#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all endpoints systematically with test@aspcorpo.com account
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';
const TEST_EMAIL = 'test@aspcorpo.com';
const TENANT_ID = 'default';

// Global state
let authToken = null;
let testEntityId = null;
let testImageId = null;
let testNotificationId = null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`${title}`, 'bold');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
      fullError: error.response || error
    };
  }
}

// Test System Health
async function testSystemHealth() {
  logSection('SYSTEM HEALTH TESTS');
  
  logTest('GET /health');
  const result = await apiRequest('GET', '/health');
  
  if (result.success) {
    logSuccess(`Health check passed - Status: ${result.data.status}`);
    console.log('Services:', result.data.services);
  } else {
    logError(`Health check failed: ${result.error}`);
  }
  
  return result.success;
}

// Test Authentication Flow
async function testAuthentication() {
  logSection('AUTHENTICATION TESTS');
  
  // Test 1: Send OTP
  logTest('POST /api/auth/send-otp');
  const otpResult = await apiRequest('POST', '/api/auth/send-otp', {
    email: TEST_EMAIL,
    tenantId: TENANT_ID
  });
  
  if (otpResult.success) {
    logSuccess('OTP sent successfully');
    console.log('Response:', otpResult.data);
  } else {
    logError(`Failed to send OTP: ${otpResult.error}`);
    return false;
  }
  
  // Wait for user to provide OTP
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const otp = await new Promise((resolve) => {
    rl.question('\n🔑 Please enter the OTP you received: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
  
  // Test 2: Verify OTP
  logTest('POST /api/auth/verify-otp');
  const verifyResult = await apiRequest('POST', '/api/auth/verify-otp', {
    email: TEST_EMAIL,
    otp: otp,
    tenantId: TENANT_ID
  });
  
  if (verifyResult.success) {
    authToken = verifyResult.data.token;
    logSuccess('OTP verified successfully - Token received');
    console.log('User:', verifyResult.data.user);
  } else {
    logError(`Failed to verify OTP: ${JSON.stringify(verifyResult.error, null, 2)}`);
    console.log('Full error details:', verifyResult.fullError?.data || verifyResult.fullError);
    return false;
  }
  
  // Test 3: Get current user info
  logTest('GET /api/auth/me');
  const meResult = await apiRequest('GET', '/api/auth/me');
  
  if (meResult.success) {
    logSuccess('User info retrieved successfully');
    console.log('User info:', meResult.data);
  } else {
    logError(`Failed to get user info: ${meResult.error}`);
  }
  
  return true;
}

// Test Entity Management
async function testEntityManagement() {
  logSection('ENTITY MANAGEMENT TESTS');
  
  // Test 1: Get categories
  logTest('GET /api/categories');
  const categoriesResult = await apiRequest('GET', '/api/categories');
  
  if (categoriesResult.success) {
    logSuccess(`Retrieved ${categoriesResult.data.categories.length} categories`);
    console.log('Categories:', categoriesResult.data.categories.map(c => c.name));
  } else {
    logError(`Failed to get categories: ${categoriesResult.error}`);
  }
  
  // Test 2: List all entities
  logTest('GET /api/entities');
  const entitiesResult = await apiRequest('GET', '/api/entities');
  
  if (entitiesResult.success) {
    logSuccess(`Retrieved ${entitiesResult.data.entities.length} entities`);
    console.log('Pagination:', entitiesResult.data.pagination);
  } else {
    logError(`Failed to get entities: ${entitiesResult.error}`);
  }
  
  // Test 3: Create a new entity
  logTest('POST /api/entities');
  const createResult = await apiRequest('POST', '/api/entities', {
    name: 'Test Property - API Testing',
    entity_type: 'property',
    description: 'This is a test property created during API testing',
    attributes: {
      address: '123 Test Street, Test City',
      price: '350000',
      bedrooms: '3',
      bathrooms: '2',
      area: '1200'
    },
    public_shareable: true
  });
  
  if (createResult.success) {
    testEntityId = createResult.data.id;
    logSuccess(`Entity created successfully - ID: ${testEntityId}`);
    console.log('Entity:', createResult.data);
  } else {
    logError(`Failed to create entity: ${JSON.stringify(createResult.error, null, 2)}`);
    console.log('Full error details:', createResult.fullError?.data || createResult.fullError);
  }
  
  // Test 4: Get specific entity
  if (testEntityId) {
    logTest(`GET /api/entities/${testEntityId}`);
    const getResult = await apiRequest('GET', `/api/entities/${testEntityId}`);
    
    if (getResult.success) {
      logSuccess('Entity retrieved successfully');
      console.log('Entity details:', getResult.data);
    } else {
      logError(`Failed to get entity: ${getResult.error}`);
    }
  }
  
  // Test 5: Update entity
  if (testEntityId) {
    logTest(`PATCH /api/entities/${testEntityId}`);
    const updateResult = await apiRequest('PATCH', `/api/entities/${testEntityId}`, {
      attributes: {
        price: '375000',
        description: 'Updated test property description'
      }
    });
    
    if (updateResult.success) {
      logSuccess('Entity updated successfully');
      console.log('Updated entity:', updateResult.data);
    } else {
      logError(`Failed to update entity: ${updateResult.error}`);
    }
  }
  
  // Test 6: Get my entities
  logTest('GET /api/my/entities');
  const myEntitiesResult = await apiRequest('GET', '/api/my/entities');
  
  if (myEntitiesResult.success) {
    logSuccess(`Retrieved ${myEntitiesResult.data.entities.length} user entities`);
  } else {
    logError(`Failed to get user entities: ${myEntitiesResult.error}`);
  }
  
  return testEntityId !== null;
}

// Test Search Functionality
async function testSearch() {
  logSection('SEARCH TESTS');
  
  // Test 1: Basic search
  logTest('GET /api/entities/search');
  const searchResult = await apiRequest('GET', '/api/entities/search?q=test&limit=5');
  
  if (searchResult.success) {
    logSuccess(`Search returned ${searchResult.data.entities.length} results`);
    console.log('Search results:', searchResult.data.entities.map(e => e.attributes?.name || e.id));
  } else {
    logError(`Search failed: ${searchResult.error}`);
  }
  
  // Test 2: Category-specific search
  logTest('GET /api/entities/search with category filter');
  const categorySearchResult = await apiRequest('GET', '/api/entities/search?category=property&limit=5');
  
  if (categorySearchResult.success) {
    logSuccess(`Category search returned ${categorySearchResult.data.entities.length} results`);
  } else {
    logError(`Category search failed: ${categorySearchResult.error}`);
  }
  
  // Test 3: Owner filtering
  logTest('GET /api/entities/search with owner_id filter');
  const ownerSearchResult = await apiRequest('GET', `/api/entities/search?owner_id=${TEST_EMAIL}&limit=5`);
  
  if (ownerSearchResult.success) {
    logSuccess(`Owner search returned ${ownerSearchResult.data.entities.length} results`);
  } else {
    logError(`Owner search failed: ${ownerSearchResult.error}`);
  }
  
  // Test 4: Get entities by category
  logTest('GET /api/categories/property/entities');
  const categoryEntitiesResult = await apiRequest('GET', '/api/categories/property/entities?limit=5');
  
  if (categoryEntitiesResult.success) {
    logSuccess(`Category entities returned ${categoryEntitiesResult.data.entities.length} results`);
  } else {
    logError(`Category entities failed: ${categoryEntitiesResult.error}`);
  }
  
  return true;
}

// Test Image Management
async function testImageManagement() {
  logSection('IMAGE MANAGEMENT TESTS');
  
  if (!testEntityId) {
    logWarning('Skipping image tests - no test entity available');
    return false;
  }
  
  // Create a simple test image file
  const testImagePath = path.join(__dirname, 'test-image.png');
  const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(testImagePath, testImageBuffer);
  
  // Test 1: Upload image
  logTest(`POST /api/entities/${testEntityId}/images`);
  try {
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testImagePath));
    formData.append('label', 'Test Image');
    
    const uploadResult = await axios.post(
      `${BASE_URL}/api/entities/${testEntityId}/images`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    if (uploadResult.data.success) {
      testImageId = uploadResult.data.images[0].id;
      logSuccess(`Image uploaded successfully - ID: ${testImageId}`);
      console.log('Image details:', uploadResult.data.images[0]);
    } else {
      logError('Image upload failed');
    }
  } catch (error) {
    logError(`Image upload error: ${error.response?.data || error.message}`);
  }
  
  // Test 2: Get entity images
  logTest(`GET /api/entities/${testEntityId}/images`);
  const getImagesResult = await apiRequest('GET', `/api/entities/${testEntityId}/images`);
  
  if (getImagesResult.success) {
    logSuccess(`Retrieved ${getImagesResult.data.images.length} images for entity`);
    console.log('Images:', getImagesResult.data.images.map(img => ({ id: img.id, label: img.label })));
  } else {
    logError(`Failed to get entity images: ${getImagesResult.error}`);
  }
  
  // Clean up test image file
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }
  
  return testImageId !== null;
}

// Test Notification System
async function testNotifications() {
  logSection('NOTIFICATION TESTS');
  
  // Test 1: Subscribe device
  logTest('POST /api/notifications/subscribe-device');
  const subscribeResult = await apiRequest('POST', '/api/notifications/subscribe-device', {
    deviceToken: 'test-device-token-' + Date.now(),
    tenantContext: TENANT_ID
  });
  
  if (subscribeResult.success) {
    logSuccess('Device subscribed successfully');
    console.log('Subscription:', subscribeResult.data);
  } else {
    logError(`Device subscription failed: ${subscribeResult.error}`);
  }
  
  // Test 2: Get notification preferences
  logTest('GET /api/notifications/preferences');
  const prefsResult = await apiRequest('GET', '/api/notifications/preferences');
  
  if (prefsResult.success) {
    logSuccess('Notification preferences retrieved');
    console.log('Preferences:', prefsResult.data.preferences);
  } else {
    logError(`Failed to get preferences: ${prefsResult.error}`);
  }
  
  // Test 3: Update notification preferences
  logTest('POST /api/notifications/preferences');
  const updatePrefsResult = await apiRequest('POST', '/api/notifications/preferences', {
    preferences: {
      chat_requests: true,
      attribute_updates: true,
      reminders: false,
      marketing: false
    }
  });
  
  if (updatePrefsResult.success) {
    logSuccess('Notification preferences updated');
    console.log('Updated preferences:', updatePrefsResult.data);
  } else {
    logError(`Failed to update preferences: ${JSON.stringify(updatePrefsResult.error, null, 2)}`);
    console.log('Full error details:', updatePrefsResult.fullError?.data || updatePrefsResult.fullError);
  }
  
  // Test 4: Send test notification
  logTest('POST /api/notifications/test');
  // Special handling for test notification endpoint that expects no body
  let testNotifResult;
  try {
    const response = await axios.post(
      `${BASE_URL}/api/notifications/test`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    testNotifResult = { success: true, data: response.data, status: response.status };
  } catch (error) {
    testNotifResult = {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
      fullError: error.response || error
    };
  }
  
  if (testNotifResult.success) {
    logSuccess('Test notification sent');
    console.log('Notification:', testNotifResult.data);
  } else {
    logError(`Test notification failed: ${JSON.stringify(testNotifResult.error, null, 2)}`);
    console.log('Full error details:', testNotifResult.fullError?.data || testNotifResult.fullError);
  }
  
  // Test 5: Get notification history
  logTest('GET /api/notifications/history');
  const historyResult = await apiRequest('GET', '/api/notifications/history?limit=5');
  
  if (historyResult.success) {
    logSuccess(`Retrieved ${historyResult.data.notifications.length} notifications from history`);
    if (historyResult.data.notifications.length > 0) {
      testNotificationId = historyResult.data.notifications[0].id;
      console.log('Recent notifications:', historyResult.data.notifications.map(n => ({ id: n.id, type: n.event_type })));
    }
  } else {
    logError(`Failed to get notification history: ${historyResult.error}`);
  }
  
  // Test 6: Mark notification as seen
  if (testNotificationId) {
    logTest(`POST /api/notifications/${testNotificationId}/seen`);
    const seenResult = await apiRequest('POST', `/api/notifications/${testNotificationId}/seen`);
    
    if (seenResult.success) {
      logSuccess('Notification marked as seen');
    } else {
      logError(`Failed to mark notification as seen: ${JSON.stringify(seenResult.error, null, 2)}`);
      console.log('Full error details:', seenResult.fullError?.data || seenResult.fullError);
    }
  }
  
  return true;
}

// Test Interaction Logs
async function testInteractionLogs() {
  logSection('INTERACTION LOGS TESTS');
  
  // Test 1: Log an interaction
  logTest('POST /api/interaction_logs');
  const logResult = await apiRequest('POST', '/api/interaction_logs', {
    eventType: 'api_test_event',
    entityId: testEntityId,
    eventPayload: {
      source: 'api_testing',
      test_run: new Date().toISOString(),
      custom_data: 'test_value'
    }
  });
  
  if (logResult.success) {
    logSuccess('Interaction logged successfully');
    console.log('Log result:', logResult.data);
  } else {
    logError(`Failed to log interaction: ${logResult.error}`);
  }
  
  // Test 2: Query interaction logs
  logTest('GET /api/interaction_logs');
  const queryResult = await apiRequest('GET', '/api/interaction_logs?limit=10');
  
  if (queryResult.success) {
    logSuccess(`Retrieved ${queryResult.data.logs.length} interaction logs`);
    console.log('Pagination:', queryResult.data.pagination);
    if (queryResult.data.logs.length > 0) {
      console.log('Sample log:', queryResult.data.logs[0]);
    }
  } else {
    logError(`Failed to query interaction logs: ${queryResult.error}`);
  }
  
  // Test 3: Query with filters
  logTest('GET /api/interaction_logs with filters');
  const filteredResult = await apiRequest('GET', '/api/interaction_logs?eventType=api_test_event&limit=5');
  
  if (filteredResult.success) {
    logSuccess(`Filtered query returned ${filteredResult.data.logs.length} logs`);
    console.log('Filters applied:', filteredResult.data.filters_applied);
  } else {
    logError(`Filtered query failed: ${filteredResult.error}`);
  }
  
  return true;
}

// Test Shared Entity Access
async function testSharedAccess() {
  logSection('SHARED ACCESS TESTS');
  
  if (!testEntityId) {
    logWarning('Skipping shared access tests - no test entity available');
    return false;
  }
  
  // First get the entity to find its share token
  const entityResult = await apiRequest('GET', `/api/entities/${testEntityId}`);
  
  if (entityResult.success && entityResult.data.share_token) {
    const shareToken = entityResult.data.share_token;
    
    logTest(`GET /api/shared/${shareToken}`);
    const sharedResult = await apiRequest('GET', `/api/shared/${shareToken}`);
    
    if (sharedResult.success) {
      logSuccess('Shared entity accessed successfully');
      console.log('Shared entity:', { id: sharedResult.data.id, name: sharedResult.data.attributes?.name });
    } else {
      logError(`Failed to access shared entity: ${sharedResult.error}`);
    }
  } else {
    logWarning('Entity does not have a share token');
  }
  
  return true;
}

// Test Logout
async function testLogout() {
  logSection('LOGOUT TEST');
  
  logTest('POST /api/auth/logout');
  // Special handling for logout endpoint that expects no body
  let logoutResult;
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/logout`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    logoutResult = { success: true, data: response.data, status: response.status };
  } catch (error) {
    logoutResult = {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
      fullError: error.response || error
    };
  }
  
  if (logoutResult.success) {
    logSuccess('Logged out successfully');
    authToken = null;
  } else {
    logError(`Logout failed: ${JSON.stringify(logoutResult.error, null, 2)}`);
    console.log('Full error details:', logoutResult.fullError?.data || logoutResult.fullError);
  }
  
  return logoutResult.success;
}

// Cleanup function
async function cleanup() {
  logSection('CLEANUP');
  
  if (testEntityId && authToken) {
    logTest(`DELETE /api/entities/${testEntityId}`);
    const deleteResult = await apiRequest('DELETE', `/api/entities/${testEntityId}`);
    
    if (deleteResult.success) {
      logSuccess('Test entity deleted successfully');
    } else {
      logWarning(`Failed to delete test entity: ${deleteResult.error}`);
    }
  }
  
  if (testImageId && authToken) {
    logTest(`DELETE /api/images/${testImageId}`);
    const deleteImageResult = await apiRequest('DELETE', `/api/images/${testImageId}`);
    
    if (deleteImageResult.success) {
      logSuccess('Test image deleted successfully');
    } else {
      logWarning(`Failed to delete test image: ${deleteImageResult.error}`);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '🚀 COMPREHENSIVE API TESTING STARTED'.padStart(50));
  console.log(`📧 Testing with account: ${TEST_EMAIL}`);
  console.log(`🌐 API Base URL: ${BASE_URL}`);
  console.log(`🏢 Tenant ID: ${TENANT_ID}\n`);
  
  const testResults = {
    health: false,
    auth: false,
    entities: false,
    search: false,
    images: false,
    notifications: false,
    logs: false,
    shared: false,
    logout: false
  };
  
  try {
    // Run all tests in sequence
    testResults.health = await testSystemHealth();
    testResults.auth = await testAuthentication();
    
    if (testResults.auth) {
      testResults.entities = await testEntityManagement();
      testResults.search = await testSearch();
      testResults.images = await testImageManagement();
      testResults.notifications = await testNotifications();
      testResults.logs = await testInteractionLogs();
      testResults.shared = await testSharedAccess();
      
      // Cleanup before logout
      await cleanup();
      
      testResults.logout = await testLogout();
    }
    
  } catch (error) {
    logError(`Unexpected error during testing: ${error.message}`);
  }
  
  // Print final summary
  logSection('TEST SUMMARY');
  
  const passed = Object.values(testResults).filter(Boolean).length;
  const total = Object.keys(testResults).length;
  
  console.log('\nTest Results:');
  Object.entries(testResults).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${test.padEnd(15)}: ${status}`);
  });
  
  console.log(`\n📊 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    logSuccess('\n🎉 All tests passed! API is working correctly.');
  } else {
    logWarning(`\n⚠️  ${total - passed} test(s) failed. Please review the results above.`);
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };