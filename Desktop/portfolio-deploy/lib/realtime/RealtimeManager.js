/**
 * REALTIME MANAGER
 * Real-time features using WebSockets/Supabase
 * Features: Live updates, notifications, chat, presence, price feeds
 */

import { createClient } from '@supabase/supabase-js';

class RealtimeManager {
  constructor(config) {
    this.config = config.realtime;
    this.supabase = null;
    this.channels = new Map();
    this.listeners = new Map();
    this.presence = new Map();
    this.initialized = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize Realtime Manager
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Supabase Realtime
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        }
      );

      // Setup connection monitoring
      this.setupConnectionMonitoring();

      this.initialized = true;
      console.log('✅ Realtime Manager initialized');
      this.emit('initialized');

    } catch (error) {
      console.error('Realtime initialization error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channelName, callbacks = {}) {
    await this.initialize();

    try {
      const channel = this.supabase.channel(channelName);

      // Setup event handlers
      if (callbacks.onInsert) {
        channel.on('postgres_changes',
          { event: 'INSERT', schema: 'public' },
          callbacks.onInsert
        );
      }

      if (callbacks.onUpdate) {
        channel.on('postgres_changes',
          { event: 'UPDATE', schema: 'public' },
          callbacks.onUpdate
        );
      }

      if (callbacks.onDelete) {
        channel.on('postgres_changes',
          { event: 'DELETE', schema: 'public' },
          callbacks.onDelete
        );
      }

      if (callbacks.onBroadcast) {
        channel.on('broadcast',
          { event: '*' },
          callbacks.onBroadcast
        );
      }

      if (callbacks.onPresence) {
        channel.on('presence',
          { event: 'sync' },
          () => {
            const state = channel.presenceState();
            callbacks.onPresence(state);
          }
        );
      }

      // Subscribe to channel
      const subscribed = await channel.subscribe((status) => {
        console.log(`Channel ${channelName} status:`, status);
        if (status === 'SUBSCRIBED') {
          this.emit('channelSubscribed', { channel: channelName });
        }
      });

      // Store channel reference
      this.channels.set(channelName, subscribed);

      this.trackEvent('channel_subscribed', { channel: channelName });

      return subscribed;

    } catch (error) {
      console.error(`Error subscribing to channel ${channelName}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName) {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    try {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.emit('channelUnsubscribed', { channel: channelName });
      this.trackEvent('channel_unsubscribed', { channel: channelName });
    } catch (error) {
      console.error(`Error unsubscribing from ${channelName}:`, error);
    }
  }

  /**
   * Broadcast message to channel
   */
  async broadcast(channelName, event, payload) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not subscribed`);
    }

    try {
      await channel.send({
        type: 'broadcast',
        event,
        payload
      });

      this.trackEvent('message_broadcast', {
        channel: channelName,
        event
      });

    } catch (error) {
      console.error('Broadcast error:', error);
      throw error;
    }
  }

  /**
   * Track user presence in a channel
   */
  async trackPresence(channelName, userState) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not subscribed`);
    }

    try {
      await channel.track(userState);
      this.presence.set(channelName, userState);
      this.trackEvent('presence_tracked', { channel: channelName });
    } catch (error) {
      console.error('Presence tracking error:', error);
      throw error;
    }
  }

  /**
   * Untrack user presence
   */
  async untrackPresence(channelName) {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    try {
      await channel.untrack();
      this.presence.delete(channelName);
    } catch (error) {
      console.error('Presence untracking error:', error);
    }
  }

  /**
   * Get presence state for a channel
   */
  getPresenceState(channelName) {
    const channel = this.channels.get(channelName);
    if (!channel) return {};

    return channel.presenceState();
  }

  /**
   * Setup live crypto price feed
   */
  async setupCryptoPriceFeed(symbols = ['BTC', 'ETH', 'SOL'], onPriceUpdate) {
    const channel = await this.subscribe('crypto-prices', {
      onBroadcast: (payload) => {
        if (payload.event === 'price_update') {
          onPriceUpdate(payload.payload);
        }
      }
    });

    // Start price polling (in real app, this would come from backend)
    this.startPricePolling(symbols, channel);

    return channel;
  }

  /**
   * Start polling crypto prices (demo)
   */
  startPricePolling(symbols, channel) {
    // This is a demo - in production, backend would push real prices
    const pollInterval = setInterval(async () => {
      try {
        const prices = await this.fetchCryptoPrices(symbols);
        await channel.send({
          type: 'broadcast',
          event: 'price_update',
          payload: prices
        });
      } catch (error) {
        console.error('Price polling error:', error);
      }
    }, 5000); // Every 5 seconds

    // Store interval for cleanup
    this.pricePollingInterval = pollInterval;
  }

  /**
   * Fetch crypto prices from API
   */
  async fetchCryptoPrices(symbols) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(',')}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();

      return symbols.map(symbol => ({
        symbol,
        price: data[symbol.toLowerCase()]?.usd || 0,
        change24h: data[symbol.toLowerCase()]?.usd_24h_change || 0,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Price fetch error:', error);
      return [];
    }
  }

  /**
   * Setup live notifications
   */
  async setupNotifications(userId, onNotification) {
    const channelName = `notifications:${userId}`;

    return await this.subscribe(channelName, {
      onBroadcast: (payload) => {
        if (payload.event === 'new_notification') {
          onNotification(payload.payload);
          this.showBrowserNotification(payload.payload);
        }
      }
    });
  }

  /**
   * Send notification
   */
  async sendNotification(userId, notification) {
    const channelName = `notifications:${userId}`;
    const channel = this.channels.get(channelName);

    if (!channel) {
      // If channel doesn't exist, store in database for later
      await this.storeNotification(userId, notification);
      return;
    }

    await this.broadcast(channelName, 'new_notification', {
      ...notification,
      id: this.generateId(),
      timestamp: Date.now(),
      read: false
    });
  }

  /**
   * Show browser notification
   */
  async showBrowserNotification(notification) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.id,
        requireInteraction: notification.urgent || false
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showBrowserNotification(notification);
      }
    }
  }

  /**
   * Setup live chat
   */
  async setupChat(roomId, userId, onMessage) {
    const channelName = `chat:${roomId}`;

    const channel = await this.subscribe(channelName, {
      onBroadcast: (payload) => {
        if (payload.event === 'message') {
          onMessage(payload.payload);
        }
      },
      onPresence: (presenceState) => {
        this.emit('chatPresence', { room: roomId, presence: presenceState });
      }
    });

    // Track user presence
    await this.trackPresence(channelName, {
      userId,
      username: userId, // Get from user profile
      online: true,
      lastSeen: Date.now()
    });

    return channel;
  }

  /**
   * Send chat message
   */
  async sendChatMessage(roomId, message) {
    const channelName = `chat:${roomId}`;

    await this.broadcast(channelName, 'message', {
      ...message,
      id: this.generateId(),
      timestamp: Date.now()
    });
  }

  /**
   * Setup live analytics dashboard
   */
  async setupAnalyticsDashboard(onUpdate) {
    const channel = await this.subscribe('analytics:dashboard', {
      onBroadcast: (payload) => {
        if (payload.event === 'metrics_update') {
          onUpdate(payload.payload);
        }
      }
    });

    return channel;
  }

  /**
   * Update analytics metrics
   */
  async updateMetrics(metrics) {
    await this.broadcast('analytics:dashboard', 'metrics_update', metrics);
  }

  /**
   * Setup connection monitoring
   */
  setupConnectionMonitoring() {
    // Monitor connection status
    this.supabase.channel('connection-monitor')
      .on('system', { event: 'phx_error' }, () => {
        console.log('Connection error');
        this.emit('connectionError');
        this.attemptReconnect();
      })
      .on('system', { event: 'phx_close' }, () => {
        console.log('Connection closed');
        this.emit('connectionClosed');
        this.attemptReconnect();
      })
      .subscribe();
  }

  /**
   * Attempt to reconnect
   */
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.initialize();
        this.reconnectAttempts = 0;
        this.emit('reconnected');
      } catch (error) {
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Store notification in database
   */
  async storeNotification(userId, notification) {
    try {
      await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          ...notification,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Store notification error:', error);
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event emitter methods
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => callback(data));
  }

  /**
   * Track analytics event
   */
  trackEvent(eventName, properties) {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackEvent(`realtime_${eventName}`, {
        ...properties,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    // Stop price polling
    if (this.pricePollingInterval) {
      clearInterval(this.pricePollingInterval);
    }

    // Unsubscribe from all channels
    for (const [channelName] of this.channels) {
      await this.unsubscribe(channelName);
    }

    this.channels.clear();
    this.listeners.clear();
    this.presence.clear();
    this.initialized = false;
  }

  /**
   * Get active channels
   */
  getActiveChannels() {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

// Singleton instance
let realtimeManager = null;

export const getRealtimeManager = (config) => {
  if (!realtimeManager) {
    realtimeManager = new RealtimeManager(config);
  }
  return realtimeManager;
};

export default RealtimeManager;
