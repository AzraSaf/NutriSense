// Move to the top and bottom functions
let topButton = document.getElementById("topBtn");
let bottomButton = document.getElementById("bottomBtn");
window.onscroll = function () {
  scrollFunction();
};
function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    topButton.style.display = "block";
  } else {
    topButton.style.display = "none";
  }
  if (
    document.body.scrollHeight - window.innerHeight - window.pageYOffset >
    100
  ) {
    bottomButton.style.display = "block";
  } else {
    bottomButton.style.display = "none";
  }
}
// Move to the top function
function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}
// Move to the bottom function
function bottomFunction() {
  window.scrollTo(0, document.body.scrollHeight);
}

/*#################################################################*/
// Function to change font size of specified elements
function changeFontSize(elements, step) {
  elements.forEach((element) => {
    var computedStyle = window.getComputedStyle(element);
    var currentSize = parseFloat(computedStyle.fontSize);
    if (!isNaN(currentSize)) {
      element.style.fontSize = currentSize + step + "px";
    }
  });
}

// JavaScript functions to increase and decrease font size
function increaseFontSize() {
  var elements = document.querySelectorAll(
    ".text, .overlayframe h1, .overlayframe p, .team, .picframe p, .whatweoffer h1, .time p, .person p, .options p, .shop p"
  );
  changeFontSize(elements, 2); // You can adjust the step size as per your requirement
}

function decreaseFontSize() {
  var elements = document.querySelectorAll(
    ".text, .overlayframe h1, .overlayframe p, .team, .picframe p, .whatweoffer h1, .time p, .person p, .options p, .shop p"
  );
  changeFontSize(elements, -2); // You can adjust the step size as per your requirement
}

// Function to reset the font size
function resetFont() {
  // Select the elements directly using document.querySelector() or document.querySelectorAll()
  let header = document.querySelector(".text");
  let overlayheadings = document.querySelectorAll(".overlayframe h1");
  let overlaypara = document.querySelectorAll(".overlayframe p");
  let team = document.querySelector(".team");
  let names = document.querySelectorAll(".picframe p");
  let offerheading = document.querySelector(".whatweoffer h1");
  let time = document.querySelector(".time p");
  let person = document.querySelector(".person p");
  let options = document.querySelector(".options p");
  let shop = document.querySelector(".shop p");

  // Reset font sizes for each element
  header.style.fontSize = "35px";
  overlayheadings.forEach((element) => {
    element.style.fontSize = "40px";
  });
  overlaypara.forEach((element) => {
    element.style.fontSize = "20px";
  });
  team.style.fontSize = "35px";
  names.forEach((element) => {
    element.style.fontSize = "20px";
  });
  offerheading.style.fontSize = "28px";
  time.style.fontSize = "17px";
  person.style.fontSize = "17px";
  options.style.fontSize = "17px";
  shop.style.fontSize = "17px";
}
