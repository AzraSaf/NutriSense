import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# API configurations
IPSTACK_API_KEY = "2db412ca1de0d3257e022db62fc9ee38"
IPSTACK_URL = f"http://api.ipstack.com/check?access_key={IPSTACK_API_KEY}"

# Define confidence thresholds
CONFIDENCE_THRESHOLDS = {
    "plant": 0.70,  # 70% confidence threshold for plant identification
    "deficiency": 0.65,  # 65% confidence threshold for deficiency detection
    "severity": 0.60  # 60% confidence threshold for severity assessment
}

# Plant classes and deficiency mappings
PLANT_CLASSES = ['Banana', 'Coffee', 'NegSamples', 'Rice']

DEFICIENCY_CLASSES = {
    "Rice": ["Nitrogen(N)", "Phosphorus(P)", "Potassium(K)"],
    "Coffee": ["iron-Fe", "phosphorus-P", "potasium-K", "other_2"],
    "Banana": ["iron", "magnesium", "potassium","other"]
}

SEVERITY_CLASSES = ["Mild", "Moderate", "Severe"]

# Load domain knowledge
import json
with open('domain_knowledge.json', 'r') as f:
    DOMAIN_KNOWLEDGE = json.load(f)