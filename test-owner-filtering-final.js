#!/usr/bin/env node

// Final comprehensive test of owner-id filtering feature
const API_URL = 'http://localhost:3001';

async function makeRequest(endpoint, description, expectedBehavior = null) {
  const url = `${API_URL}${endpoint}`;
  console.log(`\n🔍 ${description}`);
  console.log(`📡 ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Entities returned: ${data.entities?.length || 0}`);
      
      if (data.filters_applied && Object.keys(data.filters_applied).length > 0) {
        console.log(`🔧 Filters applied:`, data.filters_applied);
      }
      
      if (expectedBehavior) {
        const result = expectedBehavior(data);
        console.log(`🎯 Expected behavior: ${result.success ? '✅ PASS' : '❌ FAIL'} - ${result.message}`);
        return result.success;
      }
      
      return true;
    } else {
      console.log(`❌ Status: ${response.status}`);
      console.log(`❌ Error:`, data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log(`🚨 Network Error:`, error.message);
    return false;
  }
}

async function runFinalTests() {
  console.log('🎯 Final Owner-ID Filtering Feature Test');
  console.log('==========================================');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Get baseline data
  console.log('\n📊 Getting baseline data...');
  const baselineResponse = await fetch(`${API_URL}/api/entities?limit=20`);
  const baselineData = await baselineResponse.json();
  
  if (!baselineResponse.ok || !baselineData.entities || baselineData.entities.length === 0) {
    console.log('❌ Cannot get baseline data. Exiting.');
    return;
  }
  
  // Find a good test owner (one with multiple entities)
  const ownerCounts = {};
  baselineData.entities.forEach(entity => {
    ownerCounts[entity.owner_id] = (ownerCounts[entity.owner_id] || 0) + 1;
  });
  
  const testOwner = Object.keys(ownerCounts).find(owner => ownerCounts[owner] >= 2);
  const testOwnerCount = ownerCounts[testOwner];
  const testEntityId = baselineData.entities.find(e => e.owner_id === testOwner)?.id;
  
  console.log(`🎯 Test owner: "${testOwner}" (${testOwnerCount} entities)`);
  console.log(`🎯 Test entity ID: "${testEntityId}"`);
  
  // Test 2: Owner filtering on /api/entities
  totalTests++;
  const test2 = await makeRequest(
    `/api/entities?owner_id=${encodeURIComponent(testOwner)}&limit=20`,
    'Test 2: Owner filtering on /api/entities',
    (data) => {
      const allCorrectOwner = data.entities.every(e => e.owner_id === testOwner);
      const hasResults = data.entities.length > 0;
      return {
        success: allCorrectOwner && hasResults,
        message: `${data.entities.length} entities, all owned by correct user: ${allCorrectOwner}`
      };
    }
  );
  if (test2) passedTests++;
  
  // Test 3: Owner filtering on /api/entities/search
  totalTests++;
  const test3 = await makeRequest(
    `/api/entities/search?owner_id=${encodeURIComponent(testOwner)}&limit=20`,
    'Test 3: Owner filtering on /api/entities/search',
    (data) => {
      const allCorrectOwner = data.entities.every(e => e.owner_id === testOwner);
      const hasResults = data.entities.length > 0;
      return {
        success: allCorrectOwner && hasResults,
        message: `${data.entities.length} entities, all owned by correct user: ${allCorrectOwner}`
      };
    }
  );
  if (test3) passedTests++;
  
  // Test 4: Exclude ID filtering
  totalTests++;
  const test4 = await makeRequest(
    `/api/entities?exclude_id=${testEntityId}&limit=20`,
    'Test 4: Exclude ID filtering',
    (data) => {
      const excludedFound = data.entities.find(e => e.id === testEntityId);
      return {
        success: !excludedFound,
        message: `Excluded entity found in results: ${excludedFound ? 'YES (ERROR)' : 'NO (CORRECT)'}`
      };
    }
  );
  if (test4) passedTests++;
  
  // Test 5: Combined owner_id and exclude_id
  totalTests++;
  const test5 = await makeRequest(
    `/api/entities?owner_id=${encodeURIComponent(testOwner)}&exclude_id=${testEntityId}&limit=20`,
    'Test 5: Combined owner_id and exclude_id filtering',
    (data) => {
      const allCorrectOwner = data.entities.every(e => e.owner_id === testOwner);
      const excludedFound = data.entities.find(e => e.id === testEntityId);
      const hasResults = data.entities.length > 0;
      return {
        success: allCorrectOwner && !excludedFound && hasResults,
        message: `${data.entities.length} entities, correct owner: ${allCorrectOwner}, excluded entity not found: ${!excludedFound}`
      };
    }
  );
  if (test5) passedTests++;
  
  // Test 6: Pagination with owner filter
  totalTests++;
  const test6 = await makeRequest(
    `/api/entities?owner_id=${encodeURIComponent(testOwner)}&page=1&limit=1`,
    'Test 6: Pagination with owner filter',
    (data) => {
      const respectsLimit = data.entities.length <= 1;
      const hasCorrectOwner = data.entities.length === 0 || data.entities[0].owner_id === testOwner;
      return {
        success: respectsLimit && hasCorrectOwner,
        message: `Returned ${data.entities.length} entities (limit=1), correct owner: ${hasCorrectOwner}`
      };
    }
  );
  if (test6) passedTests++;
  
  // Test 7: Non-existent owner
  totalTests++;
  const test7 = await makeRequest(
    `/api/entities?owner_id=nonexistent@example.com&limit=10`,
    'Test 7: Non-existent owner',
    (data) => {
      const isEmpty = data.entities.length === 0;
      return {
        success: isEmpty,
        message: `Non-existent owner returns ${data.entities.length} entities (should be 0)`
      };
    }
  );
  if (test7) passedTests++;
  
  // Test 8: Search with owner filter and query
  totalTests++;
  const test8 = await makeRequest(
    `/api/entities/search?owner_id=${encodeURIComponent(testOwner)}&q=vehicle&limit=10`,
    'Test 8: Search with owner filter and query',
    (data) => {
      const allCorrectOwner = data.entities.length === 0 || data.entities.every(e => e.owner_id === testOwner);
      return {
        success: allCorrectOwner,
        message: `${data.entities.length} entities, all owned by correct user: ${allCorrectOwner}`
      };
    }
  );
  if (test8) passedTests++;
  
  // Test 9: Empty parameters (edge case)
  totalTests++;
  const test9 = await makeRequest(
    `/api/entities?owner_id=&exclude_id=&limit=5`,
    'Test 9: Empty parameters (edge case)',
    (data) => {
      const hasResults = data.entities.length > 0;
      return {
        success: hasResults,
        message: `Empty parameters should not filter, returned ${data.entities.length} entities`
      };
    }
  );
  if (test9) passedTests++;
  
  // Final Results
  console.log('\n' + '='.repeat(50));
  console.log('🎯 FINAL TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`📊 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('✅ Owner-ID filtering feature is working correctly');
    console.log('✅ Exclude-ID filtering feature is working correctly');
    console.log('✅ Both endpoints (/api/entities and /api/entities/search) support the new filters');
    console.log('✅ Pagination, search queries, and edge cases work properly');
    console.log('\n🚀 The feature is ready for production deployment!');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the results above.');
  }
  
  return passedTests === totalTests;
}

runFinalTests().catch(console.error);