#!/usr/bin/env node

// Test both local and production APIs to compare behavior
const LOCAL_API = 'http://localhost:3001';
const PROD_API = 'https://multi-tenant-cli-boilerplate-api.vercel.app';

async function testEndpoint(baseUrl, endpoint, description) {
  const url = `${baseUrl}${endpoint}`;
  console.log(`\n🔍 ${description}`);
  console.log(`📡 ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Status: ${response.status}, Entities: ${data.entities?.length || 0}`);
      
      if (data.filters_applied) {
        console.log(`🔧 Filters applied:`, data.filters_applied);
      }
      
      if (data.entities && data.entities.length > 0) {
        console.log(`📝 Sample entity owner_id: "${data.entities[0].owner_id}"`);
      }
      
      return { success: true, count: data.entities?.length || 0, data };
    } else {
      console.log(`❌ Status: ${response.status}, Error:`, data.error || data.message);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`🚨 Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function compareAPIs() {
  console.log('🔄 Comparing Local vs Production API Behavior');
  
  // Test 1: Basic entities endpoint
  console.log('\n=== Test 1: Basic entities endpoint ===');
  const localBasic = await testEndpoint(LOCAL_API, '/api/entities?limit=5', 'Local API - Basic');
  const prodBasic = await testEndpoint(PROD_API, '/api/entities?limit=5', 'Production API - Basic');
  
  if (localBasic.success && prodBasic.success) {
    console.log(`\n📊 Comparison: Local=${localBasic.count} entities, Production=${prodBasic.count} entities`);
    
    if (localBasic.count > 0 && prodBasic.count > 0) {
      // Get a sample owner_id from production
      const sampleOwner = prodBasic.data.entities[0].owner_id;
      
      // Test 2: Owner filtering
      console.log('\n=== Test 2: Owner ID filtering ===');
      const localOwner = await testEndpoint(LOCAL_API, `/api/entities?owner_id=${encodeURIComponent(sampleOwner)}&limit=5`, 'Local API - Owner Filter');
      const prodOwner = await testEndpoint(PROD_API, `/api/entities?owner_id=${encodeURIComponent(sampleOwner)}&limit=5`, 'Production API - Owner Filter');
      
      console.log(`\n📊 Owner Filter Comparison: Local=${localOwner.success ? localOwner.count : 'ERROR'} entities, Production=${prodOwner.success ? prodOwner.count : 'ERROR'} entities`);
      
      if (localOwner.success && localOwner.count > 0) {
        console.log('🎉 Local API owner filtering is working!');
        
        // Test 3: Exclude ID filtering
        const sampleEntityId = localOwner.data.entities[0].id;
        console.log('\n=== Test 3: Exclude ID filtering ===');
        const localExclude = await testEndpoint(LOCAL_API, `/api/entities?owner_id=${encodeURIComponent(sampleOwner)}&exclude_id=${sampleEntityId}&limit=5`, 'Local API - Exclude Filter');
        const prodExclude = await testEndpoint(PROD_API, `/api/entities?owner_id=${encodeURIComponent(sampleOwner)}&exclude_id=${sampleEntityId}&limit=5`, 'Production API - Exclude Filter');
        
        console.log(`\n📊 Exclude Filter Comparison: Local=${localExclude.success ? localExclude.count : 'ERROR'} entities, Production=${prodExclude.success ? prodExclude.count : 'ERROR'} entities`);
        
        if (localExclude.success) {
          const excludedFound = localExclude.data.entities?.find(e => e.id === sampleEntityId);
          console.log(`🚫 Local API - Excluded entity found: ${excludedFound ? 'YES (ERROR!)' : 'NO (CORRECT)'}`);
        }
      } else {
        console.log('⚠️ Local API owner filtering is not working');
      }
      
      if (prodOwner.success && prodOwner.count === 0) {
        console.log('⚠️ Production API owner filtering is not working (returns 0 entities)');
      }
    }
  }
  
  console.log('\n🎯 Summary:');
  console.log('- If local API shows entities with owner filtering but production shows 0, the fix is working locally but not deployed');
  console.log('- If both show 0, there might be another issue to investigate');
  console.log('- If both work, the feature is working correctly');
}

compareAPIs().catch(console.error);