# 🚀 Deployment & Versioning Strategy

This document outlines best practices for safe deployment, environment management, and development workflows. The system supports unified domain hosting, version control via cookies, and schema separation inside a single database—all optimized for iterative architecture evolution.

---

## 🔀 Git Flow & Branching

- Use `main` for production
- Use `dev` for active development
- Create feature branches:
  - `feature/reminders-engine`
  - `fix/attribute-sync`
  - `refactor/entities-model`

### Pull Request Guidelines

- All feature branches must be reviewed before merging
- Tag PRs with `@version` label if DB changes or API modifications occur
- Each milestone in [`roadmap.md`] matches a release tag:
  - `v1-alpha`, `v1-beta`, `v2-staging`, etc.

---

## 📁 .gitignore Setup

Your `.gitignore` should include:
- Environment files
    `.env.local .env.production .env.development`
- Logs & debugging
    `*.log`
- Build output
    `.next/ dist/ out/`
- Supabase artifacts
    `supabase/.temp/ supabase/migrations/`
- IDE files
    `.vscode/ .idea/`

This keeps secrets, artifacts, and temporary files out of Git. Supabase migration files may be managed intentionally in `/db/migrations` outside `.gitignore`.

---

## 🍪 Cookie-Based Routing Context

To avoid multiple domains while testing new versions:

- Set `app_version_cookie=dev` for development view
- UI and API use this cookie to determine context
- If cookie is absent, default to `main` (production)

Usage:

- Devs and testers toggle versions via cookie
- All served from the same domain (e.g., `platform.com`)
- Reduces complexity across frontend and server infrastructure

---

## 🗃 Database Environment Strategy

Use **a single Supabase instance** with multiple schemas:

| Schema     | Purpose              | Notes                                   |
|------------|----------------------|-----------------------------------------|
| `public`   | Production data       | Used by live site                       |
| `dev`      | Development testing   | RLS matches cookie context if needed    |

Queries inspect cookie or user context to route between schemas.

Optionally apply Postgres `search_path` dynamically.

---

## 🧩 SQL Change Tracking

All schema changes are stored inside:
```/www/src/db/migrations/```


Each file named by purpose or phase:

- `001-init.sql`
- `002-add-reminders.sql`
- `003-refactor-attributes.sql`

Best practice:

- Every file includes a header:
```-- @version v1-alpha -- @description Adds reminder triggers and notification enums```
- SQL files should be synced with Git tags and roadmap milestones
- Supabase CLI or manual tooling can be used to apply migrations

---

## 🧠 Sentry Tracking Integration

Use Sentry across backend and frontend for full architecture observability.

### Backend Integration

- Add Sentry SDK to Fastify/Node
- Track API errors, exception traces, cron failures
- Add metadata: `userId`, `tenantId`, `endpoint`, `version`
- Group errors by `app_version_cookie`

Env Vars:
  - `SENTRY_DSN_BACKEND`
  - `SENTRY_ENV`

### Frontend Integration

- Capture route-level errors
- Track UI events: failed requests, auth failures, broken UIs
- Use version-aware tags and user context

Env Vars:
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_VERSION_COOKIE_NAME=app_version_cookie`

Sentry will log versioned paths like `/entity/:id?version=dev`

---

## 🧪 Local Development Setup

Steps:

1. Clone repo  
2. Create `.env.local` using `setup.md` vars  
3. Run: `npm run dev`  
4. Set cookie: `app_version_cookie=dev`  
5. Supabase CLI uses `dev` schema  
6. Frontend loads dev version using cookie routing

---

## 📦 Production Deployment (Vercel)

- Push to `main` triggers automatic Vercel deployment  
- `.env.production` pulled from dashboard secrets  
- Confirm presence of keys for:
  - Clerk
  - Supabase
  - OneSignal
  - Resend  
- Health route: `GET /health`  
- Edge configs for caching, throttling, version fallback

---

## 🔐 Supabase RLS Planning

- All queries scoped by tenant using RLS  
- Separation via schemas prevents accidental cross-env writes  
- Roles can isolate development teams from production risks  
- Logs tagged by `version`, `tenant`, and optionally `branch`

---

## 🧙 Universal CLI Integration

Universal CLI reads architectural context from `docs/CLI_CONTEXT.md`.

Be sure to update:
- Update `docs/CLI_CONTEXT.md` with major architecture decisions
    - Deployment strategy  
    - Branching logic  
    - Routing via cookies  
    - Schema separation rules  
    - SQL migration policy
- Include deployment strategy, branching logic, and version tracking notes
