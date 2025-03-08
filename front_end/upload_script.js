document.querySelector(".next-btn").addEventListener("click", function () {
    const uploadWrapper = document.querySelector(".upload-wrapper");

    // Fade Out Animation for Step 1
    uploadWrapper.style.opacity = "0";
    uploadWrapper.style.transform = "translateY(20px)"; 

    setTimeout(() => {
        // Change the content to Step 2 (Loading Bar)
        uploadWrapper.innerHTML = `
            <div class="instructions">
                <h2>Step 2:</h2> 
                <p>Your image is being analyzed...</p>
            </div> 

            <div class="upload-container">
                <h2>Processing Your Image...</h2>
                <p>Please wait while we analyze your plant's health.</p>

                <div class="progress-bar-container">
                    <div class="progress-bar"></div>
                    <span class="progress-text">0%</span>
                </div>
                
                <p class="status-message">Analyzing...</p>
            </div>
        `;

        // Fade In Animation
        uploadWrapper.style.opacity = "1";
        uploadWrapper.style.transform = "translateY(0)"; 

        // Start Progress Bar Simulation
        let progress = 0;
        const progressBar = document.querySelector(".progress-bar");
        const progressText = document.querySelector(".progress-text");
        const statusMessage = document.querySelector(".status-message");

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 10) + 5; // Increment by 5-15%

            if (progress > 100) {
                progress = 100;
                clearInterval(interval);
                statusMessage.textContent = "Generating Report...";
                
                // Show the final report after delay
                setTimeout(showReport, 2000);
            }

            progressBar.style.width = progress + "%";
            progressText.textContent = progress + "%";
        }, 500); // Update every 500ms
    }, 500); // Wait before replacing content
});

function showReport() {
    const uploadWrapper = document.querySelector(".upload-wrapper");

    uploadWrapper.innerHTML = `
        <div class="instructions">
            <h2>Step 3: Analysis Complete</h2> 
            <p>Your plant has the following deficiency:</p>
        </div> 

        <div class="upload-container">
            <h2>Deficiency Report</h2>
            <p><strong>Deficiency:</strong> Nitrogen Deficiency</p>
            <p><strong>Severity:</strong> Moderate</p>
            <p><strong>Suggested Solution:</strong> Use nitrogen-rich fertilizers like urea or compost.</p>
            
            <div class="next-container">
                <button class="next-btn">Done</button>
            </div>
        </div>
    `;
}
