// Function to show a summary of the form data
function showSummary(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Get the values of the form fields
    var firstName = document.getElementById('fname').value;
    var lastName = document.getElementById('lname').value;
    var email = document.getElementById('email').value;
    var theme = document.querySelector('input[name="theme"]:checked');
    var queryDetails = document.getElementById('querydet').value;

    // Check if any of the required fields are empty
    if (firstName === "" || lastName === "" || email === "" || !theme || queryDetails === "") {
        // If any field is empty, display an alert using the alertbox library
        alertbox.render({
            alertIcon: 'warning',
            title: 'Important',
            message: "Please fill in all fields.",
            btnTitle: 'Ok',
            themeColor: '#fb046c',
            btnColor: '#fb046c',
            border:true
        });
        // Render the alert and exit the function
        alertbox.render();
        return;
    }

    // Get the label of the selected theme
    var themeLabel = document.querySelector('label[for="' + theme.id + '"]').innerText;

    // Create a summary of the form data
    var summary = "Name: " + firstName + " " + lastName + "<br>";
    summary += "Email: " + email + "<br>";
    summary += "Subject: " + themeLabel + "<br>";
    summary += "Details: " + queryDetails;

    // Display the summary using the alertbox library
    alertbox.render({
        alertIcon: 'info',
        title: 'Summary',
        message: summary,
        btnTitle: 'Ok',
        themeColor: '#fb046c',
        btnColor: '#fb046c',
        border:true
    });
    // Render the alert
    alertbox.render();
}
