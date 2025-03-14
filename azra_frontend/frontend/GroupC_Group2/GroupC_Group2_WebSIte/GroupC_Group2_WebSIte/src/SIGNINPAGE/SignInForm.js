//Sign in and Sign Up buttons
const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click',()=>{
    container.classList.remove("active");
});

function submitForm() {
    // Perform any additional checks or actions if needed
    // Then redirect to the main page
    window.location.href = '../MAINPAGE/Mainpage.html';
}

//Customized alert boxes-SignUp
const form = document.getElementById('Signup');
const alertContainer = document.getElementById('alertContainer');
const alertText =document.getElementById('alertText');

form.addEventListener('submit',function (event){
    event.preventDefault(); //Prevent form submission

    //Get value of the name input field
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const age = document.getElementById('age').value.trim();
    const PLF = document.getElementById('PLF').value.trim();
    const Education = document.getElementById('education').value.trim();

    // Validate if all compulsory fields are filled
    if (name.trim() !== '' && isValidEmail(email)!=='' && password.trim() !== '' && age.trim()!=='' && PLF.trim()!=='' && Education.trim()!=='') {
        // If all fields are filled, show success alert
        showAlert(`Dear ${name}, thank you for Signing Up with us, the recommended results will be shown in a while.`);
        setTimeout(submitForm,5000);
        // Here you can submit the form or perform any other action
    } else {
        // If any field is empty, show error alert
        showAlert('Please fill in all compulsory fields.');
    }

    // Function to display the alert
    function showAlert(message) {
        alertText.innerText = message;
        alertContainer.style.display = 'flex';
        // Hide the alert after some time
        setTimeout(function() {
            alertContainer.style.display = 'none';
        }, 5000); // 5000 milliseconds = 5 seconds
    }
});


//Customized alert boxes-SignIn
const form1 = document.getElementById('Signin');
const alertContainer1 = document.getElementById('alertContainer');
const alertText1 =document.getElementById('alertText');

form1.addEventListener('submit',function (event){
    event.preventDefault(); //Prevent form submission

    //Get value of the name input field
    const email1 = document.getElementById('email1').value.trim();
    const password1 = document.getElementById('password1').value.trim();

    // Validate if all compulsory fields are filled
    if (isValidEmail(email)!=='' && password1.trim() !== '') {
        // If all fields are filled, show success alert
        showAlert(`Welcome Back, Learner!`);
        setTimeout(submitForm,5000);
        // Here you can submit the form or perform any other action
    } else {
        // If any field is empty, show error alert
        showAlert('Please fill in all compulsory fields.');
    }

    // Function to display the alert
    function showAlert(message) {
        alertText1.innerText = message;
        alertContainer1.style.display = 'flex';
        // Hide the alert after some time
        setTimeout(function() {
            alertContainer1.style.display = 'none';
        }, 3500); // 5000 milliseconds = 5 seconds
    }
});


document.addEventListener("DOMContentLoaded", function() {
    // Get the progress bar element
    var progressBar = document.getElementById("progressBar");

    // Get the sign-up form
    var signUpForm = document.getElementById("Signup");

    // Get all input fields in the sign-up form
    var inputFields = signUpForm.querySelectorAll("input");

    // Calculate the total number of input fields
    var totalFields = inputFields.length;

    // Calculate the progress per input field
    var progressPerField = 100 / totalFields;

    // Initialize the progress
    var progress = 0;

    // Update progress function
    function updateProgress() {
        // Calculate the current progress based on filled fields
        var filledFields = 0;
        inputFields.forEach(function(inputField) {
            if (inputField.value !== "") {
                filledFields++;
            }
        });
        progress = filledFields * progressPerField;

        // Update the progress bar width
        progressBar.style.width = progress + "%";
    }

    // Add event listeners to input fields for change events
    inputFields.forEach(function(inputField) {
        inputField.addEventListener("input", updateProgress);
    });
});

document.getElementById("Signup").addEventListener("submit", function(event) {
    var preferredLearning = document.getElementById("PLF").value.trim().toLowerCase();

    if (preferredLearning !== "online" && preferredLearning !== "onsite") {
        // If the entered value is not "Online" or "Onsite", prevent form submission
        event.preventDefault();
        alert("Preferred Learning Format should be either 'Online' or 'Onsite'");
        return false;
    }
});


function isValidEmail(email){
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
