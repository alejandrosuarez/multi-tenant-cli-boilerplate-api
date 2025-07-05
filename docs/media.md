# 🖼️ Media & CDN Module

This document outlines how uploaded images and media files are stored, retrieved, and linked to entities. It supports tenant-specific organization, metadata enrichment, and scalable access via CDN.

---

## 📁 Upload Flow

POST /entity/:id/upload-image  
Authorization: Bearer {JWT}  
Payload: FormData with:

- `file`: image file (jpg, png, webp)
- `label`: optional descriptor (e.g. `front_view`)
- `tenantId`: context for storage separation

Stored in: `/cdn/{tenantId}/{entityId}/images/{uuid}`

Metadata stored in DB:

- `entityId`
- `tenantId`
- `fileType`
- `label`
- `fileURL`
- `uploadedAt`

---

## 📷 Retrieve Images

GET /entity/:id/images  
Returns all images for an entity with metadata

GET /cdn/tenant_xyz/images  
Returns image folder contents for tenant dashboard

---

## 📦 Storage Provider Options

- Supabase Storage
- Amazon S3
- Cloudflare R2

Requires:
- Bucket setup per environment
- Public access URL configuration
- API key or signed token if required

Env Variables:

SUPABASE_URL=  
SUPABASE_ANON_KEY=  
SUPABASE_STORAGE_BUCKET=  
API_BASE_URL=

---

## 🧠 CDN Logic

- Image URLs are generated and cached
- Linked directly to entities
- Can be displayed in portals with fallback placeholder
- Optional signed URLs or token gates for restricted access

---

## 🧩 Image Metadata Enhancements

Each upload may include:

- Dimensions (height, width)
- File size
- Label (manual or auto-tag)
- Image type
- Optional EXIF (camera data)

Future Ideas:
- AI-generated tag suggestions
- Duplicate detection or cleanup helpers

---

## 🛑 File Rules

- Max size: 5MB (configurable)
- Accepted types: jpg, jpeg, png, webp
- Filename normalization enforced
- No video/audio in current phase

---

## 🧙 Universal CLI Integration

Universal can assist by:

- Drafting upload and retrieval endpoints
- Structuring CDN paths per tenant
- Suggesting preview logic for frontend use

