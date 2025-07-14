# 📊 Interaction Logging

This document outlines how all user behavior and system interactions are captured through a single, typed logging structure. These logs power analytics, event-based notifications, and per-tenant dashboards.

---

## 🧱 Unified Log Model

Table: `mtcli_interactions` (accessed as `interactionLogs`)

| Field           | Type     | Notes                                             |
|-----------------|----------|---------------------------------------------------|
| `id`            | UUID     | Unique per log                                    |
| `user_id`       | Text     | User ID or 'anonymous'                           |
| `entity_id`     | UUID     | Related entity (optional)                        |
| `event_type`    | Text     | Event type identifier                            |
| `event_payload` | JSONB    | Metadata (filters used, channel, attribute name) |
| `tenant_context`| Text     | Tag for tenant isolation                         |
| `timestamp`     | DateTime | When event was recorded                          |

**Note**: `visitorToken` is not currently implemented. Anonymous users are logged with `user_id: 'anonymous'`.

---

## 🧩 Event Types

**Currently Implemented**:
- `entity_created` → Entity created by user
- `entity_viewed` → Entity accessed/viewed
- `entity_updated` → Entity modified
- `entity_deleted` → Entity soft-deleted
- `otp_verification_success` → Successful OTP login
- `user_logout` → User logged out
- `attribute_info_requested` → Attribute information requested
- `custom_event` → Manual interaction logging

**Common Event Types** (can be logged via API):
- `visit_main` → User loads main entity listing page
- `visit_entity` → Direct visit to an entity by ID
- `entities_searched` → Search performed
- `share_entity` → Entity URL copied or distributed
- `contact_owner` → Click "Chat Owner" or similar action

---

## 💡 Example Log Entry

{
  "event_type": "entity_viewed",
  "entity_id": "xyz456",
  "user_id": "user@example.com",
  "tenant_context": "default",
  "event_payload": {
    "source": "direct",
    "referrer": "search"
  },
  "timestamp": "2025-07-09T12:33:00Z"
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
- View counts and interaction patterns

**API Endpoints**:
- `GET /api/entities/:id/logs` - Get logs for specific entity (owners only)
- `GET /api/my/interactions` - Get user's own interaction history

---

## 🔐 Access Control & Security

**Current Implementation**:
- API-level access control (not RLS)
- Users can view their own interaction history
- Entity owners can view logs for their entities only
- Tenant isolation via `tenant_context` field

**API Endpoints**:

### Get My Interactions
GET /api/my/interactions?page=1&limit=50&event_type=entity_viewed  
Authorization: Bearer {JWT}

### Get Entity Logs (Owner Only)
GET /api/entities/:id/logs?page=1&limit=50&event_type=entity_viewed  
Authorization: Bearer {JWT}

### Manual Log Interaction
POST /api/interaction_logs  
Authorization: Bearer {JWT} (optional)

```json
{
  "eventType": "custom_event",
  "entityId": "entity-uuid",
  "eventPayload": {
    "custom_data": "value",
    "source": "manual"
  }
}
```

---

## 🧙 Integration Notes

- Key APIs automatically log interactions (entity creation, viewing, updates)
- Manual logging available via `/api/interaction_logs` endpoint
- Sentry integration for error tracking on failed log operations
- Tenant isolation ensures data separation
- Universal CLI can use these events to contextualize patterns

---

## 🚧 Current Implementation Status

**Implemented Features**:
- ✅ Unified interaction logging system
- ✅ Automatic logging for key entity operations
- ✅ Manual interaction logging API
- ✅ User interaction history endpoint
- ✅ Entity-specific logs for owners
- ✅ Tenant isolation and access control
- ✅ Pagination support for log queries
- ✅ Event filtering by type
- ✅ Sentry integration for error tracking

**Database Integration**:
- Table: `mtcli_interactions`
- Service: `DatabaseService.logInteraction()`
- Automatic logging in entity operations
- Error handling and monitoring

**Pending Features**:
- ⏳ Visitor token support for anonymous session tracking
- ⏳ Row Level Security (RLS) implementation
- ⏳ Aggregation views for analytics
- ⏳ Scheduled reporting system
- ⏳ Advanced analytics dashboard
- ⏳ Event-based notification triggers
- ⏳ Bulk log operations
- ⏳ Log retention policies

