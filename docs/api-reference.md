# 🚀 API Reference

Multi-tenant CLI Boilerplate API - Complete endpoint documentation for all tested and ready-to-use endpoints.

**Base URL**: `http://localhost:3000` (local) | `https://multi-tenant-cli-boilerplate-api.vercel.app/` (production)

---

## 🔐 Authentication

### Send OTP
Send a one-time password to user's email for authentication.

```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "test@aspcorpo.com",
  "tenantId": "default"  // optional, defaults to "default"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2025-07-07T16:36:39.098Z"
}
```

**Response (Error)**:
```json
{
  "error": "Email is required"
}
```

---

### Verify OTP & Login
Verify OTP code and receive a persistent authentication token.

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "test@aspcorpo.com",
  "otp": "123456",
  "tenantId": "default"  // optional, defaults to "default"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "user": {
    "email": "test@aspcorpo.com",
    "tenantId": "default"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "persistent",
  "timestamp": "2025-07-07T16:32:20.618Z"
}
```

**Response (Error)**:
```json
{
  "error": "Invalid OTP"
}
```

**⚠️ Important**: Save the `token` - it's required for all authenticated requests and **never expires** until logout.

---

### Get Current User
Get information about the currently authenticated user.

```http
GET /api/auth/me
Authorization: Bearer <your-token>
```

**Response**:
```json
{
  "user": {
    "id": "test@aspcorpo.com",
    "email": "test@aspcorpo.com",
    "tenant": "default",
    "metadata": {}
  },
  "authenticated": true,
  "tokenType": "persistent"
}
```

---

### Logout
Invalidate the current authentication token.

```http
POST /api/auth/logout
Authorization: Bearer <your-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**⚠️ Note**: After logout, the token becomes permanently invalid and cannot be reused.

---

## 🏢 Entity Management

### List Entities
Get a paginated list of entities with optional filtering.

```http
GET /api/entities?page=1&limit=20&category=property&tenant=default
```

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20
- `category` (optional): Filter by entity category
- `tenant` (optional): Filter by tenant ID
- Any other parameters will be used as attribute filters

**Response**:
```json
{
  "entities": [
    {
      "id": "f148c38c-8957-4477-86d0-8bf3834b8523",
      "entity_type": "property",
      "tenant_id": "default",
      "owner_id": "dev-user",
      "attributes": {
        "address": "123 Main St",
        "price": "350000",
        "bedrooms": "3",
        "bathrooms": "2"
      },
      "share_token": "26508f58e1531837692bc126722de37d",
      "public_shareable": true,
      "disabled": false,
      "created_at": "2025-07-05T12:32:05.063+00:00",
      "updated_at": "2025-07-05T12:32:05.063+00:00",
      "mtcli_entity_categories": {
        "id": "646aff41-d134-4aca-b38a-cb2f14d9f852",
        "description": "Houses, apartments, commercial spaces",
        "display_name": "Properties"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "has_more": false
  },
  "filters_applied": {}
}
```

---

### Get Entity by ID
Retrieve a specific entity by its ID.

```http
GET /api/entities/{entity_id}
Authorization: Bearer <your-token>  // optional for public entities
```

**Response**:
```json
{
  "id": "f148c38c-8957-4477-86d0-8bf3834b8523",
  "entity_type": "property",
  "tenant_id": "default",
  "owner_id": "dev-user",
  "attributes": {
    "address": "123 Main St",
    "price": "350000"
  },
  "share_token": "26508f58e1531837692bc126722de37d",
  "public_shareable": true,
  "disabled": false,
  "created_at": "2025-07-05T12:32:05.063+00:00",
  "updated_at": "2025-07-05T12:32:05.063+00:00"
}
```

---

### Create Entity
Create a new entity (requires authentication).

```http
POST /api/entities
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "My Property",
  "category": "property",
  "description": "A beautiful house",
  "attributes": {
    "address": "456 Oak St",
    "price": "450000",
    "bedrooms": "4",
    "bathrooms": "3"
  },
  "public_shareable": true
}
```

