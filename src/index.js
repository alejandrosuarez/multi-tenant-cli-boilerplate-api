const fastify = require('fastify')({ logger: true });
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import services and middleware
const DatabaseService = require('./services/database');
const EntityService = require('./services/entity');
const ImageService = require('./services/image');
const NotificationService = require('./services/notification');
const OTPService = require('./services/otp');
const AuthMiddleware = require('./middleware/auth');
const registerSwagger = require('./swagger');

// Initialize services
const db = new DatabaseService();
const entityService = new EntityService(db);
const imageService = new ImageService(db);
const notificationService = new NotificationService(db);
const otpService = new OTPService(db);
const auth = new AuthMiddleware();

// Register CORS support
fastify.register(require('@fastify/cors'), {
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3001', // UI preview server
    'http://localhost:4173', // Vite preview server
    'http://localhost:5174', // New Vite dev server port
    'http://localhost:5176', // Another common Vite port
    /^https:\/\/.*\.vercel\.app$/, // Vercel deployments
    /^https:\/\/.*\.netlify\.app$/, // Netlify deployments
    /^https:\/\/.*\.share\.dreamflow\.app$/, // Dreamflow share deployments
    /^http:\/\/localhost:\d+$/, // Any localhost port for development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

// Register multipart support for file uploads
fastify.register(require('@fastify/multipart'));

// Register static file serving
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../ui/public'),
  prefix: '/public/'
});

// Register Swagger documentation
registerSwagger(fastify);

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
});

// Authentication endpoints
fastify.post('/api/auth/send-otp', async (request, reply) => {
  const { email, tenantId = 'default' } = request.body;

  if (!email) {
    return reply.code(400).send({ success: false, error: 'Email is required' });
  }

  const result = await otpService.sendOTP(email, tenantId);

  if (result.success) {
    return { success: true, message: 'OTP sent successfully' };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

fastify.post('/api/auth/verify-otp', async (request, reply) => {
  const { email, otp, tenantId = 'default' } = request.body;

  if (!email || !otp) {
    return reply.code(400).send({ success: false, error: 'Email and OTP are required' });
  }

  const result = await otpService.verifyOTP(email, otp, tenantId);

  if (result.success) {
    const token = auth.generatePersistentToken({
      email,
      tenantId,
      id: result.user.id
    });

    return {
      success: true,
      token,
      user: result.user
    };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

fastify.get('/api/auth/me', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  return {
    success: true,
    user: request.user
  };
});

fastify.post('/api/auth/logout', {
  preHandler: auth.required.bind(auth),
  schema: {
    body: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
}, async (request, reply) => {
  const result = auth.logout(request.user.email);
  return { success: true, message: 'Logged out successfully' };
});

// Entity categories
fastify.get('/api/categories', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  const tenantId = request.user?.tenant || 'default';
  const result = await db.getEntityCategories(tenantId);

  if (result.success) {
    return { success: true, categories: result.data };
  } else {
    return reply.code(500).send({ success: false, error: result.error });
  }
});

// Entity endpoints
fastify.get('/api/entities', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  const { page = 1, limit = 20, owner_id, exclude_id, tenant } = request.query;
  const tenantId = tenant || request.user?.tenant || 'default';

  const result = await entityService.getMyEntities({
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100),
    tenantId,
    userId: request.user?.sub,
    ownerId: owner_id,
    excludeId: exclude_id
  });

  if (result.success) {
    return result.data;
  } else {
    return reply.code(500).send({ success: false, error: result.error });
  }
});

fastify.post('/api/entities', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const result = await entityService.createEntity(
    request.body,
    request.user.sub,
    request.user.tenant
  );

  if (result.success) {
    return { success: true, ...result.data };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

fastify.get('/api/entities/:id', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  const { id } = request.params;
  const result = await entityService.getEntity(
    id,
    request.user?.sub,
    request.user?.tenant
  );

  if (result.success) {
    return { success: true, ...result.data };
  } else {
    return reply.code(404).send({ success: false, error: result.error });
  }
});

fastify.patch('/api/entities/:id', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const { id } = request.params;
  const result = await entityService.updateEntity(
    id,
    request.body,
    request.user.sub,
    request.user.tenant
  );

  if (result.success) {
    return { success: true, ...result.data };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

fastify.delete('/api/entities/:id', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const { id } = request.params;
  const result = await entityService.deleteEntity(
    id,
    request.user.sub,
    request.user.tenant
  );

  if (result.success) {
    return { success: true, message: 'Entity deleted successfully' };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

// Search endpoints
fastify.get('/api/entities/search', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  const { q, category, page = 1, limit = 20, owner_id, exclude_id } = request.query;
  const tenantId = request.user?.tenant || 'default';

  const result = await entityService.searchEntities({
    query: q,
    category,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100),
    tenantId,
    userId: request.user?.sub,
    ownerId: owner_id,
    excludeId: exclude_id
  });

  if (result.success) {
    return result.data;
  } else {
    return reply.code(500).send({ success: false, error: result.error });
  }
});

fastify.get('/api/categories/:category/entities', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  const { category } = request.params;
  const { page = 1, limit = 20 } = request.query;
  const tenantId = request.user?.tenant || 'default';

  const result = await entityService.getEntitiesByCategory({
    category,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100),
    tenantId,
    userId: request.user?.sub
  });

  if (result.success) {
    return result.data;
  } else {
    return reply.code(500).send({ success: false, error: result.error });
  }
});

// User entities
fastify.get('/api/my/entities', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const { page = 1, limit = 20 } = request.query;

  const result = await entityService.getMyEntities({
    userId: request.user.sub,
    tenantId: request.user.tenant,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100)
  });

  if (result.success) {
    return result.data;
  } else {
    return reply.code(500).send({ success: false, error: result.error });
  }
});

// Image endpoints
fastify.post('/api/entities/:id/images', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const { id } = request.params;

  try {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ success: false, error: 'No file uploaded' });
    }

    const result = await imageService.uploadEntityImages(
      id,
      [data],
      request.user.sub,
      request.user.tenant
    );

    if (result.success) {
      return { success: true, images: result.data };
    } else {
      return reply.code(400).send({ success: false, error: result.error });
    }
  } catch (error) {
    return reply.code(500).send({ success: false, error: error.message });
  }
});

