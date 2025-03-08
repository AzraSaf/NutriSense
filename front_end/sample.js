// Initialize AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 1000,
        once: false,
        mirror: false
    });
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        const navHeight = document.querySelector('nav').offsetHeight;
        
        window.scrollTo({
            top: target.offsetTop - navHeight,
            behavior: 'smooth'
        });
    });
});