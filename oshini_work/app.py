import joblib
import os
import numpy as np
import requests_cache
from flask import Flask, request, jsonify, render_template
import requests
import pandas as pd
import openmeteo_requests
from requests.structures import CaseInsensitiveDict
from retry_requests import retry

app = Flask(__name__)
from flask_cors import CORS
CORS(app)

# Load trained model and pre-fitted encoders
MODEL_PATH = os.path.join("models", "suggest_plants.pkl")
LABEL_ENCODER_PATH = os.path.join("models", "label_encoder.pkl")
SCALER_PATH = os.path.join("models", "scaler.pkl")

rf_model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)
scaler = joblib.load(SCALER_PATH)

cache_session = requests_cache.CachedSession('.cache', expire_after=-1)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

# Function to fetch soil pH
def get_soil_ph(location):
    soil_file_path = "SP.xlsx"
    df = pd.read_excel(soil_file_path)
    location_row = df[df['location'] == location]
    if not location_row.empty:
        return location_row['ph'].values[0]
    else:
        return None


def get_coordinates(location):
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

# Function to fetch weather data
def get_weather(location):
    try:
        # Step 1: Get coordinates for the location
        latitude, longitude = get_coordinates(location)
        if latitude is None or longitude is None:
            return None, None, None

        # Step 2: Fetch weather data using Open-Meteo API
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

        # Extract weather data
        daily = response.Daily()
        temperature = daily.Variables(0).ValuesAsNumpy().mean()  # Mean temperature
        humidity = response.Hourly().Variables(0).ValuesAsNumpy().mean()  # Mean humidity
        rainfall = daily.Variables(1).ValuesAsNumpy().sum()  # Total rainfall

        return temperature, humidity, rainfall

    except Exception as e:
        print(f"An error occurred: {e}")
        return None, None, None

# Prediction function
def predict_top_crops(location, top_n=20):
    mean_ph = get_soil_ph(location)
    if mean_ph is None:
        return {"error": f"pH data not found for {location}."}

    temperature, humidity, rainfall = get_weather(location)
    if temperature is None or humidity is None or rainfall is None:
        return {"error": f"Weather data not found for {location}."}

    # Transform input using pre-trained scaler
    input_features = np.array([[temperature, humidity, mean_ph, rainfall]])
    input_features_scaled = scaler.transform(input_features)

    probabilities = rf_model.predict_proba(input_features_scaled)[0]
    top_indices = np.argsort(probabilities)[-top_n:][::-1]
    top_crops = [label_encoder.classes_[i] for i in top_indices if i < len(label_encoder.classes_)]

    return {"plants": [{"name": crop} for crop in top_crops]}

# Homepage route
@app.route('/')
def home():
    return render_template('index.html')  # Ensure your HTML file is in the 'templates' folder

# Flask API Route for Prediction
@app.route('/predict', methods=['POST'])
def predict():
    location = request.form.get('location')
    if not location:
        return jsonify({"error": "Location is required."}), 400

    # Get crop recommendations
    result = predict_top_crops(location)
    if 'error' in result:
        return jsonify(result), 404

    # Send images along with plant names
    images = {
        "Rice": "rice.jpg", "Maize": "maize.jpg", "Jute": "jute.jpg", "Cotton": "cotton.jpg",
        "Coconut": "coconut.jpg", "Papaya": "papaya.jpg", "Orange": "orange.jpg", "Apple": "apple.jpg",
        "Muskmelon": "muskmelon.jpg", "Watermelon": "watermelon.jpg", "Grapes": "grapes.jpg",
        "Mango": "mango.jpg", "Banana": "banana.jpg", "Pomegranate": "pomegranate.jpg",
        "Lentil": "lentil.jpg", "Blackgram": "blackgram.jpg", "Mungbean": "mungbean.jpg",
        "Mothbeans": "mothbeans.jpg", "Pigeonpeas": "pigeonpeas.jpg", "Kidneybeans": "kidneybeans.jpg",
        "Chickpea": "chickpea.jpg", "Coffee": "coffee.jpg"
    }

    plant_data = [{"name": crop['name'], "image": images.get(crop['name'], "images/default.jpg")} for crop in result['plants']]
    return jsonify({"plants": plant_data})

@app.route('/get_locations', methods=['GET'])
def get_locations():
    soil_file_path = "SP.xlsx"
    df = pd.read_excel(soil_file_path)
    locations = df['location'].unique().tolist()  # Get unique locations
    return jsonify({"locations": locations})

@app.route('/getExcelData', methods=['GET'])
def get_excel_data():
    try:
        # Read the Excel file
        df = pd.read_excel("location_wise_plants.xlsx")

        # Convert the Excel data into a dictionary
        excel_data = {}
        current_location = None

        for index, row in df.iterrows():
            location = row["location"]
            plant = row["plants"]

            if pd.notna(location):  # If location is not empty, update the current location
                current_location = location.lower()
                excel_data[current_location] = []

            if pd.notna(plant):  # If plant is not empty, add it to the current location
                excel_data[current_location].append(plant.lower())

        # Return the data as JSON
        return jsonify(excel_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run Flask App
if __name__ == "__main__":
    app.run(debug=True)
