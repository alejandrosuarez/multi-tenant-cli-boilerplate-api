# 🖼️ Media & CDN Module

This document outlines how uploaded images and media files are stored, retrieved, and linked to entities. It supports tenant-specific organization, metadata enrichment, and scalable access via CDN.

---

## 📁 Upload Flow

POST /api/entities/:id/images  
Authorization: Bearer {JWT}  
Content-Type: multipart/form-data

FormData:
- `files`: image files (jpg, png, webp) - multiple files supported
- `label`: optional descriptor (e.g. `front_view`)
- `is_fallback`: boolean flag for fallback image

**Storage Path**: `{tenantId}/{entityId}/{imageId}/{filename}`

**Automatic Optimization**: Creates 4 sizes + original:
- `thumbnail`: 150x150px, 80% quality
- `small`: 400x400px, 85% quality  
- `medium`: 800x600px, 90% quality
- `large`: 1200x900px, 95% quality
- `original`: unchanged

**Metadata stored in DB** (`mtcli_images`):
- `entity_id`, `tenant_id`, `uploaded_by`
- `original_name`, `label`, `is_fallback`
- `file_urls`: JSONB with all size URLs
- `created_at`

---

## 📷 Retrieve Images

### Get Entity Images
GET /api/entities/:id/images?size=medium  
Authorization: Bearer {JWT} (optional for public entities)

Returns all images for an entity with optimized URLs for requested size.

**Query Parameters**:
- `size`: thumbnail, small, medium, large (default: medium)

**Response includes**:
- Image metadata (id, label, original name)
- Optimized URL for requested size
- All available sizes and URLs
- Upload information

### Delete Image
DELETE /api/images/:id  
Authorization: Bearer {JWT}

Only the user who uploaded the image can delete it.

---

## 📦 Storage Provider

**Current Implementation**: Supabase Storage

**Features**:
- ✅ Public bucket with 5MB file size limit
- ✅ Automatic bucket initialization
- ✅ Supported formats: JPEG, PNG, WebP
- ✅ Public URL generation
- ✅ Cache control headers (1 hour)

**Environment Variables**:
```
SUPABASE_URL=                    # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=       # Service role key for storage operations
```

**Bucket Configuration**:
- Name: `entity-images`
- Public access: enabled
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

---

## 🧠 CDN & URL Logic

**Current Implementation**:
- ✅ Public URLs generated via Supabase Storage
- ✅ Cache control headers for browser caching
- ✅ Fallback support for failed optimizations
- ✅ Multiple size URLs for responsive images
- ✅ Direct linking to entities

**URL Structure**:
```
https://[supabase-url]/storage/v1/object/public/entity-images/{tenantId}/{entityId}/{imageId}/{filename}
```

**Features**:
- Automatic URL generation for all sizes
- Fallback to original if optimization fails
- Progressive JPEG format for optimized images
- Responsive image support via size parameter

---

## 🧩 Image Metadata & Processing

**Current Metadata**:
- ✅ Original filename and upload timestamp
- ✅ User-provided labels
- ✅ File size for each optimized version
- ✅ Fallback flags for failed optimizations
- ✅ Public URLs for all sizes
- ✅ Entity and tenant associations

**Image Processing** (via Sharp):
- ✅ Automatic resizing with aspect ratio preservation
- ✅ Quality optimization per size
- ✅ Progressive JPEG conversion
- ✅ No upscaling (withoutEnlargement: true)
- ✅ Error handling with fallback to original

**Future Enhancements**:
- ⏳ Dimensions (height, width) extraction
- ⏳ EXIF data preservation/stripping
- ⏳ AI-generated tag suggestions
- ⏳ Duplicate detection
- ⏳ Batch upload support

---

## 🛑 File Rules & Security

**Current Restrictions**:
- ✅ Max size: 5MB per file
- ✅ Accepted types: JPEG, PNG, WebP
- ✅ Multiple files per upload supported
- ✅ Filename normalization with UUID and timestamp
- ✅ No video/audio support

**Security Features**:
- ✅ Entity ownership validation (only owners can upload)
- ✅ Authentication required for uploads
- ✅ Tenant isolation in storage paths
- ✅ File type validation via MIME type
- ✅ Automatic cleanup on upload failures

**File Naming Convention**:
```
{timestamp}_{random}_{size}.{ext}
```
Example: `1704067200000_a1b2c3d4_medium.jpg`

---

## 🧙 Universal CLI Integration

Universal CLI can assist by:
- Drafting upload and retrieval endpoints
- Structuring CDN paths per tenant
- Suggesting preview logic for frontend use
- Optimizing image processing workflows

---

## 🚧 Current Implementation Status

**Implemented Features**:
- ✅ Multi-file upload support
- ✅ Automatic image optimization (4 sizes + original)
- ✅ Supabase Storage integration
- ✅ Public URL generation
- ✅ Entity ownership validation
- ✅ Tenant isolation
- ✅ Error handling with Sentry integration
- ✅ Fallback support for failed optimizations
- ✅ Progressive JPEG conversion
- ✅ Cache control headers
- ✅ Image deletion by uploader

**Database Integration**:
- Table: `mtcli_images`
- Service: `ImageService` class
- Sharp library for image processing
- UUID-based unique identifiers

**API Endpoints**:
- `POST /api/entities/:id/images` - Upload images
- `GET /api/entities/:id/images` - Get entity images
- `DELETE /api/images/:id` - Delete image

**Pending Features**:
- ⏳ Image dimension extraction
- ⏳ EXIF data handling
- ⏳ Batch operations
- ⏳ Image compression analytics
- ⏳ CDN integration (CloudFlare, etc.)
- ⏳ Video/audio support
- ⏳ Image transformation API
- ⏳ Duplicate detection
- ⏳ Storage usage analytics

