/**
 * ADVANCED ANALYTICS MANAGER
 * Multi-provider analytics and tracking system
 * Providers: Google Analytics, Mixpanel, Amplitude, PostHog
 */

class AdvancedAnalytics {
  constructor(config) {
    this.config = config.analytics;
    this.providers = {
      google: null,
      mixpanel: null,
      amplitude: null,
      posthog: null
    };
    this.userProperties = {};
    this.sessionId = this.generateSessionId();
    this.pageViews = [];
    this.events = [];
    this.initialized = false;
    this.consent = {
      analytics: false,
      marketing: false,
      preferences: false
    };
  }

  /**
   * Initialize all analytics providers
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Google Analytics
      if (this.config.providers.google?.enabled) {
        await this.initializeGoogleAnalytics();
      }

      // Initialize Mixpanel
      if (this.config.providers.mixpanel?.enabled) {
        await this.initializeMixpanel();
      }

      // Initialize Amplitude
      if (this.config.providers.amplitude?.enabled) {
        await this.initializeAmplitude();
      }

      // Initialize PostHog
      if (this.config.providers.posthog?.enabled) {
        await this.initializePostHog();
      }

      // Setup automatic tracking
      this.setupAutomaticTracking();

      this.initialized = true;
      console.log('✅ Advanced Analytics initialized');

    } catch (error) {
      console.error('Analytics initialization error:', error);
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  async initializeGoogleAnalytics() {
    const measurementId = this.config.providers.google.measurementId;

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: false // We'll handle this manually
    });

    this.providers.google = gtag;
    console.log('✅ Google Analytics initialized');
  }

  /**
   * Initialize Mixpanel
   */
  async initializeMixpanel() {
    const mixpanel = await import('mixpanel-browser');
    mixpanel.init(this.config.providers.mixpanel.token, {
      track_pageview: false, // Manual tracking
      persistence: 'localStorage'
    });

    this.providers.mixpanel = mixpanel;
    console.log('✅ Mixpanel initialized');
  }

  /**
   * Initialize Amplitude
   */
  async initializeAmplitude() {
    const amplitude = await import('@amplitude/analytics-browser');
    amplitude.init(this.config.providers.amplitude.apiKey, {
      defaultTracking: {
        sessions: true,
        pageViews: false, // Manual tracking
        formInteractions: true,
        fileDownloads: true
      }
    });

    this.providers.amplitude = amplitude;
    console.log('✅ Amplitude initialized');
  }

  /**
   * Initialize PostHog
   */
  async initializePostHog() {
    const posthog = await import('posthog-js');
    posthog.init(this.config.providers.posthog.apiKey, {
      api_host: 'https://app.posthog.com',
      autocapture: false, // Manual tracking
      capture_pageview: false,
      session_recording: this.config.providers.posthog.enableSessionRecording
    });

    this.providers.posthog = posthog;
    console.log('✅ PostHog initialized');
  }

