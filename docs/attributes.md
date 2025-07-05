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

POST /attribute-requests

Visitor:
{
  "entityId": "123",
  "attribute": "price",
  "visitorToken": "abc456"
}

Logged User:
{
  "entityId": "123",
  "attribute": "year"
}

---

### Request Button Logic

Displayed when:
- Attribute is missing (null)
- Attribute = `"NA"`
- Attribute = empty string ("")

---

## 📬 Owner Visibility

GET /entity/:id/attribute-requests  
Authorization: Bearer {JWT}

Returns:
- List of requested fields
- Requester ID or visitor token
- Timestamp

Used to prompt fulfillment or delay response as needed.

---

## 🔔 Fulfillment Trigger

PATCH /entities/:id  
Authorization: Bearer {JWT}

Updating a previously requested field will:
- Log `update_attribute` event
- Send push notification (if requestor registered device)
- Mark field status as “resolved” (optional)

---

## 🧠 Smart Filtering

GET /entities/search?filter=category:vehicle&price[min]=10000

- Filters based on active attribute values
- `"NA"` fields are ignored
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

