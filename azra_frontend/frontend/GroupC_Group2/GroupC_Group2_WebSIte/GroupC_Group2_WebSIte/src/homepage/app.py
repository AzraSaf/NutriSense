from flask import Flask, request, jsonify, render_template
from abc import ABC, abstractmethod
import json
import requests
import openmeteo_requests
import requests_cache
from retry_requests import retry

app = Flask(__name__)

# Load domain knowledge
with open('domain_knowledge.json', 'r') as f:
    DOMAIN_KNOWLEDGE = json.load(f)

# Open-Meteo API setup
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

# IP Stack API Setup
API_KEY = "417d58eb281d803c8f457e3e6f47dc57"
ipstack_url = f"http://api.ipstack.com/check?access_key={API_KEY}"


def get_user_location():
    try:
        response = requests.get(ipstack_url)
        data = response.json()
        lat = data.get('latitude')
        lon = data.get('longitude')
        city = data.get('city', 'Unknown')
        if lat is None or lon is None:
            raise ValueError("Invalid location data returned from IP Stack.")
        return lat, lon, city
    except Exception as e:
        print(f"Error fetching location: {e}")
        return None, None, None


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
        print(f"Error fetching weather data: {e}")
        return None, None


# Abstract Base Classes
class SoilBase(ABC):
    def __init__(self, soil_type, pH):
        self.soil_type = soil_type
        self.pH = pH

    @abstractmethod
    def get_soil_type(self):
        pass

    @abstractmethod
    def get_soil_nutrient(self, nutrient):
        pass

    @abstractmethod
    def is_suitable_for_plant(self, plant_name):
        pass


class EnvironmentBase(ABC):
    def __init__(self, temperature, humidity):
        self.temperature = temperature
        self.humidity = humidity

    @abstractmethod
    def get_temperature(self):
        pass

    @abstractmethod
    def get_humidity(self):
        pass

    @abstractmethod
    def check_suitability(self, plant_type):
        pass


class PlantBase(ABC):
    @abstractmethod
    def get_name(self):
        pass

    @abstractmethod
    def get_required_nutrients(self):
        pass

    @abstractmethod
    def check_growth_conditions(self, environment):
        pass


class FertilizerStrategyBase(ABC):
    @abstractmethod
    def get_fertilizer_recommendation(self, severity):
        pass

    @abstractmethod
    def get_application_guidelines(self):
        pass


# Concrete Classes
class Soil(SoilBase):
    def __init__(self, soil_type, pH, nutrient_levels):
        super().__init__(soil_type, pH)
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

    def get_soil_nutrient(self, nutrient):
        level = self.nutrient_levels.get(nutrient)
        if level is not None:
            return f"✅ {nutrient} level in soil: {level} ppm."
        else:
            return f"⚠️ {nutrient} not found in soil data."


class Environment(EnvironmentBase):
    def __init__(self, temperature, humidity):
        super().__init__(temperature, humidity)

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


class Plant(PlantBase):
    def __init__(self, name, soil, environment):
        self.name = name
        self.soil = soil
        self.environment = environment

    def get_name(self):
        return self.name

    def get_required_nutrients(self):
        return DOMAIN_KNOWLEDGE["nutrient_requirements"].get(self.name, {})

    def check_growth_conditions(self, environment):
        return self.environment.check_suitability(self.name)


class FertilizerStrategyLow(FertilizerStrategyBase):
    def get_fertilizer_recommendation(self, severity):
        return DOMAIN_KNOWLEDGE["fertilizer_recommendations"]

    def get_application_guidelines(self):
        return DOMAIN_KNOWLEDGE["fertilizer_application_guidelines"]

    def get_recommendation(self, deficiency_type):
        return DOMAIN_KNOWLEDGE["fertilizer_recommendations"].get(deficiency_type, {}).get("Mild",
                                                                                           "No recommendation available for this deficiency.")


class FertilizerStrategyMedium(FertilizerStrategyBase):
    def get_fertilizer_recommendation(self, severity):
        return DOMAIN_KNOWLEDGE["fertilizer_recommendations"]

    def get_application_guidelines(self):
        return DOMAIN_KNOWLEDGE["fertilizer_application_guidelines"]

    def get_recommendation(self, deficiency_type):
        return DOMAIN_KNOWLEDGE["fertilizer_recommendations"].get(deficiency_type, {}).get("Moderate",
                                                                                           "No recommendation available for this deficiency.")


class FertilizerStrategyHigh(FertilizerStrategyBase):
    def get_fertilizer_recommendation(self, severity):
        return DOMAIN_KNOWLEDGE["fertilizer_recommendations"]

    def get_application_guidelines(self):
        return DOMAIN_KNOWLEDGE["fertilizer_application_guidelines"]

    def get_recommendation(self, deficiency_type):
        return DOMAIN_KNOWLEDGE["fertilizer_recommendations"].get(deficiency_type, {}).get("Severe",
                                                                                           "No recommendation available for this deficiency.")


class RecommendationEngine:
    def __init__(self):
        self.strategies = {
            "Mild": FertilizerStrategyLow(),
            "Moderate": FertilizerStrategyMedium(),
            "Severe": FertilizerStrategyHigh()
        }

    def get_fertilizer_recommendation(self, plant, deficiency, severity, soil_suitability, temperature_status,
                                      humidity_status):
        strategy = self.strategies.get(severity, None)
        if not strategy:
            return f"Error: Invalid severity level '{severity}'. Expected: Mild, Moderate, or Severe."

        recommendation = strategy.get_recommendation(deficiency)
        guidelines = strategy.get_application_guidelines()

        return {
            "plant": plant,
            "deficiency": deficiency,
            "severity": severity,
            "recommendation": recommendation,
            "soil_suitability": soil_suitability,
            "temperature_status": temperature_status,
            "humidity_status": humidity_status,
            "application_guidelines": guidelines
        }


class FertilizerPipeline:
    def __init__(self):
        self.recommendation_engine = RecommendationEngine()

    def run(self, soil_type, plant_type, deficiency_type, severity_level):
        lat, lon, city = get_user_location()
        if lat is None or lon is None:
            raise Exception("Could not fetch location data. Please check your connection or IP Stack API key.")

        humidity, temperature = get_weather_data(lat, lon)
        if humidity is None or temperature is None:
            raise Exception("Could not fetch weather data. Please check the Open-Meteo API.")

        pH = 6.5
        nutrient_levels = {"N": 40, "P": 30, "K": 50}
        soil = Soil(soil_type, pH, nutrient_levels)
        environment = Environment(temperature, humidity)

        soil_suitability = soil.is_suitable_for_plant(plant_type)
        environment_status = environment.check_suitability(plant_type)

        recommendation = self.recommendation_engine.get_fertilizer_recommendation(
            plant=plant_type,
            deficiency=deficiency_type,
            severity=severity_level,
            soil_suitability=soil_suitability,
            temperature_status=environment_status,
            humidity_status=environment_status
        )
        recommendation["location"] = city
        recommendation["temperature"] = temperature
        recommendation["humidity"] = humidity
        return recommendation


# Routes
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/fertilizer-recommendation', methods=['POST'])
def get_fertilizer_recommendation():
    try:
        data = request.get_json()
        soil_type = data.get('soil_type')
        plant_type = data.get('plant_type')
        deficiency_type = data.get('deficiency_type')
        severity_level = data.get('severity_level')

        if not all([soil_type, plant_type, deficiency_type, severity_level]):
            return jsonify({"error": "Missing required parameters"}), 400

        pipeline = FertilizerPipeline()
        result = pipeline.run(soil_type, plant_type, deficiency_type, severity_level)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)