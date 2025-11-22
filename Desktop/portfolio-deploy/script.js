/* ========================================
   PORTFOLIO NACHO - INTERACTIVE SCRIPTS
   ======================================== */

// ========== PERFORMANCE UTILITIES ==========
// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function to ensure function is called at most once per interval
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========== LOADER ==========
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 1500);
});

// ========== THEME TOGGLE ==========
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference
const currentTheme = localStorage.getItem('theme') || 'dark';
if (currentTheme === 'light') {
    body.classList.add('light-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    const theme = body.classList.contains('light-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
});

// ========== NAVBAR SCROLL ==========
const navbar = document.getElementById('navbar');
let lastScroll = 0;

const handleNavbarScroll = throttle(() => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
}, 100);

window.addEventListener('scroll', handleNavbarScroll, { passive: true });

// ========== MOBILE MENU ==========
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.getElementById('navMenu');

mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 100;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ========== ACTIVE NAV LINK ==========
const sections = document.querySelectorAll('section[id]');

function updateActiveLink() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 150;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (navLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            navLink.classList.add('active');
        }
    });
}

const throttledUpdateActiveLink = throttle(updateActiveLink, 100);
window.addEventListener('scroll', throttledUpdateActiveLink, { passive: true });

// ========== PORTFOLIO DATA ==========
const portfolioData = [
    {
        id: 1,
        title: "Video Comercial Tech Startup",
        category: "video",
        description: "Video promocional con motion graphics y color grading profesional",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop"
    },
    {
        id: 2,
        title: "Logo & Branding CryptoVerse",
        category: "design",
        description: "Identidad visual completa para proyecto blockchain",
        image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=600&fit=crop"
    },
    {
        id: 3,
        title: "Web3 DApp Interface",
        category: "web",
        description: "Aplicación descentralizada con conexión a wallets",
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop"
    },
    {
        id: 4,
        title: "NFT Collection Design",
        category: "crypto",
        description: "Colección de 10K NFTs generativos únicos",
        image: "https://images.unsplash.com/photo-1645731970126-34e8f9b6cf42?w=800&h=600&fit=crop"
    },
    {
        id: 5,
        title: "Bot de Trading Automático",
        category: "bots",
        description: "Bot IA para trading en múltiples exchanges",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop"
    },
    {
        id: 6,
        title: "Edición Video Musical",
        category: "video",
        description: "Videoclip con efectos visuales sincronizados",
        image: "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=800&h=600&fit=crop"
    },
    {
        id: 7,
        title: "Logo Premium FashionBrand",
        category: "design",
        description: "Diseño de logo minimalista y elegante",
        image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=600&fit=crop"
    },
    {
        id: 8,
        title: "E-commerce Moderno",
        category: "web",
        description: "Tienda online con pasarela de pago integrada",
        image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&h=600&fit=crop"
    },
    {
        id: 9,
        title: "Smart Contract ERC-721",
        category: "crypto",
        description: "Contrato inteligente para marketplace NFT",
        image: "https://images.unsplash.com/photo-1644088379091-d574269d422f?w=800&h=600&fit=crop"
    },
    {
        id: 10,
        title: "Bot Instagram Automation",
        category: "bots",
        description: "Automatización de engagement y DMs",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop"
    },
    {
        id: 11,
        title: "Video Corporativo",
        category: "video",
        description: "Video institucional para empresa tech",
        image: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&h=600&fit=crop"
    },
    {
        id: 12,
        title: "Landing Page Premium",
        category: "web",
        description: "Landing page optimizada para conversión",
        image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop"
    }
];

// ========== PORTFOLIO FILTERING ==========
const portfolioGrid = document.getElementById('portfolioGrid');
const filterBtns = document.querySelectorAll('.filter-btn');

