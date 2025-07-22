#!/usr/bin/env node

/**
 * API Documentation Generator
 * 
 * This script scans the codebase for API routes and generates an OpenAPI specification.
 * It uses a combination of static analysis and JSDoc comments to build the documentation.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Base OpenAPI specification
const baseSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Multi-tenant CLI Boilerplate API',
    description: 'Complete API documentation with interactive playground',
    version: '1.0.0',
    contact: {
      name: 'API Support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    },
    {
      url: 'https://multi-tenant-cli-boilerplate-api.vercel.app',
      description: 'Production Server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'OTP-based authentication endpoints'
    },
    {
      name: 'Entities',
      description: 'Entity management endpoints'
    },
    {
      name: 'Images',
      description: 'Image upload and management'
    },
    {
      name: 'Search',
      description: 'Advanced search and filtering'
    },
    {
      name: 'Notifications',
      description: 'Push notification management'
    },
    {
      name: 'System',
      description: 'System health and utilities'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the token you received from the verify-otp endpoint'
      }
    },
    schemas: {}
  },
  paths: {}
};

// Load existing OpenAPI specification if it exists
let existingSpec = {};
const outputPath = path.join(__dirname, '../ui/public/api-docs/openapi.json');
if (fs.existsSync(outputPath)) {
  try {
    existingSpec = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    console.log('Loaded existing OpenAPI specification');
    
    // Preserve existing schemas and paths
    if (existingSpec.components && existingSpec.components.schemas) {
      baseSpec.components.schemas = existingSpec.components.schemas;
    }
    
    if (existingSpec.paths) {
      baseSpec.paths = existingSpec.paths;
    }
  } catch (error) {
    console.error('Error loading existing OpenAPI specification:', error.message);
  }
}

// Find all route files
const routeFiles = glob.sync('src/**/*.js', { ignore: ['src/node_modules/**', 'src/tests/**'] });

// Regular expressions to find route definitions
const routeRegex = /fastify\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g;
const handlerRegex = /async\s*\([^)]*\)\s*=>\s*{/;
const commentRegex = /\/\*\*\s*([\s\S]*?)\s*\*\//g;
const tagRegex = /@(\w+)\s+(.*)/g;

// Process each file
routeFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  
  // Find all route definitions in the file
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1];
    const path = match[2];
    const startIndex = match.index;
    
    // Find the handler function
    const handlerMatch = content.slice(startIndex).match(handlerRegex);
    if (!handlerMatch) continue;
    
    // Look for JSDoc comments before the route definition
    const beforeRoute = content.slice(0, startIndex);
    const lastComment = [...beforeRoute.matchAll(commentRegex)].pop();
    
    if (!lastComment) continue;
    
    const comment = lastComment[1];
    const tags = {};
    
    // Parse JSDoc tags
    let tagMatch;
    while ((tagMatch = tagRegex.exec(comment)) !== null) {
      const tagName = tagMatch[1];
      const tagValue = tagMatch[2].trim();
      tags[tagName] = tagValue;
    }
    
    // Extract description (text before any tags)
    const description = comment
      .split('@')[0]
      .trim()
      .split('\n')
      .map(line => line.trim().replace(/^\*\s*/, ''))
      .join(' ')
      .trim();
    
    // Create path entry if it doesn't exist
    if (!baseSpec.paths[path]) {
      baseSpec.paths[path] = {};
    }
    
    // Add method entry
    baseSpec.paths[path][method] = {
      tags: tags.tag ? [tags.tag] : undefined,
      summary: tags.summary || description.split('.')[0],
      description: description,
      parameters: [],
      responses: {
        '200': {
          description: tags.response || 'Successful response'
        }
      }
    };
    
    // Add security if @auth tag is present
    if (tags.auth) {
      baseSpec.paths[path][method].security = [{ bearerAuth: [] }];
    }
    
    console.log(`Found route: ${method.toUpperCase()} ${path}`);
  }
});

// Write the OpenAPI specification to file
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(baseSpec, null, 2));
console.log(`OpenAPI specification generated at ${outputPath}`);

// Create a simple script to update the documentation
const updateScript = `#!/bin/bash
echo "Updating API documentation..."
node scripts/generate-api-docs.js
echo "Documentation updated!"
`;

const updateScriptPath = path.join(__dirname, 'update-api-docs.sh');
fs.writeFileSync(updateScriptPath, updateScript);
fs.chmodSync(updateScriptPath, '755');
console.log(`Update script created at ${updateScriptPath}`);

console.log('\nTo automatically update the documentation:');
console.log('1. Add JSDoc comments to your route handlers');
console.log('2. Run ./scripts/update-api-docs.sh');
console.log('\nExample JSDoc comment:');
console.log(`/**
 * Get a list of entities with optional filtering
 * @tag Entities
 * @summary List Entities
 * @auth required
 * @response List of entities with pagination
 */`);