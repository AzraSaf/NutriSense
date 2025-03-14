function openNav() {
    document.getElementById("mySidenav").style.width = "300px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

function selectItem(itemName) {    // Function Such that when a colour is selected it closes the pulldown menu and displays the selected colour
    let dropdownBtn = document.querySelector(".dropdown-btn");
    dropdownBtn.innerHTML = itemName + '<i class="fa fa-caret-down"></i>';
    const dropdownContent = dropdownBtn.nextElementSibling;
    if (dropdownContent.style.display === "block") {
        dropdownContent.style.display = "none";
    }
}

function selectItem2(itemName) {                     //to change button  name when changing bg colour
    let dropdownBtn2 = document.querySelector(".dropdown-btn2");
    dropdownBtn2.innerHTML = itemName + '<i class="fa fa-caret-down"></i>';
    const dropdownContent2 = dropdownBtn2.nextElementSibling;
    if (dropdownContent2.style.display === "block") {
        dropdownContent2.style.display = "none";
    }
}

function setupDropdowns() {                   // function to close the pulldown menu or open them when clicked
        const dropdown = document.querySelector('.dropdown-container1');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}
function setupDropdowns2() {
    const dropdown = document.querySelector('.dropdown-container2');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function changeTextColor(color) { // Function to change the colour of the texts
    const btnid = document.getElementById("CusBtn");
    const heading = document.getElementById("Head");
    const nav = document.querySelectorAll('.nav ul li a');
    const txt = document.querySelector('.intro');
    const footer = document.querySelector('footer');
    const course = document.querySelectorAll('.course');
    const Formtxt = document.querySelector('.formText');
    const NewsLetter = document.querySelector('.text-overlay');

    const elements = [document.body, footer,NewsLetter, btnid, txt,Formtxt, heading,...course, ...nav];

    elements.forEach(element => {
        element.style.color = color;
    });


}

function changeBgColor(color) {  // to change the background colour
    document.body.style.backgroundColor = color;
}


function resetStyles() {   // to restore the colours back to the original ones

    const elements = document.querySelectorAll('body, #CusBtn,.course');
    elements.forEach(element => {
        element.style.color = "black";
    });
    const NewsLetter = document.querySelector('.text-overlay');
    NewsLetter.style.color = "#fb046c";

    const elements2 = document.querySelectorAll('.intro,.formText, #Head, .nav ul li a,footer');
    elements2.forEach(element => {
        element.style.color = "white";
    });
    document.body.style.backgroundColor = "#f1f1f1";
    selectItem('White/Black (default)');
    selectItem2('White (default)');


}

function scrollFunction() {     // the arrow navigation fucntion
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        topButton.style.display = "block";
    } else {
        topButton.style.display = "none";
    }
    if ((document.body.scrollHeight - window.innerHeight - window.pageYOffset) > 100) {
        bottomButton.style.display = "block";
    } else {
        bottomButton.style.display = "none";
    }
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function bottomFunction() {
    window.scrollTo(0, document.body.scrollHeight);
}


    // function to make sure the forms are validated
    function validateForm() {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const nameError = document.getElementById('nameError');
        const emailError = document.getElementById('emailError');

        let isValid = true;
        nameError.textContent = '';   // clears any text previously displayed
        emailError.textContent = '';

        if (!nameInput.value.trim()) {  // if name field is left empty
            nameError.textContent = 'Name is required';
            nameInput.style.borderColor = '#FF0000';
            nameInput.style.borderWidth = '2px'
            nameInput.style.backgroundColor = '#FFC0CB';
            isValid = false;                    // so that form isnt valid
        }else {
            if (isValid===true){
                nameInput.style.borderColor = '';
                nameInput.style.borderWidth = '';
                nameInput.style.backgroundColor = '';
            }
        }

        if (!emailInput.value.trim()) {

            emailError.textContent = 'Email is required';  // if Email field is left empty
            emailInput.style.borderColor = '#FF0000';
            emailInput.style.borderWidth = '2px';
            emailInput.style.backgroundColor = '#FFC0CB';
            isValid = false;

        }
        else if (!isValidEmail(emailInput.value.trim())) {  //checks if email in correct format
            emailError.textContent = 'Invalid email format';
            emailInput.style.borderColor = '#FF0000';
            emailInput.style.borderWidth = '2px';
            emailInput.style.backgroundColor = '#FFC0CB';
            isValid = false;

        }else {

                emailInput.style.borderColor = '';
                emailInput.style.borderWidth = '';
                emailInput.style.backgroundColor = '';

        }
        return isValid;
}

    function isValidEmail(email) {
    const Validmail = /^[^\s@]+@gmail.com$/; //email validation
        const Validmail2 = /^[\w.-]+(\d+)@iit.ac.lk$/
        ;
    return Validmail.test(email)||Validmail2.test(email) ;
}

    function setupSubscriptionForm() {   // function when the subscribe button is clicked
        const subscribeBtn = document.getElementById('subscribeBtn');

        subscribeBtn.addEventListener('click', function() {  // checks if the form data is valid

            if (validateForm()) {  // //  if the form  valid  name submitted is taken and displayed in the success message

                const name = document.getElementById('name').value.trim();
                showSuccessMessage(name);
            }
        });
}

    function showSuccessMessage(name) {   // function to show the success message
        const successMessage = document.getElementById('successText');
        const successPopup = document.getElementById('successPopup');
        successMessage.textContent = `Dear ${name}, you have successfully subscribed for a personalized newsletter`;
        successPopup.style.display = 'block';
        setTimeout(function() {
            successPopup.style.display = 'none';
        }, 3000);
    }

function fetchData() {  // Function taking data from xml file and displaying on webpage
    const xmlFile = 'listingPage.xml';


    fetch(xmlFile)
        .then(response => response.text())
        .then(xmlString => {

            // Parsing the XML string to XML document

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

            const reviews = xmlDoc.querySelectorAll('review');




            reviews.forEach((review,index) => {

                // Extracting the content with line breaks from CDATA section
                const contentCDATA = review.querySelector('content').textContent;

                // Index to add content to each review
                const dataList = document.getElementById('Text' + (index + 1));

                // Create a single <p> tag for each review

                const Item = document.createElement('p');
                Item.innerHTML = contentCDATA; // Parsing CDATA content

                // Appending the <p> tag with parsed content
                dataList.appendChild(Item);
            });
        })
        .catch(error => {
            console.error('Error fetching XML data:', error);
        });
}
