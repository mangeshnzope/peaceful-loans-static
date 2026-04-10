document.addEventListener("DOMContentLoaded", function() {

    const animatedWordElement = document.getElementById("animated-word");
    
    
    if (animatedWordElement) {
        const words = ["Save 0.5%-1% on interest rate ", "Save ₹5-15 Lakhs per ₹1 Cr","Get more than 75% loan"];
        let i = 0; // Word index
        let j = 0; // Character index
        let currentWord = "";
        let isDeleting = false;

        function type() {
            currentWord = words[i];

            if (isDeleting) {
                // Remove a character
                animatedWordElement.textContent = currentWord.substring(0, j - 1);
                j--;
            } else {
                // Add a character
                animatedWordElement.textContent = currentWord.substring(0, j + 1);
                j++;
            }

            // If word is fully typed, start deleting after a pause
            if (!isDeleting && j === currentWord.length) {
                isDeleting = true;
                setTimeout(type, 1500); // Pause at end of word
                return;
            }

            // If word is fully deleted, move to the next word
            if (isDeleting && j === 0) {
                isDeleting = false;
                i = (i + 1) % words.length; 
                setTimeout(type, 500); // Pause before typing new word
                return;
            }

            const typingSpeed = isDeleting ? 100 : 200;
            setTimeout(type, typingSpeed);
        }

        // Initial call to start the animation
        setTimeout(type, 500);
    }
});

// --- Initialize Testimonials Owl Carousel ---
$(document).ready(function(){
  $('.testimonials-section .owl-carousel').owlCarousel({
    loop: true,
    margin: 30, // Space between items
    nav: false, // Hide next/prev arrows
    dots: true, // Show navigation dots
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    responsive:{
        0:{
            items:1
        },
        768:{
            items:2
        },
        1200:{
            items:2
        }
    }
  });
});