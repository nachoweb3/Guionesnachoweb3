/* ========================================
   ANALYTICS & TRACKING MODULE
   Google Analytics, Tag Manager, and custom events
   ======================================== */

/**
 * Analytics Manager
 * Handles tracking, events, and conversions
 */
class AnalyticsManager {
    constructor() {
        this.gaId = null;
        this.gtmId = null;
        this.isEnabled = false;
        this.debugMode = false;
    }

    /**
     * Initialize analytics
     * @param {Object} config - Analytics configuration
     * @param {string} config.gaId - Google Analytics ID
     * @param {string} config.gtmId - Google Tag Manager ID
     * @param {boolean} config.debug - Enable debug mode
     */
    initialize(config = {}) {
        this.gaId = config.gaId || null;
        this.gtmId = config.gtmId || null;
        this.debugMode = config.debug || false;

        // Check if user has consented to cookies (GDPR compliance)
        const hasConsent = this.checkConsent();
        if (!hasConsent) {
            console.log('Analytics: User has not consented to tracking');
            return;
        }

        // Initialize Google Analytics
        if (this.gaId) {
            this.initializeGA();
        }

        // Initialize Google Tag Manager
        if (this.gtmId) {
            this.initializeGTM();
        }

        // Setup event listeners
        this.setupEventListeners();

        this.isEnabled = true;

        if (this.debugMode) {
            console.log('Analytics initialized:', { gaId: this.gaId, gtmId: this.gtmId });
        }
    }

    /**
     * Initialize Google Analytics
     */
    initializeGA() {
        // Load gtag.js script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
        document.head.appendChild(script);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = gtag;

        gtag('js', new Date());
        gtag('config', this.gaId, {
            'anonymize_ip': true,
            'cookie_flags': 'SameSite=None;Secure'
        });

        if (this.debugMode) {
            console.log('Google Analytics initialized with ID:', this.gaId);
        }
    }

    /**
     * Initialize Google Tag Manager
     */
    initializeGTM() {
        // GTM script
        (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer',this.gtmId);

        if (this.debugMode) {
            console.log('Google Tag Manager initialized with ID:', this.gtmId);
        }
    }

    /**
     * Check if user has consented to cookies
     * @returns {boolean} Consent status
     */
    checkConsent() {
        // Check localStorage for consent
        const consent = localStorage.getItem('analyticsConsent');

        // If no consent is stored, default to true (you may want to implement a cookie banner)
        if (consent === null) {
            return true; // Default to enabled, or implement proper cookie consent
        }

        return consent === 'true';
    }

    /**
     * Set user consent
     * @param {boolean} consent - User consent
     */
    setConsent(consent) {
        localStorage.setItem('analyticsConsent', consent.toString());

        if (consent && !this.isEnabled) {
            // Re-initialize analytics if consent is given
            this.initialize({
                gaId: this.gaId,
                gtmId: this.gtmId,
                debug: this.debugMode
            });
        }
    }

    /**
     * Track page view
     * @param {string} pagePath - Page path
     * @param {string} pageTitle - Page title
     */
    trackPageView(pagePath, pageTitle) {
        if (!this.isEnabled) return;

        if (typeof gtag !== 'undefined') {
            gtag('config', this.gaId, {
                'page_path': pagePath,
                'page_title': pageTitle
            });
        }

        if (this.debugMode) {
            console.log('Page view tracked:', { pagePath, pageTitle });
        }
    }

    /**
     * Track custom event
     * @param {string} eventName - Event name
     * @param {Object} eventParams - Event parameters
     */
    trackEvent(eventName, eventParams = {}) {
        if (!this.isEnabled) return;

        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventParams);
        }

        if (typeof dataLayer !== 'undefined') {
            dataLayer.push({
                'event': eventName,
                ...eventParams
            });
        }

