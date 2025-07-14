const axios = require('axios');

class NotificationService {
  constructor(database) {
    this.db = database;
    this.oneSignalApiKey = process.env.ONESIGNAL_API_KEY;
    this.oneSignalAppId = process.env.ONESIGNAL_APP_ID;
    this.oneSignalBaseUrl = 'https://onesignal.com/api/v1';
  }

  // ================================
  // DEVICE SUBSCRIPTION MANAGEMENT
  // ================================

  /**
   * Subscribe a device for push notifications
   * @param {string} deviceToken - Device token (OneSignal player_id)
   * @param {string} userId - User ID (null for anonymous)
   * @param {string} tenantContext - Tenant context
   * @param {object} subscriptionData - Additional subscription data
   */
  async subscribeDevice(deviceToken, userId, tenantContext, subscriptionData = {}) {
    try {
      // Check if subscription already exists
      const existingSubscription = await this.db.table('mtcli_push_subscriptions')
        .select('*')
        .eq('device_token', deviceToken)
        .eq('tenant_context', tenantContext)
        .single();

      if (existingSubscription.data) {
        // Update existing subscription
        const { data, error } = await this.db.table('mtcli_push_subscriptions')
          .update({
            user_id: userId,
            subscription_data: subscriptionData,
            is_active: true,
            last_used_at: new Date().toISOString()
          })
          .eq('device_token', deviceToken)
          .eq('tenant_context', tenantContext)
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data, action: 'updated' };
      } else {
        // Create new subscription
        const { data, error } = await this.db.table('mtcli_push_subscriptions')
          .insert({
            device_token: deviceToken,
            user_id: userId,
            tenant_context: tenantContext,
            subscription_data: subscriptionData,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data, action: 'created' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Merge device subscription when user logs in
   * @param {string} deviceToken - Device token
   * @param {string} userId - User ID
   * @param {string} tenantContext - Tenant context
   */
  async mergeDeviceSubscription(deviceToken, userId, tenantContext) {
    try {
      // Update the device subscription to associate it with the user
      const { data, error } = await this.db.table('mtcli_push_subscriptions')
        .update({
          user_id: userId,
          last_used_at: new Date().toISOString()
        })
        .eq('device_token', deviceToken)
        .eq('tenant_context', tenantContext)
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, merged: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active subscriptions for a user
   * @param {string} userId - User ID
   * @param {string} tenantContext - Tenant context
   */
  async getUserSubscriptions(userId, tenantContext) {
    try {
      const { data, error } = await this.db.table('mtcli_push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_context', tenantContext)
        .eq('is_active', true);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Deactivate device subscription
   * @param {string} deviceToken - Device token
   * @param {string} tenantContext - Tenant context
   */
  async unsubscribeDevice(deviceToken, tenantContext) {
    try {
      const { data, error } = await this.db.table('mtcli_push_subscriptions')
        .update({ is_active: false })
        .eq('device_token', deviceToken)
        .eq('tenant_context', tenantContext)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ================================
  // NOTIFICATION SENDING
  // ================================

  /**
   * Send push notification
   * @param {string} userId - Target user ID
   * @param {string} eventType - Event type
   * @param {string} message - Notification message
   * @param {string} link - Optional link
   * @param {string} tenantContext - Tenant context
   * @param {object} eventPayload - Additional event data
   */
  async sendNotification(userId, eventType, message, link, tenantContext, eventPayload = {}) {
    try {
      // 1. Store notification in database
      const { data: notificationData, error: dbError } = await this.db.table('mtcli_notifications')
        .insert({
          user_id: userId,
          event_type: eventType,
          message: message,
          link: link,
          event_payload: eventPayload,
          tenant_context: tenantContext,
          seen: false
        })
        .select()
        .single();

      if (dbError) {
        return { success: false, error: dbError.message };
      }

      // 2. Get user's active push subscriptions
      console.log(`🔍 Looking for subscriptions for userId: ${userId}, tenantContext: ${tenantContext}`);
      const subscriptionsResult = await this.getUserSubscriptions(userId, tenantContext);
      if (!subscriptionsResult.success) {
        console.log(`❌ No subscriptions found for user ${userId}:`, subscriptionsResult.error);
        return { success: true, data: notificationData, pushSent: false, error: 'No subscriptions found' };
      }

      const subscriptions = subscriptionsResult.data;
      console.log(`📋 Found ${subscriptions?.length || 0} subscriptions for user ${userId}:`, subscriptions);
      if (!subscriptions || subscriptions.length === 0) {
        console.log(`❌ No active subscriptions for user ${userId}`);
        return { success: true, data: notificationData, pushSent: false, error: 'No active subscriptions' };
      }

      // 3. Send push notification via OneSignal
      const pushResult = await this.sendPushNotification(subscriptions, message, link, eventPayload);

      return {
        success: true,
        data: notificationData,
        pushSent: pushResult.success,
        pushResult: pushResult
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to anonymous device
   * @param {string} deviceToken - Device token
   * @param {string} message - Notification message
   * @param {string} link - Optional link
   * @param {object} eventPayload - Additional event data
   */
  async sendAnonymousNotification(deviceToken, message, link, eventPayload = {}) {
    try {
      // Store notification in database with device_token
      const { data: notificationData, error: dbError } = await this.db.table('mtcli_notifications')
        .insert({
          device_token: deviceToken,
          event_type: 'anonymous_notification',
          message: message,
          link: link,
          event_payload: eventPayload,
          tenant_context: eventPayload.tenantContext || 'default',
          seen: false
        })
        .select()
        .single();

      if (dbError) {
        return { success: false, error: dbError.message };
      }

      // Send push notification
      const pushResult = await this.sendPushNotification([{ device_token: deviceToken }], message, link, eventPayload);

      return {
        success: true,
        data: notificationData,
        pushSent: pushResult.success,
        pushResult: pushResult
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification via OneSignal
   * @param {Array} subscriptions - Array of subscription objects
   * @param {string} message - Notification message
   * @param {string} link - Optional link
   * @param {object} eventPayload - Additional event data
   */
  async sendPushNotification(subscriptions, message, link, eventPayload = {}) {
    if (!this.oneSignalApiKey || !this.oneSignalAppId) {
      return { success: false, error: 'OneSignal not configured' };
    }

    try {
      // Extract player IDs from subscriptions
      const playerIds = subscriptions.map(sub => {
        if (sub.subscription_data && sub.subscription_data.player_id) {
          return sub.subscription_data.player_id;
        }
        return sub.device_token; // Fallback if device_token is the player_id
      }).filter(id => id);

      if (playerIds.length === 0) {
        return { success: false, error: 'No valid player IDs found' };
      }

      // Prepare OneSignal payload
      const payload = {
        app_id: this.oneSignalAppId,
        include_player_ids: playerIds,
        headings: { en: "Notification" },
        contents: { en: message },
        data: {
          ...eventPayload,
          link: link
        }
      };

      // Add URL if link is provided
      if (link) {
        payload.url = link;
      }

      // Send to OneSignal
      const response = await axios.post(
        `${this.oneSignalBaseUrl}/notifications`,
        payload,
        {
          headers: {
            'Authorization': `Basic ${this.oneSignalApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        recipients: playerIds.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors || error.message
      };
    }
  }

  // ================================
  // NOTIFICATION PREFERENCES
  // ================================

  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   * @param {string} tenantContext - Tenant context
   */
  async getUserPreferences(userId, tenantContext) {
    try {
      const { data, error } = await this.db.table('mtcli_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_context', tenantContext)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        return { success: false, error: error.message };
      }

      // Return default preferences if none found
      if (!data) {
        const defaultPreferences = {
          chat_requests: true,
          attribute_updates: true,
          reminders: true,
          marketing: false
        };
        return { success: true, data: { preferences: defaultPreferences } };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user notification preferences
   * @param {string} userId - User ID
   * @param {string} tenantContext - Tenant context
   * @param {object} preferences - Preferences object
   */
  async updateUserPreferences(userId, tenantContext, preferences) {
    try {
      const { data, error } = await this.db.table('mtcli_notification_preferences')
        .upsert({
          user_id: userId,
          tenant_context: tenantContext,
          preferences: preferences
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ================================
  // NOTIFICATION HISTORY
  // ================================

  /**
   * Get notification history for a user
   * @param {string} userId - User ID
   * @param {string} tenantContext - Tenant context
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   */
  async getNotificationHistory(userId, tenantContext, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // Get total count for proper pagination
      const { count: totalCount, error: countError } = await this.db.table('mtcli_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('tenant_context', tenantContext);

      if (countError) {
        return { success: false, error: countError.message };
      }

      // Get paginated data
      const { data, error } = await this.db.table('mtcli_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_context', tenantContext)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          has_more: (offset + data.length) < (totalCount || 0)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as seen
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   */
  async markNotificationSeen(notificationId, userId) {
    try {
      const { data, error } = await this.db.table('mtcli_notifications')
        .update({ seen: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ================================
  // SPECIALIZED NOTIFICATIONS
  // ================================

  /**
   * Send chat request notification to entity owner
   * @param {string} entityId - Entity ID
   * @param {string} requesterId - Requester user ID
   * @param {string} tenantContext - Tenant context
   * @param {string} chatUrl - Chat URL
   */
  async sendChatRequestNotification(entityId, requesterId, tenantContext, chatUrl) {
    try {
      // Get entity details to find owner
      const { data: entity, error: entityError } = await this.db.table('mtcli_entities')
        .select('id, owner_id, attributes, entity_type')
        .eq('id', entityId)
        .single();

      if (entityError || !entity) {
        return { success: false, error: 'Entity not found' };
      }

      if (!entity.owner_id) {
        return { success: false, error: 'Entity has no owner' };
      }

      // Get requester info (if available)
      let requesterInfo = 'Someone';
      if (requesterId && requesterId !== 'anonymous') {
        // You might want to add user profile lookup here
        requesterInfo = 'A user';
      }

      const message = `${requesterInfo} wants to chat about your ${entity.entity_type} listing.`;
      const eventPayload = {
        entity_id: entityId,
        requester_id: requesterId,
        chat_url: chatUrl,
        entity_type: entity.entity_type
      };

      return await this.sendNotification(
        entity.owner_id,
        'chat_request',
        message,
        chatUrl,
        tenantContext,
        eventPayload
      );
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send test notification
   * @param {string} userId - User ID
   * @param {string} tenantContext - Tenant context
   */
  async sendTestNotification(userId, tenantContext) {
    const message = 'This is a test notification from your notification system.';
    const eventPayload = { test: true, timestamp: new Date().toISOString() };

    return await this.sendNotification(
      userId,
      'test',
      message,
      null,
      tenantContext,
      eventPayload
    );
  }

  // ================================
  // HEALTH CHECK
  // ================================

  /**
   * Check notification service health
   */
  async healthCheck() {
    try {
      const checks = {
        database: false,
        onesignal: false,
        config: false
      };

      // Check database connection
      try {
        const { data, error } = await this.db.table('mtcli_notifications')
          .select('count')
          .limit(1);
        checks.database = !error;
      } catch (e) {
        checks.database = false;
      }

      // Check OneSignal configuration
      checks.onesignal = !!(this.oneSignalApiKey && this.oneSignalAppId);

      // Check environment configuration
      checks.config = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

      const allHealthy = Object.values(checks).every(check => check === true);

      return {
        success: true,
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = NotificationService;
