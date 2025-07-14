# 🧬 Attributes Module

Attributes represent the structured or custom fields attached to each entity. This module defines how they behave, how requests are handled, and how updates trigger system-wide responses.

---

## 🧱 Storage Model

- Stored inside `attributes` JSONB field within each entity
- Includes:
  - Base attributes from category schema
  - User-defined fields (custom extensions)
  - Empty values (`null`)
  - `"NA"` status for explicitly unknown info

Example:
{
  "year": "2020",
  "price": null,
  "color": "NA",
  "notes": "Available weekends"
}

---

## ⚙️ Schema Definition

Each `entityType` (category) defines its base schema.

Categories include:
- `id`
- `name`
- `baseSchema`: predefined attributes (e.g., `price`, `mileage`, `brand`)

Updates to base schema cascade via sync service or function.

---

## 🛠 Attribute Request System

### Request Flow

POST /api/request-attribute  
Authorization: Bearer {JWT} (required)

{
  "entityId": "123",
  "attribute": "price"
}

**Note**: Only authenticated users can request attribute information. Anonymous requests are not currently supported.

---

### Request Button Logic

Displayed when:
- Attribute is missing (null)
- Attribute = empty string ("")

**Note**: The system validates that the attribute exists in the entity schema and is actually empty before allowing requests.

---

## 📬 Owner Visibility

GET /api/entities/:id/logs?event_type=attribute_info_requested  
Authorization: Bearer {JWT}

Returns:
- List of interaction logs for attribute requests
- Requester ID
- Timestamp
- Event payload with attribute details

**Note**: Attribute requests are logged as interactions and can be viewed through the entity logs endpoint. Only entity owners can view these logs.

---

## 🔔 Fulfillment Trigger

PATCH /api/entities/:id  
Authorization: Bearer {JWT}

Updating a previously requested field will:
- Log `update_attribute` event
- Send push notification (if requestor registered device)
- Mark field status as “resolved” (optional)

---

## 🧠 Smart Filtering

GET /api/entities/search?category=vehicle&price[min]=10000

- Filters based on active attribute values
- Empty and null fields are handled appropriately in search
- Entities missing attribute can be queried separately if needed

---

## 📉 Analytics

You can query:
- Most requested attributes
- Average time to fulfill requests
- Request/response ratios by tenant
- Abandoned fields (never filled)

---

## 🧙 Integration Notes

- Works seamlessly with notifications, logs, and reminders
- Attributes are decoupled from rigid schemas—flexible by design
- Universal CLI can assist in generating dynamic filtering code or request logic

---

## 🚧 Current Implementation Status

**Implemented Features:**
- ✅ JSONB attribute storage in entities
- ✅ Base schema from entity categories
- ✅ Attribute request system (`POST /api/request-attribute`)
- ✅ Email notifications to entity owners
- ✅ Rate limiting for attribute requests
- ✅ Validation of attribute existence and emptiness
- ✅ Interaction logging for attribute requests
- ✅ Advanced search with attribute filtering

**Pending Features:**
- ⏳ Push notifications for attribute fulfillment
- ⏳ Dedicated attribute request tracking (currently uses interaction logs)
- ⏳ "NA" status handling (currently only handles null and empty strings)
- ⏳ Analytics dashboard for attribute request patterns

