# 🔐 CLI Agent Permissions & Access Ledger

This document outlines command and mutation scopes for all CLI agents operating within the system. It provides transparency into what each agent is authorized to perform, how delegation works, and how changes are tracked.

---

## 🧠 Context

All CLI agents use:

- Core spec: `.cli/settings.json`
- Overrides: agent-specific `settings.json` files (`.gemini/`, `.claude/`)
- Context file: `docs/CLI_CONTEXT.md`

Permissions declared below are subject to audit and tracked via commit history.

---

## 🧙 Gemini CLI

Source: `.gemini/settings.json`

- Delegates to: `.cli/settings.json`
- Agent ID: `Gemini`
- Permissions:
  - ✅ Can autocorrect Markdown files
  - ✅ Can generate SQL headers
  - ✅ Can initialize Git
  - ✅ Can run system commands:
    - `npm install`
    - `npm run dev`
    - `supabase db push`
    - `vercel deploy`
  - ✅ Can patch `.env.local` and `.env.production`
  - ✅ Can apply SQL to dev schema
  - ✅ Tracks commits and audit logs
  - 🛑 Requires confirmation before production push

---

## 🤖 Claude CLI

Source: `.claude/settings.json`

- Delegates to: `.cli/settings.json`
- Agent ID: `Claude`
- Permissions:
  - ❌ Cannot autocorrect docs
  - ✅ Can generate SQL headers
  - ❌ Cannot initialize Git
  - ✅ Can run system commands:
    - `npm run dev`
    - `supabase db push`
  - ✅ Can apply SQL to dev schema
  - 🛑 Does NOT require confirmation before production push (override)
  - ✅ Tracks audit logs and schema state

---

## 🔮 Universal CLI Scope

Defined in: `.cli/settings.json`

All CLI agents must comply with:

- Cookie routing logic: `app_version_cookie`
- Environment context injection
- Supabase schema map for `main` and `dev`
- Structured SQL headers: `@version`, `@description`, `@generated_at`
- Non-destructive onboarding and autocorrect behaviors (if allowed)
- Observability config via Sentry DSN keys

---

## 📦 Adding New Agents

To onboard a new CLI agent:

1. Create `.<agent>/settings.json`
2. Point `delegateSettingsTo` to `.cli/settings.json`
3. Define `permissions` and `overrides` as needed
4. Track changes in `.cli/AUTH.md`

Each CLI agent must operate within defined boundaries and respect the system’s modular, multi-tenant design principles.

---

Welcome to a project where agents coexist, audit transparently, and evolve in harmony.
