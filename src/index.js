const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');

// Register multipart support for file uploads
fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 files per request
  }
});

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

// Initialize Image service
const ImageService = require('./services/image');
const imageService = new ImageService(db);

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
  
  // Check image service
  try {
    const imageHealth = await imageService.healthCheck();
    status.services.images = imageHealth.status;
  } catch (err) {
    status.services.images = 'error';
  }

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

// Advanced search with enhanced filtering
fastify.get('/api/entities/search', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    const { 
      q, // Search query
      category,
      page = 1, 
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
      include_images = false,
      ...attributeFilters 
    } = request.query;
    
    // Build enhanced filters
    const filters = {
      ...attributeFilters,
      ...(category && { entity_type: category }),
      ...(q && { search_query: q })
    };

    const result = await entityService.searchEntities(
      filters,
      request.user?.id,
      tenantId,
      parseInt(page),
      parseInt(limit),
      sort_by,
      sort_order
    );

    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }

    let entities = result.data;

    // Include images if requested
    if (include_images === 'true' || include_images === true) {
      for (let entity of entities) {
        const imageResult = await imageService.getEntityImages(entity.id, tenantId);
        if (imageResult.success) {
          entity.images = imageResult.data.map(img => ({
            id: img.id,
            url: imageService.getImageUrl(img, 'small'), // Use small size for listings
            label: img.label
          }));
        } else {
          entity.images = [];
        }
      }
    }

    return {
      entities,
      pagination: result.pagination,
      search: {
        query: q,
        category,
        filters: attributeFilters,
        sort: { by: sort_by, order: sort_order },
        include_images
      }
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get available categories
fastify.get('/api/categories', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    
    // Get categories from database
    const result = await db.query(`
      SELECT 
        id,
        name,
        display_name,
        description,
        base_schema,
        active,
        created_at
      FROM mtcli_entity_categories 
      WHERE tenant_id = $1 AND active = true
      ORDER BY display_name ASC
    `, [tenantId]);

    return {
      categories: result.rows,
      total: result.rows.length
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get entities by category
fastify.get('/api/categories/:category/entities', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const category = request.params.category;
    const tenantId = auth.getTenantContext(request);
    const { page = 1, limit = 20, include_images = false } = request.query;
    
    const result = await entityService.searchEntities(
      { entity_type: category },
      request.user?.id,
      tenantId,
      parseInt(page),
      parseInt(limit)
    );

    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }

    let entities = result.data;

    // Include images if requested
    if (include_images === 'true' || include_images === true) {
      for (let entity of entities) {
        const imageResult = await imageService.getEntityImages(entity.id, tenantId);
        if (imageResult.success) {
          entity.images = imageResult.data.map(img => ({
            id: img.id,
            url: imageService.getImageUrl(img, 'thumbnail'),
            label: img.label
          }));
        } else {
          entity.images = [];
        }
      }
    }

    return {
      category,
      entities,
      pagination: result.pagination,
      include_images
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

// ================================
// IMAGE MANAGEMENT ENDPOINTS
// ================================

// Upload images to entity
fastify.post('/api/entities/:id/images', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const entityId = request.params.id;
    const tenantId = auth.getTenantContext(request);
    
    // Check if entity exists and user has access
    const entityResult = await entityService.getEntity(entityId, request.user.id, tenantId);
    if (!entityResult.success) {
      reply.status(404);
      return { error: 'Entity not found or access denied' };
    }

    // Get uploaded files
    const files = await request.saveRequestFiles();
    
    if (!files || files.length === 0) {
      reply.status(400);
      return { error: 'No files uploaded' };
    }

    const uploadResults = [];
    
    for (const file of files) {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        continue; // Skip non-image files
      }

      // Get label from form data if provided
      const label = request.body?.label || null;
      
      // Upload and optimize image
      const result = await imageService.uploadImage(
        file.file,
        file.filename,
        entityId,
        tenantId,
        request.user.id,
        label
      );

      if (result.success) {
        uploadResults.push(result.data);
      }
    }

    if (uploadResults.length === 0) {
      reply.status(400);
      return { error: 'No valid images were uploaded' };
    }

    reply.status(201);
    return {
      success: true,
      message: `${uploadResults.length} image(s) uploaded successfully`,
      images: uploadResults
    };

  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get images for an entity
fastify.get('/api/entities/:id/images', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const entityId = request.params.id;
    const tenantId = auth.getTenantContext(request);
    const size = request.query.size || 'medium'; // Default to medium size
    
    // Check if entity exists and is accessible
    const entityResult = await entityService.getEntity(entityId, request.user?.id, tenantId);
    if (!entityResult.success) {
      reply.status(404);
      return { error: 'Entity not found or access denied' };
    }

    const result = await imageService.getEntityImages(entityId, tenantId);
    
    if (!result.success) {
      reply.status(500);
      return { error: result.error };
    }

    // Format response with requested size URLs
    const formattedImages = result.data.map(image => ({
      id: image.id,
      originalName: image.original_name,
      label: image.label,
      url: imageService.getImageUrl(image, size),
      availableSizes: imageService.getAvailableSizes(image),
      urls: image.file_urls, // All available sizes
      uploadedBy: image.uploaded_by,
      createdAt: image.created_at
    }));

    return {
      entityId,
      images: formattedImages,
      requestedSize: size,
      totalImages: formattedImages.length
    };

  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Delete an image
fastify.delete('/api/images/:id', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const imageId = request.params.id;
    const tenantId = auth.getTenantContext(request);
    
    const result = await imageService.deleteImage(imageId, request.user.id, tenantId);
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }

    return { message: result.message };

  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get single image with all sizes
fastify.get('/api/images/:id', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const imageId = request.params.id;
    const tenantId = auth.getTenantContext(request);
    
    // This would require a method to get single image by ID
    // For now, we'll implement a simple version
    reply.status(501);
    return { error: 'Single image endpoint not yet implemented' };

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
      // Generate persistent authentication token
      const token = auth.generatePersistentToken({
        email: email,
        tenantId: tenantId || 'default'
      });

      // Log successful authentication
      await db.logInteraction(
        'otp_verification_success',
        email,
        tenantId || 'default',
        { timestamp: result.timestamp, tokenGenerated: true }
      );

      return {
        success: true,
        message: 'OTP verified successfully',
        user: result.user,
        token: token,
        tokenType: 'persistent',
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

// Logout endpoint
fastify.post('/api/auth/logout', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const token = auth.extractToken(request);
    const loggedOut = auth.logout(token);
    
    if (loggedOut) {
      // Log logout event
      await db.logInteraction(
        'user_logout',
        request.user.email,
        request.user.tenant,
        { timestamp: new Date().toISOString() }
      );

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } else {
      return {
        success: true,
        message: 'Session already ended'
      };
    }
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get current user info
fastify.get('/api/auth/me', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  return {
    user: {
      id: request.user.id,
      email: request.user.email,
      tenant: request.user.tenant,
      metadata: request.user.metadata
    },
    authenticated: true,
    tokenType: 'persistent'
  };
});

// Debug endpoint for OTP stats
fastify.get('/api/debug/otp-stats', async (request, reply) => {
  if (process.env.NODE_ENV === 'production') {
    reply.status(404);
    return { error: 'Not found' };
  }

  return otpService.getStats();
});

// Debug endpoint for session stats
fastify.get('/api/debug/session-stats', async (request, reply) => {
  if (process.env.NODE_ENV === 'production') {
    reply.status(404);
    return { error: 'Not found' };
  }

  return {
    activeSessions: auth.getActiveSessionsCount(),
    timestamp: new Date().toISOString()
  };
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

// Root endpoint
fastify.get('/', async (request, reply) => {
  return {
    name: 'Multi-Tenant CLI Boilerplate API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      setup: '/api/setup',
      entities: '/api/entities',
      auth: '/api/auth/*',
      docs: 'https://github.com/your-repo/docs'
    }
  };
});

// Database setup endpoint
fastify.post('/api/setup', async (request, reply) => {
  try {
    // Run database migrations
    const fs = require('fs');
    const path = require('path');
    
    const migrationsDir = path.join(__dirname, 'db', 'migrations');
    const migrations = fs.readdirSync(migrationsDir).sort();
    
    const results = [];
    
    for (const migration of migrations) {
      if (migration.endsWith('.sql')) {
        const migrationPath = path.join(migrationsDir, migration);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          await db.query(sql);
          results.push({ migration, status: 'success' });
        } catch (error) {
          // If table already exists, that's okay
          if (error.message.includes('already exists')) {
            results.push({ migration, status: 'already_exists' });
          } else {
            results.push({ migration, status: 'error', error: error.message });
          }
        }
      }
    }
    
    return {
      success: true,
      message: 'Database setup completed',
      migrations: results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    reply.status(500);
    return { 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
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