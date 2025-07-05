# Multi-Tenant Entity API System

This project is a scalable, multi-tenant API system built to manage entities, attributes, notifications, user interactions, and reminders with philosophical depth and technical precision.

## 🔧 Technologies
- Node.js + Fastify
- Supabase (PostgreSQL, Realtime, Storage)
- Clerk (authentication platform, integrated later)
- Resend (email delivery via OTP)
- OneSignal (push notifications)
- Vercel (deployment)
- JSONB schemas for lean data modeling

## 💡 Features
- Entity management with dynamic, schema-driven attributes
- Attribute request & reminder flows
- Smart search filters including range inputs
- Unified interaction logging
- CDN-backed image upload per entity
- Notification system (logged + anonymous users)
- Multi-tenant filtering and contextual visibility
- Scheduled reminders for entity validity and user follow-ups

## 🛠 Development Workflow
Documentation is located at `docs/`. Review and validate all specs before development begins in `src/`.

## 📁 Directory Structure
```
www/                          # Project root
├── README.md                 # Entry point, links to docs/
├── docs/                     # Full documentation set
│   ├── CLI_CONTEXT.md        # Universal CLI context file
│   ├── onboarding.md         # The very first touchpoint Gemini and Contributors alignment
│   ├── setup.md              # Local + Vercel deployment guide
│   ├── deployment.md         # Deployment & Versioning Strategy
│   ├── auth.md               # Clerk integration and session handling
│   ├── entities.md           # Entity creation, update, schema sync
│   ├── attributes.md         # Attribute logic, NA handling, requests
│   ├── search.md             # Smart filters, range queries
│   ├── media.md              # Image upload, CDN handling
│   ├── tenants.md            # Multi-tenant logic and filtering
│   ├── interactions.md       # Logging structure and analytics
│   ├── notifications.md      # Push subscriptions, reminders, merging
│   ├── api-examples.md       # Endpoint showcase with payloads
│   ├── roadmap.md            # Phase breakdown and release plan
├── .gemini/                  # Universal CLI project config
│   └── settings.json         # Universal CLI settings file
├── src/                      # Your backend codebase (to be added)
│   └── ...                   # API routes, DB logic, etc.
```

## 🤖 Universal CLI Support
Universal CLI is configured to use `docs/CLI_CONTEXT.md`. For AI-guided development, run Universal CLI inside the `www/` folder.

## 🔁 Cross-AI CLI Compatibility

This system supports Gemini CLI, Claude CLI, and future intelligent agents with contextual permissions.  
All orchestration flows are defined in `docs/CLI_CONTEXT.md` and governed by `.cli/settings.json`.

Current agent configs:
- `.gemini/settings.json` → delegates to `.cli/settings.json`
- `.claude/settings.json` → delegates with permission overrides
