#!/usr/bin/env node

/**
 * Comprehensive test to validate frontend team's concerns about interaction logs
 * Testing data storage, retrieval, and filtering behavior
 */

const axios = require('axios');

const BASE_URL = 'https://multi-tenant-cli-boilerplate-api.vercel.app';
const TEST_EMAIL = 'test@aspcorpo.com';

let authToken = null;

async function authenticate() {
  console.log('🔐 Authenticating...');
  
  const otpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
    email: TEST_EMAIL,
    tenantId: 'default'
  });
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const otp = await new Promise((resolve) => {
    rl.question('Enter OTP: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
  
  const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
    email: TEST_EMAIL,
    otp: otp,
    tenantId: 'default'
  });
  
  authToken = verifyResponse.data.token;
  console.log('✅ Authenticated successfully');
}

async function testDataStorage() {
  console.log('\n🧪 TESTING DATA STORAGE - Creating diverse test logs...');
  
  const testLogs = [
    {
      eventType: 'entity_interaction',
      entityId: null,
      eventPayload: { 
        action: 'click',
        component: 'button',
        message: 'User clicked save button',
        timestamp: new Date().toISOString()
      }
    },
    {
      eventType: 'user_navigation',
      entityId: null,
      eventPayload: { 
        from: '/dashboard',
        to: '/entities',
        message: 'User navigated to entities page'
      }
    },
    {
      eventType: 'form_submission',
      entityId: null,
      eventPayload: { 
        form: 'contact',
        success: true,
        message: 'Contact form submitted successfully'
      }
    },
    {
      eventType: 'api_call',
      entityId: null,
      eventPayload: { 
        endpoint: '/api/test',
        method: 'POST',
        message: 'API call made from frontend'
      }
    },
    {
      eventType: 'error_occurred',
      entityId: null,
      eventPayload: { 
        error: 'Network timeout',
        severity: 'warning',
        message: 'Network request timed out'
      }
    }
  ];
  
  const createdLogs = [];
  
  for (const [index, log] of testLogs.entries()) {
    console.log(`\n📝 Creating log ${index + 1}/5: ${log.eventType}`);
    console.log(`   Message: ${log.eventPayload.message}`);
    
    try {
      const response = await axios.post(
        `${BASE_URL}/api/interaction_logs`,
        log,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      if (response.data.success) {
        console.log(`   ✅ SUCCESS: ${log.eventType} logged at ${response.data.logged_at}`);
        createdLogs.push({
          ...log,
          logged_at: response.data.logged_at
        });
      } else {
        console.log(`   ❌ FAILED: ${log.eventType}`, response.data);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${log.eventType}:`, error.response?.data || error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Successfully created ${createdLogs.length}/5 test logs`);
  return createdLogs;
}

async function testDataRetrieval() {
  console.log('\n🔍 TESTING DATA RETRIEVAL - Querying logs without filters...');
  
  // Wait for logs to be processed
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/interaction_logs?limit=20`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      const logs = response.data.logs;
      console.log(`\n📋 Retrieved ${logs.length} logs from database:`);
      
      // Group logs by event type
      const logsByType = {};
      logs.forEach(log => {
        if (!logsByType[log.event_type]) {
          logsByType[log.event_type] = [];
        }
        logsByType[log.event_type].push(log);
      });
      
      console.log('\n📊 BREAKDOWN BY EVENT TYPE:');
      Object.entries(logsByType).forEach(([eventType, typeLogs]) => {
        console.log(`\n   ${eventType}: ${typeLogs.length} logs`);
        
        // Show first few logs of each type
        typeLogs.slice(0, 3).forEach((log, index) => {
          const message = log.event_payload?.message || 'No message';
          const entityId = log.entity_id || 'No entity';
          console.log(`     ${index + 1}. Message: "${message}"`);
          console.log(`        Entity: ${entityId}`);
          console.log(`        User: ${log.user_id}`);
          console.log(`        Time: ${log.timestamp}`);
        });
        
        if (typeLogs.length > 3) {
          console.log(`     ... and ${typeLogs.length - 3} more`);
        }
      });
      
      // Check for our test logs specifically
      const ourTestLogs = logs.filter(log => 
        ['entity_interaction', 'user_navigation', 'form_submission', 'api_call', 'error_occurred'].includes(log.event_type)
      );
      
      console.log(`\n🎯 FRONTEND TEAM'S CONCERN CHECK:`);
      console.log(`   Our test logs found: ${ourTestLogs.length}/5`);
      
      if (ourTestLogs.length === 0) {
        console.log('   ❌ ISSUE CONFIRMED: Our test logs are missing!');
      } else {
        console.log('   ✅ Our test logs are present:');
        ourTestLogs.forEach(log => {
          console.log(`     - ${log.event_type}: "${log.event_payload?.message || 'No message'}"`);
        });
      }
      
      // Check entity_viewed dominance
      const entityViewedCount = logsByType['entity_viewed']?.length || 0;
      const totalLogs = logs.length;
      const entityViewedPercentage = ((entityViewedCount / totalLogs) * 100).toFixed(1);
      
      console.log(`\n📈 ENTITY_VIEWED ANALYSIS:`);
      console.log(`   entity_viewed logs: ${entityViewedCount}/${totalLogs} (${entityViewedPercentage}%)`);
      
      if (entityViewedPercentage > 80) {
        console.log('   ⚠️  HIGH: entity_viewed logs dominate the results');
      } else {
        console.log('   ✅ BALANCED: Good mix of different event types');
      }
      
      return logs;
    } else {
      console.log('❌ Failed to retrieve logs:', response.data);
      return [];
    }
  } catch (error) {
    console.log('❌ Error retrieving logs:', error.response?.data || error.message);
    return [];
  }
}

async function testFiltering() {
  console.log('\n🔍 TESTING FILTERING - Testing different filter combinations...');
  
  const filterTests = [
    { name: 'Filter by entity_interaction', params: 'eventType=entity_interaction' },
    { name: 'Filter by user_navigation', params: 'eventType=user_navigation' },
    { name: 'Filter by form_submission', params: 'eventType=form_submission' },
    { name: 'Filter by entity_viewed', params: 'eventType=entity_viewed' },
    { name: 'Filter with entity_id (should be empty)', params: 'entityId=test-entity-123' }
  ];
  
  for (const test of filterTests) {
    console.log(`\n🔍 ${test.name}:`);
    
    try {
      const response = await axios.get(
        `${BASE_URL}/api/interaction_logs?${test.params}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      if (response.data.success) {
        const logs = response.data.logs;
        console.log(`   Found: ${logs.length} logs`);
        
        if (logs.length > 0) {
          console.log(`   Sample: ${logs[0].event_type} - "${logs[0].event_payload?.message || 'No message'}"`);
          console.log(`   Filters applied: ${JSON.stringify(response.data.filters_applied)}`);
        } else {
          console.log(`   ⚠️  No logs found with filter: ${test.params}`);
        }
      } else {
        console.log(`   ❌ Filter failed:`, response.data);
      }
    } catch (error) {
      console.log(`   ❌ Filter error:`, error.response?.data || error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function testEntityViewBehavior() {
  console.log('\n👀 TESTING ENTITY VIEW BEHAVIOR - Checking automatic logging...');
  
  // Get an entity to view
  const entitiesResponse = await axios.get(`${BASE_URL}/api/entities?limit=1`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (entitiesResponse.data.entities && entitiesResponse.data.entities.length > 0) {
    const entity = entitiesResponse.data.entities[0];
    console.log(`📋 Testing with entity: ${entity.id}`);
    
    // View the entity (should trigger automatic entity_viewed log)
    await axios.get(`${BASE_URL}/api/entities/${entity.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Entity viewed - automatic log should be created');
    
    // Wait and check for the automatic log
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const logsResponse = await axios.get(
      `${BASE_URL}/api/interaction_logs?eventType=entity_viewed&limit=5`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (logsResponse.data.success) {
      const recentEntityViewed = logsResponse.data.logs.find(log => 
        log.entity_id === entity.id && 
        new Date(log.timestamp) > new Date(Date.now() - 10000) // Last 10 seconds
      );
      
      if (recentEntityViewed) {
        console.log('✅ Automatic entity_viewed log confirmed:');
        console.log(`   Entity: ${recentEntityViewed.entity_id}`);
        console.log(`   Payload: ${JSON.stringify(recentEntityViewed.event_payload)}`);
      } else {
        console.log('❓ No recent automatic entity_viewed log found');
      }
    }
  } else {
    console.log('❌ No entities available for testing');
  }
}

async function main() {
  console.log('🚀 FRONTEND TEAM VALIDATION TEST');
  console.log('Testing interaction logs storage, retrieval, and filtering\n');
  
  try {
    await authenticate();
    
    // Test 1: Data Storage
    const createdLogs = await testDataStorage();
    
    // Test 2: Data Retrieval
    const retrievedLogs = await testDataRetrieval();
    
    // Test 3: Filtering
    await testFiltering();
    
    // Test 4: Entity View Behavior
    await testEntityViewBehavior();
    
    console.log('\n🎯 SUMMARY FOR FRONTEND TEAM:');
    console.log('=====================================');
    
    if (createdLogs.length === 5) {
      console.log('✅ Data Storage: All 5 test logs created successfully');
    } else {
      console.log(`❌ Data Storage: Only ${createdLogs.length}/5 logs created`);
    }
    
    const ourTestLogsInResults = retrievedLogs.filter(log => 
      ['entity_interaction', 'user_navigation', 'form_submission', 'api_call', 'error_occurred'].includes(log.event_type)
    );
    
    if (ourTestLogsInResults.length === 5) {
      console.log('✅ Data Retrieval: All test logs retrieved correctly');
    } else {
      console.log(`❌ Data Retrieval: Only ${ourTestLogsInResults.length}/5 test logs found`);
    }
    
    const entityViewedLogs = retrievedLogs.filter(log => log.event_type === 'entity_viewed');
    const totalLogs = retrievedLogs.length;
    
    if (entityViewedLogs.length / totalLogs > 0.8) {
      console.log('⚠️  Issue: entity_viewed logs dominate results (>80%)');
    } else {
      console.log('✅ Balance: Good mix of different event types');
    }
    
    console.log('\n📋 RECOMMENDATIONS:');
    if (ourTestLogsInResults.length < 5) {
      console.log('1. ❌ Data loss detected - investigate backend storage');
      console.log('2. 🔍 Check database constraints and error handling');
      console.log('3. 📊 Verify log processing pipeline');
    } else {
      console.log('1. ✅ Data storage and retrieval working correctly');
      console.log('2. 📈 Consider pagination for large result sets');
      console.log('3. 🔍 Implement better filtering UI for event types');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}