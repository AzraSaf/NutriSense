from flask import Blueprint, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
import os
import requests
import openmeteo_requests
import requests_cache
from retry_requests import retry
from werkzeug.utils import secure_filename
from tensorflow.keras.applications.resnet50 import preprocess_input, ResNet50
from tensorflow.keras.layers import GlobalAveragePooling2D
from tensorflow.keras.models import Model
from datetime import datetime
import traceback
from shared_config import (
    logger, UPLOAD_FOLDER, ALLOWED_EXTENSIONS, CONFIDENCE_THRESHOLDS,
    PLANT_CLASSES, DEFICIENCY_CLASSES, SEVERITY_CLASSES, DOMAIN_KNOWLEDGE
)

# Create blueprint
plant_analysis_bp = Blueprint('plant_analysis', __name__)

# API configurations
IPSTACK_API_KEY = "a68c74752f2d6726db4478c21ed49ae0"
IPSTACK_URL = f"http://api.ipstack.com/check?access_key={IPSTACK_API_KEY}"

# Setup weather API
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

# Model Paths
PLANT_IDENTIFIER_MODEL = "plant_analysis_models/plant_identification_full_model (2).h5"
RICE_MODEL_PATH = "plant_analysis_models/rice_full_model.h5"
COFFEE_MODEL_PATH = "plant_analysis_models/complete_coffee_model.h5"
BANANA_MODEL_PATH = "plant_analysis_models/complete_banana_model.h5"
SEVERITY_MODEL_PATH = "plant_analysis_models/FINALMODELforSeverity.h5"


DEFICIENCY_NAME_MAPPING = {
    # Rice format
    "Nitrogen(N)": "Nitrogen",
    "Phosphorus(P)": "Phosphorus",
    "Potassium(K)": "Potassium",

    # Coffee format
    "iron-Fe": "Iron",
    "magnesium-Mg": "Magnesium",
    "potasium-K": "Potassium",
    "phosphorus-P": "Phosphorus",
    "other_2": "Unknown",

    # Banana format
    "iron": "Iron",
    "magnesium": "Magnesium",
    "potassium": "Potassium",
    "other": "Unknown",

    # Additional variations
    "nitrogen": "Nitrogen",
    "phosphorus": "Phosphorus",
    "n": "Nitrogen",
    "p": "Phosphorus",
    "k": "Potassium",
    "fe": "Iron",
    "mg": "Magnesium"
}

# Load all models with error handling
try:
    logger.info("Loading models...")
    plant_identifier = tf.keras.models.load_model(PLANT_IDENTIFIER_MODEL)
    rice_model = tf.keras.models.load_model(RICE_MODEL_PATH)
    coffee_model = tf.keras.models.load_model(COFFEE_MODEL_PATH)
    banana_model = tf.keras.models.load_model(BANANA_MODEL_PATH)
    severity_model = tf.keras.models.load_model(SEVERITY_MODEL_PATH)

    # Set up ResNet50 feature extractor for severity model
    base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    feature_extractor = Model(inputs=base_model.input, outputs=x)

    logger.info("All models loaded successfully")
except Exception as e:
    logger.error(f"Error loading models: {str(e)}")
    logger.error(traceback.format_exc())
    raise


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def preprocess_image(image_path, target_size=(224, 224)):
    """Preprocess image for model input."""
    try:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Failed to load image at {image_path}")

        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, target_size)
        image = np.array(image, dtype=np.float32)
        image = np.expand_dims(image, axis=0)
        image = preprocess_input(image)
        return image
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        logger.error(traceback.format_exc())
        raise

