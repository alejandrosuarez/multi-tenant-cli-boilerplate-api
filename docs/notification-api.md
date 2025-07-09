# 🔔 Notification API Documentation

This document outlines all the notification endpoints implemented according to the requirements in `./docs/notifications.md`.

## 📋 Implementation Status

### ✅ COMPLETED

#### OneSignal Integration (Updated for API-based approach)
- ✅ **POST** `/api/notifications/subscribe-device` - Subscribe device for push notifications
- ✅ **POST** `/api/notifications/send` - Send push notifications
- ✅ Push subscriptions stored in database (`mtcli_push_subscriptions`)
- ✅ Integrated with existing user authentication

#### PHASE 3: Chat-to-Owner Notification System
- ✅ **POST** `/api/notifications/send` - Universal notification endpoint
- ✅ **POST** `/api/notifications/chat-request` - Specialized chat request endpoint
- ✅ Triggers when user clicks "Chat with Owner"
- ✅ Sends push notification to entity owner
- ✅ Includes chat URL in notification

#### PHASE 4: Database Integration
- ✅ **Database Schema**: `mtcli_push_subscriptions` table created
- ✅ **Database Schema**: `mtcli_notification_preferences` table created
- ✅ **GET** `/api/notifications/preferences` - Get user preferences
- ✅ **POST** `/api/notifications/preferences` - Update user preferences
- ✅ **GET** `/api/notifications/history` - Get notification history
- ✅ **POST** `/api/notifications/test` - Send test notifications

#### Additional Endpoints
- ✅ **POST** `/api/notifications/merge-device` - Merge device when user logs in
- ✅ **POST** `/api/notifications/:id/seen` - Mark notification as seen

---

## 📡 API Endpoints

### 1. Device Subscription Management

#### Subscribe Device
**POST** `/api/notifications/subscribe-device`

Subscribe a device for push notifications (supports both anonymous and authenticated users).

**Headers:**
- `Authorization: Bearer <token>` (optional)

**Body:**
```json
{
  "deviceToken": "onesignal_player_id_123",
  "tenantContext": "tenant_main"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device subscribed successfully",
  "data": {
    "id": "uuid",
    "device_token": "onesignal_player_id_123",
    "user_id": "user_123",
    "tenant_context": "tenant_main",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "action": "created"
}
```

#### Merge Device Subscription
**POST** `/api/notifications/merge-device`

Merge anonymous device subscription when user logs in.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Body:**
```json
{
  "deviceToken": "onesignal_player_id_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device subscription merged successfully",
  "merged": true
}
```

### 2. Send Notifications

#### Universal Send Endpoint
**POST** `/api/notifications/send`

Send any type of notification to a user.

**Headers:**
- `Authorization: Bearer <token>` (optional)

**Body:**
```json
{
  "userId": "user_123",
  "eventType": "chat_request",
  "message": "Someone wants to chat about your listing.",
  "link": "https://platform.com/entity/123/chat",
  "tenantContext": "tenant_main",
  "eventPayload": {
    "entity_id": "entity_123",
    "requester_id": "user_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "id": "notification_uuid",
    "user_id": "user_123",
    "event_type": "chat_request",
    "message": "Someone wants to chat about your listing.",
    "link": "https://platform.com/entity/123/chat",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "pushSent": true
}
```

#### Chat Request Notification
**POST** `/api/notifications/chat-request`

Specialized endpoint for chat requests to entity owners.

**Headers:**
- `Authorization: Bearer <token>` (optional)

**Body:**
```json
{
  "entityId": "entity_123",
  "chatUrl": "https://platform.com/entity/123/chat"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat request notification sent to owner",
  "data": {
    "id": "notification_uuid",
    "user_id": "owner_123",
    "event_type": "chat_request",
    "message": "Someone wants to chat about your vehicle listing.",
    "link": "https://platform.com/entity/123/chat"
  },
  "pushSent": true
}
```

### 3. Notification Preferences

#### Get User Preferences
**GET** `/api/notifications/preferences`

