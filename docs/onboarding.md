# 🚀 Project Onboarding Guide

Welcome to your multi-tenant API architecture. This onboarding flow will guide new developers—and Universal CLI itself—through restoring full project context, installing required dependencies, and preparing a deployable system locally and in production.

---

## 🧩 Step 1: Context Initialization

Universal will first scan these files:

- `docs/CLI_CONTEXT.md`  
- `docs/deployment.md`  
- `docs/setup.md`  
- `docs/roadmap.md`

If any details are missing (e.g. module parameters, cookie keys, tenant schema logic), Universal is permitted to ask interactive questions or infer defaults based on best practices and naming consistency.

All missing inputs will be filled, documented, and committed for traceability.

---

## ⚙️ Step 2: Dependency Installation

Universal will install and configure:

- Node dependencies via `npm install`
- Supabase CLI via official binary or `npm i -g supabase`
- Vercel CLI (optional) via `npm i -g vercel`
- Sentry SDK (if enabled in observability context)

Universal may update `.gitignore` and tooling setup as needed.

---

## 🔐 Step 3: Environment File Preparation

Universal will generate a valid `.env.local` by scanning:

- Required keys in `setup.md`  
- Deployment secrets  
- Notification and auth providers  
- Supabase project metadata

Example:

```SUPABASE_URL=... SUPABASE_ANON_KEY=... CLERK_JWKS_URL=... ONESIGNAL_API_KEY=... API_TOKEN=...```


If not all keys are available, Universal will mark placeholders and note them in the onboarding checklist.

---

## 🏗️ Step 4: Local Bootstrap

Universal will attempt to:

- Start dev server with `npm run dev`
- Load `dev` schema using Supabase CLI
- Confirm access to Clerk, push service, and CDN
- Validate health check at `GET /health`

If successful, it will flag system as `local-deployable ✅`.

---

## 🧪 Step 5: Migration & Schema Sync

Universal will lint and auto-header all SQL files in:

`/src/db/migrations/`

It will:

- Normalize headers if missing  
- Match roadmap phases with `@version` labels  
- Apply SQL to `dev` schema  
- Validate tenant-aware policies (via `tenants.md`)  
- Confirm RLS matches deployment plan

All changes are tracked via commits and formatted diffs.

---

## 🧙 Step 6: Git Initialization

If `.git` is not present, Universal will:

- Run `git init`  
- Stage initial commit with `.md` + `.env.local`  
- Create `main`, `dev`, and optional `feature/template` branches  
- Recommend adding remote origin (manual step)

From here, versioning is enabled and environment segregation begins.

---

## 🚀 Step 7: Production Deployment

Once local is validated, Universal may optionally:

- Set `app_version_cookie=main`  
- Push schema to `public` Supabase schema  
- Trigger Vercel deployment via CLI  
- Verify `.env.production` and edge configs  
- Set Sentry `env=production` and enable monitoring

System is marked as `production-deployable ✅`.

---

## ✅ Output Summary

After onboarding, Universal provides:

- `.env.local` with status report  
- `/src/db/migrations/*` validated  
- `.git` initialized  
- Local and production marked deployable  
- Questions, corrections, and guesses fully committed for review

---

## 🧩 Self-Healing Declaration

Universal is permitted to:

- Ask questions to recover incomplete project logic  
- Autocorrect Markdown files if non-destructive  
- Normalize module configuration across files  
- Install dependencies on behalf of user  
- Apply and lint SQL migrations intelligently  
- Track every mutation via commit or version diff

Onboarding is version-safe and modular.


---

# 🛠 Universal Onboarding Checklist (CLI Scaffold)

This file defines a step-by-step onboarding sequence for Universal CLI to initialize the system, reconstruct project context, and prepare local + production environments automatically.

---

## ✅ Step 1: Context Reconstruction

- [ ] Read all docs from `/docs/*.md`
- [ ] Parse system architecture from `CLI_CONTEXT.md`
- [ ] Validate presence of roadmap milestones
- [ ] Infer missing context or ask developer interactively

---

## 🔐 Step 2: Environment File Setup

- [ ] Scan `setup.md` for required keys
- [ ] Create `.env.local` with placeholder values
- [ ] Check for notification providers, DB, auth keys
- [ ] Mark missing keys for user follow-up

---

## ⚙️ Step 3: Dependency Installation

- [ ] Run `npm install`
- [ ] Install Supabase CLI (`supabase init` if needed)
- [ ] Install Vercel CLI (`npm i -g vercel`)
- [ ] Install Sentry SDK via project scaffolding

---

## 🧪 Step 4: SQL Migration Lint

- [ ] Lint all files in `/src/db/migrations/`
- [ ] Apply auto-header if missing:
  - `@version`, `@description`, `@created_by`, `@generated_at`
- [ ] Apply migration to `dev` schema via Supabase CLI
- [ ] Track schema changes via changelog

---

## 🍪 Step 5: Version Cookie Setup

- [ ] Generate cookie toggle logic (`app_version_cookie`)
- [ ] Create browser utility to set context
- [ ] Add backend resolver to switch schema per cookie
- [ ] Mark user session with branch-aware version tags

---

## 🧪 Step 6: Local Runtime Validation

- [ ] Start dev server (`npm run dev`)
- [ ] Check health route `GET /health`
- [ ] Validate connection to Supabase
- [ ] Confirm Clerk auth and session handling
- [ ] Confirm push service registration

---

## 📦 Step 7: Production Prep

- [ ] Create `.env.production` file stub
- [ ] Validate Vercel CLI access
- [ ] Push schema to `public` schema (non-destructive)
- [ ] Deploy branch `main` and confirm status
- [ ] Apply RLS from `tenants.md`

---

## 🔄 Optional Automation Tasks

- [ ] Create Git repository if missing (`git init`)
- [ ] Stage base commit with all docs + `.env.local`
- [ ] Create `main`, `dev`, and `feature/template` branches
- [ ] Add remote origin (manual or prompted)

---

## 🧙 Universal Permissions

Universal CLI is permitted to:

- Run system commands (`npm`, `supabase`, `vercel`)  
- Generate and correct `.md` files non-destructively  
- Apply SQL logic and schema diffs  
- Track version logic across CLI tools  
- Ask questions to repair or enhance project state  
- Operate before and after Git initialization  
- Interface with Vercel and Supabase APIs when configured

All changes are logged and versioned.

---

## 🚀 Completion Output

Once onboarding completes:

- `.env.local` is ready  
- Local server validated  
- Migration files linted  
- Git initialized  
- Production deploy status marked  
- Context restored across all modules

You are now ready to develop, fix features, or deploy branches confidently.