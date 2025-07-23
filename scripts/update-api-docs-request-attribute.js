#!/usr/bin/env node

/**
 * Script to update the OpenAPI documentation with the request-attribute endpoint
 */

const fs = require('fs');
const path = require('path');

// Paths
const openApiPath = path.join(__dirname, '../ui/public/api-docs/openapi.json');
const requestAttributePath = path.join(__dirname, '../ui/public/api-docs/request-attribute.json');

// Read files
const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
const requestAttributeSpec = JSON.parse(fs.readFileSync(requestAttributePath, 'utf8'));

// Add Attributes tag if it doesn't exist
const hasAttributesTag = openApiSpec.tags.some(tag => tag.name === 'Attributes');
if (!hasAttributesTag) {
  openApiSpec.tags.push({
    name: 'Attributes',
    description: 'Entity attribute management and requests'
  });
}

// Add schemas
openApiSpec.components.schemas.AttributeRequest = requestAttributeSpec.AttributeRequest;
openApiSpec.components.schemas.AttributeRequestResponse = requestAttributeSpec.AttributeRequestResponse;

// Add path
openApiSpec.paths['/api/request-attribute'] = requestAttributeSpec.path['/api/request-attribute'];

// Write updated OpenAPI spec
fs.writeFileSync(openApiPath, JSON.stringify(openApiSpec, null, 2));

console.log('OpenAPI documentation updated with request-attribute endpoint');