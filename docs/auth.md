# 🔐 Authentication Flow

This module defines how users interact with the system securely using email-based OTP for initial access, and how the flow transitions into full Clerk integration for scalable session and identity management.

---

## 🔑 Phase 1: OTP Login (In-House via Resend)

Logged-in users will authenticate via email using a one-time passcode.

### 1. Send OTP

POST /api/auth/send-otp

Payload:
{
  "email": "user@example.com",
  "tenantId": "default"  // optional, defaults to "default"
}

System uses `RESEND_API_KEY` to send OTP from `RESEND_FROM_EMAIL`. In development mode, OTP is logged to console instead of sending email.

---

### 2. Verify OTP

POST /api/auth/verify-otp

Payload:
{
  "email": "user@example.com",
  "otp": "123456",
  "tenantId": "default"  // optional, defaults to "default"
}

Successful validation returns a **persistent** session token that never expires until logout.

---

### 3. Session Handling

Session tokens are **persistent JWTs** tied to the user's email with no expiration.

- Passed as `Authorization: Bearer {token}`
- Tokens remain valid until explicit logout
- Support for both OTP-based and Clerk-based authentication
- Development mode supports `dev-token` for testing

### 4. Get Current User

GET /api/auth/me  
Authorization: Bearer {token}

Returns current user information.

### 5. Logout

POST /api/auth/logout  
Authorization: Bearer {token}

Invalidates the current session token permanently.

---

## 🔁 Transition to Clerk

Later phases will replace OTP with Clerk:

- Social login (Google, Apple, etc.)
- Magic links or passwordless flows
- JWT validated against `CLERK_JWKS_URL`
- Clerk `userId` used across all APIs and logs

---

## 🔐 Session Security

JWT validation middleware checks:

- Email or Clerk `userId`
- Expiration timestamp
- Token signature (in Clerk phase)

---

## 🧠 User Metadata

When Clerk is active, users may carry:

- `publicMetadata.tenant_id`
- `preferences` (e.g. reminder frequency)
- `devices` (push tokens for notifications)
- `account_type` (admin, tenant, guest)

---

## 🔓 Visitor Mode (Anonymous)

Visitors not logged in can:

- Browse entities (GET /api/entities)
- View individual entities (GET /api/entities/:id)
- Subscribe for notifications (deviceToken only)
- Their requests and interactions are logged anonymously

**Note**: Attribute requests currently require authentication. Anonymous attribute requests are not yet implemented.

---

## 🧩 Merge Strategy

If a visitor later logs in:

- Match deviceToken → User ID (POST /api/notifications/merge-device)
- Migrate notifications history
- Update logs to associate requests with user identity

**Current Implementation**: Device subscription merging is implemented for push notifications.

---

## 🧙 Environment Variables Used

From `.env.local`:

```
RESEND_API_KEY=          # For sending OTP emails
RESEND_FROM_EMAIL=       # From address for OTP emails
CLERK_JWKS_URL=          # For Clerk JWT validation (optional)
JWT_SECRET=              # For signing persistent tokens (auto-generated if not set)
ONESIGNAL_API_KEY=       # For push notifications
ONESIGNAL_APP_ID=        # OneSignal app ID
```

---

## 🚧 Current Implementation Status

**Implemented Features:**
- ✅ OTP-based authentication via email
- ✅ Persistent JWT tokens (no expiration)
- ✅ Session management with logout capability
- ✅ Multi-tenant support in tokens
- ✅ Development mode with console OTP logging
- ✅ Clerk JWT validation support (when configured)
- ✅ Device token merging for notifications
- ✅ Anonymous browsing capabilities

**Pending Features:**
- ⏳ Full Clerk integration for social login
- ⏳ Magic link authentication
- ⏳ Anonymous attribute requests with visitor tokens
- ⏳ User metadata management
- ⏳ Account type differentiation (admin, tenant, guest)
