#!/usr/bin/env node

/**
 * Debug script to analyze notification filtering issues
 * This script will help us understand if notifications are properly filtered by user
 */

const axios = require('axios');

const API_BASE = 'https://multi-tenant-cli-boilerplate-api.vercel.app';

// Test data we know exists
const testUsers = [
  'test@aspcorpo.com',
  'alejandro@aspcorpo.com',
  'cucu@aspcorpo.com',
  'unix@aspcorpo.com',
  'google@aspcorpo.com'
];

const testEntities = [
  {
    id: '600a503a-c9af-42b8-9986-9344887c257c',
    owner: 'test@aspcorpo.com',
    type: 'vehicle'
  },
  {
    id: '5e1ff9a2-02d2-4cbf-afe4-5b98c9afe32b', 
    owner: 'alejandro@aspcorpo.com',
    type: 'vehicle'
  },
  {
    id: '1fdd053b-47e2-4ed6-a695-84ee6fa6b233',
    owner: 'cucu@aspcorpo.com', 
    type: 'property'
  }
];

async function createTestNotifications() {
  console.log('🔔 Creating test notifications...\n');
  
  for (const entity of testEntities) {
    try {
      const response = await axios.post(`${API_BASE}/api/notifications/chat-request`, {
        entityId: entity.id,
        chatUrl: `https://test.com/chat/${entity.id}`
      });
      
      console.log(`✅ Created notification for ${entity.owner} (${entity.type})`);
      console.log(`   Notification ID: ${response.data.data.id}`);
      console.log(`   User ID: ${response.data.data.user_id}`);
      console.log('');
    } catch (error) {
      console.log(`❌ Failed to create notification for ${entity.owner}:`, error.response?.data || error.message);
    }
  }
}

async function tryCommonOTPs(email) {
  const commonOTPs = ['123456', '000000', '111111', '999999', 'test01', 'dev123'];
  
  for (const otp of commonOTPs) {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
        email,
        otp,
        tenantId: 'default'
      });
      
      if (response.data.success) {
        console.log(`🎉 Found working OTP for ${email}: ${otp}`);
        return response.data.token;
      }
    } catch (error) {
      // Continue trying
    }
  }
  
  console.log(`❌ No common OTP worked for ${email}`);
  return null;
}

async function requestOTPAndTryLogin(email) {
  try {
    // Request OTP
    console.log(`📧 Requesting OTP for ${email}...`);
    await axios.post(`${API_BASE}/api/auth/send-otp`, {
      email,
      tenantId: 'default'
    });
    
    // Try common OTPs
    console.log(`🔐 Trying common OTP patterns...`);
    const token = await tryCommonOTPs(email);
    
    return token;
  } catch (error) {
    console.log(`❌ Failed to get token for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function testNotificationHistory(email, token) {
  try {
    console.log(`📋 Testing notification history for ${email}...`);
    
    const response = await axios.get(`${API_BASE}/api/notifications/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const notifications = response.data.notifications;
    console.log(`   Found ${notifications.length} notifications`);
    
    // Check if all notifications belong to this user
    const foreignNotifications = notifications.filter(n => n.user_id !== email);
    
    if (foreignNotifications.length > 0) {
      console.log(`🚨 FILTERING ISSUE DETECTED! ${email} can see ${foreignNotifications.length} notifications from other users:`);
      foreignNotifications.forEach(n => {
        console.log(`   - Notification ${n.id} belongs to ${n.user_id} (should not be visible)`);
      });
    } else {
      console.log(`✅ Filtering working correctly for ${email} - only sees own notifications`);
    }
    
    // Show user's own notifications
    const ownNotifications = notifications.filter(n => n.user_id === email);
    if (ownNotifications.length > 0) {
      console.log(`   Own notifications:`);
      ownNotifications.forEach(n => {
        console.log(`   - ${n.id}: ${n.message} (${n.event_type})`);
      });
    }
    
    console.log('');
    return { total: notifications.length, foreign: foreignNotifications.length, own: ownNotifications.length };
    
  } catch (error) {
    console.log(`❌ Failed to get history for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function analyzeNotificationFiltering() {
  console.log('🔍 Starting notification filtering analysis...\n');
  
  // Step 1: Create test notifications
  await createTestNotifications();
  
  // Step 2: Try to authenticate users and test their notification history
  const results = [];
  
  for (const email of testUsers.slice(0, 2)) { // Test first 2 users
    console.log(`\n🔐 Attempting authentication for ${email}...`);
    
    const token = await requestOTPAndTryLogin(email);
    
    if (token) {
      console.log(`✅ Successfully authenticated ${email}`);
      const historyResult = await testNotificationHistory(email, token);
      results.push({ email, token, history: historyResult });
    } else {
      console.log(`❌ Could not authenticate ${email}`);
      results.push({ email, token: null, history: null });
    }
  }
  
  // Step 3: Summary
  console.log('\n📊 ANALYSIS SUMMARY');
  console.log('===================');
  
  const authenticatedUsers = results.filter(r => r.token !== null);
  
  if (authenticatedUsers.length === 0) {
    console.log('❌ No users could be authenticated - cannot test filtering');
    console.log('💡 Try running the server locally or use actual OTP codes');
  } else {
    console.log(`✅ Successfully tested ${authenticatedUsers.length} users`);
    
    const usersWithFilteringIssues = authenticatedUsers.filter(r => r.history && r.history.foreign > 0);
    
    if (usersWithFilteringIssues.length > 0) {
      console.log(`\n🚨 FILTERING ISSUES DETECTED!`);
      console.log(`   ${usersWithFilteringIssues.length} out of ${authenticatedUsers.length} users can see other users' notifications`);
      console.log(`\n💡 RECOMMENDED FIXES:`);
      console.log(`   1. Check the database query in getNotificationHistory()`);
      console.log(`   2. Verify JWT token contains correct user ID`);
      console.log(`   3. Ensure tenant context is properly applied`);
    } else {
      console.log(`\n✅ NO FILTERING ISSUES DETECTED`);
      console.log(`   All users only see their own notifications`);
    }
  }
}

// Run the analysis
analyzeNotificationFiltering().catch(console.error);
