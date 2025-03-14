function getPlants() {
    let location = document.getElementById("location").value;
    if (!location) {
        alert("Please enter a location!");
        return;
    }

    console.log("Location entered: " + location);

    // Use FormData to send the location
    let formData = new FormData();
    formData.append("location", location);

    fetch("/predict", {
        method: "POST", body: formData
    })
        .then(response => response.json())
        .then(data => {
            let plantList = document.getElementById("plant-list");
            plantList.innerHTML = ""; // Clear previous results

            if (data.error) {
                plantList.innerHTML = `<p style="color: red;">${data.error}</p>`;
                return;
            }

            data.plants.forEach(plant => {
                let plantItem = `
                <div class="image-container">
                     <img src="/static/images/${plant.name}.jpg" alt="${plant.name}">
                    <div class="caption">${plant.name}</div>
                </div>
            `;
                plantList.innerHTML += plantItem;
            });

            // Show the results section
            document.querySelector('.results').style.display = 'block';

        })
        .catch(error => console.error("Error:", error));
}

// Function to convert a string to sentence case
function toSentenceCase(str) {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

// Fetch locations from the backend
fetch('/get_locations')
    .then(response => response.json())
    .then(data => {
        const locations = data.locations;
        const dropdownContent = document.getElementById('locationDropdown');

        // Populate the dropdown with locations
        locations.forEach(location => {
            const option = document.createElement('div');
            const sentenceCaseLocation = toSentenceCase(location); // Convert to sentence case
            option.textContent = sentenceCaseLocation;
            option.onclick = () => {
                document.getElementById('location').value = sentenceCaseLocation;
                hideDropdown();
            };
            dropdownContent.appendChild(option);
        });
    })
    .catch(error => console.error('Error fetching locations:', error));

// Show the dropdown when the input field is focused
function showDropdown() {
    document.getElementById('locationDropdown').style.display = 'block';
}

// Hide the dropdown
function hideDropdown() {
    document.getElementById('locationDropdown').style.display = 'none';
}

// Hide dropdown when clicking outside the dropdown or input field
document.addEventListener('click', function (event) {
    const input = document.getElementById('location');
    const dropdown = document.getElementById('locationDropdown');

    // Check if the click is outside the input and dropdown
    if (event.target !== input && event.target !== dropdown && !dropdown.contains(event.target)) {
        hideDropdown();
    }
});

// Filter locations based on user input
function filterLocations() {
    const input = document.getElementById('location');
    const filter = input.value.toUpperCase();
    const dropdown = document.getElementById('locationDropdown');
    const options = dropdown.getElementsByTagName('div');

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const text = option.textContent || option.innerText;
        if (text.toUpperCase().indexOf(filter) > -1) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    }
}


