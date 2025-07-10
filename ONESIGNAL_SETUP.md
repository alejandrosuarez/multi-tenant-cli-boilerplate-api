# OneSignal Setup Guide

## 🚀 Getting OneSignal Credentials

### 1. Create OneSignal Account
1. Go to https://onesignal.com
2. Sign up for a free account
3. Click "New App/Website"

### 2. Configure Your App
1. **App Name**: Enter your app name (e.g., "Entity Management System")
2. **Platform**: Select "Web Push"
3. **Site URL**: Enter `http://localhost:5174` (for development)
4. **Default Icon URL**: (Optional) Enter icon URL or skip
5. **Permission Message**: Customize or use default

### 3. Get Your Credentials
After creating the app, you'll get:

#### App ID
- Found in Settings > Keys & IDs
- Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

#### REST API Key
- Found in Settings > Keys & IDs
- Format: `Basic xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Important**: Use the full key including "Basic " prefix for API calls

### 4. Configure Environment Variables

Create a `.env` file in your project root with:

```bash
# OneSignal Configuration
ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_API_KEY=your_rest_api_key_here

# Other existing environment variables...
```

## 🧪 Testing OneSignal Integration

### Manual Test Script
Run this to test your OneSignal setup:

```bash
node test-onesignal.js
```

### Expected Results
- ✅ Connection to OneSignal API
- ✅ App details retrieved
- ✅ Test notification sent (to valid player ID)

## 🔧 Troubleshooting

### Common Issues:

1. **Invalid API Key Error**
   - Make sure to use the REST API Key, not User Auth Key
   - Include "Basic " prefix if using manually

2. **App Not Found Error**
   - Double-check the App ID format
   - Ensure the app is created and active

3. **Player ID Not Found**
   - Player IDs are generated when users subscribe
   - Use real OneSignal player IDs from actual devices

## 📱 Frontend Integration

Your frontend is already configured with OneSignal SDK. Once you set the environment variables:

1. Start the backend: `npm start`
2. Start the frontend: `npm run dev`
3. Go to http://localhost:5174
4. Enable notifications in the browser
5. Test the chat request feature

## ✅ Verification Steps

1. Set environment variables ✓
2. Restart backend server ✓
3. Test OneSignal connection ✓
4. Register device in frontend ✓
5. Test chat request notification ✓