**Response (Success)**:
```json
{
  "id": "new-entity-id",
  "entity_type": "property",
  "tenant_id": "default",
  "owner_id": "test@aspcorpo.com",
  "attributes": {
    "address": "456 Oak St",
    "price": "450000",
    "bedrooms": "4",
    "bathrooms": "3"
  },
  "share_token": "generated-share-token",
  "public_shareable": true,
  "disabled": false,
  "created_at": "2025-07-07T16:00:00.000Z",
  "updated_at": "2025-07-07T16:00:00.000Z"
}
```

---

### Update Entity
Update an existing entity (requires authentication and ownership).

```http
PATCH /api/entities/{entity_id}
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "attributes": {
    "price": "475000",
    "description": "Updated description"
  },
  "public_shareable": false
}
```

**Response**: Updated entity object (same format as create)

---

### Delete Entity
Soft delete an entity (requires authentication and ownership).

```http
DELETE /api/entities/{entity_id}
Authorization: Bearer <your-token>
```

**Response**:
```json
{
  "message": "Entity deleted successfully"
}
```

---

### Get My Entities
Get entities owned by the authenticated user.

```http
GET /api/my/entities?page=1&limit=20
Authorization: Bearer <your-token>
```

**Response**: Same format as list entities, but filtered to user's entities only.

---

### Get Shared Entity
Access a publicly shared entity using its share token.

```http
GET /api/shared/{share_token}
```

**Response**: Entity object (same format as get by ID)

---

## 🖼️ Image Management

### Upload Images to Entity
Upload and automatically optimize images for an entity. **Only entity owners can upload images.**

```http
POST /api/entities/:id/images
Authorization: Bearer <your-token>
Content-Type: multipart/form-data

Form Data:
- files: image file (jpg, png, webp, max 5MB) - multiple files supported
- label: optional label (e.g., "front_view", "interior")
```

**Security Requirements**:
- ✅ **Authentication required**: Must be logged in
- ✅ **Ownership required**: Only the entity owner can upload images
- ✅ **Entity must exist**: Entity must exist and be accessible
- ✅ **Tenant isolation**: Respects tenant boundaries

**Response (Success)**:
```json
{
  "success": true,
  "message": "1 image(s) uploaded successfully",
  "images": [
    {
      "id": "image-uuid",
      "urls": {
        "thumbnail": {
          "url": "https://supabase-url/storage/v1/object/public/entity-images/...",
          "path": "tenant/entity/image/thumbnail.jpg",
          "size": 5120
        },
        "small": { "url": "...", "path": "...", "size": 15360 },
        "medium": { "url": "...", "path": "...", "size": 51200 },
        "large": { "url": "...", "path": "...", "size": 102400 }
      },
      "metadata": {
        "originalName": "photo.jpg",
        "label": "front_view",
        "entityId": "entity-uuid",
        "tenantId": "default",
        "uploadedBy": "user@example.com",
        "createdAt": "2025-07-07T17:00:00.000Z"
      }
    }
  ]
}
```

**Image Optimization Features**:
- ✅ **4 Automatic Sizes**: thumbnail (150x150), small (400x400), medium (800x600), large (1200x900)
- ✅ **Quality Optimization**: Progressive JPEG with size-appropriate quality (80-95%)
- ✅ **Free Tier Friendly**: Uses Supabase Storage (no paid CDN features)
- ✅ **Smart Resizing**: Maintains aspect ratio, no upscaling

---

### Get Entity Images
Retrieve all images for a specific entity.

```http
GET /api/entities/:id/images?size=medium
Authorization: Bearer <your-token>  // optional for public entities
```

**Query Parameters**:
- `size` (optional): thumbnail, small, medium, large (default: medium)

**Response**:
```json
{
  "entityId": "entity-uuid",
  "images": [
    {
      "id": "image-uuid",
      "originalName": "photo.jpg",
      "label": "front_view",
      "url": "https://optimized-url-for-requested-size",
      "availableSizes": ["thumbnail", "small", "medium", "large"],
      "urls": {
        "thumbnail": { "url": "...", "size": 5120 },
        "small": { "url": "...", "size": 15360 },
        "medium": { "url": "...", "size": 51200 },
        "large": { "url": "...", "size": 102400 }
      },
      "uploadedBy": "user@example.com",
      "createdAt": "2025-07-07T17:00:00.000Z"
    }
  ],
  "requestedSize": "medium",
  "totalImages": 1
}
```

