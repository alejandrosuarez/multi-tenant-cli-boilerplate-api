const DatabaseService = require('./src/services/database');
const NotificationService = require('./src/services/notification');
require('dotenv').config({ path: '.env.local' });

async function testSubscriptionLookup() {
  console.log('🔧 Testing Subscription Lookup');
  console.log('===============================');
  
  try {
    const db = new DatabaseService();
    const notificationService = new NotificationService(db);
    
    // Test 1: Check what's in the push_subscriptions table
    console.log('\n🔍 Checking Push Subscriptions Table...');
    const { data: subscriptions, error: subError } = await db.table('mtcli_push_subscriptions')
      .select('*')
      .eq('user_id', 'test-user-123')
      .eq('tenant_context', 'default');
    
    console.log('Direct DB Query Result:');
    console.log('Error:', subError);
    console.log('Data:', subscriptions);
    
    // Test 2: Test the getUserSubscriptions function
    console.log('\n🔍 Testing getUserSubscriptions Function...');
    const userSubsResult = await notificationService.getUserSubscriptions('test-user-123', 'default');
    console.log('getUserSubscriptions Result:', userSubsResult);
    
    // Test 3: Check if the RPC function exists
    console.log('\n🔍 Testing RPC Function Direct Call...');
    try {
      const { data: rpcResult, error: rpcError } = await db.rpc('get_user_subscriptions', {
        p_user_id: 'test-user-123',
        p_tenant_context: 'default'
      });
      console.log('RPC Result:', rpcResult);
      console.log('RPC Error:', rpcError);
    } catch (rpcErr) {
      console.log('RPC Function Error:', rpcErr.message);
      console.log('This might mean the RPC function is not implemented in the database');
    }
    
    // Test 4: Simple subscription query
    console.log('\n🔍 Simple Active Subscriptions Query...');
    const { data: activeSubscriptions, error: activeError } = await db.table('mtcli_push_subscriptions')
      .select('*')
      .eq('user_id', 'test-user-123')
      .eq('tenant_context', 'default')
      .eq('is_active', true);
    
    console.log('Active Subscriptions:');
    console.log('Error:', activeError);
    console.log('Data:', activeSubscriptions);
    
    if (activeSubscriptions && activeSubscriptions.length > 0) {
      console.log('\n✅ Found active subscriptions - testing notification with direct push...');
      
      // Test direct push notification
      const pushResult = await notificationService.sendPushNotification(
        activeSubscriptions,
        'Direct push test notification',
        'https://example.com/direct',
        { test: true, direct: true }
      );
      
      console.log('Direct Push Result:', pushResult);
    }
    
    console.log('\n🎉 Subscription Lookup Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSubscriptionLookup();
