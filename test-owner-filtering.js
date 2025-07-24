#!/usr/bin/env node

// Test script for owner-id filtering endpoints
const API_URL = process.env.API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';

async function testEndpoint(url, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`📡 URL: ${url}`);
  
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
      console.log(`📊 Results: ${data.entities ? data.entities.length : 0} entities`);
      
      if (data.entities && data.entities.length > 0) {
        console.log(`📝 Sample entity:`, {
          id: data.entities[0].id,
          owner_id: data.entities[0].owner_id,
          entity_type: data.entities[0].entity_type,
          public_shareable: data.entities[0].public_shareable
        });
      }
      
      if (data.filters_applied) {
        console.log(`🔧 Filters applied:`, data.filters_applied);
      }
      
      if (data.search) {
        console.log(`🔍 Search params:`, data.search);
      }
      
      return { success: true, data };
    } else {
      console.log(`❌ Status: ${response.status}`);
      console.log(`❌ Error:`, data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`🚨 Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Owner ID Filtering Endpoints');
  console.log(`🌐 API Base URL: ${API_URL}`);
  
  // Test 1: Basic health check
  await testEndpoint(`${API_URL}/health`, 'API Health Check');
  
  // Test 2: Get all entities (baseline)
  const allEntitiesResult = await testEndpoint(`${API_URL}/api/entities?limit=5`, 'Get All Entities (baseline)');
  
  let testOwnerId = null;
  let testEntityId = null;
  
  if (allEntitiesResult.success && allEntitiesResult.data.entities && allEntitiesResult.data.entities.length > 0) {
    testOwnerId = allEntitiesResult.data.entities[0].owner_id;
    testEntityId = allEntitiesResult.data.entities[0].id;
    console.log(`\n📋 Using test data: owner_id="${testOwnerId}", entity_id="${testEntityId}"`);
  }
  
  // Test 3: Filter by owner_id on /api/entities
  if (testOwnerId) {
    await testEndpoint(`${API_URL}/api/entities?owner_id=${encodeURIComponent(testOwnerId)}&limit=5`, 'Filter by owner_id (/api/entities)');
  }
  
  // Test 4: Filter by owner_id on /api/entities/search
  if (testOwnerId) {
    await testEndpoint(`${API_URL}/api/entities/search?owner_id=${encodeURIComponent(testOwnerId)}&limit=5`, 'Filter by owner_id (/api/entities/search)');
  }
  
  // Test 5: Exclude specific entity
  if (testEntityId) {
    await testEndpoint(`${API_URL}/api/entities?exclude_id=${testEntityId}&limit=5`, 'Exclude specific entity');
  }
  
  // Test 6: Combined owner_id and exclude_id
  if (testOwnerId && testEntityId) {
    await testEndpoint(`${API_URL}/api/entities?owner_id=${encodeURIComponent(testOwnerId)}&exclude_id=${testEntityId}&limit=5`, 'Combined owner_id and exclude_id');
  }
  
  // Test 7: Search with owner_id and query
  if (testOwnerId) {
    await testEndpoint(`${API_URL}/api/entities/search?owner_id=${encodeURIComponent(testOwnerId)}&q=test&limit=5`, 'Search with owner_id and query');
  }
  
  // Test 8: Test with non-existent owner
  await testEndpoint(`${API_URL}/api/entities?owner_id=nonexistent@example.com&limit=5`, 'Non-existent owner_id');
  
  // Test 9: Test with non-existent exclude_id
  await testEndpoint(`${API_URL}/api/entities?exclude_id=999999&limit=5`, 'Non-existent exclude_id');
  
  // Test 10: Test pagination with owner filter
  if (testOwnerId) {
    await testEndpoint(`${API_URL}/api/entities?owner_id=${encodeURIComponent(testOwnerId)}&page=1&limit=2`, 'Pagination with owner filter');
  }
  
  console.log('\n🎉 Testing completed!');
}

// Run the tests
runTests().catch(console.error);