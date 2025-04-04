from flask import Flask
from flask_cors import CORS
from plant_analysis import plant_analysis_bp
from crop_recommendation import crop_recommendation_bp
from shared_config import logger

app = Flask(__name__)
CORS(app)

# Register both blueprints
app.register_blueprint(plant_analysis_bp)
app.register_blueprint(crop_recommendation_bp)

if __name__ == "__main__":
    app.run(debug=True) 