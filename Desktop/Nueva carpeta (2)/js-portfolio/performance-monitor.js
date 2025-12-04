/**
 * Performance Monitoring System
 * Real-time performance tracking and optimization recommendations
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: {},
            webVitals: {},
            userInteractions: {},
            errors: [],
            warnings: []
        };

        this.thresholds = {
            FCP: 1800, // First Contentful Paint (ms)
            LCP: 2500, // Largest Contentful Paint (ms)
            FID: 100, // First Input Delay (ms)
            CLS: 0.1, // Cumulative Layout Shift
            TTFB: 800, // Time to First Byte (ms)
            DOMContentLoaded: 3000,
            LoadComplete: 5000
        };

        this.init();
    }

    init() {
        this.setupWebVitals();
        this.setupPerformanceObserver();
        this.setupErrorTracking();
        this.setupUserInteractionTracking();
        this.startRealTimeMonitoring();
        this.setupPerformanceReporting();
    }

    // Web Vitals Monitoring
    setupWebVitals() {
        // Import and use Web Vitals library if available
        if (typeof webVitals !== 'undefined') {
            webVitals.getFCP(metric => this.recordMetric('FCP', metric));
            webVitals.getLCP(metric => this.recordMetric('LCP', metric));
            webVitals.getFID(metric => this.recordMetric('FID', metric));
            webVitals.getCLS(metric => this.recordMetric('CLS', metric));
            webVitals.getTTFB(metric => this.recordMetric('TTFB', metric));
        } else {
            // Fallback implementation
            this.setupFallbackWebVitals();
        }
    }

    setupFallbackWebVitals() {
        // First Contentful Paint
        this.observePerformanceEntry('paint', entries => {
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
                this.recordMetric('FCP', { value: fcpEntry.startTime });
            }
        });

        // Largest Contentful Paint
        this.observePerformanceEntry('largest-contentful-paint', entries => {
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                this.recordMetric('LCP', { value: lastEntry.startTime });
            }
        });

        // Cumulative Layout Shift
        this.observePerformanceEntry('layout-shift', entries => {
            let cls = 0;
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    cls += entry.value;
                }
            });
            this.recordMetric('CLS', { value: cls });
        });
    }

    // Performance Observer API
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Navigation Timing
            const navigationObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.processNavigationTiming(entry);
                }
            });
            navigationObserver.observe({ entryTypes: ['navigation'] });

            // Resource Timing
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.processResourceTiming(entry);
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });

            // Long Tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordLongTask(entry);
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
        }
    }

    processNavigationTiming(entry) {
        this.metrics.pageLoad = {
            DNS: entry.domainLookupEnd - entry.domainLookupStart,
            TCP: entry.connectEnd - entry.connectStart,
            SSL: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
            TTFB: entry.responseStart - entry.requestStart,
            Download: entry.responseEnd - entry.responseStart,
            DOMProcessing: entry.domContentLoadedEventStart - entry.domLoading,
            DOMComplete: entry.domComplete - entry.domContentLoadedEventStart,
            LoadComplete: entry.loadEventEnd - entry.navigationStart
        };

        this.checkThresholds();
    }

    processResourceTiming(entry) {
        const resource = {
            name: entry.name,
            type: this.getResourceType(entry),
            duration: entry.duration,
            size: entry.transferSize,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
        };

        // Track slow resources
        if (resource.duration > 1000) {
            this.recordWarning(`Slow resource: ${resource.name} took ${resource.duration.toFixed(0)}ms`);
        }

        // Track large resources
        if (resource.size > 1024 * 1024) { // > 1MB
            this.recordWarning(`Large resource: ${resource.name} is ${(resource.size / 1024 / 1024).toFixed(1)}MB`);
        }
    }

    getResourceType(entry) {
        if (entry.initiatorType) return entry.initiatorType;

        const url = new URL(entry.name);
        const extension = url.pathname.split('.').pop()?.toLowerCase();

        const typeMap = {
            'js': 'script',
            'css': 'stylesheet',
            'png': 'image',
            'jpg': 'image',
            'jpeg': 'image',
            'gif': 'image',
            'svg': 'image',
            'webp': 'image',
            'woff': 'font',
            'woff2': 'font',
            'ttf': 'font'
        };

        return typeMap[extension] || 'other';
    }

    recordLongTask(entry) {
        this.recordWarning(`Long task detected: ${entry.duration.toFixed(0)}ms blocking the main thread`);
        this.metrics.webVitals.longTasks = this.metrics.webVitals.longTasks || [];
        this.metrics.webVitals.longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime
        });
    }

    // Error Tracking
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now()
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise',
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack,
                timestamp: Date.now()
            });
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.recordError({
                    type: 'resource',
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    timestamp: Date.now()
                });
            }
        }, true);
    }

    // User Interaction Tracking
    setupUserInteractionTracking() {
        const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart'];

        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.recordInteraction(eventType, event);
            }, { passive: true });
        });
    }

    recordInteraction(type, event) {
        const interaction = {
            type,
            timestamp: Date.now(),
            target: this.getElementSelector(event.target)
        };

        if (!this.metrics.userInteractions[type]) {
            this.metrics.userInteractions[type] = [];
        }
        this.metrics.userInteractions[type].push(interaction);

        // Limit stored interactions to prevent memory issues
        if (this.metrics.userInteractions[type].length > 100) {
            this.metrics.userInteractions[type] = this.metrics.userInteractions[type].slice(-50);
        }
    }

    getElementSelector(element) {
        if (!element || element === document) return 'document';
        if (element === window) return 'window';
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ').join('.')}`;
        return element.tagName.toLowerCase();
    }

    // Real-time Monitoring
    startRealTimeMonitoring() {
        setInterval(() => {
            this.checkMemoryUsage();
            this.checkNetworkStatus();
            this.updatePerformanceDashboard();
        }, 10000); // Every 10 seconds
    }

    checkMemoryUsage() {
        if (performance.memory) {
            const memory = performance.memory;
            const usedMemory = memory.usedJSHeapSize / 1024 / 1024; // MB
            const totalMemory = memory.totalJSHeapSize / 1024 / 1024; // MB
            const memoryUsage = (usedMemory / totalMemory) * 100;

            if (memoryUsage > 80) {
                this.recordWarning(`High memory usage: ${memoryUsage.toFixed(1)}%`);
            }

            this.metrics.memory = {
                used: usedMemory.toFixed(1),
                total: totalMemory.toFixed(1),
                usage: memoryUsage.toFixed(1)
            };
        }
    }

    checkNetworkStatus() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.metrics.network = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
    }

    // Performance Reporting
    setupPerformanceReporting() {
        // Report performance metrics to analytics
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.reportPerformanceMetrics();
            }, 5000); // Wait for full page load
        });

        // Report to PerformanceObserver API
        this.observePerformanceEntry('paint', (entries) => {
            entries.forEach(entry => {
                this.sendMetricToAnalytics(`${entry.name}`, entry.startTime);
            });
        });
    }

    reportPerformanceMetrics() {
        const report = {
            pageLoad: this.metrics.pageLoad,
            webVitals: this.metrics.webVitals,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            url: window.location.href
        };

        // Send to analytics
        this.sendToAnalytics('performance', report);

        // Check for performance issues
        this.analyzePerformance();
    }

    analyzePerformance() {
        const issues = [];

        // Check page load time
        if (this.metrics.pageLoad.LoadComplete > this.thresholds.LoadComplete) {
            issues.push({
                type: 'slow_page_load',
                severity: 'high',
                message: `Page load took ${this.metrics.pageLoad.LoadComplete}ms (threshold: ${this.thresholds.LoadComplete}ms)`,
                recommendations: [
                    'Optimize images and videos',
                    'Minimize CSS and JavaScript',
                    'Use a CDN',
                    'Enable gzip compression'
                ]
            });
        }

        // Check web vitals
        Object.entries(this.metrics.webVitals).forEach(([metric, data]) => {
            if (data.value > this.thresholds[metric]) {
                issues.push({
                    type: `poor_${metric.toLowerCase()}`,
                    severity: metric === 'CLS' ? 'medium' : 'high',
                    message: `${metric} is ${data.value} (threshold: ${this.thresholds[metric]})`,
                    recommendations: this.getMetricRecommendations(metric)
                });
            }
        });

        // Check for long tasks
        if (this.metrics.webVitals.longTasks && this.metrics.webVitals.longTasks.length > 0) {
            issues.push({
                type: 'long_tasks',
                severity: 'medium',
                message: `${this.metrics.webVitals.longTasks.length} long tasks detected`,
                recommendations: [
                    'Break up long-running JavaScript',
                    'Use Web Workers for heavy computations',
                    'Code splitting and lazy loading'
                ]
            });
        }

        if (issues.length > 0) {
            this.displayPerformanceIssues(issues);
        }
    }

    getMetricRecommendations(metric) {
        const recommendations = {
            FCP: [
                'Reduce server response time',
                'Eliminate render-blocking resources',
                'Optimize CSS delivery'
            ],
            LCP: [
                'Optimize images',
                'Preload important resources',
                'Remove unused CSS/JS'
            ],
            FID: [
                'Reduce JavaScript execution time',
                'Break up long tasks',
                'Use web workers'
            ],
            CLS: [
                'Include size attributes for images and videos',
                'Never insert content above existing content',
                'Reserve space for dynamic content'
            ],
            TTFB: [
                'Improve server response time',
                'Use CDN',
                'Optimize database queries'
            ]
        };

        return recommendations[metric] || ['Contact performance expert for optimization'];
    }

    displayPerformanceIssues(issues) {
        // Create performance panel in dev mode
        if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
            this.createPerformancePanel(issues);
        }

        // Send to monitoring service
        this.sendToAnalytics('performance_issues', issues);
    }

    createPerformancePanel(issues) {
        let panel = document.getElementById('performance-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'performance-panel';
            panel.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 500px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                border-radius: 8px;
                padding: 20px;
                z-index: 10000;
                font-family: monospace;
                font-size: 12px;
                overflow-y: auto;
            `;
            document.body.appendChild(panel);
        }

        const html = `
            <h3 style="margin: 0 0 10px 0; color: #ff6b6b;">Performance Issues Detected</h3>
            ${issues.map(issue => `
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(255, 107, 107, 0.1); border-radius: 4px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">${issue.type.replace('_', ' ').toUpperCase()}</div>
                    <div style="margin-bottom: 8px;">${issue.message}</div>
                    <div style="font-size: 10px; opacity: 0.8;">
                        <strong>Recommendations:</strong>
                        <ul style="margin: 5px 0; padding-left: 15px;">
                            ${issue.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `).join('')}
            <button onclick="document.getElementById('performance-panel').remove()" style="background: #ff6b6b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Close</button>
        `;

        panel.innerHTML = html;
    }

    // Utility Methods
    recordMetric(name, metric) {
        this.metrics.webVitals[name] = metric;
        this.sendMetricToAnalytics(name, metric.value);
    }

    recordWarning(message) {
        this.metrics.warnings.push({
            message,
            timestamp: Date.now()
        });
        console.warn(`[Performance Monitor] ${message}`);
    }

    recordError(error) {
        this.metrics.errors.push(error);
        this.sendToAnalytics('error', error);
        console.error(`[Performance Monitor] Error:`, error);
    }

    sendMetricToAnalytics(name, value) {
        if (typeof analytics !== 'undefined' && analytics.track) {
            analytics.track(`Performance: ${name}`, { value });
        }
    }

    sendToAnalytics(event, data) {
        if (typeof analytics !== 'undefined' && analytics.track) {
            analytics.track(event, data);
        }
    }

    observePerformanceEntry(type, callback) {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                callback(list.getEntries());
            });

            try {
                observer.observe({ entryTypes: [type] });
            } catch (e) {
                console.warn(`Performance observer for ${type} not supported`);
            }
        }
    }

    checkThresholds() {
        Object.entries(this.thresholds).forEach(([metric, threshold]) => {
            if (this.metrics.webVitals[metric] && this.metrics.webVitals[metric].value > threshold) {
                this.recordWarning(`${metric} exceeds threshold: ${this.metrics.webVitals[metric].value} > ${threshold}`);
            }
        });
    }

    updatePerformanceDashboard() {
        // Update real-time dashboard if available
        const dashboard = document.getElementById('performance-dashboard');
        if (dashboard) {
            const data = {
                memory: this.metrics.memory,
                network: this.metrics.network,
                errors: this.metrics.errors.length,
                warnings: this.metrics.warnings.length
            };

            // Update dashboard visualization
            this.renderPerformanceDashboard(dashboard, data);
        }
    }

    renderPerformanceDashboard(element, data) {
        // Simple dashboard update - could be enhanced with charts
        element.innerHTML = `
            <h4>Performance Dashboard</h4>
            <div>Memory Usage: ${data.memory?.usage || 'N/A'}%</div>
            <div>Network: ${data.network?.effectiveType || 'N/A'}</div>
            <div>Errors: ${data.errors}</div>
            <div>Warnings: ${data.warnings}</div>
            <div>Last Updated: ${new Date().toLocaleTimeString()}</div>
        `;
    }

    // Public API
    getMetrics() {
        return { ...this.metrics };
    }

    getPerformanceScore() {
        let score = 100;

        Object.entries(this.metrics.webVitals).forEach(([metric, data]) => {
            if (this.thresholds[metric]) {
                const ratio = data.value / this.thresholds[metric];
                if (ratio > 1) {
                    score -= Math.min(50, (ratio - 1) * 25);
                } else if (ratio > 0.5) {
                    score -= (1 - ratio) * 10;
                }
            }
        });

        return Math.max(0, Math.round(score));
    }
}

// Initialize Performance Monitor
let performanceMonitor;

document.addEventListener('DOMContentLoaded', () => {
    performanceMonitor = new PerformanceMonitor();

    // Expose globally for debugging
    window.performanceMonitor = performanceMonitor;
});

// Performance monitoring for service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PERFORMANCE_METRICS') {
            console.log('Service Worker Performance:', event.data.metrics);
        }
    });
}