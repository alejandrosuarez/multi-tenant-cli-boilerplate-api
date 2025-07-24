#!/usr/bin/env node

/**
 * Sync OpenAPI Documentation
 * 
 * This script copies the OpenAPI specification from src/swagger/openapi.js
 * to the public directory for the UI documentation.
 */

const fs = require('fs');
const path = require('path');

// Load the OpenAPI schema from the source
const openApiSchema = require('../src/swagger/openapi');

// Output path for the public documentation
const outputPath = path.join(__dirname, '../ui/public/api-docs/openapi.json');

// Ensure the output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the OpenAPI specification to the public directory
fs.writeFileSync(outputPath, JSON.stringify(openApiSchema, null, 2));

console.log('✅ OpenAPI documentation synced successfully!');
console.log(`📄 Updated: ${outputPath}`);
console.log('🌐 The UI documentation will now reflect the latest API changes.');