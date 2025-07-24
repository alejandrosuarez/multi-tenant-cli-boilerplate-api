#!/usr/bin/env node

// Comprehensive test for owner-id filtering with proper tenant context
const API_URL = process.env.API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';

async function makeRequest(endpoint, headers = {}) {
  const url = `${API_URL}${endpoint}`;
  console.log(`📡 ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
  
  const data = await response.json();
  return { response, data };
}

async function runComprehensiveTests() {
  console.log('🚀 Comprehensive Owner-ID Filtering Tests');
  console.log(`🌐 API Base URL: ${API_URL}`);
  
  try {
    // Step 1: Get baseline entities to understand the data
    console.log('\n📊 Step 1: Getting baseline entities');
    const { response: baseResponse, data: baseData } = await makeRequest('/api/entities?limit=10');
    
    if (!baseResponse.ok) {
      console.log('❌ Failed to get baseline entities:', baseData);
      return;
    }
    
    console.log(`✅ Found ${baseData.entities.length} entities`);
    
    if (baseData.entities.length === 0) {
      console.log('⚠️ No entities found, cannot test filtering');
      return;
    }
    
    // Analyze the data
    const sampleEntity = baseData.entities[0];
    const tenantId = sampleEntity.tenant_id;
    const ownerId = sampleEntity.owner_id;
    
    console.log(`📋 Sample entity:`, {
      id: sampleEntity.id,
      owner_id: ownerId,
      tenant_id: tenantId,
      entity_type: sampleEntity.entity_type,
      public_shareable: sampleEntity.public_shareable
    });
    
    // Count entities by owner
    const ownerCounts = {};
    baseData.entities.forEach(entity => {
      ownerCounts[entity.owner_id] = (ownerCounts[entity.owner_id] || 0) + 1;
    });
    
    console.log('\n📈 Owner distribution:');
    Object.entries(ownerCounts).forEach(([owner, count]) => {
      console.log(`  "${owner}": ${count} entities`);
    });
    
    // Step 2: Test owner_id filtering on /api/entities
    console.log(`\n🔍 Step 2: Testing owner_id filtering on /api/entities`);
    console.log(`Using owner_id: "${ownerId}"`);
    
    const { response: ownerResponse, data: ownerData } = await makeRequest(
      `/api/entities?owner_id=${encodeURIComponent(ownerId)}&limit=10`
    );
    
    if (ownerResponse.ok) {
      console.log(`✅ Status: ${ownerResponse.status}, Entities: ${ownerData.entities.length}`);
      console.log(`🔧 Filters applied:`, ownerData.filters_applied);
      
      if (ownerData.entities.length > 0) {
        // Verify all entities have the correct owner_id
        const allCorrectOwner = ownerData.entities.every(e => e.owner_id === ownerId);
        console.log(`🎯 All entities have correct owner_id: ${allCorrectOwner ? 'YES' : 'NO'}`);
        
        if (!allCorrectOwner) {
          console.log('❌ Found entities with wrong owner_id:');
          ownerData.entities.forEach(e => {
            if (e.owner_id !== ownerId) {
              console.log(`  - Entity ${e.id}: owner_id="${e.owner_id}"`);
            }
          });
        }
      } else {
        console.log('⚠️ No entities returned for owner filter');
      }
    } else {
      console.log(`❌ Owner filter failed: ${ownerResponse.status}`, ownerData);
    }
    
    // Step 3: Test owner_id filtering on /api/entities/search
    console.log(`\n🔍 Step 3: Testing owner_id filtering on /api/entities/search`);
    
    const { response: searchResponse, data: searchData } = await makeRequest(
      `/api/entities/search?owner_id=${encodeURIComponent(ownerId)}&limit=10`
    );
    
    if (searchResponse.ok) {
      console.log(`✅ Status: ${searchResponse.status}, Entities: ${searchData.entities.length}`);
      console.log(`🔍 Search params:`, searchData.search);
      
      if (searchData.entities.length > 0) {
        const allCorrectOwner = searchData.entities.every(e => e.owner_id === ownerId);
        console.log(`🎯 All entities have correct owner_id: ${allCorrectOwner ? 'YES' : 'NO'}`);
      }
    } else {
      console.log(`❌ Search owner filter failed: ${searchResponse.status}`, searchData);
    }
    
    // Step 4: Test exclude_id filtering
    console.log(`\n🔍 Step 4: Testing exclude_id filtering`);
    
    const { response: excludeResponse, data: excludeData } = await makeRequest(
      `/api/entities?exclude_id=${sampleEntity.id}&limit=10`
    );
    
    if (excludeResponse.ok) {
      console.log(`✅ Status: ${excludeResponse.status}, Entities: ${excludeData.entities.length}`);
      console.log(`🔧 Filters applied:`, excludeData.filters_applied);
      
      const excludedFound = excludeData.entities.find(e => e.id === sampleEntity.id);
      console.log(`🚫 Excluded entity found in results: ${excludedFound ? 'YES (ERROR!)' : 'NO (CORRECT)'}`);
    } else {
      console.log(`❌ Exclude filter failed: ${excludeResponse.status}`, excludeData);
    }
    
    // Step 5: Test combined owner_id and exclude_id
    console.log(`\n🔍 Step 5: Testing combined owner_id and exclude_id`);
    
    const { response: combinedResponse, data: combinedData } = await makeRequest(
      `/api/entities?owner_id=${encodeURIComponent(ownerId)}&exclude_id=${sampleEntity.id}&limit=10`
    );
    
    if (combinedResponse.ok) {
      console.log(`✅ Status: ${combinedResponse.status}, Entities: ${combinedData.entities.length}`);
      console.log(`🔧 Filters applied:`, combinedData.filters_applied);
      
      if (combinedData.entities.length > 0) {
        const allCorrectOwner = combinedData.entities.every(e => e.owner_id === ownerId);
        const excludedFound = combinedData.entities.find(e => e.id === sampleEntity.id);
        
        console.log(`🎯 All entities have correct owner_id: ${allCorrectOwner ? 'YES' : 'NO'}`);
        console.log(`🚫 Excluded entity found in results: ${excludedFound ? 'YES (ERROR!)' : 'NO (CORRECT)'}`);
      }
    } else {
      console.log(`❌ Combined filter failed: ${combinedResponse.status}`, combinedData);
    }
    
    // Step 6: Test with non-existent owner
    console.log(`\n🔍 Step 6: Testing with non-existent owner`);
    
    const { response: nonExistentResponse, data: nonExistentData } = await makeRequest(
      `/api/entities?owner_id=nonexistent@example.com&limit=10`
    );
    
    if (nonExistentResponse.ok) {
      console.log(`✅ Status: ${nonExistentResponse.status}, Entities: ${nonExistentData.entities.length}`);
      console.log(`🎯 Expected 0 entities for non-existent owner: ${nonExistentData.entities.length === 0 ? 'CORRECT' : 'ERROR'}`);
    } else {
      console.log(`❌ Non-existent owner test failed: ${nonExistentResponse.status}`, nonExistentData);
    }
    
    // Step 7: Test pagination with owner filter
    console.log(`\n🔍 Step 7: Testing pagination with owner filter`);
    
    const { response: paginationResponse, data: paginationData } = await makeRequest(
      `/api/entities?owner_id=${encodeURIComponent(ownerId)}&page=1&limit=2`
    );
    
    if (paginationResponse.ok) {
      console.log(`✅ Status: ${paginationResponse.status}, Entities: ${paginationData.entities.length}`);
      console.log(`📄 Pagination:`, paginationData.pagination);
      console.log(`🎯 Respects limit: ${paginationData.entities.length <= 2 ? 'YES' : 'NO'}`);
    } else {
      console.log(`❌ Pagination test failed: ${paginationResponse.status}`, paginationData);
    }
    
    console.log('\n🎉 Comprehensive testing completed!');
    
  } catch (error) {
    console.log(`🚨 Error during testing:`, error.message);
  }
}

runComprehensiveTests().catch(console.error);