document.getElementById('recommendationForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const soilType = document.getElementById('soil_type').value;
    const plantType = document.getElementById('plant_type').value;
    const deficiencyType = document.getElementById('deficiency_type').value;
    const severityLevel = document.getElementById('severity_level').value;

    const data = {
        soil_type: soilType,
        plant_type: plantType,
        deficiency_type: deficiencyType,
        severity_level: severityLevel
    };

    fetch('/fertilizer-recommendation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('result');
        if (data.error) {
            resultDiv.innerHTML = `<h2>Error</h2><p>${data.error}</p>`;
        } else {
            resultDiv.innerHTML = `
                <h2>Recommendation</h2>
                <p><strong>Plant:</strong> ${data.plant}</p>
                <p><strong>Deficiency:</strong> ${data.deficiency}</p>
                <p><strong>Severity:</strong> ${data.severity}</p>
                <p><strong>Recommendation:</strong> ${data.recommendation}</p>
                <p><strong>Location:</strong> ${data.location}</p>
                <p><strong>Temperature:</strong> ${data.temperature}°C</p>
                <p><strong>Humidity:</strong> ${data.humidity}%</p>
                <p><strong>Soil Suitability:</strong> ${data.soil_suitability}</p>
                <p><strong>Temperature Status:</strong> ${data.temperature_status}</p>
                <p><strong>Humidity Status:</strong> ${data.humidity_status}</p>
            `;
        }
        // Append static guidelines regardless of result
        resultDiv.innerHTML += `
            <h3>Fertilizer Application Guidelines (Applicable to Banana, Coffee & Rice)</h3>
            <ul>
                <li><strong>Application Methods:</strong>
                    <ul>
                        <li><strong>Even & Precise Spreading:</strong> Use calibrated spreaders and perform tray tests to ensure even distribution.</li>
                        <li><strong>Split Applications:</strong>
                            <ul>
                                <li><strong>Nitrogen:</strong> Apply in multiple splits—50% before transplanting, 25% at 30 days, 25% at panicle initiation.</li>
                                <li><strong>Phosphorus, Potassium, Zinc:</strong> Typically applied as a basal dose.</li>
                            </ul>
                        </li>
                        <li><strong>Equipment & Conditions:</strong> Adjust spreader settings based on weather to avoid uneven application.</li>
                    </ul>
                </li>
                <li><strong>General Best Practices:</strong>
                    <ul>
                        <li><strong>Quality & Consistency:</strong> Use high-quality fertilizers and store them properly.</li>
                        <li><strong>Timing & Precision:</strong> Apply nutrients when crops need them most.</li>
                        <li><strong>Zone-Specific Recommendations:</strong> Follow field zone-based tables for tailored application rates.</li>
                    </ul>
                </li>
            </ul>
        `;
        resultDiv.style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<h2>Error</h2><p>Failed to fetch recommendation. Please try again.</p>`;
        // Append static guidelines even on error
        resultDiv.innerHTML += `
            <h3>Fertilizer Application Guidelines (Applicable to Banana, Coffee & Rice)</h3>
            <ul>
                <li><strong>Application Methods:</strong>
                    <ul>
                        <li><strong>Even & Precise Spreading:</strong> Use calibrated spreaders and perform tray tests to ensure even distribution.</li>
                        <li><strong>Split Applications:</strong>
                            <ul>
                                <li><strong>Nitrogen:</strong> Apply in multiple splits—50% before transplanting, 25% at 30 days, 25% at panicle initiation.</li>
                                <li><strong>Phosphorus, Potassium, Zinc:</strong> Typically applied as a basal dose.</li>
                            </ul>
                        </li>
                        <li><strong>Equipment & Conditions:</strong> Adjust spreader settings based on weather to avoid uneven application.</li>
                    </ul>
                </li>
                <li><strong>General Best Practices:</strong>
                    <ul>
                        <li><strong>Quality & Consistency:</strong> Use high-quality fertilizers and store them properly.</li>
                        <li><strong>Timing & Precision:</strong> Apply nutrients when crops need them most.</li>
                        <li><strong>Zone-Specific Recommendations:</strong> Follow field zone-based tables for tailored application rates.</li>
                    </ul>
                </li>
            </ul>
        `;
        resultDiv.style.display = 'block';
    });
});