# 🔐 Authentication Flow

This module defines how users interact with the system securely using email-based OTP for initial access, and how the flow transitions into full Clerk integration for scalable session and identity management.

---

## 🔑 Phase 1: OTP Login (In-House via Resend)

Logged-in users will authenticate via email using a one-time passcode.

### 1. Request OTP

POST /auth/request-otp

Payload:
{
  "email": "user@example.com"
}

System uses `RESEND_API_KEY` to send OTP from `RESEND_FROM_EMAIL`.

---

### 2. Verify OTP

POST /auth/verify-otp

Payload:
{
  "email": "user@example.com",
  "code": "123456"
}

Successful validation returns a session token.

---

### 3. Session Handling

Session tokens are JWTs tied to the user's email.

Stored in cookie or passed as Authorization: Bearer {token}

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

- Browse entities
- Request attributes (via `visitorToken`)
- Subscribe for notifications (deviceToken only)
- Their requests and interactions are logged anonymously

---

## 🧩 Merge Strategy

If a visitor later logs in:

- Match deviceToken → Clerk userId
- Migrate notifications history
- Update logs to associate requests with user identity

---

## 🧙 Env Variables Used

From `.env.local`:

RESEND_API_KEY=
RESEND_FROM_EMAIL=
CLERK_JWKS_URL=
ONESIGNAL_API_KEY=
API_TOKEN=
