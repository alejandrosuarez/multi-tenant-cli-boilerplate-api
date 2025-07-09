#!/usr/bin/env node

/**
 * Test OneSignal Subscription Flow
 * 
 * This script tests the complete OneSignal subscription flow including:
 * - User authentication
 * - External user ID setting
 * - Device subscription
 * - Backend subscription tracking
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'test@aspcorpo.com';
const TEST_TENANT = 'default';

async function testOneSignalSubscription() {
  console.log('🔔 Testing OneSignal Subscription Flow...\n');
  
  try {
    // Step 1: Authenticate user
    console.log('🔐 Step 1: Authenticating user...');
    
    // Send OTP
    const otpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
      email: TEST_EMAIL,
      tenantId: TEST_TENANT
    });
    
    // Get OTP from debug endpoint
    const otpStats = await axios.get(`${BASE_URL}/api/debug/otp-stats`);
    const otpData = otpStats.data.otps.find(otp => otp.email === TEST_EMAIL);
    
    if (!otpData) {
      throw new Error('OTP not found for test email');
    }
    
    // Verify OTP
    const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      email: TEST_EMAIL,
      otp: otpData.otp,
      tenantId: TEST_TENANT
    });
    
    const token = verifyResponse.data.token;
    console.log('✅ User authenticated successfully');
    
    // Step 2: Simulate device subscription
    console.log('\n📱 Step 2: Simulating device subscription...');
    
    // Generate a fake OneSignal player ID for testing
    const fakePlayerId = '73026eed-482b-4cce-829f-2945dc2182f0';
    
    const subscribeResponse = await axios.post(`${BASE_URL}/api/notifications/subscribe-device`, {
      deviceToken: fakePlayerId,
      tenantContext: TEST_TENANT
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3001'
      }
    });
    
    console.log('✅ Device subscription response:', subscribeResponse.data);
    
    // Step 3: Check user subscriptions
    console.log('\n📊 Step 3: Checking user subscriptions...');
    
    const userSubscriptions = await axios.get(`${BASE_URL}/api/debug/user-subscriptions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('User subscriptions:', JSON.stringify(userSubscriptions.data, null, 2));
    
    // Step 4: Test notification sending
    console.log('\n🔔 Step 4: Testing notification sending...');
    
    const testNotificationResponse = await axios.post(`${BASE_URL}/api/notifications/test`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Test notification response:', JSON.stringify(testNotificationResponse.data, null, 2));
    
    // Step 5: Check session and user info
    console.log('\n👤 Step 5: Checking user info...');
    
    const userInfo = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('User info:', JSON.stringify(userInfo.data, null, 2));
    
    console.log('\n🎉 OneSignal subscription flow test completed!');
    
    // Summary
    console.log('\n📋 Summary:');
    console.log('- User authenticated:', '✅');
    console.log('- Device subscription:', subscribeResponse.data.success ? '✅' : '❌');
    console.log('- User subscriptions found:', userSubscriptions.data.subscriptions.length > 0 ? '✅' : '❌');
    console.log('- Test notification sent:', testNotificationResponse.data.success ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testOneSignalSubscription().catch(console.error);