        if (this.debugMode) {
            console.log('Event tracked:', eventName, eventParams);
        }
    }

    /**
     * Track product view
     * @param {Object} product - Product details
     */
    trackProductView(product) {
        this.trackEvent('view_item', {
            currency: 'USD',
            value: parseFloat(product.price) || 0,
            items: [{
                item_id: product.id,
                item_name: product.name || product.title,
                price: parseFloat(product.price) || 0,
                quantity: 1
            }]
        });
    }

    /**
     * Track add to cart
     * @param {Object} product - Product details
     * @param {number} quantity - Quantity added
     */
    trackAddToCart(product, quantity = 1) {
        this.trackEvent('add_to_cart', {
            currency: 'USD',
            value: parseFloat(product.price) * quantity || 0,
            items: [{
                item_id: product.id,
                item_name: product.name || product.title,
                price: parseFloat(product.price) || 0,
                quantity: quantity
            }]
        });
    }

    /**
     * Track remove from cart
     * @param {Object} product - Product details
     */
    trackRemoveFromCart(product) {
        this.trackEvent('remove_from_cart', {
            currency: 'USD',
            value: parseFloat(product.price) || 0,
            items: [{
                item_id: product.id,
                item_name: product.name || product.title,
                price: parseFloat(product.price) || 0,
                quantity: 1
            }]
        });
    }

    /**
     * Track checkout initiation
     * @param {Array} items - Cart items
     * @param {number} total - Cart total
     */
    trackBeginCheckout(items, total) {
        this.trackEvent('begin_checkout', {
            currency: 'USD',
            value: total,
            items: items.map(item => ({
                item_id: item.id,
                item_name: item.name || item.title,
                price: parseFloat(item.price) || 0,
                quantity: item.quantity || 1
            }))
        });
    }

    /**
     * Track purchase
     * @param {Object} transaction - Transaction details
     */
    trackPurchase(transaction) {
        this.trackEvent('purchase', {
            transaction_id: transaction.id,
            value: parseFloat(transaction.amount),
            currency: transaction.currency || 'USD',
            tax: parseFloat(transaction.tax) || 0,
            items: transaction.items.map(item => ({
                item_id: item.id,
                item_name: item.name || item.title,
                price: parseFloat(item.price) || 0,
                quantity: item.quantity || 1
            }))
        });
    }

    /**
     * Track crypto wallet connection
     * @param {string} walletType - Type of wallet
     */
    trackWalletConnection(walletType) {
        this.trackEvent('wallet_connection', {
            wallet_type: walletType,
            event_category: 'crypto',
            event_label: walletType
        });
    }

    /**
     * Track crypto payment
     * @param {Object} payment - Payment details
     */
    trackCryptoPayment(payment) {
        this.trackEvent('crypto_payment', {
            currency: payment.currency,
            crypto_amount: payment.cryptoAmount,
            usd_amount: payment.amountUSD,
            payment_method: 'cryptocurrency',
            event_category: 'payment'
        });
    }

    /**
     * Track form submission
     * @param {string} formName - Form identifier
     */
    trackFormSubmission(formName) {
        this.trackEvent('form_submission', {
            form_name: formName,
            event_category: 'engagement'
        });
    }

    /**
     * Track outbound link click
     * @param {string} url - External URL
     * @param {string} label - Link label
     */
    trackOutboundLink(url, label) {
        this.trackEvent('click', {
            event_category: 'outbound',
            event_label: label,
            value: url
        });
    }

    /**
     * Track social share
     * @param {string} network - Social network
     * @param {string} action - Share action
     */
    trackSocialShare(network, action) {
        this.trackEvent('share', {
            method: network,
            content_type: action,
            event_category: 'social'
        });
    }

    /**
     * Setup automatic event tracking
     */
    setupEventListeners() {
        // Track cart updates
        window.addEventListener('cart:updated', (e) => {
            if (this.debugMode) {
                console.log('Cart updated:', e.detail);
            }
        });

        // Track payment events
        window.addEventListener('payment:paymentCompleted', (e) => {
            this.trackCryptoPayment(e.detail);
            this.trackPurchase({
                id: e.detail.id,
                amount: e.detail.amountUSD,
                currency: 'USD',
                tax: 0,
                items: []
            });
        });

        // Track wallet connections
        window.addEventListener('wallet:walletConnected', (e) => {
            this.trackWalletConnection(e.detail.wallet);
        });

        // Track scroll depth
        let scrollDepths = [25, 50, 75, 100];
        let scrolled = [];

        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

            scrollDepths.forEach(depth => {
                if (scrollPercent >= depth && !scrolled.includes(depth)) {
                    scrolled.push(depth);
                    this.trackEvent('scroll_depth', {
                        scroll_depth: depth,
                        event_category: 'engagement'
                    });
                }
            });
        });
    }

    /**
     * Track user timing
     * @param {string} category - Timing category
     * @param {string} variable - Timing variable
     * @param {number} time - Time in milliseconds
     */
    trackTiming(category, variable, time) {
        if (!this.isEnabled) return;

        if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
                'name': variable,
                'value': time,
                'event_category': category
            });
        }

        if (this.debugMode) {
            console.log('Timing tracked:', { category, variable, time });
        }
    }

    /**
     * Track exception/error
     * @param {string} description - Error description
     * @param {boolean} fatal - Is fatal error
     */
    trackException(description, fatal = false) {
        if (!this.isEnabled) return;

        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                'description': description,
                'fatal': fatal
            });
        }

        if (this.debugMode) {
            console.log('Exception tracked:', { description, fatal });
        }
    }
}

// Create global instance
const analytics = new AnalyticsManager();

// Auto-initialize if environment variables are available
if (typeof process !== 'undefined' && process.env) {
    analytics.initialize({
        gaId: process.env.GOOGLE_ANALYTICS_ID,
        gtmId: process.env.GOOGLE_TAG_MANAGER_ID,
        debug: process.env.NODE_ENV !== 'production'
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalyticsManager, analytics };
}
