#!/usr/bin/env node

/**
 * Test Session Persistence
 * 
 * This script tests the OTP authentication flow and session persistence
 * to ensure sessions are not destroyed immediately after creation.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'test@example.com';
const TEST_TENANT = 'default';

async function testSessionPersistence() {
  console.log('🧪 Testing Session Persistence...\n');
  
  try {
    // Step 1: Request OTP
    console.log('📧 Step 1: Requesting OTP...');
    const otpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
      email: TEST_EMAIL,
      tenantId: TEST_TENANT
    });
    
    console.log('✅ OTP requested successfully');
    if (otpResponse.data.devMode) {
      console.log(`🔐 OTP Code: ${otpResponse.data.otp}`);
    }
    
    // Step 2: Get OTP from server logs/console (in dev mode)
    console.log('\n🔍 Step 2: Getting OTP stats to find the code...');
    const otpStats = await axios.get(`${BASE_URL}/api/debug/otp-stats`);
    console.log('OTP Stats:', JSON.stringify(otpStats.data, null, 2));
    
    // Find the OTP code for our test email
    const otpData = otpStats.data.otps.find(otp => otp.email === TEST_EMAIL);
    if (!otpData) {
      throw new Error('OTP not found for test email');
    }
    
    const otpCode = otpData.otp;
    console.log(`📋 Found OTP code: ${otpCode}`);
    
    // Step 3: Verify OTP and get token
    console.log('\n🔐 Step 3: Verifying OTP...');
    const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      email: TEST_EMAIL,
      otp: otpCode,
      tenantId: TEST_TENANT
    });
    
    console.log('✅ OTP verified successfully');
    console.log('Token received:', verifyResponse.data.token ? 'YES' : 'NO');
    
    const token = verifyResponse.data.token;
    
    // Step 4: Test immediate token usage
    console.log('\n👤 Step 4: Testing immediate token usage...');
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token works immediately after creation');
    console.log('User info:', meResponse.data.user);
    
    // Step 5: Wait a moment and test again
    console.log('\n⏳ Step 5: Waiting 2 seconds and testing again...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const meResponse2 = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token still works after 2 seconds');
    console.log('User info:', meResponse2.data.user);
    
    // Step 6: Check session stats
    console.log('\n📊 Step 6: Checking session stats...');
    const sessionStats = await axios.get(`${BASE_URL}/api/debug/session-stats`);
    console.log('Session Stats:', JSON.stringify(sessionStats.data, null, 2));
    
    // Step 7: Test a protected endpoint
    console.log('\n🔒 Step 7: Testing protected endpoint...');
    const entitiesResponse = await axios.get(`${BASE_URL}/api/my/entities`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Protected endpoint works with persistent token');
    console.log('Entities response status:', entitiesResponse.status);
    
    console.log('\n🎉 All tests passed! Session persistence is working correctly.');
    
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
testSessionPersistence().catch(console.error);