---

### Delete Image
Remove an image and all its optimized versions. **Only the user who uploaded the image can delete it.**

```http
DELETE /api/images/:id
Authorization: Bearer <your-token>
```

**Security Requirements**:
- ✅ **Authentication required**: Must be logged in
- ✅ **Uploader ownership**: Only the user who uploaded the image can delete it
- ✅ **Tenant isolation**: Respects tenant boundaries

**Response**:
```json
{
  "message": "Image deleted successfully"
}
```

---

## 🔍 Enhanced Search & Filtering

### Advanced Entity Search
Search entities with enhanced filtering, sorting, and optional image inclusion.

```http
GET /api/entities/search?q=house&category=property&price[min]=100000&price[max]=500000&bedrooms=3&make=Toyota&year=2020&sort_by=created_at&sort_order=desc&include_images=true
```

**Query Parameters**:
- `q` (optional): Search query text
- `category` (optional): Filter by entity category/type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (default: created_at)
- `sort_order` (optional): asc or desc (default: desc)
- `include_images` (optional): Include image thumbnails (default: false)
- **Attribute Filters**:
  - **Exact match**: `attribute_name=value` (e.g., `make=Toyota`, `color=red`)
  - **Range filters**: `attribute_name[min]=value` and `attribute_name[max]=value` (e.g., `price[min]=100000`, `year[max]=2023`)
  - **Combined**: Multiple filters can be combined (e.g., `make=Toyota&year=2020&price[min]=15000`)

**Response**:
```json
{
  "entities": [
    {
      "id": "entity-uuid",
      "entity_type": "property",
      "attributes": {
        "address": "123 Main St",
        "price": "350000"
      },
      "images": [
        {
          "id": "image-uuid",
          "url": "https://thumbnail-url",
          "label": "front_view"
        }
      ],
      "created_at": "2025-07-07T17:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "has_more": false
  },
  "search": {
    "query": "house",
    "category": "property",
    "filters": { "price[min]": "100000" },
    "sort": { "by": "created_at", "order": "desc" },
    "include_images": true
  }
}
```

---

### Get Available Categories
List all available entity categories.

```http
GET /api/categories
```

