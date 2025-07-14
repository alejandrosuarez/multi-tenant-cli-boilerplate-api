#!/usr/bin/env node

/**
 * Comprehensive notification filtering test
 * This will definitively determine if there are filtering issues
 */

const axios = require('axios');

const API_BASE = 'https://multi-tenant-cli-boilerplate-api.vercel.app';

async function authenticateUser(email, otp) {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
      email,
      otp,
      tenantId: 'default'
    });
    
    if (response.data.success) {
      console.log(`✅ Authenticated ${email}`);
      console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      return response.data.token;
    } else {
      console.log(`❌ Failed to authenticate ${email}:`, response.data.error);
      return null;
    }
  } catch (error) {
    console.log(`❌ Authentication error for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function getNotificationHistory(email, token) {
  try {
    const response = await axios.get(`${API_BASE}/api/notifications/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

async function runFilteringTest(testUser, alejandroUser) {
  console.log('🔍 COMPREHENSIVE NOTIFICATION FILTERING TEST');
  console.log('============================================\n');
  
  // Test both users
  const users = [
    { email: 'test@aspcorpo.com', otp: testUser.otp, expectedNotifications: ['7d6e1f00-8c79-4ea8-a61f-d4e1009b4ade'] },
    { email: 'alejandro@aspcorpo.com', otp: alejandroUser.otp, expectedNotifications: ['40a60c24-3100-482e-830c-dec56c69b6e9'] }
  ];
  
  const results = [];
  
  for (const user of users) {
    console.log(`\n🔐 Testing ${user.email}...`);
    
    // Authenticate
    const token = await authenticateUser(user.email, user.otp);
    if (!token) {
      results.push({ email: user.email, authenticated: false });
      continue;
    }
    
    // Get notification history
    console.log(`📋 Fetching notification history for ${user.email}...`);
    const historyResult = await getNotificationHistory(user.email, token);
    
    if (!historyResult.success) {
      console.log(`❌ Failed to get history:`, historyResult.error);
      results.push({ email: user.email, authenticated: true, historyError: historyResult.error });
      continue;
    }
    
    const notifications = historyResult.data.notifications;
    console.log(`   Found ${notifications.length} notifications`);
    
    // Analyze notifications
    const ownNotifications = notifications.filter(n => n.user_id === user.email);
    const foreignNotifications = notifications.filter(n => n.user_id !== user.email);
    
    console.log(`   - Own notifications: ${ownNotifications.length}`);
    console.log(`   - Foreign notifications: ${foreignNotifications.length}`);
    
    if (foreignNotifications.length > 0) {
      console.log(`\n🚨 FILTERING ISSUE DETECTED for ${user.email}!`);
      console.log('   Can see notifications from:');
      foreignNotifications.forEach(n => {
        console.log(`     - ${n.id} (belongs to ${n.user_id})`);
      });
    } else {
      console.log(`\n✅ Filtering working correctly for ${user.email}`);
    }
    
    // Log all notifications for analysis
    console.log('\n   All notifications:');
    notifications.forEach((n, i) => {
      const isOwn = n.user_id === user.email;
      const indicator = isOwn ? '✅' : '🚨';
      console.log(`     ${i + 1}. ${indicator} ${n.id}: ${n.user_id} - "${n.message.substring(0, 50)}..."`);
    });
    
    results.push({
      email: user.email,
      authenticated: true,
      totalNotifications: notifications.length,
      ownNotifications: ownNotifications.length,
      foreignNotifications: foreignNotifications.length,
      foreignDetails: foreignNotifications.map(n => ({ id: n.id, user_id: n.user_id })),
      hasFilteringIssue: foreignNotifications.length > 0
    });
  }
  
  // Final analysis
  console.log('\n\n📊 FINAL ANALYSIS');
  console.log('==================');
  
  const authenticatedUsers = results.filter(r => r.authenticated);
  const usersWithIssues = authenticatedUsers.filter(r => r.hasFilteringIssue);
  
  console.log(`\nAuthenticated users: ${authenticatedUsers.length}/${users.length}`);
  console.log(`Users with filtering issues: ${usersWithIssues.length}/${authenticatedUsers.length}`);
  
  if (usersWithIssues.length > 0) {
    console.log('\n🚨 FILTERING PROBLEM CONFIRMED!');
    console.log('\nUsers affected:');
    usersWithIssues.forEach(user => {
      console.log(`  - ${user.email}: sees ${user.foreignNotifications} foreign notifications`);
      user.foreignDetails.forEach(foreign => {
        console.log(`    └── Can see notification ${foreign.id} from ${foreign.user_id}`);
      });
    });
    
    console.log('\n💡 RECOMMENDED FIXES:');
    console.log('1. 🔍 Check JWT token decoding in auth middleware');
    console.log('2. 🗄️ Verify database query in getNotificationHistory()');
    console.log('3. 🏢 Ensure tenant context is properly applied');
    console.log('4. 🔐 Add debug logging to trace the exact filtering logic');
    
  } else if (authenticatedUsers.length > 0) {
    console.log('\n✅ NO FILTERING ISSUES DETECTED');
    console.log('All users only see their own notifications');
    console.log('The notification filtering is working correctly!');
    
  } else {
    console.log('\n❌ COULD NOT TEST - Authentication failed');
    console.log('Please check OTP codes and try again');
  }
  
  return results;
}

// Export the function for use with provided OTPs
module.exports = { runFilteringTest };

// If run directly with command line arguments
if (require.main === module) {
  const testOtp = process.argv[2];
  const alejandroOtp = process.argv[3];
  
  if (!testOtp || !alejandroOtp) {
    console.log('Usage: node test_filtering_comprehensive.js <test_otp> <alejandro_otp>');
    console.log('Example: node test_filtering_comprehensive.js 123456 789012');
    process.exit(1);
  }
  
  runFilteringTest(
    { otp: testOtp },
    { otp: alejandroOtp }
  ).catch(console.error);
}
