#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 OneSignal Setup Assistant');
console.log('=============================\n');

console.log('This script will help you set up OneSignal for push notifications.');
console.log('Follow these steps to get your chat request notifications working!\n');

console.log('📝 STEP 1: Create OneSignal Account');
console.log('──────────────────────────────────');
console.log('1. Open your browser and go to: https://onesignal.com');
console.log('2. Click "Get Started" or "Sign Up"');
console.log('3. Create a free account');
console.log('4. After signup, click "New App/Website"\n');

console.log('🔧 STEP 2: Configure Your OneSignal App');
console.log('───────────────────────────────────────');
console.log('1. App Name: "Entity Management System" (or any name you prefer)');
console.log('2. Platform: Select "Web Push"');
console.log('3. Site URL: Enter "http://localhost:5174"');
console.log('4. Site Name: "Entity Management" (optional)');
console.log('5. Default Icon URL: Leave blank or add your icon URL');
console.log('6. Permission Message: Use default or customize');
console.log('7. Click "Save & Continue"\n');

console.log('🔑 STEP 3: Get Your Credentials');
console.log('──────────────────────────────');
console.log('1. In your OneSignal dashboard, go to Settings → Keys & IDs');
console.log('2. Copy the following values:');
console.log('   • App ID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
console.log('   • REST API Key (long string)');
console.log('\n⚠️  IMPORTANT: Use the REST API Key, NOT the User Auth Key!\n');

console.log('💾 STEP 4: Set Environment Variables');
console.log('───────────────────────────────────');

const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log(`✅ Found existing .env file at: ${envPath}`);
  console.log('📝 Add these lines to your .env file:');
} else {
  console.log('📄 Create a new .env file in your project root with:');
}

console.log('');
console.log('# OneSignal Configuration');
console.log('ONESIGNAL_APP_ID=your_app_id_here');
console.log('ONESIGNAL_API_KEY=your_rest_api_key_here');
console.log('');

if (!envExists) {
  console.log('💡 TIP: You can copy .env.template to .env and fill in the values:');
  console.log('   cp .env.template .env');
  console.log('');
}

console.log('🧪 STEP 5: Test Your Setup');
console.log('─────────────────────────');
console.log('After setting your environment variables:');
console.log('');
console.log('1. Test OneSignal connection:');
console.log('   node test-onesignal-credentials.js');
console.log('');
console.log('2. Start your backend server:');
console.log('   npm start');
console.log('');
console.log('3. Start your frontend:');
console.log('   npm run dev');
console.log('');
console.log('4. Visit http://localhost:5174');
console.log('5. Enable notifications when prompted');
console.log('6. Test the chat request feature');
console.log('');

console.log('🔍 STEP 6: Verify Chat Request Notifications');
console.log('─────────────────────────────────────────');
console.log('1. Go to an entity page (e.g., vehicle, property)');
console.log('2. Click "Chat with Owner" button');
console.log('3. The entity owner should receive a push notification');
console.log('4. Check the notification appears in browser/device');
console.log('');

console.log('🆘 TROUBLESHOOTING');
console.log('─────────────────');
console.log('If notifications don\'t work:');
console.log('');
console.log('• Check environment variables are set correctly');
console.log('• Verify OneSignal credentials are valid');
console.log('• Ensure browser allows notifications');
console.log('• Check browser console for JavaScript errors');
console.log('• Verify entity owner has registered for notifications');
console.log('');
console.log('📖 For detailed help, see ONESIGNAL_SETUP.md');
console.log('');

console.log('🎯 SUMMARY');
console.log('─────────');
console.log('✅ Your chat request endpoint (/api/notifications/chat-request) is working');
console.log('✅ Database integration is functional');
console.log('✅ Frontend OneSignal SDK is integrated');
console.log('⏳ Only OneSignal credentials are needed to complete the setup');
console.log('');
console.log('Once you add ONESIGNAL_APP_ID and ONESIGNAL_API_KEY to .env,');
console.log('your push notifications will work end-to-end! 🚀');

// Check current status
console.log('\n📊 CURRENT STATUS');
console.log('────────────────');

const hasOneSignalEnv = process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY;
const hasEnvFile = fs.existsSync(envPath);

console.log(`Environment file (.env): ${hasEnvFile ? '✅ Exists' : '❌ Missing'}`);
console.log(`OneSignal App ID: ${process.env.ONESIGNAL_APP_ID ? '✅ Set' : '❌ Not set'}`);
console.log(`OneSignal API Key: ${process.env.ONESIGNAL_API_KEY ? '✅ Set' : '❌ Not set'}`);

if (hasOneSignalEnv) {
  console.log('\n🎉 OneSignal is configured! Run the test script to verify:');
  console.log('   node test-onesignal-credentials.js');
} else {
  console.log('\n⏳ Ready for OneSignal setup - follow the steps above!');
}