def get_deficiency_model(plant_type):
    """Get appropriate deficiency model for plant type."""
    try:
        plant_type = plant_type.title()
        if plant_type in DEFICIENCY_CLASSES:
            if plant_type == "Rice":
                return rice_model, DEFICIENCY_CLASSES[plant_type]
            elif plant_type == "Coffee":
                return coffee_model, DEFICIENCY_CLASSES[plant_type]
            elif plant_type == "Banana":
                return banana_model, DEFICIENCY_CLASSES[plant_type]
        raise ValueError(f"No deficiency model available for plant type: {plant_type}")
    except Exception as e:
        logger.error(f"Error getting deficiency model: {str(e)}")
        logger.error(traceback.format_exc())
        raise

def get_user_location():
    """Get user's location using IP Stack API."""
    try:
        response = requests.get(IPSTACK_URL)
        data = response.json()
        lat = data.get('latitude')
        lon = data.get('longitude')
        city = data.get('city', 'Unknown')
        if lat is None or lon is None:
            raise ValueError("Invalid location data returned from IP Stack.")
        return lat, lon, city
    except Exception as e:
        logger.error(f"Error fetching location: {e}")
        return None, None, "Unknown"

def get_weather_data(lat, lon):
    """Get weather data from OpenMeteo API."""
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
        logger.error(f"Error fetching weather data: {e}")
        return None, None

def check_environmental_conditions(plant_type, temperature, humidity):
    """Check if environmental conditions are suitable for the plant."""
    plant_conditions = DOMAIN_KNOWLEDGE["plant_conditions"].get(plant_type, {})
    if not plant_conditions:
        return "Environmental conditions data not available for this plant type"

    temp_range = plant_conditions.get("temp_range", [])
    humidity_range = plant_conditions.get("humidity_range", [])

    if temp_range and humidity_range:
        temp_ok = temp_range[0] <= temperature <= temp_range[1]
        humidity_ok = humidity_range[0] <= humidity <= humidity_range[1]

        if temp_ok and humidity_ok:
            return f"✅ Optimal: Temperature ({temperature}°C) and Humidity ({humidity}%) are within ideal ranges"
        else:
            return f"⚠️ Suboptimal: Ideal ranges are {temp_range[0]}-{temp_range[1]}°C and {humidity_range[0]}-{humidity_range[1]}% humidity"
    return "Could not determine environmental suitability"

def check_soil_suitability(plant_type, soil_type):
    """Check if soil type is suitable for the plant."""
    soil_preferences = DOMAIN_KNOWLEDGE["soil_preferences"].get(plant_type, {})
    if not soil_preferences:
        return "Soil preference data not available for this plant type"

    suitable_soils = soil_preferences.get("suitable_soils", [])
    if soil_type in suitable_soils:
        return f"✅ Suitable: {soil_type} soil is ideal for {plant_type}"
    else:
        return f"⚠️ Not Ideal: {plant_type} prefers {', '.join(suitable_soils)} soil"

# Add these constants at the top level
CURRENT_USER = "Muh-Ayyub"
CURRENT_DATE = "2025-03-14 11:51:51"

