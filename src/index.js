const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Sentry for error tracking
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN_BACKEND) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    environment: process.env.SENTRY_ENV || 'development',
  });
}

// Initialize Database service
const DatabaseService = require('./services/database');
const db = new DatabaseService();

// Initialize Auth middleware
const AuthMiddleware = require('./middleware/auth');
const auth = new AuthMiddleware();

// Initialize Entity service
const EntityService = require('./services/entity');
const entityService = new EntityService(db);

// Initialize OTP service
const OTPService = require('./services/otp');
const otpService = new OTPService();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  otpService.cleanupExpired();
}, 5 * 60 * 1000);

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const status = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'checking',
      auth: 'checking',
      notifications: 'checking'
    }
  };

  try {
    // Check database connection
    const healthResult = await db.healthCheck();
    status.services.database = healthResult.status;
  } catch (err) {
    status.services.database = 'error';
  }

  // Check environment variables
  status.services.auth = process.env.CLERK_JWKS_URL ? 'configured' : 'not_configured';
  status.services.notifications = process.env.ONESIGNAL_API_KEY ? 'configured' : 'not_configured';

  return status;
});

// ================================
// ENTITY MANAGEMENT ENDPOINTS
// ================================

// Create new entity
fastify.post('/api/entities', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    const result = await entityService.createEntity(
      request.body,
      request.user.id,
      tenantId
    );

    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }

    reply.status(201);
    return result.data;
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get entity by ID
fastify.get('/api/entities/:id', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    const result = await entityService.getEntity(
      request.params.id,
      request.user?.id,
      tenantId
    );

    if (!result.success) {
      reply.status(404);
      return { error: result.error };
    }

    return result.data;
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Update entity
fastify.patch('/api/entities/:id', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    const result = await entityService.updateEntity(
      request.params.id,
      request.body,
      request.user.id,
      tenantId
    );

    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }

    return result.data;
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Delete entity (soft delete)
fastify.delete('/api/entities/:id', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    const result = await entityService.deleteEntity(
      request.params.id,
      request.user.id,
      tenantId
    );

    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }

    return { message: 'Entity deleted successfully' };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Search entities with filters
fastify.get('/api/entities', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    const { page = 1, limit = 20, ...filters } = request.query;
    
    const result = await entityService.searchEntities(
      filters,
      request.user?.id,
      tenantId,
      parseInt(page),
      parseInt(limit)
    );

    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }

    return {
      entities: result.data,
      pagination: result.pagination,
      filters_applied: filters
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get my entities (owner dashboard)
fastify.get('/api/my/entities', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    const { page = 1, limit = 20 } = request.query;
    
    const result = await entityService.getMyEntities(
      request.user.id,
      tenantId,
      parseInt(page),
      parseInt(limit)
    );

    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }

    return {
      entities: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get entity by share token (public access)
fastify.get('/api/shared/:shareToken', async (request, reply) => {
  try {
    const result = await entityService.getEntityByShareToken(request.params.shareToken);

    if (!result.success) {
      reply.status(404);
      return { error: result.error };
    }

    return result.data;
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// OTP Authentication Routes
fastify.post('/api/auth/send-otp', async (request, reply) => {
  const { email, tenantId } = request.body;
  
  if (!email) {
    reply.status(400);
    return { error: 'Email is required' };
  }

  try {
    const result = await otpService.sendOTP(email, tenantId || 'default');
    
    return {
      success: true,
      message: 'OTP sent successfully',
      expiresAt: result.expiresAt
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

fastify.post('/api/auth/verify-otp', async (request, reply) => {
  const { email, otp, tenantId } = request.body;
  
  if (!email || !otp) {
    reply.status(400);
    return { error: 'Email and OTP are required' };
  }

  try {
    const result = await otpService.verifyOTP(email, otp, tenantId || 'default');
    
    if (result.valid) {
      // Log successful authentication
      await db.logInteraction(
        'otp_verification_success',
        email,
        tenantId || 'default',
        { timestamp: result.timestamp }
      );

      return {
        success: true,
        message: 'OTP verified successfully',
        user: result.user,
        timestamp: result.timestamp
      };
    } else {
      reply.status(400);
      return { error: result.error };
    }
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Debug endpoint for OTP stats
fastify.get('/api/debug/otp-stats', async (request, reply) => {
  if (process.env.NODE_ENV === 'production') {
    reply.status(404);
    return { error: 'Not found' };
  }

  return otpService.getStats();
});

// Test email endpoint
fastify.post('/api/test/send-email', async (request, reply) => {
  const { email, subject, message } = request.body;
  
  if (!email) {
    reply.status(400);
    return { error: 'Email is required' };
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [email],
      subject: subject || 'Test Email',
      html: `
        <h2>Test Email</h2>
        <p>${message || 'This is a test email from your multi-tenant CLI boilerplate.'}</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    });

    if (error) {
      reply.status(500);
      return { error: error.message };
    }

    return {
      success: true,
      messageId: data.id,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();