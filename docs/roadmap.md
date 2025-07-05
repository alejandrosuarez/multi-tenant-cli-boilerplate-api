# 🛤️ Development Roadmap

This roadmap organizes the system build into clear, testable phases. Each phase includes functionality goals, API coverage, and infrastructure alignment to ensure scalable delivery and aligned developer focus.

---

## 📍 Phase 1 — Core API Setup

- Create, update, retrieve entities
- Categories and base schema loading
- OTP login system via Resend
- Clerk JWT middleware stub (placeholder)
- Supabase DB initialized
- `.env.local` variables integrated

---

## 📍 Phase 2 — Attribute Framework

- Attribute request system
- Attribute button logic per field
- Owner dashboard to view requested attributes
- Smart filtering per category
- `interaction_logs` for request tracking

---

## 📍 Phase 3 — Notifications & Reminders

- Web Push subscription (visitor + user)
- Notification storage and delivery logic
- Merge deviceToken with userId
- Reminder engine for:
  - Incomplete attributes
  - Entity expiration check
  - Chat reminders
- Scheduler or Supabase cron function

---

## 📍 Phase 4 — Multi-Tenant Federation

- Tenant-aware filtering
- Public portal setup (via tenantContext)
- RLS policies for scoped data
- Subdomain or token-based portal support
- Tenant dashboard queries

---

## 📍 Phase 5 — Media Integration

- Image upload endpoint with metadata
- Image retrieval per entity
- CDN setup: Supabase Storage / S3 / R2
- Directory structure per tenant

---

## 📍 Phase 6 — Analytics Foundation

- Aggregate views per tenant
- Popular entities, attributes, user actions
- Logging audit tools
- Entity and owner behavior insights

---

## 📍 Phase 7 — Clerk Integration

- Replace OTP flow with full Clerk login
- JWT-based session middleware
- Metadata extensions (tenant, preferences)
- Session merge logic with deviceToken

---

## 📍 Phase 8 — Frontend Interfaces

- Public explorer frontend
- Owner dashboard
- Attribute response interface
- Entity viewer with CDN images
- Tenant-scoped frontend design patterns

---

## 🧠 Deployment Milestones

| Milestone     | Stack                        | Notes                                  |
|---------------|------------------------------|----------------------------------------|
| Dev Alpha     | Local with OTP & Supabase    | Baseline functionality, JSON-only APIs |
| Dev Beta      | Clerk login integrated       | Push ready, UI endpoints exposed       |
| Staging       | Vercel with CDN & portals    | Tenant filtering, reminder jobs active |
| Public Launch | Full UI, analytics, docs     | GitHub README, Universal CLI supported    |