function renderPortfolio(filter = 'all') {
    const filteredItems = filter === 'all'
        ? portfolioData
        : portfolioData.filter(item => item.category === filter);

    portfolioGrid.innerHTML = filteredItems.map(item => `
        <div class="portfolio-item" data-category="${item.category}">
            <img src="${item.image}" alt="${item.title}" class="portfolio-image" loading="lazy">
            <div class="portfolio-overlay">
                <div class="portfolio-category">${item.category}</div>
                <h3 class="portfolio-title">${item.title}</h3>
                <p class="portfolio-description">${item.description}</p>
            </div>
        </div>
    `).join('');

    // Trigger GSAP animation
    if (typeof gsap !== 'undefined') {
        gsap.from('.portfolio-item', {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out'
        });
    }
}

// Initial render
renderPortfolio();

// Filter buttons event listeners
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        renderPortfolio(filter);
    });
});

// ========== SHOP DATA (Dynamic Loading) ==========
let shopData = [];

// Function to load products from JSON
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Failed to load products');
        const data = await response.json();
        shopData = data.products.map(product => ({
            id: product.id,
            title: product.name,
            price: `$${product.price}`,
            description: product.description,
            icon: product.icon,
            badge: product.badge,
            features: product.features
        }));
        return shopData;
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback data in case JSON fails to load
        shopData = [
            {
                id: 1,
                title: "Paquete Video Express",
                price: "$199",
                description: "Edición profesional de video hasta 3 minutos",
                icon: "fas fa-video",
                badge: "Popular",
                features: [
                    "Edición hasta 3 minutos",
                    "Color grading básico",
                    "1 revisión incluida",
                    "Entrega en 48h",
                    "Archivos HD 1080p"
                ]
            },
            {
                id: 2,
                title: "Logo + Branding Kit",
                price: "$299",
                description: "Logo profesional con identidad visual completa",
                icon: "fas fa-palette",
                badge: "Bestseller",
                features: [
                    "Logo + 3 variaciones",
                    "Manual de marca",
                    "Archivos vectoriales",
                    "Revisiones ilimitadas",
                    "Mockups incluidos"
                ]
            },
            {
                id: 3,
                title: "Landing Page Pro",
                price: "$499",
                description: "Página web profesional lista para lanzar",
                icon: "fas fa-laptop-code",
                badge: "Nuevo",
                features: [
                    "Diseño responsive",
                    "SEO optimizado",
                    "Formulario contacto",
                    "Hosting gratis 1 año",
                    "Soporte 30 días"
                ]
            }
        ];
        return shopData;
    }
}

// ========== SHOP RENDERING ==========
const shopGrid = document.getElementById('shopGrid');

async function renderShop() {
    // Load products first
    await loadProducts();

    if (!shopGrid) return;

    shopGrid.innerHTML = shopData.map(item => `
        <div class="shop-item">
            ${item.badge ? `<div class="shop-badge">${item.badge}</div>` : ''}
            <div class="shop-icon">
                <i class="${item.icon}"></i>
            </div>
            <h3 class="shop-title">${item.title}</h3>
            <p class="shop-description">${item.description}</p>
            <div class="shop-price">${item.price}</div>
            <ul class="shop-features">
                ${item.features.map(feature => `
                    <li><i class="fas fa-check"></i> ${feature}</li>
                `).join('')}
            </ul>
            <button onclick="cart.addItem({id: ${item.id}, title: '${item.title}', name: '${item.title}', price: '${item.price}', icon: '${item.icon}', features: ${JSON.stringify(item.features)}})"
                    class="btn-primary" style="width: 100%; justify-content: center; border: none; cursor: pointer;">
                Añadir al Carrito
                <i class="fas fa-shopping-cart"></i>
            </button>
        </div>
    `).join('');

    // Trigger animations if GSAP is available
    if (typeof gsap !== 'undefined') {
        gsap.from('.shop-item', {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out'
        });
    }
}

// Initial render (async)
renderShop();

