# 📣 Notifications Module

This document outlines how users receive and manage notifications—via Web Push or in-app feed. The system supports anonymous visitors, logged-in users, and those who transition between the two via device-token merging.

---

## 🔔 Notification Channels

| Channel     | Status      | Description                                       |
|-------------|-------------|--------------------------------------------------|
| Web Push    | ✅ Active    | Sent to registered devices (anonymous or logged) |
| In-App Feed | ✅ Active    | Available to logged-in users via dashboard       |
| Email       | ❌ Optional  | Reserved for digest or reminder emails           |

---

## 📩 Subscription Flow

### Anonymous Visitor

POST /api/notifications/subscribe-device  
Authorization: Bearer {JWT} (optional)

Payload:
{
  "deviceToken": "onesignal_player_id_123",
  "tenantContext": "default"
}

Stores token + context without userId (anonymous subscription).

### Logged-In User

POST /api/notifications/subscribe-device  
Authorization: Bearer {JWT}

Payload:
{
  "deviceToken": "onesignal_player_id_123",
  "tenantContext": "default"
}

Automatically links deviceToken to authenticated user ID.

---

## 🔄 Merge Logic (Visitor → User)

POST /api/notifications/merge-device  
Authorization: Bearer {JWT}

Payload:
{
  "deviceToken": "onesignal_player_id_123"
}

**Effect**:
- Associates anonymous device subscription with authenticated user
- Previous notifications linked to device become accessible to user
- Future push messages sent using userId and deviceToken
- User ID automatically extracted from JWT token

---

## 📣 Generic Notification Trigger

Use this universal endpoint to notify a user with a contextual message and optional link.

POST /api/notifications/send  
Authorization: Bearer {JWT}

Payload:
{
  "userId": "user@example.com",
  "eventType": "chat_request",
  "message": "Someone wants to chat about your listing.",
  "link": "https://platform.com/entity/123/chat",
  "tenantContext": "default",
  "eventPayload": {
    "entity_id": "entity_123",
    "requester_id": "user_456"
  }
}

**Features**:
- Stores notification in database
- Delivers via OneSignal push notifications
- Supports flexible use cases: chat, reminders, data requests, etc.
- Returns push delivery status

## 📱 Specialized Endpoints

### Chat Request Notification
POST /api/notifications/chat-request  
Authorization: Bearer {JWT} (optional)

Payload:
{
  "entityId": "entity_123",
  "chatUrl": "https://platform.com/entity/123/chat"
}

Automatically notifies entity owner about chat request.

### Test Notification
POST /api/notifications/test  
Authorization: Bearer {JWT}

Sends a test notification to the authenticated user.

---

## 📥 Notification Storage

**Push Subscriptions Table**: `mtcli_push_subscriptions`

| Field              | Type     | Notes                                           |
|--------------------|----------|-------------------------------------------------|
| `id`               | UUID     | Unique subscription ID                          |
| `device_token`     | Text     | OneSignal player ID                            |
| `user_id`          | Text     | User ID (null for anonymous)                  |
| `tenant_context`   | Text     | Tenant isolation                               |
| `subscription_data`| JSONB    | Additional subscription metadata               |
| `is_active`        | Boolean  | Subscription status                            |
| `created_at`       | DateTime | When subscription was created                  |
| `last_used_at`     | DateTime | Last activity timestamp                        |

**Notifications Table**: `mtcli_notifications` (for notification history)

| Field           | Type     | Notes                                           |
|-----------------|----------|-------------------------------------------------|
| `id`            | UUID     | Unique per notification                         |
| `user_id`       | Text     | User ID                                        |
| `event_type`    | Text     | E.g. `chat_request`, `test`, `attribute_request`|
| `message`       | Text     | Visible message to user                         |
| `link`          | Text     | Optional link included in notification          |
| `event_payload` | JSONB    | Additional context                              |
| `tenant_context`| Text     | Origin context of trigger                       |
| `timestamp`     | DateTime | When it was created                             |
| `seen`          | Boolean  | Whether the user has viewed this notification   |

---

## 📋 User Preferences & History

### Get Notification Preferences
GET /api/notifications/preferences  
Authorization: Bearer {JWT}

Returns user's notification preferences.

### Update Notification Preferences
POST /api/notifications/preferences  
Authorization: Bearer {JWT}

Payload:
{
  "preferences": {
    "chat_requests": true,
    "attribute_updates": true,
    "reminders": true,
    "marketing": false
  }
}

### Get Notification History
GET /api/notifications/history?page=1&limit=20  
Authorization: Bearer {JWT}

Returns paginated notification history for the user.

### Mark Notification as Seen
POST /api/notifications/:id/seen  
Authorization: Bearer {JWT}

Marks a specific notification as seen.

## ⏰ Reminder Triggers

**Current Status**: Basic notification system implemented.

**Future Scheduled Logic** for reminders:
- `attribute_pending`: owner hasn't filled requested field
- `entity_checkin`: item hasn't been updated in a while
- `attribute_fulfilled`: requester notified when field is added
- `chat_pending`: follow-up needed in owner/requester dialogue

These would run via cron job or Supabase scheduled function.

---

## 📊 Analytics Queries

Use logs and database views to analyze:

- Most active entities
- Notification volume per tenant
- Ratio of seen/unseen events
- Reminder response rates

---

## 🧙 Environment Variables Required

```
ONESIGNAL_API_KEY=      # OneSignal REST API key
ONESIGNAL_APP_ID=       # OneSignal application ID
SUPABASE_URL=           # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY= # For database operations
JWT_SECRET=             # For authentication
```

---

## 🚧 Current Implementation Status

**Implemented Features**:
- ✅ OneSignal push notification integration
- ✅ Device subscription management (anonymous & authenticated)
- ✅ Device subscription merging on login
- ✅ Generic notification sending
- ✅ Specialized chat request notifications
- ✅ Test notification endpoint
- ✅ User notification preferences
- ✅ Notification history with pagination
- ✅ Mark notifications as seen
- ✅ Tenant isolation
- ✅ Error handling and logging

**Database Tables**:
- `mtcli_push_subscriptions` - Device subscriptions
- `mtcli_notifications` - Notification history

**Service Integration**:
- `NotificationService` class
- OneSignal API integration
- Database persistence
- User preference management

**API Endpoints**:
- Device subscription: `/api/notifications/subscribe-device`
- Device merging: `/api/notifications/merge-device`
- Send notification: `/api/notifications/send`
- Chat requests: `/api/notifications/chat-request`
- Preferences: `/api/notifications/preferences`
- History: `/api/notifications/history`
- Mark seen: `/api/notifications/:id/seen`
- Test: `/api/notifications/test`

**Pending Features**:
- ⏳ Email notifications
- ⏳ Scheduled reminder system
- ⏳ In-app notification feed UI
- ⏳ Notification templates
- ⏳ Bulk notification sending
- ⏳ Advanced analytics dashboard
- ⏳ Notification delivery tracking
- ⏳ Rich notification content (images, actions)
