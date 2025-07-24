# Design Document

## Overview

This feature adds a GET method to the existing `/api/interaction_logs` endpoint to enable querying and filtering of interaction logs. The implementation will extend the current POST-only endpoint to support retrieval operations while maintaining the same route structure and authentication requirements.

## Architecture

The solution involves minimal changes to the existing architecture:

1. **Route Enhancement**: Add GET method handler to the existing `/api/interaction_logs` route
2. **Database Querying**: Implement filtering logic for the interactionLogs table
3. **Authentication**: Use existing auth middleware to ensure only authenticated users can access logs
4. **Permission Model**: Users can see logs they have access to based on ownership and tenant context

## Components and Interfaces

### API Endpoint Enhancement

The existing endpoint will support both methods:
- `POST /api/interaction_logs` - Create new interaction log (existing)
- `GET /api/interaction_logs` - Query interaction logs (new)

### Query Parameters

```javascript
GET /api/interaction_logs?eventType=entity_viewed&entityId=123&page=1&limit=20&start_date=2025-01-01
```

**System Parameters:**
- `eventType` - Filter by event type
- `entityId` - Filter by entity ID  
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50, max: 100)
- `start_date` - Filter logs from this date onwards
- `end_date` - Filter logs up to this date

**Custom Parameters:**
- Any other query parameter will be treated as a filter for the event_payload JSON field

### Database Query Logic

```javascript
// Base query
let query = db.table('interactionLogs')
  .select('*')
  .eq('tenant_context', tenantId)
  .order('timestamp', { ascending: false });

// Apply filters
if (eventType) {
  query = query.eq('event_type', eventType);
}

if (entityId) {
  query = query.eq('entity_id', entityId);
}

// Date range filtering
if (start_date) {
  query = query.gte('timestamp', start_date);
}

if (end_date) {
  query = query.lte('timestamp', end_date);
}

// Custom payload filtering
for (const [key, value] of Object.entries(customFilters)) {
  query = query.contains('event_payload', { [key]: value });
}

// Pagination
const offset = (page - 1) * limit;
query = query.range(offset, offset + limit - 1);
```

## Data Models

No changes to existing data models are required. The feature uses the existing `interactionLogs` table structure:

```sql
interactionLogs:
- id (primary key)
- event_type (string)
- user_id (string) 
- tenant_context (string)
- event_payload (jsonb)
- entity_id (string, nullable)
- timestamp (timestamp)
```

## Access Control and Permissions

### Authentication
- **Required**: All GET requests must be authenticated
- **Middleware**: Use existing `auth.required` middleware

### Authorization Logic
```javascript
// Users can see:
// 1. Logs where they are the user_id (their own actions)
// 2. Logs for entities they own (if entity_id is present)
// 3. Logs within their tenant context

if (request.user.id !== log.user_id) {
  // Check if user owns the entity (if entity_id exists)
  if (log.entity_id) {
    const entity = await entityService.getEntity(log.entity_id, request.user.id, tenantId);
    if (!entity.success || entity.data.owner_id !== request.user.id) {
      // Filter out this log
      continue;
    }
  } else {
    // No entity_id, user can only see their own logs
    continue;
  }
}
```

## Response Format

### Success Response
```javascript
{
  "success": true,
  "logs": [
    {
      "id": "log-123",
      "event_type": "entity_viewed",
      "user_id": "user@example.com",
      "tenant_context": "default",
      "event_payload": {
        "source": "manual",
        "custom_data": "value"
      },
      "entity_id": "entity-456",
      "timestamp": "2025-07-24T21:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "has_more": false
  },
  "filters_applied": {
    "eventType": "entity_viewed",
    "entityId": "entity-456"
  }
}
```

### Error Response
```javascript
{
  "success": false,
  "error": "Authentication required"
}
```

## Error Handling

### Authentication Errors
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User doesn't have permission to access requested logs

### Validation Errors
- **400 Bad Request**: Invalid date format, invalid pagination parameters
- **422 Unprocessable Entity**: Invalid filter combinations

### System Errors
- **500 Internal Server Error**: Database connection issues, unexpected errors

## Performance Considerations

### Database Optimization
- **Indexing**: Ensure indexes exist on frequently filtered columns:
  - `tenant_context` (existing)
  - `event_type` (existing)
  - `entity_id` (existing)  
  - `timestamp` (existing)
  - `user_id` (existing)

### Query Optimization
- **Pagination**: Use LIMIT/OFFSET for efficient pagination
- **Filtering**: Apply most selective filters first
- **JSON Queries**: Custom payload filtering may be slower, use sparingly

### Caching Strategy
- **No caching initially**: Logs are real-time data, caching may not be beneficial
- **Future consideration**: Cache frequently accessed log summaries

## Testing Strategy

### Unit Tests
1. **Authentication Tests**
   - Test with valid authentication token
   - Test with invalid/missing token
   - Test with expired token

2. **Filtering Tests**
   - Test eventType filtering
   - Test entityId filtering
   - Test custom payload filtering
   - Test date range filtering
   - Test combined filters

3. **Pagination Tests**
   - Test default pagination
   - Test custom page/limit
   - Test edge cases (page=0, limit=0)

4. **Permission Tests**
   - Test user can see own logs
   - Test user can see logs for owned entities
   - Test user cannot see other users' logs
   - Test tenant isolation

### Integration Tests
- Test full request/response cycle
- Test with real database data
- Test performance with large datasets

## Implementation Plan

The implementation will be done in phases:

1. **Phase 1**: Basic GET endpoint with authentication
2. **Phase 2**: Add system filters (eventType, entityId)
3. **Phase 3**: Add pagination and sorting
4. **Phase 4**: Add custom payload filtering
5. **Phase 5**: Add date range filtering
6. **Phase 6**: Add comprehensive testing and optimization