Get user's notification preferences.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "preferences": {
    "chat_requests": true,
    "attribute_updates": true,
    "reminders": true,
    "marketing": false
  },
  "userId": "user_123"
}
```

#### Update User Preferences
**POST** `/api/notifications/preferences`

Update user's notification preferences.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Body:**
```json
{
  "preferences": {
    "chat_requests": true,
    "attribute_updates": false,
    "reminders": true,
    "marketing": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "id": "pref_uuid",
    "user_id": "user_123",
    "preferences": {
      "chat_requests": true,
      "attribute_updates": false,
      "reminders": true,
      "marketing": false
    }
  }
}
```

### 4. Notification History

#### Get Notification History
**GET** `/api/notifications/history?page=1&limit=20`

Get user's notification history with pagination.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notification_uuid",
      "event_type": "chat_request",
      "message": "Someone wants to chat about your listing.",
      "link": "https://platform.com/entity/123/chat",
      "event_payload": {
        "entity_id": "entity_123",
        "requester_id": "user_456"
      },
      "seen": false,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "has_more": false
  },
  "userId": "user_123"
}
```

#### Mark Notification as Seen
**POST** `/api/notifications/:id/seen`

Mark a specific notification as seen.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as seen",
  "data": {
    "id": "notification_uuid",
    "seen": true,
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 5. Testing

#### Test Notification
**POST** `/api/notifications/test`

Send a test notification to the authenticated user.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "data": {
    "id": "notification_uuid",
    "event_type": "test",
    "message": "This is a test notification from your notification system.",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "pushSent": true
}
```

---

## 🗄️ Database Schema

### `mtcli_push_subscriptions`
Stores device push subscription information.

```sql
CREATE TABLE mtcli_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_token TEXT NOT NULL,
  user_id TEXT,
  tenant_context TEXT NOT NULL,
  subscription_data JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);
```

### `mtcli_notification_preferences`
Stores user notification preferences.

```sql
CREATE TABLE mtcli_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  tenant_context TEXT NOT NULL,
  preferences JSONB DEFAULT '{
    "chat_requests": true,
    "attribute_updates": true,
    "reminders": true,
    "marketing": false
  }'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `mtcli_notifications`
Stores all notifications (existing table, enhanced).

```sql
CREATE TABLE mtcli_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  device_token TEXT,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  event_payload JSONB DEFAULT '{}'::JSONB,
  tenant_context TEXT,
  seen BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

---

## 🌐 OneSignal Integration

### Environment Variables Required
```bash
ONESIGNAL_API_KEY=your_api_key
ONESIGNAL_APP_ID=your_app_id
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### OneSignal Payload Structure
```json
{
  "app_id": "your_app_id",
  "include_player_ids": ["player_id_1", "player_id_2"],
  "headings": { "en": "Notification" },
  "contents": { "en": "Your notification message" },
  "data": {
    "entity_id": "entity_123",
    "chat_url": "https://platform.com/chat/123",
    "link": "https://platform.com/entity/123/chat"
  },
  "url": "https://platform.com/entity/123/chat"
}
```

---

## 🔍 Usage Examples

### Frontend Integration

#### Subscribe Device on Page Load
```javascript
// Subscribe device when page loads
const subscribeDevice = async () => {
  const response = await fetch('/api/notifications/subscribe-device', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}` // Optional
    },
    body: JSON.stringify({
      deviceToken: oneSignalPlayerId,
      tenantContext: 'tenant_main'
    })
  });
  
  const result = await response.json();
  console.log('Device subscribed:', result);
};
```

#### Trigger Chat Request
```javascript
// When user clicks "Chat with Owner"
const requestChat = async (entityId) => {
  const chatUrl = `https://platform.com/entity/${entityId}/chat`;
  
  const response = await fetch('/api/notifications/chat-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}` // Optional
    },
    body: JSON.stringify({
      entityId: entityId,
      chatUrl: chatUrl
    })
  });
  
  const result = await response.json();
  console.log('Chat request sent:', result);
};
```

---

## 🔧 Service Architecture

### NotificationService Class
- **Database Integration**: Direct Supabase integration
- **OneSignal Integration**: HTTP API calls
- **Error Handling**: Comprehensive error responses
- **Logging**: Automatic interaction logging
- **Health Checks**: Service health monitoring

### Key Features
- **Anonymous Support**: Works with anonymous visitors
- **User Merging**: Seamless transition from anonymous to authenticated
- **Preferences**: User-configurable notification settings
- **History Tracking**: Complete notification audit trail
- **Multi-tenant**: Full tenant isolation
- **Scalable**: Designed for high-volume usage

---

## 📞 Support

For issues or questions about the notification system:
1. Check the health endpoint: `/health`
2. Review the logs in the interaction_logs table
3. Test with the `/api/notifications/test` endpoint
4. Verify OneSignal configuration in environment variables

---

**Status**: ✅ **FULLY IMPLEMENTED AND READY FOR USE**

All endpoints from the original requirements have been implemented and are ready for production use.
