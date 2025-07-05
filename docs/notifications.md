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

POST /notifications/subscribe-device

Payload:
{
  "deviceToken": "xyz987",
  "tenantContext": "tenant_main"
}

Stores token + context without userId.

---

### Logged-In User

Clerk session detected → deviceToken linked to userId

Stored:
{
  "deviceToken": "xyz987",
  "userId": "clerk-uuid-123",
  "tenantContext": "tenant_xyz"
}

---

## 🔄 Merge Logic (Visitor → User)

POST /notifications/merge-device

Payload:
{
  "deviceToken": "xyz987",
  "userId": "clerk-uuid-123"
}

Effect:
- Previous notifications linked to device are now visible in user dashboard
- Future push messages sent using userId and deviceToken

---

## 📣 Generic Notification Trigger

Use this universal endpoint to notify a user with a contextual message and optional link.

POST /notifications/send

Payload:
{
  "userId": "clerk-xyz-789",
  "eventType": "chat_request",
  "message": "Someone wants to chat about your listing.",
  "link": "https://platform.com/entity/123/chat",
  "tenantContext": "tenant_main"
}

- Stores as notification in DB
- Delivers via push and/or feed
- Supports flexible use cases: chat, reminders, data requests, etc.

---

## 📥 Notification Storage

Table: `notifications`

| Field          | Type     | Notes                                           |
|----------------|----------|-------------------------------------------------|
| `id`           | UUID     | Unique per notification                         |
| `userId`       | UUID     | Clerk user, null for visitors                   |
| `deviceToken`  | Text     | For push delivery                               |
| `eventType`    | Text     | E.g. `attribute_filled`, `chat_pending`, `reminder` |
| `message`      | Text     | Visible message to user                         |
| `link`         | Text     | Optional link included in notification          |
| `eventPayload` | JSONB    | Additional context                              |
| `tenantContext`| Text     | Origin context of trigger                       |
| `timestamp`    | DateTime | When it was created                             |
| `seen`         | Boolean  | Whether the user has viewed this notification   |

---

## ⏰ Reminder Triggers

Scheduled logic generates reminders for specific cases:

- `attribute_pending`: owner hasn’t filled requested field
- `entity_checkin`: item hasn’t been updated in a while
- `attribute_fulfilled`: requester notified when field is added
- `chat_pending`: follow-up needed in owner/requester dialogue

These run via cron job or Supabase scheduled function.

---

## 📊 Analytics Queries

Use logs and database views to analyze:

- Most active entities
- Notification volume per tenant
- Ratio of seen/unseen events
- Reminder response rates

---

## 🧙 Env Variables Required

ONESIGNAL_API_KEY=  
ONESIGNAL_APP_ID=  
CLERK_JWKS_URL=  
SUPABASE_URL=  
API_TOKEN=
