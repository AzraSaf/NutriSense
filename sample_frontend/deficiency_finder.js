document.getElementById("imageUpload").addEventListener("change", function (event) {
    const file = event.target.files[0]; 
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imagePreview = document.getElementById("imagePreview");
            imagePreview.src = e.target.result;
            imagePreview.style.display = "block"; 
        };
        reader.readAsDataURL(file);
    }
});

document.querySelector(".upload-btn").addEventListener("click", async function () {
    let fileInput = document.getElementById("imageUpload");
    let file = fileInput.files[0];

    if (!file) {
        alert("Please select an image first.");
        return;
    }

    let formData = new FormData();
    formData.append("file", file);

    try {
        let response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            body: formData,
        });

        let data = await response.json();
        
        if (data.prediction) {
            document.getElementById("result").innerText = "Deficiency Detected: " + data.prediction;
            document.getElementById("result").classList.remove("hidden");
        } else {
            alert("Error: " + (data.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error uploading file.");
    }
});
