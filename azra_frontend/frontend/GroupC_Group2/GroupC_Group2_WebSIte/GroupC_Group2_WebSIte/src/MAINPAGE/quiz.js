// Creating a script element
const script = document.createElement('script');

// Set the src attribute to the URL of the alertbox library
script.src = "https://cdn.jsdelivr.net/gh/noumanqamar450/alertbox@main/version/1.0.2/alertbox.min.js";

// Append the <script> element to the document's <head> element
document.head.appendChild(script);

// Get references to the top and bottom buttons
let topButton = document.getElementById("topBtn");
let bottomButton = document.getElementById("bottomBtn");

// Attach scroll event listener
window.onscroll = function () {
    scrollFunction()
};

// Function to handle scrolling behavior
function scrollFunction() {
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

// Function to scroll to the top of the page
function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

// Function to scroll to the bottom of the page
function bottomFunction() {
    window.scrollTo(0, document.body.scrollHeight);
}

// Event listener for when the DOM content is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Get reference to the quiz link and party icon
    const quizLink = document.getElementById("about");
    const partyIcon = document.querySelector(".bx-party");

    // Event listener for mouse entering the quiz link
    quizLink.addEventListener("mouseenter", function () {
        partyIcon.style.marginLeft = "150px";
    });

    // Event listener for mouse leaving the quiz link
    quizLink.addEventListener("mouseleave", function () {
        partyIcon.style.marginLeft = "65px";
    });
});

// Function to open the quiz popup
function openPopup(event) {
    event.preventDefault();
    document.getElementById("quizText").style.display = "block";
}

// Function to close the quiz popup
function closePopup() {
    document.getElementById("quizText").style.display = "none";
    confettiParticles.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to initiate the quiz
function quiz() {
    document.querySelector(".quizbg").style.display = "none";
    document.getElementById("hh").style.display = "block";
}

// Function to handle the quiz questions and calculate the score
function quiz1() {
    var quizQuestions = [
        {
            question: "1. How do you say \"thank you\" in Japanese? \nEnter the option letter ONLY.",
            options: ['A)Arigato', 'B)Konnichiwa', 'C)Sayonara '],
            correctAnswer: 'A'
        },
        // More quiz questions...
    ];
    var score = 0;
    for (var i = 0; i < quizQuestions.length; i++) {
        let x = true;
        var userAnswer = prompt(quizQuestions[i].question + "\n" + quizQuestions[i].options.join(", ")).toUpperCase();
        while (x) {
            if (userAnswer === quizQuestions[i].correctAnswer) {
                score += 2;
                alert("Yay, your answer is right!")
                x = false;
                break;
            } else if (userAnswer == null || userAnswer == "") {
                alert("An answer was not given.")
                var userAnswer = prompt(quizQuestions[i].question + "\n" + quizQuestions[i].options.join(", "));
            } else {
                score -= 1;
                alert("Wrong choice. The correct answer was, " + quizQuestions[i].correctAnswer)
                x = false;
                break;
            }
        }
    }
    // Display the results
    if (score > 0) {
        document.querySelector(".container123").style.display = "none";
        document.querySelector(".container1234").style.display = "block";
        showresults(score);
    } else {
        document.querySelector(".container123").style.display = "none";
        document.querySelector(".container1234").style.display = "block";
        showresults(score);
    }
}

// Function to generate a random number within a specified range
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Function to create a confetti particle
function createConfettiParticle() {
    return {
        x: randomInRange(0, window.innerWidth),
        y: -10,
        radius: randomInRange(5, 10),
        color: `rgb(${randomInRange(0, 255)}, ${randomInRange(0, 255)}, ${randomInRange(0, 255)})`,
        speed: randomInRange(2, 4),
        angle: randomInRange(0, Math.PI * 2),
        rotationSpeed: randomInRange(-0.2, 0.2)
    };
}

// Create a canvas element for the confetti
const canvas = document.createElement('canvas');
canvas.id = 'confettiCanvas';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.pointerEvents = 'none';
document.body.appendChild(canvas);

// Get 2D context for the canvas
const ctx = canvas.getContext('2d');

// CSS styles for the confetti canvas
const styles = `
    #confettiCanvas {
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
    }
`;

// Create a style element and append CSS styles to it
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Array to hold confetti particles
const confettiParticles = [];

// Function to draw confetti particles
function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiParticles.forEach(particle => {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.angle);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.radius / 2, -particle.radius / 2, particle.radius, particle.radius);
        ctx.restore();
    });
}

// Function to update confetti particles
function updateConfetti() {
    confettiParticles.forEach(particle => {
        particle.y += particle.speed;
        particle.angle += particle.rotationSpeed;

        // Reset confetti particle if it goes below the window
        if (particle.y > window.innerHeight) {
            particle.y = -10;
        }
    });
}

// Function to create a burst of confetti
function burstConfetti() {
    for (let i = 0; i < 100; i++) {
        confettiParticles.push(createConfettiParticle());
    }
}

// Function to animate confetti
function animate() {
    drawConfetti();
    updateConfetti();
    requestAnimationFrame(animate);
}

// Start the animation loop
animate();

// Variable to hold text for displaying results
var txt;

// Function to display the quiz results
function showresults(score) {
    var container = document.querySelector(".container1234");
    if (score > 0) {
        txt = ("<span style='color: black; font-weight: bolder'><br>Congratulations! <br> You have earned " + score + " points. Please claim the points in your next purchase.")
    } else {
        txt = ("<span style='color: black; font-weight: bolder'>You scored " + score + " points. Better luck next time!");
    }
    container.innerHTML = "<h1 style='color: #Fb046c'>Result of your performance</h1><i class='bx bx-window-close bx-flashing-hover' style=\"color: #Fb046c; font-size: xx-large; position: absolute; margin-left: 246px; top: -5px\"  onclick=\"closePopup()\"></i><br><br>" +
        "<i class='bx bx-gift bx-tada' style='font-size: 75px'></i><br><br> <p><canvas id=\"confettiCanvas\"></canvas><button onclick='showTxt()' style=\"margin-left: 10px\">Click here!</button></p>";
}

// Function to show the text content with confetti
function showTxt() {
    burstConfetti();
    var container = document.querySelector(".container1234");
    container.innerHTML += "<p>" + txt + "</p>";
}
