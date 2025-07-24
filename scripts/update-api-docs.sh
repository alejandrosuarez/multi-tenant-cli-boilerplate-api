#!/bin/bash
echo "Updating API documentation..."
node scripts/generate-api-docs.js
node scripts/sync-openapi-docs.js
echo "Documentation updated!"
