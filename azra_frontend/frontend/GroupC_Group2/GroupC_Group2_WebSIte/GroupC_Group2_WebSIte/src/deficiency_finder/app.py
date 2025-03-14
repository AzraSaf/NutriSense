from flask import Flask, request, jsonify, send_from_directory
import tensorflow as tf
import numpy as np
import cv2
import os
from werkzeug.utils import secure_filename
from tensorflow.keras.applications.resnet50 import preprocess_input, ResNet50
from tensorflow.keras.layers import GlobalAveragePooling2D
from tensorflow.keras.models import Model
from flask_cors import CORS
import logging
import json
import requests
import openmeteo_requests
import requests_cache
from retry_requests import retry

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Model Paths
PLANT_IDENTIFIER_MODEL = "models/plant_identification_full_model.h5"
RICE_MODEL_PATH = "models/rice_model.h5"
COFFEE_MODEL_PATH = "models/coffee_full_model.h5"
BANANA_MODEL_PATH = "models/banana_full_model.h5"
SEVERITY_MODEL_PATH = "models/FINALMODELforSeverity.h5"

# Load models
try:
    logger.info("Loading models...")
    plant_identifier = tf.keras.models.load_model(PLANT_IDENTIFIER_MODEL)
    rice_model = tf.keras.models.load_model(RICE_MODEL_PATH)
    coffee_model = tf.keras.models.load_model(COFFEE_MODEL_PATH)
    banana_model = tf.keras.models.load_model(BANANA_MODEL_PATH)
    severity_model = tf.keras.models.load_model(SEVERITY_MODEL_PATH)
    logger.info("All models loaded successfully")
except Exception as e:
    logger.error(f"Error loading models: {str(e)}")
    raise

# Set up ResNet50 feature extractor
base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
x = base_model.output
x = GlobalAveragePooling2D()(x)
feature_extractor = Model(inputs=base_model.input, outputs=x)

# Configuration
PLANT_CLASSES = ["Banana", "Coffee", "Rice", "Wheat"]
DEFICIENCY_CLASSES = {
    "Rice": ["Nitrogen(N)", "Phosphorus(P)", "Potassium(K)"],
    "Coffee": ["iron-Fe", "magnesium-Mg", "potasium-K"],
    "Banana": ["iron", "magnesium", "potassium"]
}
SEVERITY_CLASSES = ["Mild", "Moderate", "Severe"]

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["ALLOWED_EXTENSIONS"] = {"png", "jpg", "jpeg"}

# Weather API setup
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)
API_KEY = "fb37b41e83988cac48252059149897f6"
ipstack_url = f"http://api.ipstack.com/check?access_key={API_KEY}"

# Load domain knowledge
with open("models/domain_knowledge.json", "r") as f:
    DOMAIN_KNOWLEDGE = json.load(f)


# Utility Functions
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]


def preprocess_image(image_path, target_size=(224, 224)):
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image, target_size)
    image = np.expand_dims(image, axis=0)
    return preprocess_input(image)


def get_deficiency_model(plant_type):
    plant_type = plant_type.title()
    if plant_type == "Rice":
        return rice_model, DEFICIENCY_CLASSES[plant_type]
    elif plant_type == "Coffee":
        return coffee_model, DEFICIENCY_CLASSES[plant_type]
    elif plant_type == "Banana":
        return banana_model, DEFICIENCY_CLASSES[plant_type]
    # No need to handle Wheat here since we'll catch it earlier
    raise ValueError(f"No deficiency model for {plant_type}")


def normalize_deficiency(deficiency):
    """Normalize model-predicted deficiency names to match domain_knowledge.json keys."""
    deficiency = deficiency.lower()
    if "(n)" in deficiency:
        return "Nitrogen"
    elif "(p)" in deficiency:
        return "Phosphorus"
    elif "(k)" in deficiency or "potasium" in deficiency:
        return "Potassium"
    elif "magnesium" in deficiency:
        return "Magnesium"
    elif "iron" in deficiency:
        return "Iron"
    return deficiency.capitalize()


def get_user_location():
    try:
        response = requests.get(ipstack_url)
        data = response.json()
        lat = data.get('latitude')
        lon = data.get('longitude')
        city = data.get('city', 'Unknown')
        region = data.get('region_name', 'Unknown')
        country = data.get('country_name', 'Unknown')
        if lat is None or lon is None:
            logger.warning("Invalid location data from IP Stack, using fallback")
            return None, None, "Unknown Location"
        location = f"{city}, {region}, {country}"
        return lat, lon, location
    except Exception as e:
        logger.error(f"Error fetching location: {str(e)}")
        return None, None, "Unknown Location"


