# 🧩 Entities Module

This document defines how entities are created, structured, stored, and retrieved across the system. Entities are modular JSONB objects representing things like vehicles, properties, or other categorized items.

---

## 📦 Entity Model Overview

- Each entity belongs to a category (`entity_type`)
- Attributes are stored as a JSONB object
- Includes metadata like `tenant_id`, `owner_id`, timestamps
- Supports base attributes, user-defined fields
- Includes `public_shareable` flag and `share_token` for public access
- Soft delete support via `disabled` flag

---

## 🛠️ API Endpoints

### Create Entity

POST /api/entities  
Authorization: Bearer {JWT}

Payload:

{
  "entity_type": "vehicle",
  "attributes": {
    "color": null,
    "year": "2021",
    "price": "25000",
    "custom_notes": "Battery replaced recently"
  },
  "public_shareable": true
}

**Note**: `tenant_id` is automatically determined from the authenticated user's context.

---

### Retrieve Entity

GET /api/entities/:id  
Authorization: Bearer {JWT} (optional for public entities)

Returns full entity including category type, attributes, share token, and metadata.

### Get Entity by Share Token

GET /api/shared/:shareToken  
Public access to shared entities without authentication.

---

### Update Entity

PATCH /api/entities/:id  
Authorization: Bearer {JWT}

Payload:

{
  "attributes": {
    "color": "Blue",
    "custom_notes": "Available on weekends"
  },
  "public_shareable": false
}

**Security**: Only entity owners can update their entities.

---

### Delete Entity

DELETE /api/entities/:id  
Authorization: Bearer {JWT}  

Performs soft-delete by marking entity as disabled.

**Security**: Only entity owners can delete their entities.

### List Entities

GET /api/entities?page=1&limit=20&category=vehicle  
Authorization: Bearer {JWT} (optional)

Supports pagination and filtering by category and attributes.

### Advanced Search

GET /api/entities/search?q=blue&category=vehicle&price[min]=20000&include_images=true  
Authorization: Bearer {JWT} (optional)

Advanced search with text query, range filters, and optional image inclusion.

### Get My Entities

GET /api/my/entities?page=1&limit=20  
Authorization: Bearer {JWT}

Returns entities owned by the authenticated user.

---

## 🧬 Schema Syncing via Category

- Base schema defined per `entity_type` in `mtcli_entity_categories` table
- Entity creation merges base schema with provided attributes
- Attributes not in base schema persist as custom extensions
- Category validation ensures only valid entity types are created

### Get Available Categories

GET /api/categories  
Authorization: Bearer {JWT} (optional)

Returns all available entity categories with their base schemas.

### Get Entities by Category

GET /api/categories/:category/entities?include_images=true  
Authorization: Bearer {JWT} (optional)

Returns all entities in a specific category.

---

## 📁 Image Handling

### Upload Images

POST /api/entities/:id/images  
Authorization: Bearer {JWT}  
Content-Type: multipart/form-data

FormData:
- image files (multiple supported)
- label: "front_view" (optional)
- is_fallback: true/false (optional)

**Features**:
- Automatic image optimization (4 sizes: thumbnail, small, medium, large)
- Supabase Storage integration
- Only entity owners can upload images

### Retrieve Images

GET /api/entities/:id/images?size=medium  
Authorization: Bearer {JWT} (optional for public entities)

Returns all uploaded images with optimized URLs for requested size.

### Delete Image

DELETE /api/images/:id  
Authorization: Bearer {JWT}

Only the user who uploaded the image can delete it.

---

## 🔎 Search & Filtering

GET /api/entities/search?category=vehicle&price[min]=15000&year[max]=2022&q=blue&sort_by=created_at&sort_order=desc  

**Supported Features**:
- Category-based filtering (`category=vehicle`)
- Range filtering for numeric fields (`price[min]=15000`, `price[max]=30000`)
- Text search query (`q=search term`)
- Sorting (`sort_by=created_at`, `sort_order=desc`)
- Image inclusion (`include_images=true`)
- Pagination (`page=1`, `limit=20`)

**Filter Examples**:
- Exact match: `make=Toyota`, `color=blue`
- Range filters: `price[min]=10000`, `year[max]=2023`
- Combined: `make=Toyota&year=2020&price[min]=15000`

---

## 🧠 Implementation Notes

- `attributes` can contain empty, `null` values
- Shareable URLs via `share_token` allow public access (view-only)
- Entities include `tenant_id` for multi-tenant scoping
- Ownership linked via `owner_id` (user ID from authentication)
- Access control enforced at API layer
- Interaction logging for entity views and operations

## 📊 Analytics & Logging

### Get Entity Logs

GET /api/entities/:id/logs?event_type=entity_viewed  
Authorization: Bearer {JWT}

Returns interaction logs for a specific entity (entity owners only).

---

## 🚧 Current Implementation Status

**Implemented Features**:
- ✅ Full CRUD operations for entities
- ✅ Multi-tenant architecture with tenant isolation
- ✅ Category-based entity types with base schemas
- ✅ Advanced search and filtering
- ✅ Image upload and optimization (4 sizes)
- ✅ Public sharing via share tokens
- ✅ Owner-based access control
- ✅ Interaction logging and analytics
- ✅ Pagination support
- ✅ Soft delete functionality

**Database Tables**:
- `mtcli_entities` - Main entity storage
- `mtcli_entity_categories` - Entity type definitions
- `mtcli_images` - Image metadata and URLs
- `mtcli_interactions` - Activity logging

## 🧰 Future Enhancements

- ⏳ Expiry or validity check reminders
- ⏳ Moderation or approval workflow
- ⏳ Flagging system for outdated information
- ⏳ Full-text search optimization
- ⏳ Bulk operations support
- ⏳ Entity versioning/history
- ⏳ Advanced analytics dashboard

