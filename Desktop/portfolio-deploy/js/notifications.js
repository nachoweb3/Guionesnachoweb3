/* ========================================
   NOTIFICATION SYSTEM
   User-friendly notification messages
   ======================================== */

/**
 * Notification Manager
 * Handles all notification types and displays
 */
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 5;
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Notificaciones');
        document.body.appendChild(this.container);
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Type: success, error, warning, info
     * @param {Object} options - Additional options
     */
    show(message, type = 'info', options = {}) {
        const {
            duration = 5000,
            persistent = false,
            action = null,
            dismissible = true
        } = options;

        const notification = this.createNotification(message, type, {
            persistent,
            action,
            dismissible
        });

        this.addNotification(notification);

        if (!persistent) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }

        return notification.id;
    }

    createNotification(message, type, options) {
        const id = this.generateId();
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-notification-id', id);

        const icon = this.getIcon(type);
        const ariaLabel = this.getAriaLabel(type);

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon" aria-hidden="true">
                    <i class="${icon}"></i>
                </div>
                <div class="notification-message">
                    <p>${message}</p>
                </div>
                ${options.action ? `
                    <div class="notification-action">
                        <button class="btn-small btn-primary" onclick="${options.action.callback}">
                            ${options.action.label}
                        </button>
                    </div>
                ` : ''}
                ${options.dismissible ? `
                    <button class="notification-close"
                            onclick="notifications.remove('${id}')"
                            aria-label="Cerrar notificación">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
            <div class="notification-progress" aria-hidden="true"></div>
        `;

        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-label', ariaLabel);

        // Add to tracking
        this.notifications.push({
            id,
            element: notification,
            type
        });

        return {
            id,
            element: notification,
            type,
            persistent: options.persistent
        };
    }

    addNotification(notification) {
        // Limit number of notifications
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.find(n => !n.persistent);
            if (oldest) {
                this.removeNotification(oldest.id);
            }
        }

        this.container.appendChild(notification.element);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });
    }

    removeNotification(id) {
        const notificationIndex = this.notifications.findIndex(n => n.id === id);

        if (notificationIndex === -1) return;

        const notification = this.notifications[notificationIndex];

        // Add hide animation
        notification.element.classList.add('hide');

        // Remove after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.splice(notificationIndex, 1);
        }, 300);
    }

    /**
     * Clear all notifications
     */
    clear() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification.id);
        });
    }

    /**
     * Show success notification
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * Show error notification
     */
    error(message, options = {}) {
        return this.show(message, 'error', { ...options, duration: 8000 });
    }

    /**
     * Show warning notification
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    /**
     * Show info notification
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getAriaLabel(type) {
        const labels = {
            success: 'Éxito',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información'
        };
        return labels[type] || labels.info;
    }

    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Global notification functions
let notifications;

function showNotification(message, type = 'info', options = {}) {
    if (!notifications) {
        notifications = new NotificationManager();
    }
    return notifications.show(message, type, options);
}

// Convenience functions
function showSuccess(message, options = {}) {
    if (!notifications) notifications = new NotificationManager();
    return notifications.success(message, options);
}

function showError(message, options = {}) {
    if (!notifications) notifications = new NotificationManager();
    return notifications.error(message, options);
}

function showWarning(message, options = {}) {
    if (!notifications) notifications = new NotificationManager();
    return notifications.warning(message, options);
}

function showInfo(message, options = {}) {
    if (!notifications) notifications = new NotificationManager();
    return notifications.info(message, options);
}

function clearNotifications() {
    if (!notifications) return;
    notifications.clear();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    notifications = new NotificationManager();

    // Show welcome message
    if (localStorage.getItem('welcome_shown') !== 'true') {
        showSuccess(
            '¡Bienvenido a mi portfolio! Explora mis servicios y productos digitales.',
            { duration: 6000 }
        );
        localStorage.setItem('welcome_shown', 'true');
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NotificationManager,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        clearNotifications
    };
}