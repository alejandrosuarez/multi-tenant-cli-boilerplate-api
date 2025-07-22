# API Documentation Guide

This guide explains how to maintain and update the API documentation for the Multi-tenant CLI Boilerplate API.

## Overview

The API documentation system consists of:

1. **OpenAPI Specification**: A JSON file that defines all API endpoints, parameters, request bodies, and responses
2. **Swagger UI**: An interactive web interface for exploring and testing the API
3. **Landing Page**: A user-friendly introduction to the API documentation

## File Structure

```
├── ui/public/api-docs/
│   ├── index.html          # Swagger UI interface
│   └── openapi.json        # OpenAPI specification
├── ui/public/api-docs-landing.html  # Landing page
└── docs/API_DOCUMENTATION_GUIDE.md  # This guide
```

## Updating the Documentation

### Manual Updates

To manually update the API documentation:

1. Edit the `ui/public/api-docs/openapi.json` file to add or modify endpoints
2. Follow the OpenAPI 3.0 specification format (see below)
3. Test the documentation by visiting `/api-docs` in your browser

### Automated Updates

For a more automated approach, you can:

1. Create a script that generates the OpenAPI specification from your code
2. Run this script as part of your build process or development workflow

## Adding a New Endpoint

To add a new endpoint to the documentation:

1. Open `ui/public/api-docs/openapi.json`
2. Add a new path entry under the `paths` object
3. Define the HTTP methods (GET, POST, etc.) for the endpoint
4. Specify parameters, request body, responses, and security requirements

Example:

```json
"/api/new-endpoint": {
  "get": {
    "tags": ["Category"],
    "summary": "Short description",
    "description": "Detailed description of what the endpoint does",
    "parameters": [
      {
        "name": "param",
        "in": "query",
        "description": "Parameter description",
        "schema": {
          "type": "string"
        }
      }
    ],
    "security": [
      {
        "bearerAuth": []
      }
    ],
    "responses": {
      "200": {
        "description": "Successful response",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ResponseSchema"
            }
          }
        }
      },
      "400": {
        "description": "Bad request",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      }
    }
  }
}
```

## Adding a New Schema

To add a new data schema:

1. Open `ui/public/api-docs/openapi.json`
2. Add a new schema definition under `components.schemas`

Example:

```json
"NewSchema": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

## Automating Documentation Updates

### Option 1: Code-First Approach

You can implement a code-first approach where the OpenAPI specification is generated from your code:

1. Add JSDoc or similar comments to your route handlers
2. Use a tool like `swagger-jsdoc` to generate the OpenAPI specification
3. Create a script that runs this tool and updates the `openapi.json` file

Example script (`scripts/generate-api-docs.js`):

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

// Define options for swagger-jsdoc
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-tenant CLI Boilerplate API',
      version: '1.0.0',
      description: 'Complete API documentation with interactive playground'
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
    ]
  },
  // Path to the API routes with JSDoc comments
  apis: ['./src/**/*.js']
};

// Generate the OpenAPI specification
const openapiSpecification = swaggerJsdoc(options);

// Write the specification to the file
const outputPath = path.join(__dirname, '../ui/public/api-docs/openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(openapiSpecification, null, 2));

console.log(`OpenAPI specification generated at ${outputPath}`);
```

### Option 2: Route Decorator Approach

Implement a route decorator that automatically adds routes to the OpenAPI specification:

1. Create a decorator function that wraps your route handlers
2. The decorator collects metadata about the route
3. A script compiles this metadata into the OpenAPI specification

Example:

```javascript
// src/utils/route-decorator.js
const routes = [];

function route(options) {
  return function(target, key, descriptor) {
    routes.push({
      path: options.path,
      method: options.method,
      summary: options.summary,
      description: options.description,
      parameters: options.parameters,
      requestBody: options.requestBody,
      responses: options.responses,
      security: options.security,
      tags: options.tags
    });
    
    return descriptor;
  };
}

module.exports = { route, routes };
```

Then use it in your route handlers:

```javascript
const { route } = require('./utils/route-decorator');

class EntityController {
  @route({
    path: '/api/entities',
    method: 'get',
    summary: 'List Entities',
    description: 'Get a paginated list of entities with optional filtering',
    tags: ['Entities'],
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }
    ],
    responses: {
      '200': {
        description: 'List of entities',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/EntityList' }
          }
        }
      }
    }
  })
  async listEntities(request, reply) {
    // Implementation
  }
}
```

### Option 3: Fastify Swagger Integration

If you resolve the compatibility issues with Fastify Swagger, you can use it to automatically generate the OpenAPI specification:

1. Install compatible versions of `@fastify/swagger` and `@fastify/swagger-ui`
2. Configure them to generate the OpenAPI specification
3. Add route options to define the OpenAPI metadata

Example:

```javascript
// Register Swagger
fastify.register(require('@fastify/swagger'), {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'Multi-tenant CLI Boilerplate API',
      description: 'Complete API documentation with interactive playground',
      version: '1.0.0'
    },
    host: 'localhost:3000',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    }
  },
  exposeRoute: true
});

// Define routes with schema
fastify.get('/api/entities', {
  schema: {
    tags: ['Entities'],
    summary: 'List Entities',
    description: 'Get a paginated list of entities with optional filtering',
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 }
      }
    },
    response: {
      200: {
        description: 'List of entities',
        type: 'object',
        properties: {
          entities: { type: 'array', items: { $ref: '#/components/schemas/Entity' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              has_more: { type: 'boolean' }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  handler: async (request, reply) => {
    // Implementation
  }
});
```

## Best Practices

1. **Keep Documentation in Sync**: Update the documentation whenever you add or modify endpoints
2. **Use Descriptive Summaries**: Write clear, concise summaries for each endpoint
3. **Include Examples**: Provide example requests and responses
4. **Document Error Responses**: Include all possible error responses
5. **Group Related Endpoints**: Use tags to group related endpoints
6. **Test the Documentation**: Regularly test the documentation to ensure it works correctly

## OpenAPI Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Tools](https://openapi.tools/)

## Troubleshooting

### Common Issues

1. **Swagger UI Not Loading**: Check that the `index.html` file is being served correctly
2. **Invalid OpenAPI Specification**: Validate your JSON using the Swagger Editor
3. **Authentication Not Working**: Ensure the security definitions are correct

### Validation

You can validate your OpenAPI specification using:

1. The [Swagger Editor](https://editor.swagger.io/)
2. The [OpenAPI Validator](https://github.com/IBM/openapi-validator) CLI tool

## Conclusion

Maintaining up-to-date API documentation is crucial for developer experience. By following this guide and implementing one of the automated approaches, you can ensure your documentation stays current with minimal effort.

For any questions or issues, please refer to the OpenAPI specification or contact the development team.