def get_fertilizer_recommendation(deficiency_type, severity_level):
    """Get fertilizer recommendation based on deficiency type and severity."""
    try:
        if deficiency_type == "Unknown":
            return "Cannot provide recommendation without valid deficiency type"

        # Handle the "other_2" case for Coffee
        if deficiency_type == "other_2":
            return "No recommendation needed - plant appears healthy or shows an unrecognized condition"

        recommendations = DOMAIN_KNOWLEDGE["fertilizer_recommendations"]

        # Debug logging
        logger.info(f"Getting recommendation for: {deficiency_type} (Severity: {severity_level})")

        # Clean the input
        cleaned_type = deficiency_type.strip()

        # First try direct mapping
        if cleaned_type in DEFICIENCY_NAME_MAPPING:
            standard_name = DEFICIENCY_NAME_MAPPING[cleaned_type]
        else:
            # Try different variations
            cleaned_lower = cleaned_type.lower()

            # Remove parentheses and hyphens
            base_name = cleaned_lower
            if '(' in base_name:
                base_name = base_name.split('(')[0].strip()
            if '-' in base_name:
                base_name = base_name.split('-')[0].strip()

            # Try to find a match
            if base_name in DEFICIENCY_NAME_MAPPING:
                standard_name = DEFICIENCY_NAME_MAPPING[base_name]
            else:
                # Try partial matching
                matches = [value for key, value in DEFICIENCY_NAME_MAPPING.items()
                         if base_name in key.lower()]
                standard_name = matches[0] if matches else None

        logger.info(f"Standardized name: {standard_name}")

        if standard_name and standard_name in recommendations:
            if severity_level in recommendations[standard_name]:
                recommendation = recommendations[standard_name][severity_level]
                logger.info(f"Found recommendation: {recommendation}")
                return recommendation
            else:
                logger.warning(f"No recommendation found for severity level: {severity_level}")
                return f"No specific {severity_level} severity recommendation available for {standard_name} deficiency"

        logger.warning(f"No recommendation found for deficiency type: {deficiency_type}")
        return f"No recommendation found for {deficiency_type} deficiency"


    except Exception as e:
        logger.error(f"Error in get_fertilizer_recommendation: {str(e)}")
        logger.error(traceback.format_exc())
        return "Error getting fertilizer recommendation"



