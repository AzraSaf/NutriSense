document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeButton = document.getElementById('remove-image');

    // Plant data object (Add the entire JSON data here)
    const plantData = {
        
            "soil_preferences": {
              "Banana": {
                "pH_range": [5.5, 7.0],
                "suitable_soils": ["Loamy", "Clay"]
              },
              "Coffee": {
                "pH_range": [5.0, 6.5],
                "suitable_soils": ["Loamy", "Sandy"]
              },
              "Rice": {
                "pH_range": [5.5, 7.5],
                "suitable_soils": ["Clay", "Loamy"]
              }
            },
            "plant_conditions": {
              "Banana": {
                "temp_range": [18, 30],
                "humidity_range": [50, 80]
              },
              "Coffee": {
                "temp_range": [15, 28],
                "humidity_range": [60, 90]
              },
              "Rice": {
                "temp_range": [20, 35],
                "humidity_range": [70, 100]
              }
            },
            "nutrient_requirements": {
              "Banana": {
                "N": 200,
                "P": 60,
                "K": 350
              },
              "Coffee": {
                "N": 150,
                "P": 50,
                "K": 200
              },
              "Rice": {
                "N": 100,
                "P": 40,
                "K": 150
              }
            },
            "fertilizer_recommendations": {
              "Nitrogen": {
                "Mild": "Apply 20-30 kg/ha of urea as a foliar spray.",
                "Moderate": "Apply 50 kg/ha of urea in split doses.",
                "Severe": "Apply 80-100 kg/ha of urea with soil incorporation."
              },
              "Phosphorus": {
                "Mild": "Apply 15-25 kg/ha of superphosphate.",
                "Moderate": "Apply 40 kg/ha of superphosphate.",
                "Severe": "Apply 60 kg/ha of superphosphate, deep placement."
              },
              "Potassium": {
                "Mild": "Foliar spray of 2% KCl weekly until symptoms disappear.",
                "Moderate": "Apply 40 kg/ha of K2O and monitor plant response.",
                "Severe": "Apply 80 kg/ha of K2O and incorporate into the soil."
              },
              "Magnesium": {
                "Mild": "Foliar spray of 5% MgSO4 or dolomite limestone at 3 t/ha.",
                "Moderate": "Apply 30-50 kg/ha of MgSO4 to the soil.",
                "Severe": "Apply 100 kg/ha of MgSO4 with irrigation water."
              },
              "Iron": {
                "Mild": "Soil application of FeSO4 (5 g/ha) or foliar spray of 0.5% FeSO4 weekly.",
                "Moderate": "Apply 10 g/ha of FeSO4 to the soil and monitor symptoms.",
                "Severe": "Apply chelated iron (EDDHA-Fe) for rapid correction."
              }
            },
            "plant_deficiency_map": {
              "Banana": ["Magnesium", "Iron", "Potassium"],
              "Coffee": ["Magnesium", "Iron", "Potassium"],
              "Rice": ["Nitrogen", "Phosphorus", "Potassium"]
            },
            "severity_levels": ["Mild", "Moderate", "Severe"],
            "fertilizer_application_guidelines": {
              "Application_Methods": {
                "Even_Precise_Spreading": "Use calibrated spreaders and perform tray tests to ensure even distribution.",
                "Split_Applications": {
                  "Nitrogen": "Apply in multiple splits—50% before transplanting, 25% at 30 days, 25% at panicle initiation.",
                  "Phosphorus_Potassium_Zinc": "Typically applied as a basal dose."
                },
                "Equipment_Conditions": "Adjust spreader settings based on weather to avoid uneven application."
              },
              "General_Best_Practices": {
                "Quality_Consistency": "Use high-quality fertilizers and store them properly.",
                "Timing_Precision": "Apply nutrients when crops need them most.",
                "Zone_Specific_Recommendations": "Follow field zone-based tables for tailored application rates."
              }
            }
          
    };

    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle image removal
    removeButton.addEventListener('click', function() {
        fileInput.value = '';
        previewContainer.style.display = 'none';
        imagePreview.src = '#';
    });

    // Function to update result display
    function updateResult(elementId, label, value, confidence) {
        const element = document.getElementById(elementId);
        // Change this line to match your HTML IDs
        const confidenceBar = document.getElementById(elementId.split('-')[0] + '-confidence');
        
        if (element && confidenceBar) {
            element.textContent = `${label}: ${value}`;
            const confidencePercent = (confidence * 100).toFixed(1);
            
            // Add confidence percentage text
            element.innerHTML += `<span class="confidence-text">(${confidencePercent}% confidence)</span>`;
            
            // Update the confidence bar
            confidenceBar.innerHTML = `<div class="confidence-fill" style="width: ${confidencePercent}%"></div>`;
        } else {
            console.error('Could not find elements:', elementId, confidenceBar);
        }
    }

    function generateDetailedReport(plantType, deficiencyType, severityLevel) {
        const report = document.getElementById('detailed-report');
        
        if (!plantData.soil_preferences[plantType]) {
            console.error('Plant type not found in data:', plantType);
            return;
        }

        // Soil Preferences
        const soilPrefs = plantData.soil_preferences[plantType];
        const soilPrefsElement = document.getElementById('soil-preferences');
        if (soilPrefsElement) {
            soilPrefsElement.innerHTML = `
                <ul class="report-list">
                    <li>pH Range: ${soilPrefs.pH_range[0]} - ${soilPrefs.pH_range[1]}</li>
                    <li>Suitable Soils: ${soilPrefs.suitable_soils.join(', ')}</li>
                </ul>
            `;
        }

        // Growing Conditions
        const conditions = plantData.plant_conditions[plantType];
        const growingConditionsElement = document.getElementById('growing-conditions');
        if (growingConditionsElement) {
            growingConditionsElement.innerHTML = `
                <ul class="report-list">
                    <li>Temperature: ${conditions.temp_range[0]}°C - ${conditions.temp_range[1]}°C</li>
                    <li>Humidity: ${conditions.humidity_range[0]}% - ${conditions.humidity_range[1]}%</li>
                </ul>
            `;
        }

        // Nutrient Requirements
        const nutrients = plantData.nutrient_requirements[plantType];
        const nutrientReqElement = document.getElementById('nutrient-requirements');
        if (nutrientReqElement) {
            nutrientReqElement.innerHTML = `
                <div class="report-grid">
                    <div class="report-item">
                        <h4>Recommended Nutrient Levels (kg/ha)</h4>
                        <ul class="report-list">
                            <li>Nitrogen (N): ${nutrients.N}</li>
                            <li>Phosphorus (P): ${nutrients.P}</li>
                            <li>Potassium (K): ${nutrients.K}</li>
                        </ul>
                    </div>
                </div>
            `;
        }

        // Treatment Recommendations
        
        let deficiencyKey = deficiencyType;
        // Handle different formats of deficiency types
        if (deficiencyType.includes('(')) {
            deficiencyKey = deficiencyType.split('(')[0].trim(); // Handle format like "Nitrogen(N)"
        } else if (deficiencyType.includes('-')) {
            deficiencyKey = deficiencyType.split('-')[0].trim(); // Handle format like "nitrogen-N"
        }
        // Capitalize first letter to match JSON keys
        deficiencyKey = deficiencyKey.charAt(0).toUpperCase() + deficiencyKey.slice(1);

        const fertilizer = plantData.fertilizer_recommendations[deficiencyKey];
        const treatmentRecsElement = document.getElementById('treatment-recommendations');
        if (treatmentRecsElement && fertilizer) {
            treatmentRecsElement.innerHTML = `
                <div class="report-item">
                    <h4>${deficiencyType} Deficiency Treatment (${severityLevel})</h4>
                    <p>${fertilizer[severityLevel]}</p>
                </div>
            `;
        } else {
            console.log('Treatment data not found for:', deficiencyKey, severityLevel);
            treatmentRecsElement.innerHTML = `
                <div class="report-item">
                    <h4>Treatment Information Unavailable</h4>
                    <p>No specific treatment information available for ${deficiencyType} deficiency.</p>
                </div>
            `;
        }
        

        // Application Guidelines
        const guidelines = plantData.fertilizer_application_guidelines;
        const guidelinesElement = document.getElementById('application-guidelines');
        if (guidelinesElement) {
            guidelinesElement.innerHTML = `
                <div class="report-grid">
                    <div class="report-item">
                        <h4>Application Methods</h4>
                        <ul class="report-list">
                            <li>${guidelines.Application_Methods.Even_Precise_Spreading}</li>
                            <li>${guidelines.Application_Methods.Split_Applications.Nitrogen}</li>
                        </ul>
                    </div>
                    <div class="report-item">
                        <h4>Best Practices</h4>
                        <ul class="report-list">
                            <li>${guidelines.General_Best_Practices.Quality_Consistency}</li>
                            <li>${guidelines.General_Best_Practices.Timing_Precision}</li>
                            <li>${guidelines.General_Best_Practices.Zone_Specific_Recommendations}</li>
                        </ul>
                    </div>
                </div>
            `;
        }

        if (report) {
            report.classList.add('visible');
        }
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        try {
            // Show loading state
            document.getElementById('loading').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            document.getElementById('error').style.display = 'none';
            document.getElementById('detailed-report').classList.remove('visible');
            
            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            // Hide loading state
            document.getElementById('loading').style.display = 'none';
            
            // Show results
            if (data.error) {
                document.getElementById('error').style.display = 'block';
                document.getElementById('error').textContent = data.error;
                return;
            }
            
            document.getElementById('results').style.display = 'block';
            
            // Update results display
            updateResult('plant-type', 'Plant Type', data.plant.type, data.plant.confidence);
            updateResult('deficiency-type', 'Deficiency', data.deficiency.type, data.deficiency.confidence);
            updateResult('severity-level', 'Severity', data.severity.level, data.severity.confidence);
            
            // Generate detailed report
            generateDetailedReport(
                data.plant.type,
                data.deficiency.type,
                data.severity.level
            );
            
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = 'Error processing image. Please try again.';
        }
    });

    // Add drag and drop handlers (your existing code)
    const dropZone = document.querySelector('.file-upload label');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        fileInput.files = dt.files;
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
});