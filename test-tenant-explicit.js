#!/usr/bin/env node

// Test with explicit tenant context to isolate the issue
const API_URL = process.env.API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';

async function testWithExplicitTenant() {
  console.log('🔍 Testing with Explicit Tenant Context');
  console.log(`🌐 API Base URL: ${API_URL}`);
  
  try {
    // Step 1: Get entities and check their tenant_id
    console.log('\n📊 Step 1: Analyzing entity tenant_ids');
    
    const response1 = await fetch(`${API_URL}/api/entities?limit=20`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data1 = await response1.json();
    
    if (!response1.ok || !data1.entities) {
      console.log('❌ Failed to get entities:', data1);
      return;
    }
    
    console.log(`✅ Found ${data1.entities.length} entities`);
    
    // Analyze tenant distribution
    const tenantGroups = {};
    const ownerGroups = {};
    
    data1.entities.forEach(entity => {
      // Group by tenant
      if (!tenantGroups[entity.tenant_id]) {
        tenantGroups[entity.tenant_id] = [];
      }
      tenantGroups[entity.tenant_id].push(entity);
      
      // Group by owner within tenant
      const key = `${entity.tenant_id}:${entity.owner_id}`;
      if (!ownerGroups[key]) {
        ownerGroups[key] = [];
      }
      ownerGroups[key].push(entity);
    });
    
    console.log('\n📋 Tenant distribution:');
    Object.entries(tenantGroups).forEach(([tenantId, entities]) => {
      console.log(`  "${tenantId}": ${entities.length} entities`);
    });
    
    console.log('\n📋 Owner distribution by tenant:');
    Object.entries(ownerGroups).forEach(([key, entities]) => {
      const [tenantId, ownerId] = key.split(':');
      console.log(`  Tenant "${tenantId}", Owner "${ownerId}": ${entities.length} entities`);
    });
    
    // Step 2: Test with explicit tenant parameter
    const defaultTenantEntities = tenantGroups['default'] || [];
    if (defaultTenantEntities.length > 0) {
      const sampleEntity = defaultTenantEntities[0];
      const ownerId = sampleEntity.owner_id;
      
      console.log(`\n🎯 Testing with tenant="default", owner="${ownerId}"`);
      
      // Test 1: Using tenant query parameter
      console.log('\n📡 Test 1: Using tenant query parameter');
      const response2 = await fetch(`${API_URL}/api/entities?tenant=default&owner_id=${encodeURIComponent(ownerId)}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data2 = await response2.json();
      console.log(`Status: ${response2.status}, Entities: ${data2.entities?.length || 0}`);
      console.log(`Filters applied:`, data2.filters_applied);
      
      // Test 2: Using X-Tenant-ID header
      console.log('\n📡 Test 2: Using X-Tenant-ID header');
      const response3 = await fetch(`${API_URL}/api/entities?owner_id=${encodeURIComponent(ownerId)}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'default'
        }
      });
      
      const data3 = await response3.json();
      console.log(`Status: ${response3.status}, Entities: ${data3.entities?.length || 0}`);
      console.log(`Filters applied:`, data3.filters_applied);
      
      // Test 3: Check if the issue is with the combination of filters
      console.log('\n📡 Test 3: Testing without owner_id filter (tenant only)');
      const response4 = await fetch(`${API_URL}/api/entities?tenant=default&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data4 = await response4.json();
      console.log(`Status: ${response4.status}, Entities: ${data4.entities?.length || 0}`);
      
      if (data4.entities && data4.entities.length > 0) {
        const ownerMatch = data4.entities.filter(e => e.owner_id === ownerId);
        console.log(`Entities with matching owner_id: ${ownerMatch.length}`);
        
        if (ownerMatch.length > 0) {
          console.log(`✅ Entities with this owner exist in tenant "default"`);
          console.log(`Sample matching entity:`, {
            id: ownerMatch[0].id,
            owner_id: ownerMatch[0].owner_id,
            tenant_id: ownerMatch[0].tenant_id
          });
        }
      }
      
      // Test 4: Try the /api/entities/search endpoint
      console.log('\n📡 Test 4: Testing /api/entities/search with tenant');
      const response5 = await fetch(`${API_URL}/api/entities/search?tenant=default&owner_id=${encodeURIComponent(ownerId)}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data5 = await response5.json();
      console.log(`Status: ${response5.status}, Entities: ${data5.entities?.length || 0}`);
      console.log(`Search params:`, data5.search);
    }
    
  } catch (error) {
    console.log(`🚨 Error:`, error.message);
  }
}

testWithExplicitTenant().catch(console.error);