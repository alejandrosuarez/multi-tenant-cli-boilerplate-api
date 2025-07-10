#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const PRODUCTION_URL = 'https://multi-tenant-cli-boilerplate-a677dxxjm.vercel.app';
const ENTITY_ID = 'test-entity-123';
const TENANT_ID = 'test-tenant-123';
const USER_ID = 'test-user-123';

// Create a tiny test image (1x1 PNG)
const createTinyTestImage = () => {
  // This is a 1x1 transparent PNG in base64
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jD8VqAAAAAElFTkSuQmCC',
    'base64'
  );
  return pngData;
};

// Test upload function
async function testUpload() {
  console.log('🧪 Starting production upload test...');
  console.log(`📍 Production URL: ${PRODUCTION_URL}`);
  
  try {
    // Create form data
    const form = new FormData();
    const imageBuffer = createTinyTestImage();
    
    // Add file to form
    form.append('image', imageBuffer, {
      filename: 'test-tiny-image.png',
      contentType: 'image/png'
    });
    
    // Add metadata
    form.append('entityId', ENTITY_ID);
    form.append('tenantId', TENANT_ID);
    form.append('userId', USER_ID);
    form.append('label', 'Test staging upload');
    
    console.log('📤 Uploading test image...');
    
    // Make upload request
    const response = await axios.post(`${PRODUCTION_URL}/api/images/upload`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000
    });
    
    console.log('✅ Upload successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const imageData = response.data.data;
      console.log('\n🎯 Test Results:');
      console.log(`- Image ID: ${imageData.id}`);
      console.log(`- Entity ID: ${imageData.metadata.entityId}`);
      console.log(`- Tenant ID: ${imageData.metadata.tenantId}`);
      console.log('- Available URLs:');
      
      Object.entries(imageData.urls).forEach(([size, info]) => {
        console.log(`  ${size}: ${info.url}`);
      });
      
      return { success: true, imageId: imageData.id };
    }
    
  } catch (error) {
    console.error('❌ Upload failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    return { success: false, error: error.message };
  }
}

// Test getting images for entity
async function testGetImages() {
  console.log('\n📋 Testing get images endpoint...');
  
  try {
    const response = await axios.get(`${PRODUCTION_URL}/api/images/entity/${ENTITY_ID}`, {
      params: { tenantId: TENANT_ID },
      timeout: 30000
    });
    
    console.log('✅ Get images successful!');
    console.log('📊 Images found:', response.data.data?.length || 0);
    
    return { success: true, images: response.data.data };
  } catch (error) {
    console.error('❌ Get images failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting production deployment tests...');
  console.log('=' .repeat(50));
  
  // Test 1: Upload image
  const uploadResult = await testUpload();
  
  // Test 2: Get images
  const getResult = await testGetImages();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 Test Summary:');
  console.log(`Upload test: ${uploadResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Get images test: ${getResult.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (uploadResult.success && getResult.success) {
    console.log('\n🎉 All tests passed! Production deployment is working correctly.');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Check the production deployment.');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testUpload, testGetImages };