def get_weather_data(lat, lon):
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ["temperature_2m", "relative_humidity_2m"]
        }
        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]
        current = response.Current()
        temperature = current.Variables(0).Value()
        humidity = current.Variables(1).Value()
        return humidity, temperature
    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        return None, None


# Classes
class Soil:
    def __init__(self, soil_type, pH, nutrient_levels):
        self.soil_type = soil_type
        self.pH = pH
        self.nutrient_levels = nutrient_levels

    def get_soil_type(self):
        return self.soil_type

    def is_suitable_for_plant(self, plant_name):
        soil_preferences = DOMAIN_KNOWLEDGE["soil_preferences"]
        if plant_name in soil_preferences:
            prefs = soil_preferences[plant_name]
            if prefs["pH_range"][0] <= self.pH <= prefs["pH_range"][1] and self.soil_type in prefs["suitable_soils"]:
                return f"✅ Suitable: {self.soil_type} soil with pH {self.pH} is ideal for {plant_name}."
            else:
                return f"⚠️ Not Suitable: {plant_name} prefers {prefs['suitable_soils']} soil with pH between {prefs['pH_range'][0]} and {prefs['pH_range'][1]}, but got {self.soil_type} with pH {self.pH}."
        return "❌ Unknown plant type. Cannot determine soil suitability."


class Environment:
    def __init__(self, temperature, humidity):
        self.temperature = temperature
        self.humidity = humidity

    def get_temperature(self):
        return self.temperature

    def get_humidity(self):
        return self.humidity

    def check_suitability(self, plant_type):
        plant_conditions = DOMAIN_KNOWLEDGE["plant_conditions"]
        if plant_type in plant_conditions:
            conditions = plant_conditions[plant_type]
            temp_ok = conditions["temp_range"][0] <= self.temperature <= conditions["temp_range"][1]
            humidity_ok = conditions["humidity_range"][0] <= self.humidity <= conditions["humidity_range"][1]
            if temp_ok and humidity_ok:
                return f"✅ Environment suitable: Temperature {self.temperature}°C & Humidity {self.humidity}% are within optimal range for {plant_type}."
            else:
                return f"⚠️ Not Suitable: {plant_type} requires temperature {conditions['temp_range']}°C & humidity {conditions['humidity_range']}%, but got {self.temperature}°C and {self.humidity}%."
        return "❌ Unknown plant type. Cannot determine environmental suitability."


class FertilizerStrategyLow:
    def get_fertilizer_recommendation(self, deficiency_type):
        return DOMAIN_KNOWLEDGE["fertilizer_recommendations"].get(deficiency_type, {}).get("Mild", "No recommendation available.")

    def get_application_guidelines(self):
        return DOMAIN_KNOWLEDGE["fertilizer_application_guidelines"]


class FertilizerStrategyMedium:
    def get_fertilizer_recommendation(self, deficiency_type):
        return DOMAIN_KNOWLEDGE["fertilizer_recommendations"].get(deficiency_type, {}).get("Moderate", "No recommendation available.")

    def get_application_guidelines(self):
        return DOMAIN_KNOWLEDGE["fertilizer_application_guidelines"]


class FertilizerStrategyHigh:
    def get_fertilizer_recommendation(self, deficiency_type):
        return DOMAIN_KNOWLEDGE["fertilizer_recommendations"].get(deficiency_type, {}).get("Severe", "No recommendation available.")

    def get_application_guidelines(self):
        return DOMAIN_KNOWLEDGE["fertilizer_application_guidelines"]


class RecommendationEngine:
    def __init__(self):
        self.strategies = {
            "Mild": FertilizerStrategyLow(),
            "Moderate": FertilizerStrategyMedium(),
            "Severe": FertilizerStrategyHigh()
        }

    def get_fertilizer_recommendation(self, plant, deficiency, severity, soil_suitability, environment_status):
        strategy = self.strategies.get(severity)
        if not strategy:
            logger.error(f"Invalid severity level '{severity}'. Expected: Mild, Moderate, or Severe.")
            return {"error": f"Invalid severity level '{severity}'. Expected: Mild, Moderate, or Severe."}

        recommendation = strategy.get_fertilizer_recommendation(deficiency)
        guidelines = strategy.get_application_guidelines()

        if recommendation == "No recommendation available.":
            logger.warning(f"No recommendation found for deficiency '{deficiency}' at severity '{severity}' in domain_knowledge.json")

        return {
            "plant": plant,
            "deficiency": deficiency,
            "severity": severity,
            "recommendation": recommendation,
            "soil_suitability": soil_suitability,
            "temperature_status": environment_status,
            "humidity_status": environment_status,
            "application_guidelines": guidelines
        }


# Routes
@app.route('/')
def serve_frontend():
    return send_from_directory('frontend', 'index.html')