// ========== FAQ ACCORDION ==========
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all items
        faqItems.forEach(faq => faq.classList.remove('active'));

        // Open clicked item if it wasn't active
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// ========== CONTACT FORM ==========
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    // Form validation
    const inputs = contactForm.querySelectorAll('input[required], select[required], textarea[required]');

    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateField(input);
            }
        });
    });

    function validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove previous error
        removeError(field);

        // Check if empty
        if (!value) {
            isValid = false;
            errorMessage = 'Este campo es requerido';
        }
        // Email validation
        else if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Por favor ingresa un email válido';
            }
        }
        // Name validation
        else if (field.id === 'name' && value.length < 2) {
            isValid = false;
            errorMessage = 'El nombre debe tener al menos 2 caracteres';
        }
        // Message validation
        else if (field.id === 'message' && value.length < 10) {
            isValid = false;
            errorMessage = 'El mensaje debe tener al menos 10 caracteres';
        }

        if (!isValid) {
            showError(field, errorMessage);
        }

        return isValid;
    }

    function showError(field, message) {
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
    }

    function removeError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentElement.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields
        let isFormValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            // Scroll to first error
            const firstError = contactForm.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Submit form
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            // If using Formspree or similar
            const formData = new FormData(contactForm);
            const formAction = contactForm.getAttribute('action');

            if (formAction && formAction !== 'https://formspree.io/f/YOUR_FORM_ID') {
                const response = await fetch(formAction, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    showSuccessMessage();
                    contactForm.reset();
                } else {
                    throw new Error('Error al enviar el formulario');
                }
            } else {
                // Demo mode - just show success message
                setTimeout(() => {
                    showSuccessMessage();
                    contactForm.reset();
                }, 1500);
            }
        } catch (error) {
            showErrorMessage();
            console.error('Error:', error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    function showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'form-message success';
        message.innerHTML = '<i class="fas fa-check-circle"></i> ¡Mensaje enviado con éxito! Te responderé pronto.';
        contactForm.insertAdjacentElement('beforebegin', message);

        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    function showErrorMessage() {
        const message = document.createElement('div');
        message.className = 'form-message error';
        message.innerHTML = '<i class="fas fa-exclamation-circle"></i> Hubo un error al enviar el mensaje. Por favor intenta de nuevo.';
        contactForm.insertAdjacentElement('beforebegin', message);

        setTimeout(() => {
            message.remove();
        }, 5000);
    }
}

// ========== GSAP ANIMATIONS ==========
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero animations
    gsap.from('.hero-badge', {
        opacity: 0,
        y: -30,
        duration: 1,
        ease: 'power2.out'
    });

    gsap.from('.hero-title', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.2,
        ease: 'power2.out'
    });

    gsap.from('.hero-subtitle', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.4,
        ease: 'power2.out'
    });

    gsap.from('.hero-cta', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.6,
        ease: 'power2.out'
    });

    gsap.from('.stat-card', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.8,
        stagger: 0.1,
        ease: 'power2.out'
    });

    // Section animations
    const animateSections = document.querySelectorAll('.service-card, .review-card, .pricing-card');

    animateSections.forEach(element => {
        gsap.from(element, {
            scrollTrigger: {
                trigger: element,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: 'power2.out'
        });
    });

    // About section
    gsap.from('.about-image-wrapper', {
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 60%'
        },
        opacity: 0,
        x: -50,
        duration: 1,
        ease: 'power2.out'
    });

    gsap.from('.about-content', {
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 60%'
        },
        opacity: 0,
        x: 50,
        duration: 1,
        ease: 'power2.out'
    });

    // Floating badges
    gsap.to('.floating-badge', {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        stagger: 0.3
    });

    // Stats counter animation
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const target = stat.textContent;
        const isPercentage = target.includes('%');
        const isPlus = target.includes('+');
        const numericValue = parseInt(target.replace(/[^0-9]/g, ''));

        ScrollTrigger.create({
            trigger: stat,
            start: 'top 80%',
            onEnter: () => {
                let current = 0;
                const increment = numericValue / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= numericValue) {
                        current = numericValue;
                        clearInterval(timer);
                    }
                    stat.textContent = Math.floor(current) + (isPercentage ? '%' : '') + (isPlus ? '+' : '');
                }, 30);
            }
        });
    });

    // Parallax effect on gradient orbs
    gsap.to('.orb-1', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        },
        y: 200,
        rotation: 360,
        ease: 'none'
    });

    gsap.to('.orb-2', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        },
        y: -150,
        rotation: -360,
        ease: 'none'
    });
}

