const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const oneSignalApiKey = process.env.ONESIGNAL_API_KEY;
const oneSignalAppId = process.env.ONESIGNAL_APP_ID;
const oneSignalBaseUrl = 'https://onesignal.com/api/v1';

console.log('🔧 OneSignal Configuration Test');
console.log('================================');
console.log('API Key:', oneSignalApiKey ? `${oneSignalApiKey.substring(0, 20)}...` : 'NOT SET');
console.log('App ID:', oneSignalAppId || 'NOT SET');
console.log('Base URL:', oneSignalBaseUrl);
console.log('');

async function testOneSignalConnection() {
  if (!oneSignalApiKey || !oneSignalAppId) {
    console.error('❌ OneSignal credentials not configured');
    process.exit(1);
  }

  try {
    console.log('🔍 Testing OneSignal App Details...');
    
    // Test 1: Get app details
    const appResponse = await axios.get(
      `${oneSignalBaseUrl}/apps/${oneSignalAppId}`,
      {
        headers: {
          'Authorization': `Basic ${oneSignalApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ App Details Retrieved Successfully');
    console.log('App Name:', appResponse.data.name);
    console.log('Created At:', appResponse.data.created_at);
    console.log('Updated At:', appResponse.data.updated_at);
    console.log('Players:', appResponse.data.players);
    console.log('Platform:', appResponse.data.chrome_web_gcm_sender_id ? 'Web configured' : 'Web not configured');
    console.log('');

    // Test 2: Get players (devices)
    console.log('🔍 Testing Player List...');
    const playersResponse = await axios.get(
      `${oneSignalBaseUrl}/players?app_id=${oneSignalAppId}&limit=5`,
      {
        headers: {
          'Authorization': `Basic ${oneSignalApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Players Retrieved Successfully');
    console.log('Total Players:', playersResponse.data.total_count);
    console.log('Active Players:', playersResponse.data.players?.length || 0);
    
    if (playersResponse.data.players && playersResponse.data.players.length > 0) {
      console.log('Sample Player IDs:');
      playersResponse.data.players.slice(0, 3).forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.id} (${player.device_type}, last_active: ${player.last_active})`);
      });
    } else {
      console.log('⚠️  No players found - you may need to register some devices first');
    }
    console.log('');

    // Test 3: Test notification sending capability (dry run)
    console.log('🔍 Testing Notification API (dry run)...');
    
    // Create a test notification that won't actually send
    const testNotificationPayload = {
      app_id: oneSignalAppId,
      // Use a fake player ID for testing
      include_player_ids: ['test-player-id-that-does-not-exist'],
      headings: { en: "Test Notification" },
      contents: { en: "This is a test notification from your notification system." },
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    try {
      const notificationResponse = await axios.post(
        `${oneSignalBaseUrl}/notifications`,
        testNotificationPayload,
        {
          headers: {
            'Authorization': `Basic ${oneSignalApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Notification API Response:', notificationResponse.data);
    } catch (notificationError) {
      // This is expected since we're using a fake player ID
      if (notificationError.response?.status === 400) {
        console.log('✅ Notification API is working (expected 400 error for fake player ID)');
        console.log('Error details:', notificationError.response.data);
      } else {
        console.log('❌ Unexpected notification error:', notificationError.message);
      }
    }
    
    console.log('');
    console.log('🎉 OneSignal Integration Test Complete!');
    console.log('Summary: OneSignal API is accessible and configured correctly.');
    
  } catch (error) {
    console.error('❌ OneSignal Test Failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    console.error('');
    console.error('Common issues:');
    console.error('- Invalid API key');
    console.error('- Invalid App ID');
    console.error('- Network connectivity issues');
    console.error('- OneSignal service unavailable');
    process.exit(1);
  }
}

testOneSignalConnection();
