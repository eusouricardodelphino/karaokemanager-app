// ============================================
// SCROLL ANIMATIONS
// ============================================

// Smooth scroll behavior for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header background on scroll
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add/remove scrolled class for styling
    if (currentScroll > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// ============================================
// INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all animated elements
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll(
        '.feature-card, .step, .stat, .benefit-item'
    );
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add visible class styles dynamically
const style = document.createElement('style');
style.textContent = `
    .visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// ============================================
// MOBILE MENU TOGGLE (if needed in future)
// ============================================

// Utility function for future enhancements
function addGlowEffect(element) {
    element.addEventListener('mouseenter', () => {
        element.style.boxShadow = '0 0 30px rgba(161, 52, 255, 0.6)';
    });
    
    element.addEventListener('mouseleave', () => {
        element.style.boxShadow = '';
    });
}

// ============================================
// TRACK CTA CLICKS (for analytics if needed)
// ============================================

document.querySelectorAll('a[href*="signup"]').forEach(button => {
    button.addEventListener('click', () => {
        console.log('Signup button clicked');
        // Add analytics tracking here if needed
    });
});

document.querySelectorAll('a[href*="login"]').forEach(button => {
    button.addEventListener('click', () => {
        console.log('Login button clicked');
        // Add analytics tracking here if needed
    });
});