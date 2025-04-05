document.addEventListener('DOMContentLoaded', function() {
    // Fetch locations when page loads
    fetch('http://localhost:5000/get-locations')
        .then(response => response.json())
        .then(data => {
            const locations = data.locations;
            const dropdownContent = document.getElementById('locationDropdown');

            locations.forEach(location => {
                const option = document.createElement('div');
                option.textContent = toSentenceCase(location);
                option.onclick = () => {
                    document.getElementById('location').value = option.textContent;
                    hideDropdown();
                };
                dropdownContent.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching locations:', error));
});

function getPlants() {
    let location = document.getElementById("location").value;
    if (!location) {
        alert("Please enter a location!");
        return;
    }

    // Show loading state
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.querySelector('.results').style.display = 'none';

    let formData = new FormData();
    formData.append("location", location);

    fetch("http://localhost:5000/predict-crop", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('loading').style.display = 'none';

        if (data.error) {
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = data.error;
            return;
        }

        let plantList = document.getElementById("plant-list");
        plantList.innerHTML = ""; // Clear previous results

    
        // Fetch the Excel data for filtering
        fetch("http://localhost:5000/getExcelData")
            .then(response => response.json())
            .then(excelData => {
                let filteredPlants = data.plants.filter(plant => {
                    let locationPlants = excelData[location.toLowerCase()];
                    return locationPlants && locationPlants.includes(plant.name.toLowerCase());
                });

                // Display the filtered plants
                const plantsGrid = document.createElement('div');
                plantsGrid.className = 'plants-grid';
                
                filteredPlants.forEach(plant => {
                    let plantItem = `
                        <div class="image-container">
                            <img src="assets/images/${plant.name.toLowerCase()}.jpg" 
                                 alt="${plant.name}"
                                 onerror="this.src='assets/images/default.jpg'">
                            <div class="caption">${plant.name}</div>
                        </div>
                    `;
                    plantsGrid.innerHTML += plantItem;
                });

                plantList.appendChild(plantsGrid);
                document.querySelector('.results').style.display = 'block';
            })
            .catch(error => console.error("Error fetching Excel data:", error));
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Error processing request. Please try again.';
    });
}