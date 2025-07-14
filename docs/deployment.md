# 🚀 Deployment & Versioning Strategy

This document outlines best practices for safe deployment, environment management, and development workflows. The system supports unified domain hosting, version control via cookies, and schema separation inside a single database—all optimized for iterative architecture evolution.

---

## 🔀 Git Flow & Branching

- Use `main` for production
- Use `staging` for pre-production testing
- Create feature branches:
  - `feature/reminders-engine`
  - `fix/attribute-sync`
  - `refactor/entities-model`

### Pull Request Guidelines

- All feature branches must be reviewed before merging
- Tag PRs with `@version` label if DB changes or API modifications occur
- Each milestone in [`roadmap.md`] matches a release tag:
  - `v1-alpha`, `v1-beta`, `v2-staging`, etc.

### GitHub Actions

- Automated testing on push to `main` and `staging` branches
- Unit tests run via `npm test`
- Staging deployment tests (when accessible)
- Image upload functionality testing

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

**Note**: Cookie-based version routing is not currently implemented in the codebase.

**Current Implementation**: 
- Single deployment environment per branch
- Environment determined by deployment target (Vercel)
- Multi-tenant support via tenant context in requests

**Future Enhancement**: Cookie-based routing could be implemented to:
- Set `app_version_cookie=dev` for development view
- UI and API use this cookie to determine context
- If cookie is absent, default to `main` (production)

---

## 🗃 Database Environment Strategy

**Current Implementation**: Single Supabase instance with `public` schema.

**Tables**:
- `mtcli_entities` - Entity storage
- `mtcli_entity_categories` - Entity type definitions
- `mtcli_interactions` - Interaction logging
- `mtcli_images` - Image metadata
- `mtcli_push_subscriptions` - Push notification subscriptions

**Multi-tenant Support**: Achieved via `tenant_id` field in entities and tenant context in API requests.

**Future Enhancement**: Multiple schemas could be implemented:
| Schema     | Purpose              | Notes                                   |
|------------|----------------------|-----------------------------------------|
| `public`   | Production data       | Used by live site                       |
| `dev`      | Development testing   | RLS matches context if needed           |

---

## 🧩 SQL Change Tracking

All schema changes are stored inside:
```/www/src/db/migrations/```

**Current Migration Files**:
- `001-init.sql` - Initial database setup
- `002-fix-relationships.sql` - Relationship fixes
- `003-images.sql` - Image storage setup
- `004-push-subscriptions.sql` - Push notification tables
- `006_add_fallback_support.sql` - Fallback image support

**Supabase Migrations**:
- `supabase/migrations/20250709183057_remote_schema.sql` - Remote schema sync

**Best Practice**:
- Every file includes a header with version and description
- SQL files should be synced with Git tags and roadmap milestones
- Supabase CLI used for migration management

---

## 🧠 Sentry Tracking Integration

**Current Implementation**: Sentry is integrated in the backend.

### Backend Integration

- ✅ Sentry SDK integrated in Fastify/Node (`src/index.js`)
- ✅ Tracks API errors and exception traces
- ✅ Initialized with DSN and environment configuration

**Environment Variables**:
```
SENTRY_DSN_BACKEND=     # Backend Sentry DSN
SENTRY_ENV=             # Environment (development/production)
```

### Frontend Integration

**Status**: Not yet implemented for the React UI.

**Future Enhancement**: Frontend Sentry integration could include:
- Route-level error capture
- UI event tracking: failed requests, auth failures
- User context and tenant information
- Version-aware error grouping

---

## 🧪 Local Development Setup

**Current Steps**:

1. Clone repo  
2. Create `.env.local` using `setup.md` variables  
3. Run: `npm run dev` (starts backend on port 3000)
4. Run: `cd ui && npm run dev` (starts frontend on port 5173)
5. Backend serves API endpoints and static files
6. Frontend connects to backend API

**Scripts Available**:
- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

---

## 📦 Production Deployment (Vercel)

**Current Setup**:
- ✅ Vercel configuration in `vercel.json`
- ✅ Node.js runtime with `@vercel/node`
- ✅ All routes directed to `src/index.js`
- ✅ Production environment variables set in Vercel dashboard

**Required Environment Variables**:
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Authentication: `JWT_SECRET`, `CLERK_JWKS_URL` (optional)
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Notifications: `ONESIGNAL_API_KEY`, `ONESIGNAL_APP_ID`
- Monitoring: `SENTRY_DSN_BACKEND`, `SENTRY_ENV`

**Health Check**: `GET /health` endpoint available for monitoring

**Deployment Triggers**:
- Push to `main` branch triggers production deployment
- GitHub Actions run tests before deployment

---

## 🔐 Supabase RLS & Security

**Current Implementation**:
- ✅ Service role used for backend operations
- ✅ Tenant isolation via `tenant_id` fields
- ✅ Entity ownership validation in API layer
- ✅ Authentication middleware for protected endpoints

**Security Features**:
- Entity access control (owners vs public entities)
- Image upload restricted to entity owners
- Attribute requests require authentication
- Rate limiting on sensitive operations

**Future RLS Enhancement**:
- Row Level Security policies for additional database-level protection
- Schema separation for environment isolation
- Role-based access control for different user types

---

## 🧙 Universal CLI Integration

Universal CLI reads architectural context from `docs/CLI_CONTEXT.md`.

Be sure to update:
- Update `docs/CLI_CONTEXT.md` with major architecture decisions
    - Deployment strategy  
    - Branching logic  
    - Schema separation rules  
    - SQL migration policy
- Include deployment strategy, branching logic, and version tracking notes

---

## 🚧 Current Implementation Status

**Implemented Features**:
- ✅ Vercel deployment configuration
- ✅ GitHub Actions CI/CD pipeline
- ✅ Database migrations tracking
- ✅ Environment variable management
- ✅ Health check endpoint
- ✅ Sentry error tracking (backend)
- ✅ Multi-tenant architecture
- ✅ Production-ready API structure

**Pending Features**:
- ⏳ Cookie-based version routing
- ⏳ Multiple database schemas for environments
- ⏳ Frontend Sentry integration
- ⏳ Edge caching configuration
- ⏳ Automated database migration deployment
- ⏳ Staging environment setup
- ⏳ Load testing and performance monitoring
