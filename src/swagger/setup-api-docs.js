#!/usr/bin/env node

/**
 * Setup script for API documentation
 * This script installs required dependencies and sets up the API documentation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up API documentation...');

// Check if required directories exist
const swaggerDir = path.join(__dirname);
const uiPublicDir = path.join(__dirname, '..', '..', 'ui', 'public');

if (!fs.existsSync(uiPublicDir)) {
  console.log('📁 Creating UI public directory...');
  fs.mkdirSync(uiPublicDir, { recursive: true });
}

// Install dependencies
console.log('📦 Installing required dependencies...');
try {
  execSync('npm install --save @fastify/swagger @fastify/swagger-ui', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('\n✨ API documentation setup complete!');
console.log('\n📚 You can now access the API documentation at:');
console.log('- Local: http://localhost:3000/api-docs');
console.log('- Production: https://multi-tenant-cli-boilerplate-api.vercel.app/api-docs');
console.log('\n🧪 To test the API documentation:');
console.log('1. Start the server: npm run dev');
console.log('2. Open your browser and navigate to: http://localhost:3000/api-docs');
console.log('3. Try out the endpoints using the interactive playground');
console.log('\n📝 Documentation features:');
console.log('- Interactive API testing');
console.log('- Authentication flow with OTP');
console.log('- Entity management');
console.log('- Image upload and management');
console.log('- Notification system');
console.log('- Advanced search and filtering');