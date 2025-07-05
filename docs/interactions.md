# 📊 Interaction Logging

This document outlines how all user behavior and system interactions are captured through a single, typed logging structure. These logs power analytics, event-based notifications, and per-tenant dashboards.

---

## 🧱 Unified Log Model

Table: `interaction_logs`

| Field         | Type     | Notes                                             |
|---------------|----------|---------------------------------------------------|
| `id`          | UUID     | Unique per log                                    |
| `userId`      | UUID     | Clerk user or null (anonymous)                   |
| `visitorToken`| Text     | If anonymous, used to identify sessions          |
| `entityId`    | UUID     | Related entity                                   |
| `eventType`   | Enum     | See below                                         |
| `eventPayload`| JSONB    | Metadata (filters used, channel, attribute name) |
| `tenantContext`| Text    | Tag for portal or subdomain                      |
| `timestamp`   | DateTime | When event was recorded                          |

---

## 🧩 Event Types

- `visit_main` → User loads main entity listing page
- `visit_entity` → Direct visit to an entity by ID
- `request_attribute` → Attribute request initiated
- `share_entity` → Entity URL copied or distributed
- `contact_owner` → Click “Chat Owner” or similar action
- `update_attribute` → Field filled after request
- `subscribe_device` → Notification registration via push
- `merge_device_user` → Visitor device paired with Clerk user

---

## 💡 Example Log Entry

{
  "eventType": "visit_entity",
  "entityId": "xyz456",
  "userId": "clerk-id-123",
  "tenantContext": "tenant_alpha",
  "eventPayload": {
    "source": "direct"
  },
  "timestamp": "2025-07-04T12:33:00Z"
}

---

## 🧪 Usage Scenarios

- Analytics engine can:
  - Count most viewed entities
  - Rank most requested attributes
  - Compare logged vs anonymous usage
  - Track engagement rate across tenants

- Notification logic can:
  - Trigger follow-ups after key events
  - Resurface reminders based on inactivity

---

## 🧑‍💼 Owner Visibility

Entity owners can see:
- Which attributes were requested on their entities
- Who interacted with their items (if logged)
- A history of updates and responses

---

## 🔐 Access Control & RLS

- Supabase Row-Level Security ensures:
  - Users only see their own logs (unless admin)
  - Tenants can see logs scoped to their entities

Logged users → view logs via:

GET /my/interactions  
GET /entity/:id/logs

---

## 🧙 Integration Notes

- All APIs insert to `interaction_logs` automatically
- Scheduled reports may use aggregation views
- Universal CLI can use these events to contextualize patterns

