// API Connection Test Utility
export const testApiConnection = async () => {
  const API_URL = import.meta.env.VITE_API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';
  
  try {
    console.log('🔍 Testing API connection to:', API_URL);
    
    // Use the health endpoint (proxy will handle routing)
    const healthUrl = `${API_URL}/health`;
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Health Check Response:', data);
    
    return {
      success: true,
      data,
      url: API_URL
    };
  } catch (error) {
    console.error('❌ API Connection Failed:', error);
    return {
      success: false,
      error: error.message,
      url: API_URL
    };
  }
};

// Test OTP functionality
export const testOTPFlow = async (email = 'test@example.com') => {
  const API_URL = import.meta.env.VITE_API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';
  
  try {
    console.log('🔍 Testing OTP send to:', email);
    
    const response = await fetch(`${API_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tenantId: 'default'
      })
    });
    
    const data = await response.json();
    console.log('📧 OTP Send Response:', data);
    
    return {
      success: response.ok,
      data,
      status: response.status
    };
  } catch (error) {
    console.error('❌ OTP Test Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test entities endpoint
export const testEntitiesEndpoint = async () => {
  const API_URL = import.meta.env.VITE_API_URL || 'https://multi-tenant-cli-boilerplate-api.vercel.app';
  
  try {
    console.log('🔍 Testing entities endpoint');
    
    const response = await fetch(`${API_URL}/api/entities?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('📊 Entities Response:', data);
    
    return {
      success: response.ok,
      data,
      status: response.status
    };
  } catch (error) {
    console.error('❌ Entities Test Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Run all API tests
export const runAllApiTests = async () => {
  console.log('🚀 Running API Connection Tests...');
  
  const results = {
    health: await testApiConnection(),
    otp: await testOTPFlow(),
    entities: await testEntitiesEndpoint()
  };
  
  console.log('📋 API Test Results:', results);
  
  const allPassed = Object.values(results).every(result => result.success);
  
  if (allPassed) {
    console.log('✅ All API tests passed! Production API is ready.');
  } else {
    console.log('⚠️ Some API tests failed. Check the results above.');
  }
  
  return results;
};