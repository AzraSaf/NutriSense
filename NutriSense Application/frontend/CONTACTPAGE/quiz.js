const script = document.createElement('script');

// Set the src attribute to the URL of the alertbox library
script.src = "https://cdn.jsdelivr.net/gh/noumanqamar450/alertbox@main/version/1.0.2/alertbox.min.js";

// Append the <script> element to the document's <head> element
document.head.appendChild(script);

let topButton = document.getElementById("topBtn");
let bottomButton = document.getElementById("bottomBtn");
window.onscroll = function () {
    scrollFunction()
};

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

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function bottomFunction() {
    window.scrollTo(0, document.body.scrollHeight);
}

document.addEventListener("DOMContentLoaded", function () {
    const quizLink = document.getElementById("about");
    const partyIcon = document.querySelector(".bx-party");

    quizLink.addEventListener("mouseenter", function () {
        partyIcon.style.marginLeft = "150px";
    });

    quizLink.addEventListener("mouseleave", function () {
        partyIcon.style.marginLeft = "65px";
    });
});

function openPopup(event) {
    event.preventDefault();
    document.getElementById("quizText").style.display = "block";
}

function closePopup() {
    document.getElementById("quizText").style.display = "none";
    confettiParticles.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function quiz() {
    document.querySelector(".quizbg").style.display = "none";
    document.getElementById("hh").style.display = "block";
}
function quiz1() {
    var quizQuestions = [
        {
            question: "1. How do you say \"thank you\" in Japanese? \nEnter the option letter ONLY.",
            options: ['A)Arigato', 'B)Konnichiwa', 'C)Sayonara '],
            correctAnswer: 'A'
        },
        {
            question: "2. What is the official language of Brazil?",
            options: ['A)Spanish', 'B)Portuguese', 'C)French'],
            correctAnswer: "B"
        },
        {
            question: "3. What is the most widely spoken language in the world?",
            options: ['A)English', 'B)Mandarin Chinese', 'C)Spanish'],
            correctAnswer: 'B'
        },
        {
            question: "4. Which of the following languages is written in Cyrillic script?",
            options: ['A)Greek', 'B)Arabic', 'C)Russian'],
            correctAnswer: 'C'
        },
        {
            question: "5. What is the correct translation of \"hello\" in Spanish?",
            options: ['A)Hola', 'B)Adiós', 'C)Gracias'],
            correctAnswer: 'A'
        }
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

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}
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
const canvas = document.createElement('canvas');
canvas.id = 'confettiCanvas';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.pointerEvents = 'none';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
const styles = `
    #confettiCanvas {
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
    }
`;
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const confettiParticles = [];
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
function burstConfetti() {
    for (let i = 0; i < 100; i++) {
        confettiParticles.push(createConfettiParticle());
    }
}
function animate() {
    drawConfetti();
    updateConfetti();
    requestAnimationFrame(animate);
}
animate();

var txt;

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

function showTxt() {
    burstConfetti();
    var container = document.querySelector(".container1234");
    container.innerHTML += "<p>" + txt + "</p>";

}