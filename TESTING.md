# Testing the Multi-Tenant CLI UI

## 🔧 Fixed Issues

### CORS Configuration
- ✅ Added `@fastify/cors` package (v8.0.0 for Fastify 4.x)
- ✅ Configured CORS to allow requests from UI development servers
- ✅ Supports origins: `localhost:5173`, `localhost:3001`, `localhost:4173`
- ✅ Enables credentials and proper HTTP methods

### OTP Development Mode
- ✅ Added development mode for OTP service
- ✅ Logs OTP codes to backend console when email service isn't configured
- ✅ UI shows helpful message about checking backend console
- ✅ No email configuration required for testing

## 🚀 Quick Start Testing

### Option 1: Use the Test Script
```bash
./test-ui.sh
```

### Option 2: Manual Setup

1. **Start Backend** (in project root):
   ```bash
   NODE_ENV=development node src/index.js
   ```

2. **Start UI** (in separate terminal):
   ```bash
   cd ui
   npm run dev
   ```

3. **Open Browser**: Navigate to `http://localhost:5173`

## 🔐 Testing OTP Authentication

1. **Enter Email**: Use any email address (e.g., `test@example.com`)
2. **Optional Tenant**: Leave as "default" or enter custom tenant ID
3. **Click "Send Verification Code"**
4. **Check Backend Console**: Look for log message like:
   ```
   🔐 OTP for test@example.com (default): 123456
   📧 Email service not configured - OTP logged to console
   ```
5. **Enter OTP**: Copy the 6-digit code from console and paste in UI
6. **Verify**: Click "Verify Code" to complete authentication

## 🎯 Expected Behavior

### Successful Flow
1. Email input → Success message about checking console
2. Backend logs OTP code
3. OTP verification → Dashboard with user info
4. Dashboard shows entities, categories, and real-time updates

### Error Handling
- Invalid OTP → Clear error message
- Expired OTP → Appropriate error
- Network issues → Connection error messages

## 🔍 API Endpoints Working

- ✅ `POST /api/auth/send-otp` - Sends OTP (dev mode)
- ✅ `POST /api/auth/verify-otp` - Verifies OTP and returns JWT
- ✅ `GET /api/auth/me` - Gets current user info
- ✅ `GET /api/entities` - Lists entities (requires auth)
- ✅ `GET /api/categories` - Lists categories
- ✅ CORS headers properly configured

## 🐛 Troubleshooting

### CORS Errors
- Ensure backend is running with CORS configuration
- Check that UI is running on allowed origin (localhost:5173)
- Verify `@fastify/cors` v8.0.0 is installed

### OTP Not Working
- Check backend console for OTP logs
- Ensure `NODE_ENV=development` is set
- Verify OTP hasn't expired (5 minutes)

### UI Not Loading
- Check that both backend (3000) and UI (5173) are running
- Verify `.env.local` has correct `VITE_API_URL=http://localhost:3000`
- Check browser console for errors

### Database Errors
- Ensure Supabase connection is configured
- Check that required tables exist
- Verify environment variables are set

## 🎨 UI Features to Test

1. **Authentication Flow**
   - Email input validation
   - OTP code input (6 digits)
   - Success/error messaging
   - Automatic redirect to dashboard

2. **Dashboard**
   - User info display (email, tenant)
   - Entity list with pagination
   - Category filtering
   - Real-time updates toggle
   - Search functionality

3. **Entity Management**
   - Create new entity form
   - Edit existing entities
   - Delete entities (with confirmation)
   - Image upload (if entity exists)
   - Dynamic attributes

4. **Responsive Design**
   - Mobile layout
   - Desktop layout
   - Neumorphic styling
   - Smooth animations

## 📝 Notes

- **Development Mode**: OTP codes are logged to console, no email required
- **Production Mode**: Requires Resend API key for actual email sending
- **Tenant Context**: Handled via JWT token and headers, not UI selection
- **Real-time**: Uses polling (configurable interval), not WebSockets yet