**Response**:
```json
{
  "categories": [
    {
      "id": "category-uuid",
      "name": "property",
      "display_name": "Properties",
      "description": "Houses, apartments, commercial spaces",
      "base_schema": {
        "address": null,
        "price": null,
        "bedrooms": null,
        "bathrooms": null
      },
      "active": true,
      "created_at": "2025-07-07T17:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### Get Entities by Category
Get all entities in a specific category with optional images.

```http
GET /api/categories/:category/entities?include_images=true&page=1&limit=20
```

**Response**: Same format as advanced search, filtered by category.

---

## 🔔 Notifications

### Subscribe Device

**POST** `/api/notifications/subscribe-device`

Subscribe a device for push notifications (supports both anonymous and authenticated users).

**Headers:**
- `Authorization: Bearer <token>` (optional)

**Body:**
```json
{
  "deviceToken": "onesignal_player_id_123",
  "tenantContext": "tenant_main"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device subscribed successfully",
  "data": {
    "id": "uuid",
    "device_token": "onesignal_player_id_123",
    "user_id": "user_123",
    "tenant_context": "tenant_main",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "action": "created"
}
```

---

### Merge Device Subscription

**POST** `/api/notifications/merge-device`

Merge anonymous device subscription when user logs in.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Body:**
```json
{
  "deviceToken": "onesignal_player_id_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device subscription merged successfully",
  "merged": true
}
```

---

### Send Notification

**POST** `/api/notifications/send`

Send any type of notification to a user.

**Headers:**
- `Authorization: Bearer <token>` (optional)

**Body:**
```json
{
  "userId": "user_123",
  "eventType": "chat_request",
  "message": "Someone wants to chat about your listing.",
  "link": "https://platform.com/entity/123/chat",
  "tenantContext": "tenant_main",
  "eventPayload": {
    "entity_id": "entity_123",
    "requester_id": "user_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "id": "notification_uuid",
    "user_id": "user_123",
    "event_type": "chat_request",
    "message": "Someone wants to chat about your listing.",
    "link": "https://platform.com/entity/123/chat",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "pushSent": true
}
```

---

### Chat Request Notification

**POST** `/api/notifications/chat-request`

Specialized endpoint for chat requests to entity owners.

**Headers:**
- `Authorization: Bearer <token>` (optional)

**Body:**
```json
{
  "entityId": "entity_123",
  "chatUrl": "https://platform.com/entity/123/chat"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat request notification sent to owner",
  "data": {
    "id": "notification_uuid",
    "user_id": "owner_123",
    "event_type": "chat_request",
    "message": "Someone wants to chat about your vehicle listing.",
    "link": "https://platform.com/entity/123/chat"
  },
  "pushSent": true
}
```

---

### Get Notification Preferences

**GET** `/api/notifications/preferences`

Get user's notification preferences.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "preferences": {
    "chat_requests": true,
    "attribute_updates": true,
    "reminders": true,
    "marketing": false
  },
  "userId": "user_123"
}
```

---

### Update Notification Preferences

**POST** `/api/notifications/preferences`

Update user's notification preferences.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Body:**
```json
{
  "preferences": {
    "chat_requests": true,
    "attribute_updates": false,
    "reminders": true,
    "marketing": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "id": "pref_uuid",
    "user_id": "user_123",
    "preferences": {
      "chat_requests": true,
      "attribute_updates": false,
      "reminders": true,
      "marketing": false
    }
  }
}
```

---

### Get Notification History

**GET** `/api/notifications/history?page=1&limit=20`

Get user's notification history with pagination.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notification_uuid",
      "event_type": "chat_request",
      "message": "Someone wants to chat about your listing.",
      "link": "https://platform.com/entity/123/chat",
      "event_payload": {
        "entity_id": "entity_123",
        "requester_id": "user_456"
      },
      "seen": false,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "has_more": false
  },
  "userId": "user_123"
}
```

---

### Mark Notification as Seen

**POST** `/api/notifications/:id/seen`

Mark a specific notification as seen.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as seen",
  "data": {
    "id": "notification_uuid",
    "seen": true,
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### Test Notification

**POST** `/api/notifications/test`

Send a test notification to the authenticated user.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "data": {
    "id": "notification_uuid",
    "event_type": "test",
    "message": "This is a test notification from your notification system.",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "pushSent": true
}
```

---

## 🏥 System Health

### Health Check
Get system status and service health.

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-07T16:25:56.169Z",
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "database": "healthy",
    "auth": "configured",
    "notifications": "healthy",
    "images": "healthy"
  }
}
```

---

## 📧 Email Testing

### Send Test Email
Send a test email (useful for testing email service configuration).

```http
POST /api/test/send-email
Content-Type: application/json

{
  "email": "test@example.com",
  "subject": "Test Email",
  "message": "This is a test message"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "messageId": "resend-message-id",
  "timestamp": "2025-07-07T16:00:00.000Z"
}
```

---

## 🐛 Debug Endpoints

**⚠️ Note**: Debug endpoints are only available in development mode (`NODE_ENV !== 'production'`)

### OTP Stats
Get current OTP statistics and active codes.

```http
GET /api/debug/otp-stats
```

**Response**:
```json
{
  "activeOTPs": 1,
  "otps": [
    {
      "key": "test@aspcorpo.com:default",
      "email": "test@aspcorpo.com",
      "tenantId": "default",
      "attempts": 0,
      "expiresAt": "2025-07-07T16:37:10.237Z",
      "otp": "836540"
    }
  ]
}
```

### Session Stats
Get active authentication session statistics.

```http
GET /api/debug/session-stats
```

**Response**:
```json
{
  "activeSessions": 2,
  "timestamp": "2025-07-07T16:32:37.762Z"
}
```

---

## 🔑 Authentication Headers

For all authenticated endpoints, include the authorization header:

```http
Authorization: Bearer <your-persistent-token>
```

**Token Characteristics**:
- ✅ **Never expires** (persistent until logout)
- ✅ **Survives server restarts** (stored in memory, regenerate on restart)
- ✅ **Invalidated on logout** (cannot be reused after logout)
- ✅ **Multi-tenant aware** (includes tenant context)

---

## 🌐 Multi-Tenant Support

All endpoints support multi-tenant architecture:

1. **Tenant from Token**: Authenticated users have tenant context in their token
2. **Tenant from Query**: `?tenant=your-tenant-id`
3. **Tenant from Header**: `X-Tenant-ID: your-tenant-id`
4. **Default Tenant**: Falls back to `"default"` if not specified

---

## 📝 Error Responses

All endpoints return consistent error formats:

```json
{
  "error": "Error message description"
}
```

Or for validation errors:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Getting Started

1. **Start Server**: `npm run dev`
2. **Send OTP**: `POST /api/auth/send-otp`
3. **Verify OTP**: `POST /api/auth/verify-otp` (get token)
4. **Use Token**: Include `Authorization: Bearer <token>` in requests
5. **Access APIs**: All authenticated endpoints now available
6. **Notifications**: Subscribe devices and send push notifications

**Example cURL Commands**:

```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@aspcorpo.com"}'