@plant_analysis_bp.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        soil_type = request.form.get('soil_type', 'Unknown')

        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        if not file or not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type"}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        logger.info(f"File saved successfully at {file_path}")

        try:
            # Get location and weather data
            lat, lon, city = get_user_location()
            humidity, temperature = get_weather_data(lat, lon) if lat and lon else (None, None)

            # Step 1: Plant Identification
            plant_image = preprocess_image(file_path)
            plant_predictions = plant_identifier.predict(plant_image)
            plant_class_idx = np.argmax(plant_predictions)
            plant_confidence = float(plant_predictions[0][plant_class_idx])

            if plant_class_idx == 2:
                return jsonify({
                    "plant": {
                        "type": "Unknown",
                        "confidence": plant_confidence,
                        "message": "Unable to classify image - not a recognized plant type"
                    },
                    "deficiency": {
                        "type": "Unknown",
                        "confidence": 1.0,
                        "message": "Cannot determine deficiency for unknown plant type"
                    },
                    "severity": {
                        "level": "Not Applicable",
                        "confidence": 1.0,
                        "message": None
                    },
                    "environmental_analysis": {
                        "location": city,
                        "temperature": None,
                        "humidity": None,
                        "status": "Environmental analysis not applicable for unknown plant type"
                    },
                    "soil_analysis": {
                        "soil_type": "Not Applicable",
                        "status": "Soil analysis not applicable for unknown plant type"
                    },
                    "recommendation": {
                        "treatment": "No treatment recommendations available for unknown plant type",
                        "guidelines": None
                    },
                    "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                    "analyzed_by": CURRENT_USER
                }), 200

            # Validate plant confidence
            if plant_confidence < CONFIDENCE_THRESHOLDS["plant"]:
                return jsonify({
                    "plant": {
                        "type": "Unknown",
                        "confidence": plant_confidence,
                        "message": "Unable to identify plant type with sufficient confidence"
                    },
                    "deficiency": {
                        "type": "Unknown",
                        "confidence": 1.0,
                        "message": "Cannot determine deficiency for unknown plant type"
                    },
                    "severity": {
                        "level": "Not Applicable",
                        "confidence": 1.0,
                        "message": None
                    },
                    "environmental_analysis": {
                        "location": city,
                        "temperature": None,
                        "humidity": None,
                        "status": "Environmental analysis not applicable for unknown plant type"
                    },
                    "soil_analysis": {
                        "soil_type": "Not Applicable",
                        "status": "Soil analysis not applicable for unknown plant type"
                    },
                    "recommendation": {
                        "treatment": "No treatment recommendations available for unknown plant type",
                        "guidelines": None
                    },
                    "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                    "analyzed_by": CURRENT_USER
                }), 200

            plant_type = PLANT_CLASSES[plant_class_idx]
            logger.info(f"Plant identified as: {plant_type} with confidence: {plant_confidence}")

            # Step 2: Deficiency Analysis
            deficiency_model, deficiency_labels = get_deficiency_model(plant_type)
            deficiency_predictions = deficiency_model.predict(plant_image)
            deficiency_class_idx = np.argmax(deficiency_predictions)
            deficiency_confidence = float(deficiency_predictions[0][deficiency_class_idx])
            deficiency_type = deficiency_labels[deficiency_class_idx]

            # Handle the "other_2" class for Coffee
            if (plant_type == "Coffee" and deficiency_type == "other_2") or (plant_type == "Banana" and deficiency_type == "other"):
                return jsonify({
                    "plant": {
                        "type": plant_type,
                        "confidence": plant_confidence
                    },
                    "deficiency": {
                        "type": "Healthy/Unknown",
                        "message": "The image shows either a healthy plant or a deficiency type that is not currently detectable by the system.",
                        "confidence": deficiency_confidence
                    },
                    "severity": {
                        "level": "Not Applicable",
                        "confidence": 1.0
                    },
                    "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                    "analyzed_by": CURRENT_USER
                }), 200

            # Validate deficiency confidence
            if deficiency_confidence < CONFIDENCE_THRESHOLDS["deficiency"]:
                deficiency_type = "Unknown"
                deficiency_message = "Unable to identify deficiency with sufficient confidence"
                # Automatically set severity as Not Applicable since deficiency is unknown
                severity_level = "Not Applicable"
                severity_confidence = 1.0  # Set to 1.0 as this is a definitive state
                severity_message = None
            else:
                deficiency_message = None
                # Only perform severity analysis if deficiency was confidently identified
                features = feature_extractor.predict(plant_image)
                severity_predictions = severity_model.predict(features)
                severity_class_idx = np.argmax(severity_predictions)
                severity_confidence = float(severity_predictions[0][severity_class_idx])

                # Validate severity confidence
                if severity_confidence < CONFIDENCE_THRESHOLDS["severity"]:
                    severity_level = "Unknown"
                    severity_message = "Unable to determine severity with sufficient confidence"
                else:
                    severity_level = SEVERITY_CLASSES[severity_class_idx]
                    severity_message = None

            # Environmental and soil analysis
            env_status = check_environmental_conditions(plant_type, temperature, humidity) if temperature and humidity else "Weather data unavailable"
            soil_status = check_soil_suitability(plant_type, soil_type) if soil_type != "Unknown" else "Soil type not provided"

            # Get fertilizer recommendation
            fertilizer_rec = get_fertilizer_recommendation(deficiency_type, severity_level) if deficiency_type != "Unknown" else "Cannot provide recommendation without valid deficiency type"

            # Clean up
            os.remove(file_path)

            # Prepare response
            response = {
                "plant": {
                    "type": plant_type,
                    "confidence": plant_confidence
                },
                "deficiency": {
                    "type": deficiency_type,
                    "confidence": deficiency_confidence,
                    "message": deficiency_message
                },
                "severity": {
                    "level": severity_level,
                    "confidence": severity_confidence,
                    "message": severity_message
                },
                "environmental_analysis": {
                    "location": city,
                    "temperature": temperature,
                    "humidity": humidity,
                    "status": env_status
                },
                "soil_analysis": {
                    "soil_type": soil_type,
                    "status": soil_status
                },
                "recommendation": {
                    "treatment": fertilizer_rec,
                    "guidelines": DOMAIN_KNOWLEDGE["fertilizer_application_guidelines"]
                },
                "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                "analyzed_by": CURRENT_USER
            }

            return jsonify(response)

        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            logger.error(traceback.format_exc())
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({"error": str(e)}), 500

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "An unexpected error occurred"}), 500