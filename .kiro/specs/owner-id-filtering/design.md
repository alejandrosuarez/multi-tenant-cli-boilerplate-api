# Design Document

## Overview

This feature enhances the existing entity search functionality by adding support for `owner_id` and `exclude_id` filtering parameters. The implementation will modify the `searchEntities` method in the EntityService class to handle these new filters while maintaining backward compatibility and existing security controls.

## Architecture

The solution involves minimal changes to the existing architecture:

1. **EntityService Enhancement**: Modify the `searchEntities` method to handle `owner_id` and `exclude_id` parameters
2. **API Endpoint Integration**: Both `/api/entities` and `/api/entities/search` endpoints will automatically support the new parameters
3. **Security Layer**: Maintain existing access controls and permission checks

## Components and Interfaces

### Modified EntityService.searchEntities Method

The `searchEntities` method will be enhanced to:
- Process `owner_id` filter before the attribute filtering loop
- Process `exclude_id` filter to exclude specific entities
- Maintain existing security and access control logic

### API Endpoints

Both existing endpoints will support the new parameters:
- `GET /api/entities?owner_id=user@example.com&exclude_id=123&limit=10`
- `GET /api/entities/search?owner_id=user@example.com&exclude_id=123&limit=10`

### Parameter Processing

```javascript
// New filter handling logic
if (filters.owner_id) {
  query = query.eq('owner_id', filters.owner_id);
}

if (filters.exclude_id) {
  query = query.neq('id', filters.exclude_id);
}
```

## Data Models

No changes to existing data models are required. The feature uses existing entity table columns:
- `owner_id`: Already exists for entity ownership
- `id`: Already exists as primary key for exclusion

## Error Handling

### Input Validation
- **Invalid owner_id format**: Return appropriate error message
- **Invalid exclude_id format**: Return appropriate error message
- **Missing parameters**: Continue with existing behavior (no filtering)

### Access Control
- Maintain existing public/private entity filtering
- Respect tenant-based access controls
- Apply owner_id filtering after security checks

### Error Response Format
```javascript
{
  "success": false,
  "error": "Invalid owner_id format"
}
```

## Testing Strategy

### Unit Tests
1. **Filter Processing Tests**
   - Test owner_id filtering with valid owner IDs
   - Test exclude_id filtering with valid entity IDs
   - Test combination of both filters
   - Test with invalid parameter formats

2. **Security Tests**
   - Verify access controls are maintained
   - Test tenant isolation with owner_id filtering
   - Test public/private entity filtering

3. **Integration Tests**
   - Test both API endpoints with new parameters
   - Test pagination with filtered results
   - Test sorting with filtered results

### Test Cases

#### Basic Functionality
```javascript
// Test owner_id filtering
GET /api/entities?owner_id=user@example.com
// Expected: Only entities owned by user@example.com

// Test exclude_id filtering  
GET /api/entities?exclude_id=123
// Expected: All entities except entity with ID 123

// Test combined filtering
GET /api/entities?owner_id=user@example.com&exclude_id=123
// Expected: Entities by user@example.com excluding entity 123
```

#### Edge Cases
```javascript
// Test with non-existent owner
GET /api/entities?owner_id=nonexistent@example.com
// Expected: Empty results

// Test with non-existent exclude_id
GET /api/entities?exclude_id=999999
// Expected: All entities (no exclusion)

// Test with invalid formats
GET /api/entities?owner_id=&exclude_id=invalid
// Expected: Appropriate error handling
```

#### Security Tests
```javascript
// Test access control with owner_id
GET /api/entities?owner_id=other@example.com
// Expected: Only public entities from other@example.com

// Test tenant isolation
GET /api/entities?owner_id=user@tenant1.com (from tenant2 context)
// Expected: No results or tenant-appropriate filtering
```

## Implementation Details

### Code Changes Required

1. **Modify EntityService.searchEntities method** (src/services/entity.js, lines ~247-265):
   - Add owner_id and exclude_id to the system filters skip list exception
   - Add specific handling for these parameters before the attribute filtering loop

2. **Update system filters list**:
   - Remove owner_id and exclude_id from the skip list or handle them as special cases

### Backward Compatibility

- All existing API calls will continue to work unchanged
- New parameters are optional and don't affect existing functionality
- Response format remains identical

### Performance Considerations

- owner_id filtering uses indexed column (existing database index)
- exclude_id filtering uses primary key (highly optimized)
- No additional database queries required
- Minimal performance impact on existing searches