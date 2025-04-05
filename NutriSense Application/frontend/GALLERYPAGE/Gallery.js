//Scroll Animation
document.addEventListener('scroll', function() {
    const section2 = document.querySelector('.section2'); //selecting the section with class 'section2'
    const section2Position =
        section2.getBoundingClientRect().top;  //getiing its position relative to the viewport
    const screenPosition = window.innerHeight / 1.3; //calculating the position threshold

    //cheching if the section2 is within the threshold
    if(section2Position < screenPosition){
        section2.classList.add('show'); //adding the show to trigger an animation
    }
});



//Carousel functionality
const nextDom = document.getElementById('next');  //selecting the next button
let prevDom = document.getElementById('prev');  //selecting the previous button

let carouselDom = document.querySelector('.carousel'); //selecting the carousel container
let SliderDom = carouselDom.querySelector('.carousel .list'); //selecting the slide list
let thumbnailBorderDom = document.querySelector('.carousel .thumbnail'); //selecting the thumbnail container
let thumbnailItemsDom = thumbnailBorderDom.querySelectorAll('.item'); //selecting the thumbnail items
let timeDom = document.querySelector('.carousel .time'); //selecting the time indicator

thumbnailBorderDom.appendChild(thumbnailItemsDom[0]); //appending the first thumbnail to the end for the loop
let timeRunning = 3000; //setting the time interval for sliding
let timeAutoNext = 7000; //setting the time interval for automatic sliding

//event listeners for next and prev buttons
nextDom.onclick = function(){
    showSlider('next');
}

prevDom.onclick = function(){
    showSlider('prev');
}
let runTimeOut;
let runNextAuto = setTimeout(() => {
    nextDom.click();
}, timeAutoNext)

//function to show the next or prev slide
function showSlider(type){
    let  SliderItemsDom = SliderDom.querySelectorAll('.carousel .list .item'); //selecting slide items
    let thumbnailItemsDom = document.querySelectorAll('.carousel .thumbnail .item'); //selecting thumbnail items

    if(type === 'next'){
        SliderDom.appendChild(SliderItemsDom[0]); //moving the first slide to the end
        thumbnailBorderDom.appendChild(thumbnailItemsDom[0]); //moving the first thumbnail to the end
        carouselDom.classList.add('next');  //adding class for animation
    }else{
        SliderDom.prepend(SliderItemsDom[SliderItemsDom.length - 1]); //moving the slide to the beginning
        thumbnailBorderDom.prepend(thumbnailItemsDom[thumbnailItemsDom.length - 1]); //moving the thumbnail to the beginning
        carouselDom.classList.add('prev'); //adding class for animation
    }

    //clearing timeouts and setting them again
    clearTimeout(runTimeOut);
    runTimeOut = setTimeout(() => {
        carouselDom.classList.remove('next');//removing animation class
        carouselDom.classList.remove('prev');//removing animation class
    }, timeRunning);

    clearTimeout(runNextAuto);
    runNextAuto = setTimeout(() => {
        next.click();  //simulating a click on next button for automatic sliding
    }, timeAutoNext)
}


//scroll to top/bottom buttons
let topButton = document.getElementById("topBtn");
let bottomButton = document.getElementById("bottomBtn");

//event listener for scroll behaviour
window.onscroll = function () {
    scrollFunction()
};

//function to control the display of scroll buttons
function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        topButton.style.display = "block"; //displaying the scroll to top button
    } else {
        topButton.style.display = "none"; //hiding the scroll to top button
    }
    //checking scroll position for displaying scroll to bottom button
    if ((document.body.scrollHeight - window.innerHeight - window.pageYOffset) > 100) {
        bottomButton.style.display = "block"; //displaying the scroll to bottom button
    } else {
        bottomButton.style.display = "none"; //hiding the scroll to bottom button
    }
}


//function for scrolling to the top of the page
function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

//function for scrolling to the bottom of the page
function bottomFunction() {
    window.scrollTo(0, document.body.scrollHeight);
}
//hover effect
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

