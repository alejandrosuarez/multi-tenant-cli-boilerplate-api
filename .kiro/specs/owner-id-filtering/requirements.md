# Requirements Document

## Introduction

This feature adds support for owner_id and exclude_id filtering parameters to the existing entity search endpoints (/api/entities and /api/entities/search). This will enable a "More from this owner" feature that shows other entities by the same owner, excluding the current entity being viewed.

## Requirements

### Requirement 1

**User Story:** As a user viewing an entity detail page, I want to see other entities by the same owner, so that I can discover more content from creators I'm interested in.

#### Acceptance Criteria

1. WHEN I request /api/entities with owner_id parameter THEN the system SHALL return only entities owned by that specific owner_id
2. WHEN I request /api/entities/search with owner_id parameter THEN the system SHALL return only entities owned by that specific owner_id that match other search criteria
3. WHEN I provide both owner_id and exclude_id parameters THEN the system SHALL return entities by that owner excluding the specified entity ID
4. WHEN I provide owner_id parameter THEN the system SHALL respect existing access controls (public_shareable, tenant permissions)

### Requirement 2

**User Story:** As a developer integrating the API, I want consistent parameter support across search endpoints, so that I can build features that work predictably.

#### Acceptance Criteria

1. WHEN I use owner_id parameter on /api/entities endpoint THEN it SHALL behave identically to /api/entities/search endpoint
2. WHEN I combine owner_id with other filters THEN all filters SHALL be applied together using AND logic
3. WHEN I provide invalid owner_id format THEN the system SHALL return appropriate error messages
4. WHEN owner_id parameter is provided THEN it SHALL not be treated as a "system filter" and SHALL be processed

### Requirement 3

**User Story:** As a user, I want the owner_id filtering to work with pagination and sorting, so that I can browse through large collections efficiently.

#### Acceptance Criteria

1. WHEN I use owner_id filter with pagination parameters THEN the system SHALL return paginated results correctly
2. WHEN I use owner_id filter with sort parameters THEN the system SHALL apply sorting to the filtered results
3. WHEN I use owner_id filter with limit parameter THEN the system SHALL respect the limit on filtered results
4. WHEN no entities match the owner_id filter THEN the system SHALL return empty results with appropriate pagination metadata