#!/usr/bin/env node

// Debug script to understand tenant context issues
const API_URL = process.env.API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';

async function debugTenantContext() {
  console.log('🔍 Debugging Tenant Context Issues');
  console.log(`🌐 API Base URL: ${API_URL}`);
  
  try {
    // Test 1: Get entities without any tenant context
    console.log('\n📡 Test 1: Get entities (no auth, no tenant)');
    const response1 = await fetch(`${API_URL}/api/entities?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data1 = await response1.json();
    console.log(`Status: ${response1.status}, Entities: ${data1.entities?.length || 0}`);
    
    if (data1.entities && data1.entities.length > 0) {
      console.log(`Sample entity tenant_id: "${data1.entities[0].tenant_id}"`);
      console.log(`Sample entity owner_id: "${data1.entities[0].owner_id}"`);
    }
    
    // Test 2: Try with explicit tenant header
    console.log('\n📡 Test 2: Get entities with tenant header');
    const response2 = await fetch(`${API_URL}/api/entities?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'default'
      }
    });
    
    const data2 = await response2.json();
    console.log(`Status: ${response2.status}, Entities: ${data2.entities?.length || 0}`);
    
    // Test 3: Try with different tenant
    console.log('\n📡 Test 3: Get entities with aspcorpo tenant');
    const response3 = await fetch(`${API_URL}/api/entities?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'aspcorpo'
      }
    });
    
    const data3 = await response3.json();
    console.log(`Status: ${response3.status}, Entities: ${data3.entities?.length || 0}`);
    
    // Test 4: Now test owner_id filtering with the correct tenant
    if (data1.entities && data1.entities.length > 0) {
      const sampleEntity = data1.entities[0];
      const tenantId = sampleEntity.tenant_id;
      const ownerId = sampleEntity.owner_id;
      
      console.log(`\n📡 Test 4: Owner filtering with tenant "${tenantId}"`);
      const response4 = await fetch(`${API_URL}/api/entities?owner_id=${encodeURIComponent(ownerId)}&limit=5`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        }
      });
      
      const data4 = await response4.json();
      console.log(`Status: ${response4.status}, Entities: ${data4.entities?.length || 0}`);
      
      if (data4.entities && data4.entities.length > 0) {
        console.log(`✅ Owner filtering works with correct tenant!`);
        console.log(`First result owner_id: "${data4.entities[0].owner_id}"`);
        
        // Test exclude_id
        console.log(`\n📡 Test 5: Exclude ID with tenant "${tenantId}"`);
        const response5 = await fetch(`${API_URL}/api/entities?owner_id=${encodeURIComponent(ownerId)}&exclude_id=${sampleEntity.id}&limit=5`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId
          }
        });
        
        const data5 = await response5.json();
        console.log(`Status: ${response5.status}, Entities: ${data5.entities?.length || 0}`);
        
        const excludedFound = data5.entities?.find(e => e.id === sampleEntity.id);
        console.log(`Excluded entity found: ${excludedFound ? 'YES (ERROR!)' : 'NO (CORRECT)'}`);
      }
    }
    
  } catch (error) {
    console.log(`🚨 Error:`, error.message);
  }
}

debugTenantContext().catch(console.error);