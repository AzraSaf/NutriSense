import numpy as np
import openmeteo_requests
import pandas as pd
import requests
import requests_cache
from flask import Flask, request, jsonify, render_template
from requests.structures import CaseInsensitiveDict
from retry_requests import retry
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler

app = Flask(__name__)
from flask_cors import CORS
CORS(app)

# Load plant dataset
file_path = "crops .csv"
data = pd.read_csv(file_path)

# Separate features and target
X = data[['temperature', 'humidity', 'ph', 'rainfall']]
y = data['label']

# Encode target labels
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# Standardize the features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_encoded, test_size=0.3, stratify=y_encoded, random_state=42
)

# Train Random Forest model
rf_model = RandomForestClassifier(n_estimators=300, max_depth=10, max_features = 'sqrt', min_samples_leaf = 1, min_samples_split = 2, random_state=42)
cv = StratifiedKFold(n_splits=5, shuffle=True,random_state=42)
cross_val_score(rf_model, X_train, y_train, cv=cv, scoring='accuracy')
rf_model.fit(X_train, y_train)

cache_session = requests_cache.CachedSession('.cache', expire_after=-1)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

# Load soil pH dataset
# def get_mean_soil_ph(location):
#     soil_file_path = "ph.xlsx"
#     df = pd.read_excel(soil_file_path)
#     df.columns = df.columns.str.strip().str.lower()
#     location = location.strip().lower()
#
#     result = df[df['location'] == location]
#     if not result.empty:
#         min_ph = result.iloc[0]['min ph']
#         max_ph = result.iloc[0]['max ph']
#         return (min_ph + max_ph) / 2  # Calculate mean pH
#     return None

def get_soil_ph(location):
    soil_file_path = "SP.xlsx"
    df = pd.read_excel(soil_file_path)
    # df.columns = df.columns.str.strip().str.lower()
    # location = location.strip().lower()

    location_row = df[df['location'] == location]
    if not location_row.empty:
        return location_row['ph'].values[0]
    else:
        return None

# # Load weather data
# def get_weather_data(location):
#     weather_file_path = "w6.xlsx"
#     df = pd.read_excel(weather_file_path)
#     df.columns = df.columns.str.strip().str.lower()
#     location = location.strip().lower()
#
#     result = df[df['location'] == location]
#     if not result.empty:
#         return result.iloc[0]['temperature'], result.iloc[0]['humidity'], result.iloc[0]['rainfall']
#     return None, None, None

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

# Function to get plant recommendations using mean pH
def predict_top_crops(location, top_n=20):
    mean_ph = get_soil_ph(location)
    if mean_ph is None:
        return {"error": f"pH data not found for {location}."}

    temperature, humidity, rainfall = get_weather(location)
    if temperature is None or humidity is None or rainfall is None:
        return {"error": f"Weather data not found for {location}."}

    # Prepare input with mean pH
    input_features = np.array([[temperature, humidity, mean_ph, rainfall]])
    input_features_scaled = scaler.transform(input_features)  # Standardize input features

    # Predict probabilities for all crops
    probabilities = rf_model.predict_proba(input_features_scaled)[0]

    # Get top N crops with highest probabilities
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