# Verify OTP (replace with actual OTP)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@aspcorpo.com", "otp": "123456"}'

# Use token for authenticated request
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Subscribe device for notifications
curl -X POST http://localhost:3000/api/notifications/subscribe-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"deviceToken": "onesignal_player_id", "tenantContext": "default"}'

# Send test notification
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

---

## 📊 Logs & Analytics

### Get My Interactions
Retrieve interaction logs for the authenticated user.

```http
GET /api/my/interactions?page=1&limit=50&event_type=entity_viewed
Authorization: Bearer <your-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `event_type` (optional): Filter by specific event type

**Response**:
```json
{
  "interactions": [
    {
      "id": "log-uuid",
      "event_type": "entity_viewed",
      "entity_id": "entity-uuid",
      "user_id": "user-id",
      "tenant_context": "default",
      "event_payload": {
        "source": "search",
        "filters": {"category": "vehicle"}
      },
      "timestamp": "2025-07-09T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "has_more": false
  },
  "user_id": "user-id",
  "tenant": "default"
}
```

---

### Get Entity Logs
Retrieve interaction logs for a specific entity (entity owners only).

```http
GET /api/entities/:id/logs?page=1&limit=50&event_type=entity_viewed
Authorization: Bearer <your-token>
```

**Security Requirements**:
- ✅ **Authentication required**: Must be logged in
- ✅ **Ownership required**: Only entity owners can view logs
- ✅ **Entity must exist**: Entity must exist and be accessible

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `event_type` (optional): Filter by specific event type

**Response**:
```json
{
  "entity_id": "entity-uuid",
  "logs": [
    {
      "id": "log-uuid",
      "event_type": "entity_viewed",
      "entity_id": "entity-uuid",
      "user_id": "viewer-id",
      "tenant_context": "default",
      "event_payload": {
        "source": "direct",
        "referrer": "search"
      },
      "timestamp": "2025-07-09T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "has_more": false
  },
  "owner": "owner-id",
  "tenant": "default"
}
```

---

### Log Interaction
Manually log an interaction event.

```http
POST /api/interaction_logs
Authorization: Bearer <your-token>  // optional
Content-Type: application/json

{
  "eventType": "custom_event",
  "entityId": "entity-uuid",
  "eventPayload": {
    "custom_data": "value",
    "source": "manual"
  }
}
```

**Request Fields**:
- `eventType` (required): Type of event to log
- `entityId` (optional): Related entity ID
- `eventPayload` (optional): Additional event data

**Common Event Types**:
- `visit_main` - User loads main entity listing
- `visit_entity` - Direct entity view
- `entity_viewed` - Entity accessed
- `entity_created` - Entity created
- `entity_updated` - Entity modified
- `entity_deleted` - Entity deleted
- `entities_searched` - Search performed
- `custom_event` - Custom tracking event

**Response**:
```json
{
  "success": true,
  "message": "Interaction logged successfully",
  "logged_at": "2025-07-09T12:00:00.000Z"
}
```

---

**📅 Last Updated**: July 9, 2025  
**🔄 API Version**: 1.0.0  
**✅ All endpoints tested and verified**
