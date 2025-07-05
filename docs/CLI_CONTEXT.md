# 🔮 Universal Context Overview

This file defines Universal CLI’s operational context, architectural awareness, and permission scope across the system.

---

## 🧠 Environment Awareness

Universal CLI understands the following:

- System uses a single Supabase instance  
- Split schema model: `public` for prod, `dev` for testing  
- All branches and environments share the same domain  
- Context resolution via cookie: `app_version_cookie`  
- Routing, logging, and notifications adapt by version context

Universal reads these from:
- `deployment.md`  
- `settings.json`  
- `.env` files (local or staged)

---

## 🚀 Deployment Strategy

All deploys follow Git Flow:

- Branches: `main`, `dev`, `feature/*`  
- Supabase schema matches cookie context  
- SQL migration files are stored in `/src/db/migrations/`  
- Vercel handles frontend deploys with edge config and cookie routing  
- Sentry integrated for both UI and backend observability

---

## 🧩 Migrations & Schema Control

Universal can read and apply migrations from:

/src/db/migrations/

Each file contains headers for versioning:

`-- @version v1-alpha`
`-- @description Initializes core schema for entity, attributes, notifications`
`-- @created_by Universal CLI`
`-- @generated_at 2025-07-05T00:24:00Z`

- If the file is regenerated or edited, Universal will append:

`-- @modified_at 2025-07-05T00:26:45Z`
`-- @modified_by Universal CLI (autocorrect)`

Universal can:
- Create new migration files  
- Suggest schema diffs  
- Validate SQL across schema boundaries
- Use the schema as memory and speak for itself.

---

# 🧩 Universal SQL Header Convention

This document outlines how Universal CLI automatically generates SQL migration headers based on file naming, project context, and roadmap versioning.

---

## 📂 Location

All migrations live in:

`/src/db/migrations/`

---

## 📄 File Naming Pattern

Universal supports these formats:

- `[dateTimeFormat]-001-init.sql`
- `[dateTimeFormat]-002-add-reminders.sql`
- `[dateTimeFormat]-003-refactor-attributes.sql`
- `[dateTimeFormat]-feature-add-chat.sql`
- `[dateTimeFormat]-fix-entity-index.sql`

---

## 🛠 Auto-Generated Headers

Universal will insert metadata at the top of each file:

`-- @version v1-alpha -- @description Initializes schema for entity, attributes, and notifications -- @created_by Universal CLI -- @generated_at 2025-07-05T00:24:00Z`

---

### 📌 Field Definitions

| Field            | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `@version`       | Inferred from roadmap milestone or branch name                             |
| `@description`   | Parsed from filename or specified manually                                  |
| `@created_by`    | Always "Universal CLI" for traceability                                        |
| `@generated_at`  | UTC ISO timestamp of initial file creation                                  |

---

## ✏️ Change Tracking

When Universal modifies an existing migration:
```-- @modified_at 2025-07-05T00:26:45Z -- @modified_by Universal CLI (autocorrect)```

## ✅ Behavior & Safeguards

- Universal does not override functional SQL unless explicitly authorized  
- Header updates are non-destructive  
- Existing files with custom headers are preserved  
- All header changes are version-controlled via Git commits  

---

## 📣 Declaration of Intelligent Header Inference

Universal ACKNOWLEDGES THAT FILE NAMES, VARIABLE KEYS, AND CONTEXTUAL USAGE MAY VARY ACROSS ENVIRONMENTS. IT WILL USE STRUCTURAL PATTERNS, COMMON SENSE, AND SYSTEM MEMORY TO INFER CORRECT HEADERS.

IT IS PERMITTED TO AUTOCORRECT OR NORMALIZE HEADERS WITHOUT ALTERING CORE LOGIC.

---

## 🧙 Universal CLI Commands (for headers)

- `Universal create-migration [name]`  
- `Universal lint-migrations`  
- `Universal inject-headers`  
- `Universal apply-dev-sql`  
- `Universal status --version=dev`

All commands respect system architecture and schema boundaries.

---

## ⚙️ CLI Permissions

Universal is permitted to perform:

**Local Commands**
- Run project: `npm run dev`  
- Trigger Supabase CLI: `supabase db push`  
- Set cookies for browser context  
- Apply SQL files in dev schema  
- Initialize `.env.local` and `.env.test`

**Remote & Deployment**
- Push schema via API token  
- Validate edge configs (via Vercel API)  
- Read and update `GEMINI.md`  
- Communicate deployment state from `dev` to `main`

Universal may autocorrect or sanitize documentation content as needed—without altering core meaning, formatting structure, or overriding live values. All edits are tracked via commit history and version control.

---

## 📣 AGAIN!!! 📣 DECLARATION OF VARIABLE FLEXIBILITY

Universal ACKNOWLEDGES THAT VARIABLE NAMES, KEYS, AND ENVIRONMENT VALUES MAY DIFFER ACROSS MODULES, CONTEXTS, OR PHASES. IT WILL USE COMMON SENSE, PATTERN MATCHING, AND DOCUMENTED STRUCTURE TO INFER CORRECT USAGE.

Universal MAY CORRECT OR NORMALIZE VALUES IF MISALIGNED—ONLY WHEN DOING SO DOES NOT ALTER STRUCTURE, FUNCTIONALITY, OR ORIGINAL INTENT.

THIS INTELLIGENT ALIGNMENT IS PERMITTED, COMMITTED, AND VERSIONED FOR TRACEABILITY.

---

## 🍪 Version Context Injection

Universal may set or check the version cookie:

document.cookie = "app_version_cookie=dev";

All client components and API routes resolve context from this value.

---

## 🧪 Observability Integration

Universal can tag generated logic with:

- `tenantId`  
- `version`  
- `userId`  
- `timestamp`

Universal respects Sentry integration and may emit trace helpers.

---

## 🔐 Security Awareness

Universal operates within these boundaries:

- No access to secrets (tokens, credentials)  
- Follows RLS and schema-based access rules  
- Any mutation to `public` schema is gated by `main` branch  
- Audit trails are stored via Git commit logs and metadata

---

## 📦 Expansion Path

Future enhancements Universal will support:

- Live preview diffing between feature branch and production  
- Scripted rollback of SQL migrations  
- Per-tenant deployment toggles  
- CLI context switching between versions or portals

---

Universal is granted full contextual memory of this architecture, and is trusted to maintain alignment across backend, frontend, database, and deployment logic—with the ability to autocorrect and harmonize intelligently.
