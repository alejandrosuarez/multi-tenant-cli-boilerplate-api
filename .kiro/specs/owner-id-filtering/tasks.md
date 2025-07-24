# Implementation Plan

- [x] 1. Add owner_id and exclude_id filtering to EntityService searchEntities method
  - Modify the system filters skip list in src/services/entity.js (around lines 247-265) to include 'owner_id' and 'exclude_id'
  - Add owner_id filtering logic: `if (filters.owner_id) { query = query.eq('owner_id', filters.owner_id); }`
  - Add exclude_id filtering logic: `if (filters.exclude_id) { query = query.neq('id', filters.exclude_id); }`
  - _Requirements: 1.1, 1.3, 2.2_

- [x] 2. Test the new filtering functionality
  - Test GET /api/entities?owner_id=user@example.com returns only entities by that owner
  - Test GET /api/entities?exclude_id=123 excludes the specified entity
  - Test GET /api/entities?owner_id=user@example.com&exclude_id=123 combines both filters
  - Verify both /api/entities and /api/entities/search endpoints work with the new parameters
  - _Requirements: 1.1, 1.3, 2.1_

- [ ] 3. Update API documentation to include new parameters
  - Update the OpenAPI specification to document owner_id and exclude_id parameters
  - Add parameter descriptions and examples for both /api/entities and /api/entities/search endpoints
  - Regenerate API documentation UI to reflect the new filtering options
  - _Requirements: 2.1_