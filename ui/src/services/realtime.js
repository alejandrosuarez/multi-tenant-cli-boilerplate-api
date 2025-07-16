// Real-time service for WebSocket connections and real-time updates
class RealtimeService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.subscriptions = new Set();
    this.isConnected = false;
    this.connectionPromise = null;
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    this.reconnectTimeout = null;
    this.connectionState = 'disconnected'; // disconnected, connecting, connected, reconnecting
    this.eventEmitter = new Map(); // For internal events
  }

  // Initialize WebSocket connection
  connect(token = null, tenantId = null) {
    if (this.connectionPromise && this.connectionState === 'connecting') {
      return this.connectionPromise;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.connectionState = 'connecting';
    this.emit('connection_state_changed', this.connectionState);

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const wsUrl = this.buildWebSocketUrl(token, tenantId);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.resubscribeAll();
          this.emit('connection_state_changed', this.connectionState);
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.connectionState = event.wasClean ? 'disconnected' : 'reconnecting';
          this.stopHeartbeat();
          this.connectionPromise = null;
          this.emit('connection_state_changed', this.connectionState);
          this.emit('disconnected', { code: event.code, reason: event.reason, wasClean: event.wasClean });
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(token, tenantId);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.connectionState = 'disconnected';
            this.emit('connection_state_changed', this.connectionState);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        this.connectionState = 'disconnected';
        this.connectionPromise = null;
        this.emit('connection_state_changed', this.connectionState);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Build WebSocket URL with authentication and tenant info
  buildWebSocketUrl(token, tenantId) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_URL || 
                   import.meta.env.VITE_API_URL?.replace(/^https?:/, wsProtocol) || 
                   `${wsProtocol}//${window.location.host}`;
    
    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (tenantId) params.append('tenant_id', tenantId);
    
    return `${wsHost}/ws${params.toString() ? '?' + params.toString() : ''}`;
  }

  // Schedule reconnection with exponential backoff and jitter
  scheduleReconnect(token, tenantId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached. Stopping reconnection.');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    // Add jitter to prevent thundering herd
    const baseDelay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    const jitter = Math.random() * 1000; // Up to 1 second of jitter
    const delay = Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
    
    this.reconnectAttempts++;
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay)}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isConnected && this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect(token, tenantId);
      }
    }, delay);
  }

  // Start heartbeat to keep connection alive
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
        this.lastHeartbeat = Date.now();
      }
    }, 30000); // Send ping every 30 seconds
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Handle incoming WebSocket messages
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // Handle heartbeat response
      if (message.type === 'pong') {
        return;
      }

      // Emit message to all listeners for this event type
      const eventListeners = this.listeners.get(message.type) || [];
      eventListeners.forEach(callback => {
        try {
          callback(message.data, message);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });

      // Emit to wildcard listeners
      const wildcardListeners = this.listeners.get('*') || [];
      wildcardListeners.forEach(callback => {
        try {
          callback(message.data, message);
        } catch (error) {
          console.error('Error in wildcard listener:', error);
        }
      });

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // Send message through WebSocket
  send(message) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Subscribe to specific event types
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    // Send subscription message to server
    this.send({
      type: 'subscribe',
      eventType: eventType
    });

    this.subscriptions.add(eventType);

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, callback);
  }

  // Unsubscribe from event type
  unsubscribe(eventType, callback) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
        
        // If no more listeners for this event type, unsubscribe from server
        if (listeners.length === 0) {
          this.listeners.delete(eventType);
          this.subscriptions.delete(eventType);
          
          this.send({
            type: 'unsubscribe',
            eventType: eventType
          });
        }
      }
    }
  }

  // Resubscribe to all event types after reconnection
  resubscribeAll() {
    this.subscriptions.forEach(eventType => {
      this.send({
        type: 'subscribe',
        eventType: eventType
      });
    });
  }

  // Disconnect WebSocket
  disconnect() {
    this.subscriptions.clear();
    this.listeners.clear();
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.connectionPromise = null;
  }

  // Internal event emitter for service events
  emit(eventType, data = null) {
    const listeners = this.eventEmitter.get(eventType) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in internal event listener:', error);
      }
    });
  }

  // Subscribe to internal service events
  on(eventType, callback) {
    if (!this.eventEmitter.has(eventType)) {
      this.eventEmitter.set(eventType, []);
    }
    this.eventEmitter.get(eventType).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventEmitter.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws?.readyState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      connectionState: this.connectionState
    };
  }

  // Entity-specific subscriptions
  subscribeToEntity(entityId, callback) {
    return this.subscribe(`entity:${entityId}`, callback);
  }

  subscribeToEntityType(entityType, callback) {
    return this.subscribe(`entity_type:${entityType}`, callback);
  }

  subscribeToUserEntities(userId, callback) {
    return this.subscribe(`user_entities:${userId}`, callback);
  }

  // Notification subscriptions
  subscribeToNotifications(callback) {
    return this.subscribe('notification', callback);
  }

  subscribeToNotificationType(notificationType, callback) {
    return this.subscribe(`notification:${notificationType}`, callback);
  }

  // Attribute request subscriptions
  subscribeToAttributeRequests(callback) {
    return this.subscribe('attribute_request', callback);
  }

  subscribeToAttributeRequestsForEntity(entityId, callback) {
    return this.subscribe(`attribute_request:${entityId}`, callback);
  }

  // System event subscriptions
  subscribeToSystemEvents(callback) {
    return this.subscribe('system_event', callback);
  }

  subscribeToUserActivity(callback) {
    return this.subscribe('user_activity', callback);
  }

  // Analytics subscriptions
  subscribeToAnalytics(callback) {
    return this.subscribe('analytics', callback);
  }

  subscribeToRealTimeMetrics(callback) {
    return this.subscribe('realtime_metrics', callback);
  }

  // Tenant-specific subscriptions
  subscribeToTenantEvents(tenantId, callback) {
    return this.subscribe(`tenant:${tenantId}`, callback);
  }

  subscribeToTenantUsers(tenantId, callback) {
    return this.subscribe(`tenant_users:${tenantId}`, callback);
  }

  // Admin subscriptions
  subscribeToAdminEvents(callback) {
    return this.subscribe('admin_event', callback);
  }

  subscribeToSystemHealth(callback) {
    return this.subscribe('system_health', callback);
  }

  subscribeToSecurityEvents(callback) {
    return this.subscribe('security_event', callback);
  }

  // Bulk operation subscriptions
  subscribeToBulkOperation(operationId, callback) {
    return this.subscribe(`bulk_operation:${operationId}`, callback);
  }

  // Media processing subscriptions
  subscribeToMediaProcessing(callback) {
    return this.subscribe('media_processing', callback);
  }

  subscribeToMediaProcessingForEntity(entityId, callback) {
    return this.subscribe(`media_processing:${entityId}`, callback);
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

// Export both the service instance and the class
export { realtimeService as default, RealtimeService };

// Convenience functions for common operations
export const realtimeAPI = {
  // Connection management
  connect: (token, tenantId) => realtimeService.connect(token, tenantId),
  disconnect: () => realtimeService.disconnect(),
  getStatus: () => realtimeService.getConnectionStatus(),

  // Entity subscriptions
  onEntityUpdate: (entityId, callback) => realtimeService.subscribeToEntity(entityId, callback),
  onEntityTypeUpdate: (entityType, callback) => realtimeService.subscribeToEntityType(entityType, callback),
  onUserEntitiesUpdate: (userId, callback) => realtimeService.subscribeToUserEntities(userId, callback),

  // Notification subscriptions
  onNotification: (callback) => realtimeService.subscribeToNotifications(callback),
  onNotificationType: (type, callback) => realtimeService.subscribeToNotificationType(type, callback),

  // Attribute request subscriptions
  onAttributeRequest: (callback) => realtimeService.subscribeToAttributeRequests(callback),
  onEntityAttributeRequest: (entityId, callback) => realtimeService.subscribeToAttributeRequestsForEntity(entityId, callback),

  // System subscriptions
  onSystemEvent: (callback) => realtimeService.subscribeToSystemEvents(callback),
  onUserActivity: (callback) => realtimeService.subscribeToUserActivity(callback),
  onAnalytics: (callback) => realtimeService.subscribeToAnalytics(callback),
  onRealTimeMetrics: (callback) => realtimeService.subscribeToRealTimeMetrics(callback),

  // Tenant subscriptions
  onTenantEvent: (tenantId, callback) => realtimeService.subscribeToTenantEvents(tenantId, callback),
  onTenantUsers: (tenantId, callback) => realtimeService.subscribeToTenantUsers(tenantId, callback),

  // Admin subscriptions
  onAdminEvent: (callback) => realtimeService.subscribeToAdminEvents(callback),
  onSystemHealth: (callback) => realtimeService.subscribeToSystemHealth(callback),
  onSecurityEvent: (callback) => realtimeService.subscribeToSecurityEvents(callback),

  // Operation subscriptions
  onBulkOperation: (operationId, callback) => realtimeService.subscribeToBulkOperation(operationId, callback),
  onMediaProcessing: (callback) => realtimeService.subscribeToMediaProcessing(callback),
  onEntityMediaProcessing: (entityId, callback) => realtimeService.subscribeToMediaProcessingForEntity(entityId, callback)
};