document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeButton = document.getElementById('remove-image');

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

    // Handle drag and drop
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

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        try {
            // Show loading state
            document.getElementById('loading').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            document.getElementById('error').style.display = 'none';
            
            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            // Update results display
            document.getElementById('loading').style.display = 'none';
            document.getElementById('results').style.display = 'block';
            
            // Update result text and confidence bars
            updateResult('plant-type', 'Plant Type', data.plant.type, data.plant.confidence);
            updateResult('deficiency-type', 'Deficiency', data.deficiency.type, data.deficiency.confidence);
            updateResult('severity-level', 'Severity', data.severity.level, data.severity.confidence);
            
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = 'Error processing image. Please try again.';
        }
    });

    // Helper function to update result display
    function updateResult(elementId, label, value, confidence) {
        const element = document.getElementById(elementId);
        const confidenceBar = document.getElementById(elementId.replace('-type', '-confidence')
            .replace('-level', '-confidence'));
        
        element.textContent = `${label}: ${value}`;
        confidenceBar.style.setProperty('--confidence-width', `${confidence * 100}%`);
        confidenceBar.setAttribute('title', `${(confidence * 100).toFixed(1)}% confidence`);
    }
});