# 🧰 API Endpoint Examples

This guide provides usage-ready examples of all major API endpoints to help developers integrate features quickly and confidently.

---

## 🔐 Authentication (OTP Phase)

### Send OTP

POST /api/auth/send-otp

{
  "email": "user@example.com",
  "tenantId": "default"
}

---

### Verify OTP

POST /api/auth/verify-otp

{
  "email": "user@example.com",
  "otp": "543210",
  "tenantId": "default"
}

---

### Get Current User Profile

GET /api/auth/me  
Authorization: Bearer {JWT}

---

### Logout

POST /api/auth/logout  
Authorization: Bearer {JWT}

---

## 🧱 Entities

### Create Entity

POST /api/entities  
Authorization: Bearer {JWT}

{
  "entityType": "vehicle",
  "tenantId": "tenant_main",
  "attributes": {
    "price": "25000",
    "year": "2021",
    "color": null,
    "custom_note": "Great condition"
  }
}

---

### Get Entity by ID

GET /api/entities/:id  
Authorization: Bearer {JWT} (optional)

---

### Update Entity

PATCH /api/entities/:id  
Authorization: Bearer {JWT}

{
  "attributes": {
    "color": "Blue",
    "custom_note": "Now available weekdays"
  }
}

---

### Delete Entity

DELETE /api/entities/:id  
Authorization: Bearer {JWT}

---

### Search Entities

GET /api/entities?page=1&limit=20&entity_type=vehicle  
Authorization: Bearer {JWT} (optional)

---

### Advanced Search

GET /api/entities/search?q=blue&category=vehicle&price[min]=20000&price[max]=30000&include_images=true  
Authorization: Bearer {JWT} (optional)

---

## 📁 Images

### Upload Images to Entity

POST /api/entities/:id/images  
Authorization: Bearer {JWT}  
Content-Type: multipart/form-data

FormData:  
- image files (multiple supported)
- label: "Main photo" (optional)
- is_fallback: true/false (optional)

---

### Get Entity Images

GET /api/entities/:id/images?size=medium  
Authorization: Bearer {JWT} (optional)

---

### Delete Image

DELETE /api/images/:id  
Authorization: Bearer {JWT}

---

## 📬 Attribute Information Requests

### Request Attribute Information

POST /api/request-attribute  
Authorization: Bearer {JWT}

{
  "entityId": "xyz123",
  "attribute": "price"
}

---

## 📣 Notifications

### Subscribe Device for Push Notifications

POST /api/notifications/subscribe-device  
Authorization: Bearer {JWT} (optional)

{
  "deviceToken": "push-xyz789",
  "tenantContext": "main"
}

---

### Merge Device Subscription (when user logs in)

POST /api/notifications/merge-device  
Authorization: Bearer {JWT}

{
  "deviceToken": "push-xyz789"
}

---

### Send Notification

POST /api/notifications/send  
Authorization: Bearer {JWT}

{
  "userId": "user123",
  "eventType": "chat_request",
  "message": "Someone wants to chat about your listing",
  "link": "https://example.com/chat/123",
  "tenantContext": "main",
  "eventPayload": {}
}

---

### Send Chat Request Notification

POST /api/notifications/chat-request  
Authorization: Bearer {JWT} (optional)

{
  "entityId": "xyz123",
  "chatUrl": "https://example.com/chat/xyz123"
}

---

### Get Notification Preferences

GET /api/notifications/preferences  
Authorization: Bearer {JWT}

---

### Update Notification Preferences

POST /api/notifications/preferences  
Authorization: Bearer {JWT}

{
  "preferences": {
    "chat_requests": true,
    "attribute_requests": true,
    "system_updates": false
  }
}

---

### Get Notification History

GET /api/notifications/history?page=1&limit=20  
Authorization: Bearer {JWT}

---

### Mark Notification as Seen

POST /api/notifications/:id/seen  
Authorization: Bearer {JWT}

---

### Test Notification

POST /api/notifications/test  
Authorization: Bearer {JWT}

---

## 📊 Interaction Logging

### Log Interaction

POST /api/interaction_logs  
Authorization: Bearer {JWT} (optional)

{
  "eventType": "visit_entity",
  "entityId": "abc123",
  "eventPayload": {
    "source": "direct"
  }
}

---

### Get My Interactions

GET /api/my/interactions?page=1&limit=50&event_type=visit_entity  
Authorization: Bearer {JWT}

---

### Get Entity Logs (Owner Only)

GET /api/entities/:id/logs?page=1&limit=50  
Authorization: Bearer {JWT}

---

## 🏢 Multi-Tenant & Category Queries

### Get Available Categories

GET /api/categories  
Authorization: Bearer {JWT} (optional)

---

### Get Entities by Category

GET /api/categories/:category/entities?page=1&limit=20&include_images=true  
Authorization: Bearer {JWT} (optional)

---

### Owner Dashboard

GET /api/my/entities?page=1&limit=20  
Authorization: Bearer {JWT}

GET /api/my/interactions?page=1&limit=50  
Authorization: Bearer {JWT}

---

### Public Entity Access (Share Token)

GET /api/shared/:shareToken

---

### Health Check

GET /health

---

### API Root

GET /

---

### Database Setup

POST /api/setup