  /**
   * Track page view
   */
  trackPageView(url = window.location.pathname, title = document.title) {
    if (!this.initialized) return;

    const pageViewData = {
      url,
      title,
      referrer: document.referrer,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    // Store in memory
    this.pageViews.push(pageViewData);

    // Google Analytics
    if (this.providers.google && this.consent.analytics) {
      this.providers.google('event', 'page_view', {
        page_title: title,
        page_location: url,
        page_referrer: document.referrer
      });
    }

    // Mixpanel
    if (this.providers.mixpanel && this.consent.analytics) {
      this.providers.mixpanel.track('Page View', pageViewData);
    }

    // Amplitude
    if (this.providers.amplitude && this.consent.analytics) {
      this.providers.amplitude.track('Page View', pageViewData);
    }

    // PostHog
    if (this.providers.posthog && this.consent.analytics) {
      this.providers.posthog.capture('$pageview', pageViewData);
    }

    console.log('📊 Page view tracked:', url);
  }

  /**
   * Track custom event
   */
  trackEvent(eventName, properties = {}) {
    if (!this.initialized) return;

    const eventData = {
      ...properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.pathname
    };

    // Store in memory
    this.events.push({ event: eventName, data: eventData });

    // Google Analytics
    if (this.providers.google && this.consent.analytics) {
      this.providers.google('event', eventName, eventData);
    }

    // Mixpanel
    if (this.providers.mixpanel && this.consent.analytics) {
      this.providers.mixpanel.track(eventName, eventData);
    }

    // Amplitude
    if (this.providers.amplitude && this.consent.analytics) {
      this.providers.amplitude.track(eventName, eventData);
    }

    // PostHog
    if (this.providers.posthog && this.consent.analytics) {
      this.providers.posthog.capture(eventName, eventData);
    }

    console.log('📊 Event tracked:', eventName, properties);
  }

  /**
   * Track conversion
   */
  trackConversion(conversionName, value = 0, currency = 'USD', properties = {}) {
    this.trackEvent('conversion', {
      conversion_name: conversionName,
      value,
      currency,
      ...properties
    });

    // Google Analytics conversion
    if (this.providers.google) {
      this.providers.google('event', 'purchase', {
        transaction_id: properties.transactionId || this.generateId(),
        value,
        currency,
        items: properties.items || []
      });
    }
  }

  /**
   * Track user signup
   */
  trackSignup(method = 'email', properties = {}) {
    this.trackEvent('sign_up', {
      method,
      ...properties
    });
  }

  /**
   * Track user login
   */
  trackLogin(method = 'email', properties = {}) {
    this.trackEvent('login', {
      method,
      ...properties
    });
  }

  /**
   * Identify user
   */
  identify(userId, properties = {}) {
    if (!this.initialized) return;

    this.userProperties = {
      ...this.userProperties,
      ...properties,
      userId
    };

    // Google Analytics
    if (this.providers.google) {
      this.providers.google('config', this.config.providers.google.measurementId, {
        user_id: userId
      });
      this.providers.google('set', 'user_properties', properties);
    }

    // Mixpanel
    if (this.providers.mixpanel) {
      this.providers.mixpanel.identify(userId);
      this.providers.mixpanel.people.set(properties);
    }

    // Amplitude
    if (this.providers.amplitude) {
      this.providers.amplitude.setUserId(userId);
      this.providers.amplitude.identify({ user_properties: properties });
    }

    // PostHog
    if (this.providers.posthog) {
      this.providers.posthog.identify(userId, properties);
    }

    console.log('👤 User identified:', userId);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties) {
    this.userProperties = {
      ...this.userProperties,
      ...properties
    };

    // Mixpanel
    if (this.providers.mixpanel) {
      this.providers.mixpanel.people.set(properties);
    }

    // Amplitude
    if (this.providers.amplitude) {
      this.providers.amplitude.identify({ user_properties: properties });
    }

    // PostHog
    if (this.providers.posthog) {
      this.providers.posthog.setPersonProperties(properties);
    }
  }

  /**
   * Track timing/performance
   */
  trackTiming(category, variable, value, label = '') {
    this.trackEvent('timing', {
      category,
      variable,
      value,
      label
    });

    // Google Analytics timing
    if (this.providers.google) {
      this.providers.google('event', 'timing_complete', {
        name: variable,
        value,
        event_category: category,
        event_label: label
      });
    }
  }

  /**
   * Track exception/error
   */
  trackException(description, fatal = false) {
    this.trackEvent('exception', {
      description,
      fatal
    });

    // Google Analytics exception
    if (this.providers.google) {
      this.providers.google('event', 'exception', {
        description,
        fatal
      });
    }
  }

  /**
   * Track search
   */
  trackSearch(searchTerm, category = null, results = 0) {
    this.trackEvent('search', {
      search_term: searchTerm,
      category,
      results_count: results
    });
  }

  /**
   * Track social interaction
   */
  trackSocial(network, action, target) {
    this.trackEvent('social', {
      network,
      action,
      target
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formId, formName, properties = {}) {
    this.trackEvent('form_submit', {
      form_id: formId,
      form_name: formName,
      ...properties
    });
  }

  /**
   * Track click
   */
  trackClick(element, properties = {}) {
    this.trackEvent('click', {
      element_id: element.id,
      element_class: element.className,
      element_text: element.textContent?.substring(0, 100),
      ...properties
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(depth) {
    this.trackEvent('scroll', {
      depth_percentage: depth,
      depth_pixels: window.scrollY,
      page_height: document.documentElement.scrollHeight
    });
  }

  /**
   * Track video interaction
   */
  trackVideo(action, videoId, properties = {}) {
    this.trackEvent('video', {
      action, // play, pause, complete, etc.
      video_id: videoId,
      ...properties
    });
  }

  /**
   * Setup automatic tracking
   */
  setupAutomaticTracking() {
    // Track initial page view
    this.trackPageView();

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden');
      } else {
        this.trackEvent('page_visible');
      }
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    const trackScroll = this.debounce(() => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      const roundedScroll = Math.round(scrollPercentage / 10) * 10; // Round to nearest 10%

      if (roundedScroll > maxScrollDepth) {
        maxScrollDepth = roundedScroll;
        this.trackScrollDepth(roundedScroll);
      }
    }, 1000);

    window.addEventListener('scroll', trackScroll, { passive: true });

    // Track time on page
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      this.trackTiming('engagement', 'time_on_page', timeOnPage);
    });

    // Track rage clicks (potential frustration)
    let clickCount = 0;
    let clickTimer = null;
    document.addEventListener('click', (e) => {
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        if (clickCount >= 3) {
          this.trackEvent('rage_click', {
            element: e.target.tagName,
            count: clickCount
          });
        }
        clickCount = 0;
      }, 1000);
    });

    // Track form interactions
    document.addEventListener('submit', (e) => {
      if (e.target.tagName === 'FORM') {
        this.trackFormSubmit(
          e.target.id || 'unnamed',
          e.target.name || 'unnamed'
        );
      }
    });

    // Track outbound links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.hostname !== window.location.hostname) {
        this.trackEvent('outbound_link', {
          url: link.href,
          text: link.textContent?.substring(0, 100)
        });
      }
    });
  }

  /**
   * Set consent preferences
   */
  setConsent(consent) {
    this.consent = {
      ...this.consent,
      ...consent
    };

    // Update Google Analytics consent
    if (this.providers.google) {
      this.providers.google('consent', 'update', {
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        ad_storage: consent.marketing ? 'granted' : 'denied',
        functionality_storage: consent.preferences ? 'granted' : 'denied'
      });
    }

    // Update PostHog opt-in/out
    if (this.providers.posthog) {
      if (consent.analytics) {
        this.providers.posthog.opt_in_capturing();
      } else {
        this.providers.posthog.opt_out_capturing();
      }
    }
  }

  /**
   * Create funnel
   */
  createFunnel(funnelName, steps) {
    return {
      name: funnelName,
      steps,
      trackStep: (stepIndex, properties = {}) => {
        this.trackEvent('funnel_step', {
          funnel_name: funnelName,
          step_index: stepIndex,
          step_name: steps[stepIndex],
          ...properties
        });
      },
      trackComplete: (properties = {}) => {
        this.trackEvent('funnel_complete', {
          funnel_name: funnelName,
          steps_count: steps.length,
          ...properties
        });
      }
    };
  }

  /**
   * A/B Test tracking
   */
  trackABTest(experimentName, variant, properties = {}) {
    this.trackEvent('ab_test', {
      experiment_name: experimentName,
      variant,
      ...properties
    });

    // Set as user property
    this.setUserProperties({
      [`experiment_${experimentName}`]: variant
    });
  }

  /**
   * Get session data
   */
  getSessionData() {
    return {
      sessionId: this.sessionId,
      pageViews: this.pageViews.length,
      events: this.events.length,
      startTime: this.pageViews[0]?.timestamp,
      duration: Date.now() - (this.pageViews[0]?.timestamp || Date.now())
    };
  }

  /**
   * Get user properties
   */
  getUserProperties() {
    return this.userProperties;
  }

  /**
   * Reset session
   */
  resetSession() {
    this.sessionId = this.generateSessionId();
    this.pageViews = [];
    this.events = [];
  }

  /**
   * Utility: Debounce
   */
  debounce(func, wait) {
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

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Is initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

// Singleton instance
let analytics = null;

export const getAnalytics = (config) => {
  if (!analytics) {
    analytics = new AdvancedAnalytics(config);
  }
  return analytics;
};

// Export for global use
if (typeof window !== 'undefined') {
  window.analytics = {
    initialize: (config) => getAnalytics(config).initialize(),
    trackEvent: (...args) => getAnalytics().trackEvent(...args),
    trackPageView: (...args) => getAnalytics().trackPageView(...args),
    trackConversion: (...args) => getAnalytics().trackConversion(...args),
    identify: (...args) => getAnalytics().identify(...args),
    setConsent: (...args) => getAnalytics().setConsent(...args),
    trackTiming: (...args) => getAnalytics().trackTiming(...args),
    trackException: (...args) => getAnalytics().trackException(...args)
  };
}

export default AdvancedAnalytics;
