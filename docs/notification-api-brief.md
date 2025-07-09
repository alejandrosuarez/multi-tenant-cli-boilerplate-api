# 🔔 Notification API - Brief Technical Guide

## Base URL
- **Local**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## 📡 Available Endpoints

### 1. Device Subscription
**POST** `/api/notifications/subscribe-device`
- **Purpose**: Subscribe device for push notifications
- **Auth**: Optional (works for anonymous users)
- **Body**: `{"deviceToken": "player_id", "tenantContext": "default"}`

### 2. Send Notification
**POST** `/api/notifications/send`
- **Purpose**: Send push notification to user
- **Auth**: Optional
- **Body**: `{"userId": "user_id", "eventType": "type", "message": "text", "link": "url"}`

### 3. Chat Request
**POST** `/api/notifications/chat-request`
- **Purpose**: Notify entity owner about chat request
- **Auth**: Optional
- **Body**: `{"entityId": "entity_id", "chatUrl": "chat_url"}`

### 4. User Preferences
**GET** `/api/notifications/preferences` - Get preferences (Auth required)
**POST** `/api/notifications/preferences` - Update preferences (Auth required)
- **Body**: `{"preferences": {"chat_requests": true, "marketing": false}}`

### 5. Notification History
**GET** `/api/notifications/history?page=1&limit=20` - Get history (Auth required)
**POST** `/api/notifications/:id/seen` - Mark as seen (Auth required)

### 6. Testing
**POST** `/api/notifications/test` - Send test notification (Auth required)

## 🔑 Authentication
Include for authenticated endpoints:
```
Authorization: Bearer <token>
```

## 📝 Common Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pushSent": true
}
```

## 🌐 Environment Variables
```bash
ONESIGNAL_API_KEY=your_api_key
ONESIGNAL_APP_ID=your_app_id
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

## 🔍 Quick Usage Examples

### Subscribe Device
```bash
curl -X POST /api/notifications/subscribe-device \
  -H "Content-Type: application/json" \
  -d '{"deviceToken": "player_123", "tenantContext": "default"}'
```

### Send Chat Request
```bash
curl -X POST /api/notifications/chat-request \
  -H "Content-Type: application/json" \
  -d '{"entityId": "entity_123", "chatUrl": "https://site.com/chat"}'
```

### Test Notification
```bash
curl -X POST /api/notifications/test \
  -H "Authorization: Bearer <token>"
```

## 🚀 Key Features
- ✅ Anonymous user support
- ✅ Multi-tenant architecture
- ✅ OneSignal integration
- ✅ User preferences
- ✅ Notification history
- ✅ Device merging on login
- ✅ Real-time push notifications

## 📊 Database Tables
- `mtcli_push_subscriptions` - Device subscriptions
- `mtcli_notification_preferences` - User preferences
- `mtcli_notifications` - Notification history

## 🏥 Health Check
**GET** `/health` - Check service status

---

**Status**: ✅ **FULLY IMPLEMENTED** - All endpoints are ready for production use.

For complete documentation see: `./docs/notification-api.md`
