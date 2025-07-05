# 🔧 Setup & Deployment Guide

This document provides configuration steps for both local development and production deployment via Vercel. It also outlines `.env` variables essential for integrating Clerk, Supabase, Resend, OneSignal, and custom platform services.

---

## 🧪 Local Development (.env.local)

Place your `.env.local` file inside the `www/` root with the following keys:

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CLERK_JWKS_URL=
ONESIGNAL_API_KEY=
ONESIGNAL_APP_ID=
API_TOKEN=
API_BASE_URL=
BASE_CHAT_URL=
BASE_API_URL=
SENTRY_DSN_BACKEND=
SENTRY_ENV=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_VERSION_COOKIE_NAME=app_version_cookie

💡 Clerk will be fully integrated later. Until then, OTP login will be handled manually using Resend to send verification codes.

---

## 🚀 Production Deployment (Vercel)

Environment variables for Vercel should match `.env.local` but must be defined via the Vercel dashboard or vercel.json. For secure deployment:

- Enable build cache
- Add health check endpoint (e.g. GET /health)
- Use edge functions for performance if applicable
- Clerk + Supabase secrets should be set via “Environment Variables” tab

Example `vercel.json`:

{
  "framework": null,
  "builds": [{ "src": "src/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/src/index.js" }]
}

---

## 📦 Runtime Services

Integration   | Description             | Setup Source
--------------|-------------------------|--------------
Supabase      | DB, Realtime, Storage   | Supabase Console
Clerk         | Auth, JWT, metadata     | Clerk Dashboard
Resend        | OTP via Email           | Resend Console
OneSignal     | Push notifications      | OneSignal Console
Platform APIs | Chat, external links    | Internal config

---

## 🧱 Project Structure

www/
├── .env.local
├── README.md
├── docs/
│   └── setup.md
├── .gemini/
│   └── settings.json
├── src/
│   └── ...                   # API routes, DB logic, etc.
---

## 🧙 Universal CLI

Universal CLI reads its context from `.gemini/settings.json`:

{
  "contextFileName": "docs/CLI_CONTEXT.md",
  "theme": "GitHub",
  "autoAccept": true,
  "fileFiltering": {
    "respectGitIgnore": true,
    "enableRecursiveFileSearch": true
  }
}

Launch Universal from `/www` to begin AI-assisted coding and doc exploration.