@app.route("/predict-and-recommend", methods=["POST"])
def predict_and_recommend():
    # Log the start of the request
    logger.info("Received request to /predict-and-recommend")

    file = request.files.get("file")
    initial_request = request.form.get("initial") == "true"
    soil_type = request.form.get("soil_type")

    # Check file presence and type
    if not file:
        logger.error("No file provided in request")
        return jsonify({"error": "Missing file"}), 400
    if not allowed_file(file.filename):
        logger.error(f"Invalid file type: {file.filename}")
        return jsonify({"error": "Invalid file type"}), 400

    # Save the uploaded file
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    logger.info(f"Saving file to {file_path}")
    file.save(file_path)
    plant_image = preprocess_image(file_path)

    # Predict plant
    logger.info("Predicting plant type...")
    plant_pred = plant_identifier.predict(plant_image)
    plant_type = PLANT_CLASSES[np.argmax(plant_pred)]
    plant_conf = float(plant_pred[0][np.argmax(plant_pred)])
    logger.info(f"Predicted plant: {plant_type} (confidence: {plant_conf:.4f})")

    # Check if plant is Wheat and stop processing if true
    if plant_type == "Wheat":
        logger.info("Wheat detected, rejecting request")
        try:
            os.remove(file_path)
        except (PermissionError, FileNotFoundError) as e:
            logger.warning(f"Could not delete {file_path}: {str(e)}")
        return jsonify({"error": "Please upload a suitable image"}), 400

    # Predict deficiency
    logger.info(f"Fetching deficiency model for {plant_type}")
    def_model, def_labels = get_deficiency_model(plant_type)
    def_pred = def_model.predict(plant_image)
    def_type_raw = def_labels[np.argmax(def_pred)]
    def_type = normalize_deficiency(def_type_raw)
    def_conf = float(def_pred[0][np.argmax(def_pred)])
    logger.info(f"Predicted deficiency: {def_type_raw} (confidence: {def_conf:.4f})")

    # Predict severity
    features = feature_extractor.predict(plant_image)
    sev_pred = severity_model.predict(features)
    sev_level = SEVERITY_CLASSES[np.argmax(sev_pred)]
    sev_conf = float(sev_pred[0][np.argmax(sev_pred)])
    logger.info(f"Predicted severity: {sev_level} (confidence: {sev_conf:.4f})")

    # For initial request, return only plant, deficiency, and severity
    if initial_request:
        logger.info("Initial request, returning basic prediction")
        try:
            os.remove(file_path)
        except (PermissionError, FileNotFoundError) as e:
            logger.warning(f"Could not delete {file_path}: {str(e)}")
        return jsonify({
            "plant": {"type": plant_type, "confidence": plant_conf},
            "deficiency": {"type": def_type_raw, "confidence": def_conf},
            "severity": {"level": sev_level, "confidence": sev_conf}
        })

    # For final request, proceed with soil type and full recommendation
    if not soil_type:
        logger.error("Missing soil type for final request")
        return jsonify({"error": "Missing soil type for final request"}), 400

    # Get location and weather
    lat, lon, location = get_user_location()
    if lat is None or lon is None:
        logger.warning("Using fallback weather data due to location failure")
        humidity, temperature = 50, 25  # Fallback values
    else:
        humidity, temperature = get_weather_data(lat, lon)
        if humidity is None or temperature is None:
            logger.warning("Using fallback weather data due to API failure")
            humidity, temperature = 50, 25  # Fallback values

    # Fertilizer recommendation pipeline
    pH = 6.5  # Fixed for now; could be dynamic
    nutrient_levels = {"N": 40, "P": 30, "K": 50}  # Fixed for now; could be dynamic
    soil = Soil(soil_type, pH, nutrient_levels)
    environment = Environment(temperature, humidity)

    soil_suitability = soil.is_suitable_for_plant(plant_type)
    environment_status = environment.check_suitability(plant_type)

    recommendation_engine = RecommendationEngine()
    rec = recommendation_engine.get_fertilizer_recommendation(
        plant=plant_type,
        deficiency=def_type,
        severity=sev_level,
        soil_suitability=soil_suitability,
        environment_status=environment_status
    )

    # Add location, temperature, and humidity
    rec["location"] = location
    rec["temperature"] = temperature
    rec["humidity"] = humidity

    # Clean up
    try:
        os.remove(file_path)
    except (PermissionError, FileNotFoundError) as e:
        logger.warning(f"Could not delete {file_path}: {str(e)}")

    logger.info("Returning full recommendation")
    return jsonify({
        "plant": {"type": plant_type, "confidence": plant_conf},
        "deficiency": {"type": def_type_raw, "confidence": def_conf},
        "severity": {"level": sev_level, "confidence": sev_conf},
        "recommendation": rec
    })

if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=8080)