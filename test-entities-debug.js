#!/usr/bin/env node

// Debug script to see what entities exist and their owner_ids
const API_URL = process.env.API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';

async function debugEntities() {
  console.log('🔍 Debugging Entities and Owner IDs');
  console.log(`🌐 API Base URL: ${API_URL}`);
  
  try {
    // Get more entities to see the variety
    const response = await fetch(`${API_URL}/api/entities?limit=20`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.entities) {
      console.log(`\n📊 Found ${data.entities.length} entities:`);
      
      // Group by owner_id
      const ownerGroups = {};
      
      data.entities.forEach((entity, index) => {
        console.log(`\n${index + 1}. Entity ID: ${entity.id}`);
        console.log(`   Owner ID: "${entity.owner_id}"`);
        console.log(`   Type: ${entity.entity_type}`);
        console.log(`   Public: ${entity.public_shareable}`);
        console.log(`   Created: ${entity.created_at}`);
        
        if (!ownerGroups[entity.owner_id]) {
          ownerGroups[entity.owner_id] = [];
        }
        ownerGroups[entity.owner_id].push(entity);
      });
      
      console.log('\n📋 Owner ID Summary:');
      Object.keys(ownerGroups).forEach(ownerId => {
        console.log(`  "${ownerId}": ${ownerGroups[ownerId].length} entities`);
      });
      
      // Test with the most common owner_id
      const mostCommonOwner = Object.keys(ownerGroups).reduce((a, b) => 
        ownerGroups[a].length > ownerGroups[b].length ? a : b
      );
      
      console.log(`\n🎯 Testing with most common owner: "${mostCommonOwner}"`);
      
      // Test owner_id filtering
      const ownerResponse = await fetch(`${API_URL}/api/entities?owner_id=${encodeURIComponent(mostCommonOwner)}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const ownerData = await ownerResponse.json();
      
      if (ownerResponse.ok) {
        console.log(`✅ Owner filter test: ${ownerData.entities.length} entities returned`);
        
        if (ownerData.entities.length > 0) {
          console.log(`📝 First filtered entity:`, {
            id: ownerData.entities[0].id,
            owner_id: ownerData.entities[0].owner_id,
            type: ownerData.entities[0].entity_type
          });
          
          // Test exclude_id with this entity
          const excludeResponse = await fetch(`${API_URL}/api/entities?owner_id=${encodeURIComponent(mostCommonOwner)}&exclude_id=${ownerData.entities[0].id}&limit=10`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          const excludeData = await excludeResponse.json();
          
          if (excludeResponse.ok) {
            console.log(`✅ Exclude filter test: ${excludeData.entities.length} entities returned (should be ${ownerData.entities.length - 1})`);
            
            // Verify the excluded entity is not in results
            const excludedFound = excludeData.entities.find(e => e.id === ownerData.entities[0].id);
            console.log(`🔍 Excluded entity found in results: ${excludedFound ? 'YES (ERROR!)' : 'NO (CORRECT)'}`);
          } else {
            console.log(`❌ Exclude filter test failed:`, excludeData);
          }
        }
      } else {
        console.log(`❌ Owner filter test failed:`, ownerData);
      }
      
    } else {
      console.log(`❌ Failed to get entities:`, data);
    }
    
  } catch (error) {
    console.log(`🚨 Error:`, error.message);
  }
}

debugEntities().catch(console.error);