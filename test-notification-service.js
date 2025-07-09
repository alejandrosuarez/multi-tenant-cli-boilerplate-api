const DatabaseService = require('./src/services/database');
const NotificationService = require('./src/services/notification');
require('dotenv').config({ path: '.env.local' });

async function testNotificationService() {
  console.log('🔧 Testing Notification Service Integration');
  console.log('===========================================');
  
  try {
    // Initialize services
    const db = new DatabaseService();
    const notificationService = new NotificationService(db);
    
    console.log('✅ Services initialized');
    
    // Test 1: Health check
    console.log('\n🔍 Testing Health Check...');
    const healthResult = await notificationService.healthCheck();
    console.log('Health Status:', healthResult.status);
    console.log('Health Checks:', healthResult.checks);
    
    // Test 2: Subscribe a test device with a real player ID
    console.log('\n🔍 Testing Device Subscription...');
    const realPlayerId = '475ebed5-baa9-4a96-be6d-3b58303a047d'; // From the OneSignal test
    
    const subscriptionResult = await notificationService.subscribeDevice(
      realPlayerId,
      'test-user-123',
      'default',
      {
        platform: 'web',
        user_agent: 'test-agent',
        player_id: realPlayerId,
        subscribed_at: new Date().toISOString()
      }
    );
    
    console.log('Subscription Result:', subscriptionResult);
    
    if (subscriptionResult.success) {
      console.log('✅ Device subscribed successfully');
      
      // Test 3: Send a real notification
      console.log('\n🔍 Testing Real Notification Send...');
      const notificationResult = await notificationService.sendNotification(
        'test-user-123',
        'test_integration',
        'This is a test notification from your notification service integration test!',
        'https://example.com/test',
        'default',
        {
          test: true,
          timestamp: new Date().toISOString(),
          source: 'integration_test'
        }
      );
      
      console.log('Notification Result:', notificationResult);
      
      if (notificationResult.success) {
        console.log('✅ Notification sent successfully');
        console.log('Push Sent:', notificationResult.pushSent);
        console.log('Notification ID:', notificationResult.data.id);
        
        if (notificationResult.pushResult) {
          console.log('Push Result:', notificationResult.pushResult);
        }
      } else {
        console.log('❌ Notification failed:', notificationResult.error);
      }
      
      // Test 4: Test anonymous notification
      console.log('\n🔍 Testing Anonymous Notification...');
      const anonymousResult = await notificationService.sendAnonymousNotification(
        realPlayerId,
        'This is an anonymous notification test!',
        'https://example.com/anonymous',
        {
          test: true,
          type: 'anonymous',
          timestamp: new Date().toISOString()
        }
      );
      
      console.log('Anonymous Notification Result:', anonymousResult);
      
      if (anonymousResult.success) {
        console.log('✅ Anonymous notification sent successfully');
        console.log('Push Sent:', anonymousResult.pushSent);
      } else {
        console.log('❌ Anonymous notification failed:', anonymousResult.error);
      }
      
    } else {
      console.log('❌ Device subscription failed:', subscriptionResult.error);
    }
    
    console.log('\n🎉 Notification Service Integration Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testNotificationService();
