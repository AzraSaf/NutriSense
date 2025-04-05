document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeButton = document.getElementById('remove-image');
    let selectedSoilType = null;
    let initialAnalysisData = null;
    const currentUser = 'Muh-Ayyub';
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Plant data object
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
        selectedSoilType = null;
        document.getElementById('soil-selection').style.display = 'none';
        document.getElementById('results').style.display = 'none';
        document.getElementById('detailed-report').classList.remove('visible');
    });

    // Handle soil type selection
    const soilOptions = document.querySelectorAll('.soil-option');
    soilOptions.forEach(option => {
        option.addEventListener('click', function() {
            soilOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            selectedSoilType = this.getAttribute('data-soil');
        });
    });

    // Function to update result display
    function updateResult(elementId, label, value, confidence) {
        const element = document.getElementById(elementId);
        const confidenceBar = document.getElementById(elementId.split('-')[0] + '-confidence');
        
        if (element && confidenceBar) {
            
                element.textContent = `${label}: ${value}`;
                const confidencePercent = (confidence * 100).toFixed(1);
                element.innerHTML += `<span class="confidence-text">(${confidencePercent}% confidence)</span>`;
                confidenceBar.innerHTML = `<div class="confidence-fill" style="width: ${confidencePercent}%"></div>`;
            }
        
    }

    // Function to generate detailed report
    function generateDetailedReport(plantType, deficiencyType, severityLevel, environmentalData = null) {
        const report = document.getElementById('detailed-report');
        
        if (!report) {
            console.error('Detailed report element not found');
            return;
        }
    
        // Clear previous report content
        report.innerHTML = '';
    
        if (deficiencyType === "Unknown") {
            report.classList.remove('visible');
            return;
        }
    
        if (!plantData.soil_preferences[plantType]) {
            console.error('Plant type not found in data:', plantType);
            return;
        }
    
        // Create the main report card
        const reportCard = document.createElement('div');
        reportCard.className = 'report-card';
    
        // Add title
        const title = document.createElement('h2');
        title.textContent = 'Detailed Plant Report';
        reportCard.appendChild(title);
    
        // Add timestamp and user info
        const timestamp = document.createElement('div');
        timestamp.className = 'report-timestamp';
        timestamp.innerHTML = `
            <p><strong>Analysis Date:</strong> ${currentDate}</p>
            <p><strong>Analyzed by:</strong> ${currentUser}</p>
        `;
        reportCard.appendChild(timestamp);
    
        // Environmental Analysis Section (New)
        if (environmentalData) {
            const envSection = document.createElement('div');
            envSection.className = 'report-section';
            envSection.innerHTML = `
                <h3>Environmental Analysis</h3>
                <div class="report-grid">
                    <div class="report-item">
                        <h4>Current Conditions</h4>
                        <ul class="report-list">
                            <li>Location: ${environmentalData.location}</li>
                            <li>Temperature: ${environmentalData.temperature ? Number(environmentalData.temperature).toFixed(1) : 'N/A'}°C</li>
                            <li>Humidity: ${environmentalData.humidity}%</li>
                            <li>${environmentalData.status}</li>
                        </ul>
                    </div>
                    <div class="report-item">
                        <h4>Soil Analysis</h4>
                        <ul class="report-list">
                            <li>Selected Soil: ${selectedSoilType || 'Not specified'}</li>
                            <li>${environmentalData.soil_analysis.status}</li>
                        </ul>
                    </div>
                </div>
            `;
            reportCard.appendChild(envSection);
        }
    
        // Soil & Growing Conditions Section (Original)
        const soilSection = document.createElement('div');
        soilSection.className = 'report-section';
        soilSection.innerHTML = `
            <h3>Soil & Growing Conditions</h3>
            <div class="report-grid">
                <div class="report-item">
                    <h4>Soil Preferences</h4>
                    <div id="soil-preferences">
                        <ul class="report-list">
                            <li>pH Range: ${plantData.soil_preferences[plantType].pH_range[0]} - ${plantData.soil_preferences[plantType].pH_range[1]}</li>
                            <li>Suitable Soils: ${plantData.soil_preferences[plantType].suitable_soils.join(', ')}</li>
                        </ul>
                    </div>
                </div>
                <div class="report-item">
                    <h4>Optimal Conditions</h4>
                    <div id="growing-conditions">
                        <ul class="report-list">
                            <li>Temperature: ${plantData.plant_conditions[plantType].temp_range[0]}°C - ${plantData.plant_conditions[plantType].temp_range[1]}°C</li>
                            <li>Humidity: ${plantData.plant_conditions[plantType].humidity_range[0]}% - ${plantData.plant_conditions[plantType].humidity_range[1]}%</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        reportCard.appendChild(soilSection);
        
        // Nutrient Requirements Section (Original)
        const nutrientSection = document.createElement('div');
        nutrientSection.className = 'report-section';
        nutrientSection.innerHTML = `
            <h3>Nutrient Requirements</h3>
            <div id="nutrient-requirements">
                <div class="report-grid">
                    <div class="report-item">
                        <h4>Recommended Nutrient Levels (kg/ha)</h4>
                        <ul class="report-list">
                            <li>Nitrogen (N): ${plantData.nutrient_requirements[plantType].N}</li>
                            <li>Phosphorus (P): ${plantData.nutrient_requirements[plantType].P}</li>
                            <li>Potassium (K): ${plantData.nutrient_requirements[plantType].K}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        reportCard.appendChild(nutrientSection);
    
        // Treatment Recommendations Section (Combined)
        const treatmentSection = document.createElement('div');
        treatmentSection.className = 'report-section';
        treatmentSection.innerHTML = `
            <h3>Treatment Recommendations</h3>
            <div id="treatment-recommendations">
                ${getTreatmentRecommendations(deficiencyType, severityLevel, environmentalData)}
            </div>
        `;
        reportCard.appendChild(treatmentSection);
    
        // Application Guidelines Section (Original)
        const guidelinesSection = document.createElement('div');
        guidelinesSection.className = 'report-section';
        guidelinesSection.innerHTML = `
            <h3>Application Guidelines</h3>
            <div id="application-guidelines">
                <div class="report-grid">
                    <div class="report-item">
                        <h4>Application Methods</h4>
                        <ul class="report-list">
                            <li>${plantData.fertilizer_application_guidelines.Application_Methods.Even_Precise_Spreading}</li>
                            <li>${plantData.fertilizer_application_guidelines.Application_Methods.Split_Applications.Nitrogen}</li>
                        </ul>
                    </div>
                    <div class="report-item">
                        <h4>Best Practices</h4>
                        <ul class="report-list">
                            <li>${plantData.fertilizer_application_guidelines.General_Best_Practices.Quality_Consistency}</li>
                            <li>${plantData.fertilizer_application_guidelines.General_Best_Practices.Timing_Precision}</li>
                            <li>${plantData.fertilizer_application_guidelines.General_Best_Practices.Zone_Specific_Recommendations}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        reportCard.appendChild(guidelinesSection);
    
        // Append the complete report card to the report container
        report.appendChild(reportCard);
        report.classList.add('visible');
    }

    function getTreatmentRecommendations(deficiencyType, severityLevel, environmentalData) {
        let deficiencyKey = deficiencyType;
        if (deficiencyType.includes('(')) {
            deficiencyKey = deficiencyType.split('(')[0].trim();
        } else if (deficiencyType.includes('-')) {
            deficiencyKey = deficiencyType.split('-')[0].trim();
        }
        deficiencyKey = deficiencyKey.charAt(0).toUpperCase() + deficiencyKey.slice(1);
    
        if (environmentalData && environmentalData.recommendation) {
            return `
                <div class="report-item">
                    <h4>${deficiencyType} Deficiency Treatment (${severityLevel})</h4>
                    <p>${environmentalData.recommendation.treatment}</p>
                    <div class="environmental-context">
                        <p><strong>Environmental Context:</strong></p>
                        <ul>
                            <li>${environmentalData.status}</li>
                            <li>${environmentalData.soil_analysis.status}</li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            const fertilizer = plantData.fertilizer_recommendations[deficiencyKey];
            return `
                <div class="report-item">
                    <h4>${deficiencyType} Deficiency Treatment (${severityLevel})</h4>
                    <p>${fertilizer ? fertilizer[severityLevel] : 'No specific recommendation available'}</p>
                </div>
            `;
        }
    }

    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        if (selectedSoilType) {
            formData.append('soil_type', selectedSoilType);
        }
        
        try {
            // Show loading state
            document.getElementById('loading').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            document.getElementById('error').style.display = 'none';
            document.getElementById('detailed-report').classList.remove('visible');
            document.getElementById('soil-selection').style.display = 'none'; // Hide soil selection
            
            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            // Hide loading state
            document.getElementById('loading').style.display = 'none';
            
            if (data.error) {
                document.getElementById('error').style.display = 'block';
                document.getElementById('error').textContent = data.error;
                return;
            }
            
            // Show results
            document.getElementById('results').style.display = 'block';
            
            // Update results display
            updateResult('plant-type', 'Plant Type', data.plant.type, data.plant.confidence);
            updateResult('deficiency-type', 'Deficiency', data.deficiency.type, data.deficiency.confidence);
            updateResult('severity-level', 'Severity', data.severity.level, data.severity.confidence);
            
            // Only show soil selection if deficiency is known and valid
            if (data.deficiency.type !== "Unknown" && data.deficiency.type !== "Healthy/Unknown") {
                document.getElementById('soil-selection').style.display = 'block';
                document.getElementById('detailed-report').classList.remove('visible');
                if(selectedSoilType){
                    document.getElementById('soil-selection').style.display = 'none';
                    // Generate detailed report
                    generateDetailedReport(
                        data.plant.type,
                        data.deficiency.type,
                        data.severity.level,
                        {
                            location: data.environmental_analysis?.location || 'Unknown',
                            temperature: data.environmental_analysis?.temperature || 'N/A',
                            humidity: data.environmental_analysis?.humidity || 'N/A',
                            status: data.environmental_analysis?.status || 'Environmental data not available',
                            soil_analysis: data.soil_analysis || {
                                soil_type: selectedSoilType || 'Not specified',
                                status: 'Soil analysis not available'
                            },
                            recommendation: data.recommendation || null
                        }
                    );
                }
            } else {
                document.getElementById('soil-selection').style.display = 'none';
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = 'Error processing image. Please ensure you uploaded a valid image file.';
        }
    });
            
    // Add handler for soil type submission
    document.getElementById('submitSoilType').addEventListener('click', function() {
        if (!selectedSoilType) {
            alert('Please select a soil type to continue.');
            return;
        }
        document.getElementById('soil-selection').style.display = 'none';
        // Resubmit the form with the soil type
        const formEvent = new Event('submit');
        form.dispatchEvent(formEvent);
    });

    // Drag and drop handlers
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