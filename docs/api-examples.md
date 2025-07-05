# 🧰 API Endpoint Examples

This guide provides usage-ready examples of all major API endpoints to help developers integrate features quickly and confidently.

---

## 🔐 Authentication (OTP Phase)

### Request OTP

POST /auth/request-otp

{
  "email": "user@example.com"
}

---

### Verify OTP

POST /auth/verify-otp

{
  "email": "user@example.com",
  "code": "543210"
}

---

### Get Profile

GET /user/profile  
Authorization: Bearer {JWT}

---

## 🧱 Entities

### Create Entity

POST /entities  
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

### Update Entity

PATCH /entities/:id  
Authorization: Bearer {JWT}

{
  "attributes": {
    "color": "Blue",
    "custom_note": "Now available weekdays"
  }
}

---

## 📁 Images

### Upload Image

POST /entity/:id/upload-image  
FormData:  
- image file  
- metadata: { label, tenantId }

---

### Get Images

GET /entity/:id/images

---

## 📬 Attribute Requests

### Anonymous Request

POST /attribute-requests

{
  "entityId": "xyz123",
  "attribute": "price",
  "visitorToken": "abc456"
}

---

### Logged User Request

POST /attribute-requests  
Authorization: Bearer {JWT}

{
  "entityId": "xyz123",
  "attribute": "year"
}

---

## 📣 Notifications

### Subscribe Device

POST /notifications/subscribe-device

{
  "deviceToken": "push-xyz789",
  "tenantContext": "main"
}

---

### Merge Device to User

POST /notifications/merge-device

{
  "deviceToken": "push-xyz789",
  "userId": "clerk-id-123"
}

---

### Get User Notifications

GET /notifications/user/:id  
Authorization: Bearer {JWT}

---

## 📊 Logging

### Log Interaction

POST /interaction_logs

{
  "eventType": "visit_entity",
  "entityId": "abc123",
  "userId": "clerk-id-456",
  "tenantContext": "tenant_xyz",
  "eventPayload": {
    "source": "direct"
  }
}

---

## 🏢 Multi-Tenant Queries

### Global View

GET /entities?global=true

---

### Tenant Scope

GET /entities?tenant=tenant_xyz

---

### Owner Dashboard

GET /my/entities  
GET /my/interactions  
GET /entity/:id/attribute-requests
