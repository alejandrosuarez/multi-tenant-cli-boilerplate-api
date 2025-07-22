const openApiSchema = require('./openapi');

/**
 * Register Swagger documentation plugin with Fastify
 * @param {FastifyInstance} fastify - Fastify instance
 */
async function registerSwagger(fastify) {
  try {
    // Register Swagger schema
    await fastify.register(require('@fastify/swagger'), {
      swagger: {
        info: {
          title: openApiSchema.info.title,
          description: openApiSchema.info.description,
          version: openApiSchema.info.version
        },
        host: 'localhost:3000',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: openApiSchema.tags,
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

    // Register Swagger UI
    await fastify.register(require('@fastify/swagger-ui'), {
      routePrefix: '/api-docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
      },
      staticCSP: false
    });

    // Add a redirect from /docs to /api-docs
    fastify.get('/docs', (req, reply) => {
      reply.redirect('/api-docs');
    });

    // Log when documentation is ready
    fastify.ready(() => {
      console.log('📚 API Documentation available at:');
      console.log('- Local: http://localhost:3000/api-docs');
      console.log('- Production: https://multi-tenant-cli-boilerplate-api.vercel.app/api-docs');
    });
  } catch (error) {
    console.error('Error setting up Swagger:', error);
  }
}

module.exports = registerSwagger;