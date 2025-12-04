// ========================================
//   ADVANCED PORTFOLIO INTERACTIONS
//   Premium UI/UX Enhancements
// ========================================

class AdvancedPortfolio {
    constructor() {
        this.init();
    }

    init() {
        this.setupParticles();
        this.setupMagneticButtons();
        this.setup3DCards();
        this.setupParallaxEffects();
        this.setupScrollAnimations();
        this.setupTypingEffect();
        this.setupGlowEffects();
        this.setupIntersectionObserver();
        this.setupSmoothScroll();
        this.setupCursorEffects();
        this.setupPerformanceMonitor();
    }

    // Particle System
    setupParticles() {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particles-container';
        particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        document.body.appendChild(particleContainer);

        // Create particles dynamically
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createParticle();
            }, i * 200);
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 4 + 2;
        particle.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            background: ${this.getRandomColor()};
            border-radius: 50%;
            left: ${Math.random() * window.innerWidth}px;
            top: ${window.innerHeight}px;
            box-shadow: 0 0 ${size * 2}px ${this.getRandomColor()};
        `;

        document.querySelector('.particles-container').appendChild(particle);

        // Animate particle
        particle.animate([
            {
                transform: 'translateY(0) rotate(0deg)',
                opacity: 0
            },
            {
                transform: `translateY(-${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`,
                opacity: 1
            },
            {
                transform: `translateY(-${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`,
                opacity: 0
            }
        ], {
            duration: Math.random() * 10000 + 10000,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();

        // Create next particle
        setTimeout(() => this.createParticle(), Math.random() * 2000);
    }

    getRandomColor() {
        const colors = [
            'rgba(99, 102, 241, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Magnetic Buttons
    setupMagneticButtons() {
        const buttons = document.querySelectorAll('.btn, .magnetic-btn');

        buttons.forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0, 0) scale(1)';
            });
        });
    }

    // 3D Card Effects
    setup3DCards() {
        const cards = document.querySelectorAll('.card, .service-card, .portfolio-item');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            });
        });
    }

    // Parallax Effects
    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('.hero-bg, .gradient-orb');

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;

            parallaxElements.forEach((element, index) => {
                const speed = index % 2 === 0 ? 0.5 : 0.3;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    // Scroll Animations
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.service-card, .portfolio-item, .stat-card').forEach(el => {
            observer.observe(el);
        });
    }

    // Typing Effect
    setupTypingEffect() {
        const heroTitle = document.querySelector('.hero-title');
        if (!heroTitle) return;

        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.borderRight = '3px solid var(--color-primary)';

        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < text.length) {
                heroTitle.textContent += text[index];
                index++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    heroTitle.style.borderRight = 'none';
                }, 1000);
            }
        }, 100);
    }

    // Glow Effects
    setupGlowEffects() {
        const glowElements = document.querySelectorAll('.btn-primary, .crypto-icon');

        glowElements.forEach(element => {
            setInterval(() => {
                element.style.animation = 'glowPulse 2s ease-in-out';
            }, 3000);
        });
    }

    // Intersection Observer for animations
    setupIntersectionObserver() {
        const elements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                }
            });
        });

        elements.forEach(el => observer.observe(el));
    }

    // Smooth Scroll
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Custom Cursor
    setupCursorEffects() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            border: 2px solid var(--color-primary);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.1s ease;
            transform: translate(-50%, -50%);
        `;

        const cursorFollower = document.createElement('div');
        cursorFollower.className = 'cursor-follower';
        cursorFollower.style.cssText = `
            position: fixed;
            width: 40px;
            height: 40px;
            background: rgba(99, 102, 241, 0.1);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            transition: transform 0.2s ease;
            transform: translate(-50%, -50%);
        `;

        document.body.appendChild(cursor);
        document.body.appendChild(cursorFollower);

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';

            setTimeout(() => {
                cursorFollower.style.left = e.clientX + 'px';
                cursorFollower.style.top = e.clientY + 'px';
            }, 100);
        });

        // Hover effects
        document.querySelectorAll('a, button, .card').forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
                cursorFollower.style.transform = 'translate(-50%, -50%) scale(1.5)';
            });

            element.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorFollower.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        });
    }

    // Performance Monitor
    setupPerformanceMonitor() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'measure') {
                        console.log(`${entry.name}: ${entry.duration}ms`);
                    }
                });
            });

            observer.observe({ entryTypes: ['measure'] });
        }
    }

    // Add ripple effect to buttons
    addRippleEffect(button) {
        button.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;

            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }
}

// Enhanced Loading Screen
class LoadingScreen {
    constructor() {
        this.init();
    }

    init() {
        const loader = document.querySelector('.loader-wrapper');
        if (!loader) return;

        // Add progress bar
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: absolute;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
        `;

        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            height: 100%;
            background: var(--gradient-primary);
            width: 0%;
            transition: width 0.3s ease;
        `;

        progressBar.appendChild(progressFill);
        loader.appendChild(progressBar);

        // Simulate loading
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    loader.classList.add('hidden');
                    setTimeout(() => {
                        loader.style.display = 'none';
                    }, 500);
                }, 300);
            }
            progressFill.style.width = progress + '%';
        }, 200);
    }
}

// Scroll Progress Indicator
class ScrollProgress {
    constructor() {
        this.init();
    }

    init() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 4px;
            background: var(--gradient-primary);
            z-index: 9999;
            transition: width 0.1s ease;
        `;
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrolled / height) * 100;
            progressBar.style.width = progress + '%';
        });
    }
}

// Advanced Form Validation
class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.submitForm();
            }
        });

        // Real-time validation
        this.form.querySelectorAll('input, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => {
                field.classList.remove('error');
                this.removeErrorMessage(field);
            });
        });
    }

    validateForm() {
        let isValid = true;
        this.form.querySelectorAll('input, textarea').forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        // Required validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(value);
        }

        if (!isValid) {
            field.classList.add('error');
            this.showErrorMessage(field);
        }

        return isValid;
    }

    showErrorMessage(field) {
        let errorMessage = field.parentNode.querySelector('.field-error');
        if (!errorMessage) {
            errorMessage = document.createElement('span');
            errorMessage.className = 'field-error';
            field.parentNode.appendChild(errorMessage);
        }

        if (field.hasAttribute('required') && !field.value.trim()) {
            errorMessage.textContent = 'This field is required';
        } else if (field.type === 'email' && field.value) {
            errorMessage.textContent = 'Please enter a valid email address';
        }
    }

    removeErrorMessage(field) {
        const errorMessage = field.parentNode.querySelector('.field-error');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    submitForm() {
        const formData = new FormData(this.form);
        console.log('Form submitted:', Object.fromEntries(formData));

        // Show success message
        this.showMessage('success', 'Thank you! Your message has been sent successfully.');
        this.form.reset();
    }

    showMessage(type, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `form-message ${type}`;
        messageElement.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;

        this.form.insertBefore(messageElement, this.form.firstChild);

        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedPortfolio();
    new LoadingScreen();
    new ScrollProgress();

    // Initialize form validation
    document.querySelectorAll('form').forEach(form => {
        new FormValidator(form);
    });

    // Add ripple effects to buttons
    document.querySelectorAll('.btn, .ripple').forEach(button => {
        new AdvancedPortfolio().addRippleEffect(button);
    });

    // Add animations to cards
    document.querySelectorAll('.card, .service-card, .portfolio-item').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-on-scroll');
    });
});

// Add CSS for custom animations
const additionalCSS = `
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }

    .animate-on-scroll.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .custom-cursor {
        mix-blend-mode: difference;
    }

    .particles-container {
        overflow: hidden;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);