fastify.get('/api/entities/:id/images', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  const { id } = request.params;

  const result = await imageService.getEntityImages(
    id,
    request.user?.sub,
    request.user?.tenant
  );

  if (result.success) {
    return { success: true, images: result.data };
  } else {
    return reply.code(404).send({ success: false, error: result.error });
  }
});

fastify.delete('/api/images/:id', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const { id } = request.params;

  const result = await imageService.deleteImage(
    id,
    request.user.sub,
    request.user.tenant
  );

  if (result.success) {
    return { success: true, message: 'Image deleted successfully' };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

// Notification endpoints
fastify.post('/api/notifications/subscribe-device', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const { deviceToken, tenantContext } = request.body;

  const result = await notificationService.subscribeDevice(
    request.user.sub,
    deviceToken,
    tenantContext || request.user.tenant
  );

  if (result.success) {
    return { success: true, subscription: result.data };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

fastify.get('/api/notifications/preferences', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const result = await notificationService.getUserPreferences(
    request.user.sub,
    request.user.tenant
  );

  if (result.success) {
    return { success: true, preferences: result.data };
  } else {
    return reply.code(500).send({ success: false, error: result.error });
  }
});

fastify.post('/api/notifications/preferences', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const result = await notificationService.updateUserPreferences(
    request.user.sub,
    request.user.tenant,
    request.body
  );

  if (result.success) {
    return { success: true, preferences: result.data };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

fastify.post('/api/notifications/test', {
  preHandler: auth.required.bind(auth),
  schema: {
    body: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
}, async (request, reply) => {
  const result = await notificationService.sendTestNotification(
    request.user.sub,
    request.user.tenant
  );

  if (result.success) {
    return { success: true, message: 'Test notification sent' };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

fastify.get('/api/notifications/history', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const { page = 1, limit = 20 } = request.query;

  const result = await notificationService.getNotificationHistory(
    request.user.sub,
    request.user.tenant,
    { page: parseInt(page), limit: Math.min(parseInt(limit), 100) }
  );

  if (result.success) {
    return { success: true, notifications: result.data };
  } else {
    return reply.code(500).send({ success: false, error: result.error });
  }
});

fastify.post('/api/notifications/:id/seen', {
  preHandler: auth.required.bind(auth),
  schema: {
    body: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
}, async (request, reply) => {
  const { id } = request.params;

  const result = await notificationService.markAsSeen(
    id,
    request.user.sub,
    request.user.tenant
  );

  if (result.success) {
    return { success: true, message: 'Notification marked as seen' };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

fastify.post('/api/notifications/send', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const result = await notificationService.sendNotification(
    request.body,
    request.user.sub,
    request.user.tenant
  );

  if (result.success) {
    return { success: true, notification: result.data };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

// Interaction logs endpoints
fastify.post('/api/interaction_logs', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const result = await db.logInteraction(
    request.body.eventType,
    request.user.sub,
    request.user.tenant,
    request.body.eventPayload || {}
  );

  if (result.success) {
    return { success: true, log: result.data };
  } else {
    return reply.code(400).send({ success: false, error: result.error });
  }
});

// GET method for interaction logs (added in recent commit)
fastify.get('/api/interaction_logs', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const {
    eventType,
    entityId,
    page = 1,
    limit = 50,
    start_date,
    end_date,
    ...customFilters
  } = request.query;

  const result = await db.getInteractionLogs({
    userId: request.user.sub,
    tenantId: request.user.tenant,
    eventType,
    entityId,
    startDate: start_date,
    endDate: end_date,
    customFilters,
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100)
  });

  if (result.success) {
    return {
      success: true,
      logs: result.data.logs,
      pagination: result.data.pagination,
      filters_applied: result.data.filters_applied
    };
  } else {
    return reply.code(500).send({ success: false, error: result.error });
  }
});

// Shared access endpoint
fastify.get('/api/shared/:shareToken', async (request, reply) => {
  const { shareToken } = request.params;

  const result = await entityService.getSharedEntity(shareToken);

  if (result.success) {
    return { success: true, entity: result.data };
  } else {
    return reply.code(404).send({ success: false, error: result.error });
  }
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

    await fastify.listen({ port, host });

    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/api-docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// For Vercel deployment
if (process.env.NODE_ENV === 'production') {
  module.exports = fastify;
} else {
  start();
}
