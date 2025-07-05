# 🧩 Entities Module

This document defines how entities are created, structured, stored, and retrieved across the system. Entities are modular JSONB objects representing things like vehicles, properties, or other categorized items.

---

## 📦 Entity Model Overview

- Each entity belongs to a category (`entityType`)
- Attributes are stored as a JSONB object
- Includes metadata like `tenantId`, `ownerId`, timestamps
- Supports base attributes, user-defined fields, and `NA` status

---

## 🛠️ API Endpoints

### Create Entity

POST /entities  
Authorization: Bearer {JWT}

Payload:

{
  "entityType": "vehicle",
  "tenantId": "tenant_main",
  "attributes": {
    "color": null,
    "year": "2021",
    "price": "25000",
    "custom_notes": "Battery replaced recently"
  }
}

---

### Retrieve Entity

GET /entities/:id  
Returns full entity including category type, attributes, shareable link, and image metadata

---

### Update Entity

PATCH /entities/:id  
Authorization: Bearer {JWT}

Payload:

{
  "attributes": {
    "color": "Blue",
    "custom_notes": "Available on weekends"
  }
}

---

### Delete Entity (optional endpoint)

DELETE /entities/:id  
Authorization: Bearer {JWT}  
Soft-delete recommendation: mark `disabled: true`

---

## 🧬 Schema Syncing via Category

- Base schema defined per `entityType` (see categories.md)
- On base schema update, all entities of that type can auto-sync
- Attributes not in base schema persist as custom extensions

---

## 📁 Image Handling

### Upload Image

POST /entity/:id/upload-image  
Authorization: Bearer {JWT}  
Payload: FormData (image + optional metadata)

CDN options: Supabase Storage, S3, or Cloudflare R2

---

### Retrieve Images

GET /entity/:id/images  
Returns all uploaded images and metadata

---

## 🔎 Search & Filtering

GET /entities/search?category=vehicle&price[min]=15000&year[max]=2022  
Supports:

- Category-based filtering
- Smart filters based on present attributes
- Range filtering for numeric/date fields
- Full-text search (if enabled)

---

## 🧠 Notes

- `attributes` can contain empty, `null`, or `"NA"` values
- Shareable URLs allow public access (view-only)
- Entities include `tenantId` for scoped queries
- Ownership linked via `ownerId` (Clerk ID if available)

---

## 🧰 Future Enhancements

- Expiry or validity check reminder
- Optional moderation or approval step before publish
- Flagging system for outdated info (e.g. item sold)