// ========== AOS-like Animation on Scroll ==========
function revealOnScroll() {
    const reveals = document.querySelectorAll('[data-aos]:not(.aos-animate)');

    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('aos-animate');
        }
    });
}

const throttledRevealOnScroll = throttle(revealOnScroll, 100);
window.addEventListener('scroll', throttledRevealOnScroll, { passive: true });
revealOnScroll(); // Initial check

// Add CSS for AOS animation
const style = document.createElement('style');
style.textContent = `
    [data-aos] {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease, transform 0.8s ease;
    }

    [data-aos].aos-animate {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// ========== CURSOR TRAIL EFFECT (Optional) ==========
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;

    requestAnimationFrame(animateCursor);
}

animateCursor();

// ========== PERFORMANCE OPTIMIZATIONS ==========
// Lazy loading images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => imageObserver.observe(img));
}

// ========== IMPROVED CRYPTO WALLET FUNCTIONS ==========
async function connectWallet(walletType) {
    try {
        showNotification(`Conectando con ${walletType}...`, 'info');

        // Check if walletManager is available
        if (typeof walletManager === 'undefined') {
            throw new Error('Web3 wallet manager no disponible');
        }

        // Attempt real wallet connection
        const result = await walletManager.connect(walletType);

        if (result.success) {
            showNotification(`✅ ${result.wallet} conectado exitosamente!`, 'success');
            console.log(`Wallet connected:`, result);

            // Update UI to show connected state
            updateWalletUI(walletType, true, result.shortAddress);

            // Track connection with analytics
            if (typeof analytics !== 'undefined') {
                analytics.trackWalletConnection(walletType);
            }
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showNotification(`Error: ${error.message}`, 'error');

        // Track error
        if (typeof analytics !== 'undefined') {
            analytics.trackException(`Wallet connection failed: ${error.message}`, false);
        }
    }
}

function updateWalletUI(walletType, isConnected, address = '') {
    const walletBtns = document.querySelectorAll('.wallet-btn');
    walletBtns.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(walletType.toLowerCase())) {
            if (isConnected) {
                btn.classList.add('connected');
                const icon = btn.querySelector('i');
                const iconClass = icon ? icon.className : '';
                btn.innerHTML = `<i class="${iconClass}"></i> ${address || 'Conectado'}`;
                btn.disabled = true;
            }
        }
    });
}

function copyAddress(address) {
    navigator.clipboard.writeText(address).then(() => {
        showNotification('✅ Dirección copiada al portapapeles', 'success');

        // Add visual feedback to the copy button
        event.target.closest('.copy-btn').classList.add('copied');
        setTimeout(() => {
            event.target.closest('.copy-btn').classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Error copying address:', err);
        showNotification('❌ Error al copiar dirección', 'error');
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `crypto-notification ${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                     type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                     'linear-gradient(135deg, #6366f1, #4f46e5)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        max-width: 300px;
    `;

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .wallet-btn.connected {
        background: linear-gradient(135deg, #10b981, #059669) !important;
        border-color: #10b981 !important;
    }

    .copy-btn.copied {
        background: linear-gradient(135deg, #10b981, #059669) !important;
    }
`;
document.head.appendChild(notificationStyles);

// ========== CONSOLE MESSAGE ==========
console.log('%c🚀 Portfolio desarrollado por Nacho', 'font-size: 20px; color: #6366f1; font-weight: bold;');
console.log('%c¿Interesado en trabajar conmigo? Contáctame en la sección de contacto!', 'font-size: 14px; color: #8b5cf6;');
console.log('%c💰 Crypto payments enabled - BTC, ETH, USDT, USDC accepted', 'font-size: 12px; color: #f59e0b;');
