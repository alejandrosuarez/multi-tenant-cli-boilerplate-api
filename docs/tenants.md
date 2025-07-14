# 🏢 Tenants Module

This document outlines how tenants are identified, how data is scoped contextually, and how the platform supports both centralized and tenant-specific portals using filtered API queries.

---

## 🔐 Tenant Identity Structure

Every entity, interaction, request, and notification includes a `tenantId` or `tenantContext` for scoping purposes.

Tenant-related fields:
- `tenantId`: Stored on entities
- `tenantContext`: Stored in logs and notifications
- `ownerId`: Tied to the tenant’s creator or maintainer
- `subdomain` or `portal`: optional custom frontend

---

## 🎛 Access Model

| User Type        | Access Scope              | Notes                                |
|------------------|---------------------------|--------------------------------------|
| Logged User      | Global view               | All data available, no restriction   |
| Visitor          | Global view (read-only)   | Requests and interactions supported  |
| Entity Owner     | Full control of own data  | Scoped to their created entities     |
| Tenant Portal    | Filtered view             | Custom UI powered via scoped queries |

---

## 🔍 API Filtering Examples

### Global View

GET /api/entities

Returns all public entities across all tenants (default behavior).

---

### Tenant-Specific View

**Current Implementation**: Tenant context is automatically determined from user authentication.

GET /api/entities  
Authorization: Bearer {JWT}

Returns entities scoped to the authenticated user's tenant context.

GET /api/my/interactions  
Authorization: Bearer {JWT}

Logs scoped to the authenticated user's tenant context.

---

### Owner Dashboard

GET /my/entities  
GET /my/attribute-requests  
GET /my/interactions

Provides full visibility into user-owned data and requests.

---

## 🖥️ Tenant Portal Building

Tenants can build their own interfaces via:
- Subdomain integration
- Custom dashboards powered by filtered APIs
- CDN folder separation (e.g., `/cdn/tenant123/images`)
- Optional access rate limits and keys
- Contact forms and feedback systems scoped by `tenantContext`

---

## 🔐 Security & RLS

Row-Level Security Policies (Supabase):
- Enforce tenant-bound queries
- Ensure users see only entities or logs that match their roles
- Fallback to global visibility if no `tenantId` restriction

Logged users can always access:
- Their own entities
- Any tenant’s public data

---

## 🧭 Design Philosophy

This architecture supports:
- Centralized content management
- Federated visibility with tenant-specific ownership
- Fully contextual logging and notification patterns
- Harmonized multi-tenant coexistence

It reflects the system's foundational principle:
> Autonomy without isolation. Interconnectedness with respect.

---

## 🧙 Universal CLI Notes

Universal CLI can assist by:
- Drafting filtered query patterns
- Suggesting tenant-aware schema rules
- Building examples for federated dashboards
