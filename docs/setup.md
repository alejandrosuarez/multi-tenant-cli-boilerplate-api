# 🔧 Setup & Deployment Guide

This document provides configuration steps for both local development and production deployment via Vercel. It also outlines `.env` variables essential for integrating Clerk, Supabase, Resend, OneSignal, and custom platform services.

---

## 🧪 Local Development Setup

### Step 1: Environment Configuration

Copy the template file and configure your environment:

```bash
cp .env.template .env.local
```

**Required Variables** (for core functionality):
```bash
# Database (Required)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Push Notifications (Required for notifications)
ONESIGNAL_API_KEY=your_onesignal_api_key
ONESIGNAL_APP_ID=your_onesignal_app_id

# API Security (Required)
API_TOKENS=dev-token-123,your_api_token_2
ALLOWED_DOMAINS=http://localhost:3000,http://localhost:5174
```

**Optional Variables**:
```bash
# Authentication (Optional - for Clerk integration)
JWT_SECRET=your_jwt_secret
CLERK_JWKS_URL=your_clerk_jwks_url

# Email Services (Optional - for OTP emails)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Error Tracking (Optional)
SENTRY_DSN_BACKEND=your_sentry_dsn
SENTRY_ENV=development

# Application
NODE_ENV=development
```

### Step 2: Install Dependencies & Start

```bash
npm install
npm run dev
```

**Development URLs**:
- Backend API: http://localhost:3000
- Frontend UI: http://localhost:5173 (run `cd ui && npm run dev`)
- Health Check: http://localhost:3000/health

💡 **Authentication**: Currently uses OTP-based authentication. Clerk integration is optional and can be added later.

---

## 🚀 Production Deployment (Vercel)

### Step 1: Vercel Configuration

The project includes a `vercel.json` configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

**Required for Production**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ONESIGNAL_API_KEY`
- `ONESIGNAL_APP_ID`
- `JWT_SECRET`

**Optional but Recommended**:
- `RESEND_API_KEY` (for OTP emails)
- `RESEND_FROM_EMAIL`
- `SENTRY_DSN_BACKEND` (for error tracking)
- `SENTRY_ENV=production`
- `CLERK_JWKS_URL` (if using Clerk)

### Step 3: Deployment

```bash
# Deploy to Vercel
vercel --prod

# Or connect GitHub for automatic deployments
```

**Production Features**:
- ✅ Health check endpoint: `/health`
- ✅ Automatic HTTPS
- ✅ Environment variable management
- ✅ GitHub Actions CI/CD integration

---

## 📦 Service Integration Setup

| Service    | Purpose                    | Setup Required | Status      |
|------------|----------------------------|----------------|-------------|
| Supabase   | Database, Storage          | ✅ Required    | ✅ Active   |
| OneSignal  | Push Notifications         | ✅ Required    | ✅ Active   |
| Resend     | OTP Email Delivery         | ⚠️ Optional    | ✅ Active   |
| Clerk      | Advanced Authentication    | ⚠️ Optional    | 🔄 Planned  |
| Sentry     | Error Tracking             | ⚠️ Optional    | ✅ Active   |

### Supabase Setup
1. Create project at https://supabase.com
2. Run SQL migrations from `src/db/migrations/`
3. Enable Storage for image uploads
4. Copy URL and keys to environment variables

### OneSignal Setup
1. Create Web Push app at https://onesignal.com
2. Configure for your domain
3. Copy App ID and REST API Key
4. See `ONESIGNAL_SETUP.md` for detailed instructions

### Resend Setup (Optional)
1. Create account at https://resend.com
2. Verify your sending domain
3. Generate API key
4. Configure FROM email address

### Sentry Setup (Optional)
1. Create project at https://sentry.io
2. Copy DSN for backend integration
3. Configure environment (development/production)

---

## 🧱 Project Structure

```
www/
├── .env.local                # Local environment variables
├── .env.example             # Environment variable examples
├── .env.template            # Detailed environment template
├── package.json             # Node.js dependencies
├── vercel.json              # Vercel deployment config
├── jest.config.js           # Test configuration
├── docs/                    # Documentation
│   ├── setup.md
│   ├── api-reference.md
│   └── ...
├── src/                     # Backend source code
│   ├── index.js            # Main server file
│   ├── middleware/         # Authentication middleware
│   ├── services/           # Business logic services
│   └── db/                 # Database migrations
├── ui/                      # Frontend React application
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── tests/                   # Test files
├── supabase/               # Supabase configuration
└── .github/                # GitHub Actions workflows
```

## 🧙 AI Assistant Integration

The project supports multiple AI assistants:

### Universal CLI (.gemini/settings.json)
```json
{
  "contextFileName": "docs/CLI_CONTEXT.md",
  "theme": "GitHub",
  "autoAccept": true,
  "fileFiltering": {
    "respectGitIgnore": true,
    "enableRecursiveFileSearch": true
  }
}
```

### Claude (.claude/settings.json)
```json
{
  "contextFileName": "docs/CLI_CONTEXT.md",
  "theme": "GitHub"
}
```

Launch from `/www` directory to begin AI-assisted development.

---

## 🚧 Quick Start Checklist

**Minimum Setup** (for basic functionality):
- [ ] Copy `.env.template` to `.env.local`
- [ ] Configure Supabase credentials
- [ ] Configure OneSignal for notifications
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test health endpoint: http://localhost:3000/health

**Full Setup** (for production):
- [ ] Complete minimum setup
- [ ] Configure Resend for OTP emails
- [ ] Configure Sentry for error tracking
- [ ] Set up Vercel deployment
- [ ] Configure production environment variables
- [ ] Run database migrations
- [ ] Test all API endpoints

**Development Workflow**:
- [ ] Start backend: `npm run dev`
- [ ] Start frontend: `cd ui && npm run dev`
- [ ] Run tests: `npm test`
- [ ] Check health: http://localhost:3000/health

---

## 🔧 Troubleshooting

**Common Issues**:

1. **Database Connection Failed**
   - Verify Supabase credentials in `.env.local`
   - Check network connectivity
   - Ensure service role key has proper permissions

2. **Push Notifications Not Working**
   - Verify OneSignal App ID and API Key
   - Check browser notification permissions
   - Review OneSignal dashboard for errors

3. **OTP Emails Not Sending**
   - Verify Resend API key and FROM email
   - Check email domain verification
   - Review Resend dashboard logs

4. **Image Uploads Failing**
   - Verify Supabase Storage is enabled
   - Check file size limits (5MB max)
   - Ensure proper file types (JPEG, PNG, WebP)

**Debug Endpoints** (development only):
- `/api/debug/otp-stats` - OTP statistics
- `/api/debug/session-stats` - Session information
- `/api/debug/user-subscriptions` - User notification subscriptions
