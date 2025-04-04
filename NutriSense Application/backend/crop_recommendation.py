from flask import Blueprint, request, jsonify, render_template
import pandas as pd
import numpy as np
import requests
import openmeteo_requests
import requests_cache
from retry_requests import retry
from requests.structures import CaseInsensitiveDict
import joblib
import os
from datetime import datetime
from shared_config import logger

# Create blueprint
crop_recommendation_bp = Blueprint('crop_recommendation', __name__)

# Setup weather API
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

# Constants
CURRENT_USER = "Muh-Ayyub"
MODEL_PATHS = {
    "model": os.path.join("crop_recommendation_models", "suggest_plants.pkl"),
    "label_encoder": os.path.join("crop_recommendation_models", "label_encoder.pkl"),
    "scaler": os.path.join("crop_recommendation_models", "scaler.pkl")
}

# Load models with error handling
try:
    logger.info("Loading crop recommendation models...")
    rf_model = joblib.load(MODEL_PATHS["model"])
    label_encoder = joblib.load(MODEL_PATHS["label_encoder"])
    scaler = joblib.load(MODEL_PATHS["scaler"])
    logger.info("Crop recommendation models loaded successfully")
except Exception as e:
    logger.error(f"Error loading crop recommendation models: {str(e)}")
    raise

def get_soil_ph(location):
    """Get soil pH from Excel file"""
    try:
        soil_file_path = "SP.xlsx"
        df = pd.read_excel(soil_file_path, engine='openpyxl')
        location_row = df[df['location'] == location]
        if not location_row.empty:
            return location_row['ph'].values[0]
        return None
    except Exception as e:
        logger.error(f"Error getting soil pH: {str(e)}")
        return None

def get_coordinates(location):
    """Get coordinates from location name using Geoapify"""
    url = f"https://api.geoapify.com/v1/geocode/autocomplete?text={location}&apiKey=f4f2dd36b76a42d690a9ae4dcf1b8703"
    headers = CaseInsensitiveDict()
    headers["Accept"] = "application/json"
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            if "features" in data and data["features"]:
                lat = data["features"][0]["geometry"]["coordinates"][1]
                lon = data["features"][0]["geometry"]["coordinates"][0]
                return lat, lon
            else:
                raise ValueError("Location not found or invalid response.")
        else:
            raise ValueError(f"API request failed with status code {resp.status_code}")
    except requests.RequestException as e:
        raise ValueError(f"Error fetching coordinates: {e}")

def get_crop_weather_data(location):
    """Get weather data for crop recommendation"""
    try:
        latitude, longitude = get_coordinates(location)
        if latitude is None or longitude is None:
            return None, None, None

        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "hourly": "relative_humidity_2m",
            "daily": ["temperature_2m_mean", "rain_sum"]
        }
        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]

        daily = response.Daily()
        temperature = daily.Variables(0).ValuesAsNumpy().mean()
        humidity = response.Hourly().Variables(0).ValuesAsNumpy().mean()
        rainfall = daily.Variables(1).ValuesAsNumpy().sum()

        return temperature, humidity, rainfall
    except Exception as e:
        logger.error(f"Error getting crop weather data: {str(e)}")
        return None, None, None

def predict_top_crops(location, top_n=20):
    """Predict top crops for a given location"""
    try:
        ph = get_soil_ph(location)
        if ph is None:
            return {"error": f"pH data not found for {location}."}

        temperature, humidity, rainfall = get_crop_weather_data(location)
        if temperature is None or humidity is None or rainfall is None:
            return {"error": f"Weather data not found for {location}."}

        # Create input features
        input_features = np.array([[temperature, humidity, ph, rainfall]])
        input_features_scaled = scaler.transform(input_features)

        # Get predictions and probabilities
        probabilities = rf_model.predict_proba(input_features_scaled)[0]
        top_indices = np.argsort(probabilities)[-top_n:][::-1]
        top_crops = [label_encoder.classes_[i] for i in top_indices if i < len(label_encoder.classes_)]

        # Add images to the response
        images = {
            "Rice": "rice.jpg", "Maize": "maize.jpg", "Jute": "jute.jpg",
            "Cotton": "cotton.jpg", "Coconut": "coconut.jpg", "Papaya": "papaya.jpg",
            "Orange": "orange.jpg", "Apple": "apple.jpg", "Muskmelon": "muskmelon.jpg",
            "Watermelon": "watermelon.jpg", "Grapes": "grapes.jpg", "Mango": "mango.jpg",
            "Banana": "banana.jpg", "Pomegranate": "pomegranate.jpg", "Lentil": "lentil.jpg",
            "Blackgram": "blackgram.jpg", "Mungbean": "mungbean.jpg",
            "Mothbeans": "mothbeans.jpg", "Pigeonpeas": "pigeonpeas.jpg",
            "Kidneybeans": "kidneybeans.jpg", "Chickpea": "chickpea.jpg",
            "Coffee": "coffee.jpg"
        }

        return {
            "plants": [{
                "name": crop,
                "image": images.get(crop, "default.jpg")
            } for crop in top_crops],
            "metadata": {
                "temperature": float(temperature),
                "humidity": float(humidity),
                "rainfall": float(rainfall),
                "ph": float(ph)
            }
        }
    except Exception as e:
        logger.error(f"Error in predict_top_crops: {str(e)}")
        return {"error": str(e)}

@crop_recommendation_bp.route('/crop-recommendation')
def crop_recommendation_page():
    return render_template('crop_recommendation.html')

@crop_recommendation_bp.route('/get-locations', methods=['GET'])
def get_locations():
    try:
        soil_file_path = "SP.xlsx"
        df = pd.read_excel(soil_file_path, engine='openpyxl')
        locations = df['location'].unique().tolist()
        return jsonify({"locations": locations})
    except Exception as e:
        logger.error(f"Error getting locations: {str(e)}")
        return jsonify({"error": str(e), "locations": []}), 500

@crop_recommendation_bp.route('/predict-crop', methods=['POST'])
def predict_crop():
    try:
        location = request.form.get('location')
        if not location:
            return jsonify({"error": "Location is required."}), 400

        result = predict_top_crops(location)
        if isinstance(result, dict) and 'error' in result:
            return jsonify(result), 404

        return jsonify({
            "plants": result["plants"],
            "metadata": result["metadata"],
            "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
            "analyzed_by": CURRENT_USER
        })

    except Exception as e:
        logger.error(f"Error in predict_crop: {str(e)}")
        return jsonify({"error": str(e)}), 500

@crop_recommendation_bp.route('/getExcelData', methods=['GET'])
def get_excel_data():
    try:
        df = pd.read_excel("location_wise_plants.xlsx", engine='openpyxl')
        excel_data = {}
        current_location = None

        for index, row in df.iterrows():
            location = row["location"]
            plant = row["plants"]

            if pd.notna(location):
                current_location = location.lower()
                excel_data[current_location] = []

            if pd.notna(plant):
                excel_data[current_location].append(plant.lower())

        return jsonify(excel_data)

    except Exception as e:
        logger.error(f"Error getting Excel data: {str(e)}")
        return jsonify({"error": str(e), "data": {}}), 500