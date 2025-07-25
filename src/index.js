const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream/promises');

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
    /^http:\/\/localhost:\d+$/, // Any localhost port for development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

// Register multipart support for file uploads
fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 files per request
  }
});

// Register static file support for OneSignal service workers
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', 'ui', 'public'),
  prefix: '/', // serve files from root
  decorateReply: false // disable decorateReply to avoid conflicts
});

// API documentation is served via static files
console.log('📚 API Documentation available at:');
console.log('- Local: http://localhost:3000/api-docs');
console.log('- Production: https://multi-tenant-cli-boilerplate-api.vercel.app/api-docs');

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

// Initialize Notification service
const NotificationService = require('./services/notification');
const notificationService = new NotificationService(db);

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  otpService.cleanupExpired();
}, 5 * 60 * 1000);

// Root path redirect to API documentation
fastify.get('/', async (request, reply) => {
  return reply.redirect('/api-docs-landing.html');
});

// API docs endpoint
fastify.get('/api-docs', async (request, reply) => {
  return reply.redirect('/api-docs/index.html');
});

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
  
  // Check notification service
  try {
    const notificationHealth = await notificationService.healthCheck();
    status.services.notifications = notificationHealth.status;
  } catch (err) {
    status.services.notifications = 'error';
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
    
    // Parse range filters from query parameters
    const parsedFilters = {};
    
    for (const [key, value] of Object.entries(attributeFilters)) {
      // Handle range filters like price[min], price[max]
      const rangeMatch = key.match(/^(.+)\[(min|max)\]$/);
      if (rangeMatch) {
        const [, fieldName, rangeType] = rangeMatch;
        if (!parsedFilters[fieldName]) {
          parsedFilters[fieldName] = {};
        }
        parsedFilters[fieldName][rangeType] = value;
      } else {
        // Handle exact match filters
        parsedFilters[key] = value;
      }
    }
    
    // Build enhanced filters
    const filters = {
      ...parsedFilters,
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
    const result = await db.table('entityCategories')
      .select('id, name, display_name, description, base_schema, active, created_at')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('display_name', { ascending: true });

    return {
      categories: result.data,
      total: result.data.length
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
    
    // SECURITY: Only allow entity owners to upload images
    if (entityResult.data.owner_id !== request.user.id) {
      reply.status(403);
      return { error: 'Only entity owners can upload images' };
    }

    // Get uploaded files
    const files = await request.saveRequestFiles();
    
    if (!files || files.length === 0) {
      reply.status(400);
      return { error: 'No files uploaded' };
    }

    const uploadResults = [];
    
    // Get label and fallback flag from form data if provided
    const label = request.body?.label || null;
    const isFallback = request.body?.is_fallback === 'true' || request.body?.is_fallback === true;
    
    for (const file of files) {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        continue; // Skip non-image files
      }
      
      // Read file buffer using the file path from saved files
      let fileBuffer;
      try {
        // Use Fastify's toBuffer method or filepath
        if (file.filepath) {
          fileBuffer = fs.readFileSync(file.filepath);
        } else {
          throw new Error('No filepath available to read file buffer');
        }
        
        console.log(`📸 Read file ${file.filename} to buffer (${fileBuffer.length} bytes)`);

        if (!fileBuffer || fileBuffer.length === 0) {
          console.error('Empty buffer received for file:', file.filename);
          continue;
        }
      } catch (bufferError) {
        console.error('Buffer reading error:', bufferError);
        continue; // Skip this file if buffer reading fails
      }
      
      
      // Upload and optimize image
      const result = await imageService.uploadImage(
        fileBuffer,
        file.filename,
        entityId,
        tenantId,
        request.user.id,
        file.mimetype,
        label,
        isFallback
      );

      if (result.success) {
        uploadResults.push(result.data);
      }
      
      // Clean up temporary file
      try {
        if (file.filepath && fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
          console.log(`🧹 Cleaned up temporary file: ${file.filepath}`);
        }
      } catch (cleanupError) {
        console.warn('Warning: Could not clean up temporary file:', cleanupError.message);
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
    console.log(`🔍 Verifying OTP for ${email} (${tenantId || 'default'})`);
    const result = await otpService.verifyOTP(email, otp, tenantId || 'default');
    
    if (result.valid) {
      console.log(`✅ OTP verified successfully for ${email}`);
      
      // Generate persistent authentication token
      const token = auth.generatePersistentToken({
        id: email, // Use email as ID for OTP-based auth
        email: email,
        tenantId: tenantId || 'default'
      });
      
      console.log(`🎉 Generated persistent token for ${email}`);

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
      console.log(`❌ OTP verification failed for ${email}: ${result.error}`);
      reply.status(400);
      return { error: result.error };
    }
  } catch (error) {
    console.log(`🚨 OTP verification error for ${email}: ${error.message}`);
    reply.status(500);
    return { error: error.message };
  }
});

// Logout endpoint
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

// ================================
// LOGS API ENDPOINTS
// ================================

// Get user's interaction logs
fastify.get('/api/my/interactions', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    const { page = 1, limit = 50, event_type } = request.query;
    const offset = (page - 1) * limit;
    
    let query = db.table('interactionLogs')
      .select('*')
      .eq('user_id', request.user.id)
      .eq('tenant_context', tenantId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by event type if provided
    if (event_type) {
      query = query.eq('event_type', event_type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      reply.status(500);
      return { error: error.message };
    }
    
    return {
      interactions: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.length,
        has_more: data.length === limit
      },
      user_id: request.user.id,
      tenant: tenantId
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get logs for a specific entity
fastify.get('/api/entities/:id/logs', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const entityId = request.params.id;
    const tenantId = auth.getTenantContext(request);
    const { page = 1, limit = 50, event_type } = request.query;
    const offset = (page - 1) * limit;
    
    // Check if entity exists and user has access
    const entityResult = await entityService.getEntity(entityId, request.user.id, tenantId);
    if (!entityResult.success) {
      reply.status(404);
      return { error: 'Entity not found or access denied' };
    }
    
    // Only allow entity owners to see logs
    if (entityResult.data.owner_id !== request.user.id) {
      reply.status(403);
      return { error: 'Only entity owners can view logs' };
    }
    
    let query = db.table('interactionLogs')
      .select('*')
      .eq('entity_id', entityId)
      .eq('tenant_context', tenantId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by event type if provided
    if (event_type) {
      query = query.eq('event_type', event_type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      reply.status(500);
      return { error: error.message };
    }
    
    return {
      entity_id: entityId,
      logs: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.length,
        has_more: data.length === limit
      },
      owner: request.user.id,
      tenant: tenantId
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Manual log interaction endpoint (POST)
fastify.post('/api/interaction_logs', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const { eventType, entityId, eventPayload = {} } = request.body;
    const tenantId = auth.getTenantContext(request);
    
    if (!eventType) {
      reply.status(400);
      return { error: 'eventType is required' };
    }
    
    // Log the interaction
    const result = await db.logInteraction(
      eventType,
      request.user?.id || 'anonymous',
      tenantId,
      eventPayload,
      entityId
    );
    
    if (!result.success) {
      reply.status(500);
      return { error: result.error };
    }
    
    return {
      success: true,
      message: 'Interaction logged successfully',
      logged_at: new Date().toISOString()
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Query interaction logs endpoint (GET)
fastify.get('/api/interaction_logs', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const tenantId = auth.getTenantContext(request);
    const { page = 1, limit = 50, eventType, entityId, start_date, end_date, ...customFilters } = request.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100, min 1
    const offset = (pageNum - 1) * limitNum;
    
    // Build base query
    let query = db.table('interactionLogs')
      .select('*')
      .eq('tenant_context', tenantId)
      .order('timestamp', { ascending: false });
    
    // Apply system filters
    const appliedFilters = {};
    
    if (eventType) {
      query = query.eq('event_type', eventType);
      appliedFilters.eventType = eventType;
    }
    
    if (entityId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(entityId)) {
        reply.status(400);
        return { error: 'Invalid entityId format. Must be a valid UUID.' };
      }
      query = query.eq('entity_id', entityId);
      appliedFilters.entityId = entityId;
    }
    
    // Apply date range filters
    if (start_date) {
      query = query.gte('timestamp', start_date);
      appliedFilters.start_date = start_date;
    }
    
    if (end_date) {
      query = query.lte('timestamp', end_date);
      appliedFilters.end_date = end_date;
    }
    
    // Apply custom event payload filters
    for (const [key, value] of Object.entries(customFilters)) {
      // Skip system parameters that might have been missed
      if (['start_date', 'end_date'].includes(key)) {
        continue;
      }
      
      if (value && value !== '') {
        // Filter by event_payload JSON field
        query = query.contains('event_payload', { [key]: value });
        appliedFilters[key] = value;
      }
    }
    
    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);
    
    const { data, error } = await query;
    
    if (error) {
      reply.status(500);
      return { error: error.message };
    }
    
    // Apply access control - users can see:
    // 1. Their own logs (user_id matches)
    // 2. Logs for entities they own (if entity_id is present)
    let filteredLogs = [];
    
    if (data) {
      for (const log of data) {
        // User can see their own logs
        if (log.user_id === request.user.id) {
          filteredLogs.push(log);
          continue;
        }
        
        // If log has entity_id, check if user owns the entity
        if (log.entity_id) {
          try {
            const entityResult = await entityService.getEntity(log.entity_id, request.user.id, tenantId);
            if (entityResult.success && entityResult.data.owner_id === request.user.id) {
              filteredLogs.push(log);
            }
          } catch (entityError) {
            // Skip this log if entity check fails
            continue;
          }
        }
      }
    }
    
    return {
      success: true,
      logs: filteredLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredLogs.length,
        has_more: filteredLogs.length === limitNum
      },
      filters_applied: appliedFilters
    };
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

// Debug endpoint for session stats
fastify.get('/api/debug/session-stats', async (request, reply) => {
  if (process.env.NODE_ENV === 'production') {
    reply.status(404);
    return { error: 'Not found' };
  }

  return {
    activeSessions: auth.getActiveSessionsCount(),
    sessionDetails: auth.getSessionDetails(),
    timestamp: new Date().toISOString()
  };
});

// Debug endpoint for multipart file upload analysis
fastify.post('/api/debug/upload-test', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  if (process.env.NODE_ENV === 'production') {
    reply.status(404);
    return { error: 'Not found' };
  }

  try {
    console.log('🔍 DEBUG: Starting multipart analysis...');
    
    // Get uploaded files
    const files = await request.saveRequestFiles();
    console.log('🔍 DEBUG: Saved files:', files.length);
    
    const results = [];
    
    for (const [index, file] of files.entries()) {
      console.log(`🔍 DEBUG: Processing file ${index + 1}:`);
      console.log('  - fieldname:', file.fieldname);
      console.log('  - filename:', file.filename);
      console.log('  - encoding:', file.encoding);
      console.log('  - mimetype:', file.mimetype);
      console.log('  - filepath:', file.filepath);
      console.log('  - file object type:', typeof file.file);
      console.log('  - file object constructor:', file.file?.constructor?.name);
      
      let bufferInfo = {};
      
      // Method 1: Try toBuffer if it exists
      if (typeof file.toBuffer === 'function') {
        try {
          const buffer1 = await file.toBuffer();
          bufferInfo.toBuffer = { success: true, size: buffer1.length };
          console.log('  ✅ toBuffer method successful:', buffer1.length, 'bytes');
        } catch (error) {
          bufferInfo.toBuffer = { success: false, error: error.message };
          console.log('  ❌ toBuffer method failed:', error.message);
        }
      } else {
        bufferInfo.toBuffer = { success: false, error: 'Method not available' };
        console.log('  ⚠️  toBuffer method not available');
      }
      
      // Method 2: Try reading from filepath
      if (file.filepath) {
        try {
          const buffer2 = fs.readFileSync(file.filepath);
          bufferInfo.filepath = { success: true, size: buffer2.length, path: file.filepath };
          console.log('  ✅ filepath read successful:', buffer2.length, 'bytes from', file.filepath);
        } catch (error) {
          bufferInfo.filepath = { success: false, error: error.message };
          console.log('  ❌ filepath read failed:', error.message);
        }
      } else {
        bufferInfo.filepath = { success: false, error: 'No filepath available' };
        console.log('  ⚠️  No filepath available');
      }
      
      // Method 3: Check file stats if filepath exists
      if (file.filepath) {
        try {
          const stats = fs.statSync(file.filepath);
          bufferInfo.fileStats = {
            size: stats.size,
            isFile: stats.isFile(),
            mtime: stats.mtime
          };
          console.log('  📊 File stats - size:', stats.size, 'bytes, isFile:', stats.isFile());
        } catch (error) {
          bufferInfo.fileStats = { error: error.message };
          console.log('  ❌ File stats failed:', error.message);
        }
      }
      
      results.push({
        index: index + 1,
        fieldname: file.fieldname,
        filename: file.filename,
        encoding: file.encoding,
        mimetype: file.mimetype,
        filepath: file.filepath,
        fileType: typeof file.file,
        fileConstructor: file.file?.constructor?.name,
        bufferMethods: bufferInfo
      });
    }
    
    return {
      success: true,
      totalFiles: files.length,
      analysis: results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('🔍 DEBUG: Upload test failed:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
  }
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

// ================================
// NOTIFICATION ENDPOINTS
// ================================

// Subscribe device for push notifications
fastify.post('/api/notifications/subscribe-device', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const { deviceToken, tenantContext } = request.body;
    const userId = request.user?.id || null;
    const tenant = tenantContext || auth.getTenantContext(request);
    
    if (!deviceToken) {
      reply.status(400);
      return { error: 'Device token is required' };
    }
    
    const subscriptionData = {
      platform: 'web',
      user_agent: request.headers['user-agent'],
      subscribed_at: new Date().toISOString()
    };
    
    const result = await notificationService.subscribeDevice(
      deviceToken,
      userId,
      tenant,
      subscriptionData
    );
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }
    
    return {
      success: true,
      message: 'Device subscribed successfully',
      data: result.data,
      action: result.action
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Merge device subscription when user logs in
fastify.post('/api/notifications/merge-device', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const { deviceToken } = request.body;
    const userId = request.user.id;
    const tenantContext = auth.getTenantContext(request);
    
    if (!deviceToken) {
      reply.status(400);
      return { error: 'Device token is required' };
    }
    
    const result = await notificationService.mergeDeviceSubscription(
      deviceToken,
      userId,
      tenantContext
    );
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }
    
    return {
      success: true,
      message: 'Device subscription merged successfully',
      merged: result.merged
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Send notification (universal endpoint)
fastify.post('/api/notifications/send', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const { 
      userId, 
      eventType, 
      message, 
      link, 
      tenantContext, 
      eventPayload = {} 
    } = request.body;
    
    const tenant = tenantContext || auth.getTenantContext(request);
    
    // Validate required fields
    if (!userId || !eventType || !message) {
      reply.status(400);
      return { error: 'userId, eventType, and message are required' };
    }
    
    const result = await notificationService.sendNotification(
      userId,
      eventType,
      message,
      link,
      tenant,
      eventPayload
    );
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }
    
    return {
      success: true,
      message: 'Notification sent successfully',
      data: result.data,
      pushSent: result.pushSent
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Send chat request notification
fastify.post('/api/notifications/chat-request', {
  preHandler: auth.optional.bind(auth)
}, async (request, reply) => {
  try {
    const { entityId, chatUrl } = request.body;
    const requesterId = request.user?.id || 'anonymous';
    const tenantContext = auth.getTenantContext(request);
    
    if (!entityId || !chatUrl) {
      reply.status(400);
      return { error: 'entityId and chatUrl are required' };
    }
    
    const result = await notificationService.sendChatRequestNotification(
      entityId,
      requesterId,
      tenantContext,
      chatUrl
    );
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }
    
    return {
      success: true,
      message: 'Chat request notification sent to owner',
      data: result.data,
      pushSent: result.pushSent
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get user notification preferences
fastify.get('/api/notifications/preferences', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const userId = request.user.id;
    const tenantContext = auth.getTenantContext(request);
    
    const result = await notificationService.getUserPreferences(userId, tenantContext);
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }
    
    return {
      success: true,
      preferences: result.data.preferences || result.data,
      userId: userId
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Update user notification preferences
fastify.post('/api/notifications/preferences', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const { preferences } = request.body;
    const userId = request.user.id;
    const tenantContext = auth.getTenantContext(request);
    
    if (!preferences || typeof preferences !== 'object') {
      reply.status(400);
      return { error: 'Valid preferences object is required' };
    }
    
    const result = await notificationService.updateUserPreferences(
      userId,
      tenantContext,
      preferences
    );
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }
    
    return {
      success: true,
      message: 'Preferences updated successfully',
      data: result.data
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Get notification history
fastify.get('/api/notifications/history', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  try {
    const userId = request.user.id;
    const tenantContext = auth.getTenantContext(request);
    const { page = 1, limit = 20 } = request.query;
    
    const result = await notificationService.getNotificationHistory(
      userId,
      tenantContext,
      parseInt(page),
      parseInt(limit)
    );
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }
    
    return {
      success: true,
      notifications: result.data,
      pagination: result.pagination,
      userId: userId
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Mark notification as seen
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
  try {
    const notificationId = request.params.id;
    const userId = request.user.id;
    
    const result = await notificationService.markNotificationSeen(
      notificationId,
      userId
    );
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }
    
    return {
      success: true,
      message: 'Notification marked as seen',
      data: result.data
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Test notification endpoint
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
  try {
    const userId = request.user.id;
    const tenantContext = auth.getTenantContext(request);
    
    const result = await notificationService.sendTestNotification(
      userId,
      tenantContext
    );
    
    if (!result.success) {
      reply.status(400);
      return { error: result.error };
    }
    
    return {
      success: true,
      message: 'Test notification sent successfully',
      data: result.data,
      pushSent: result.pushSent
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// Debug endpoint to check user's OneSignal subscriptions
fastify.get('/api/debug/user-subscriptions', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  if (process.env.NODE_ENV === 'production') {
    reply.status(404);
    return { error: 'Not found' };
  }
  
  try {
    const userId = request.user.id;
    const tenantContext = auth.getTenantContext(request);
    
    const result = await notificationService.getUserSubscriptions(userId, tenantContext);
    
    return {
      userId: userId,
      tenantContext: tenantContext,
      subscriptions: result.data || [],
      success: result.success,
      error: result.error
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// ================================
// LEGACY ENDPOINTS
// ================================

// Request attribute info endpoint
fastify.post('/api/request-attribute', {
  preHandler: auth.required.bind(auth)
}, async (request, reply) => {
  const { attribute, entityId } = request.body;
  const tenantId = auth.getTenantContext(request);
  
  // Input validation
  if (!attribute || !entityId) {
    reply.status(400);
    return { error: 'Attribute and Entity ID are required' };
  }

  // Validate attribute name (prevent injection)
  if (typeof attribute !== 'string' || !/^[a-zA-Z0-9_]+$/.test(attribute)) {
    reply.status(400);
    return { error: 'Invalid attribute name' };
  }

  // Validate entity ID format
  if (typeof entityId !== 'string' || entityId.length < 1) {
    reply.status(400);
    return { error: 'Invalid entity ID' };
  }

  try {
    // Get entity details to find owner information
    const entityResult = await entityService.getEntity(
      entityId,
      request.user.id,
      tenantId
    );

    if (!entityResult.success) {
      reply.status(404);
      return { error: 'Entity not found' };
    }

    const entity = entityResult.data;
    
    // Prevent self-requests
    if (entity.user_id === request.user.id) {
      reply.status(400);
      return { error: 'Cannot request information on your own entities' };
    }

    // Check if attribute actually exists in the entity schema
    const validAttributes = Object.keys(entity.attributes || {});
    if (!validAttributes.includes(attribute)) {
      reply.status(400);
      return { error: 'Attribute does not exist for this entity' };
    }

    // Check if attribute is actually empty (no point in requesting if it has value)
    const attributeValue = entity.attributes[attribute];
    if (attributeValue && attributeValue !== '') {
      reply.status(400);
      return { error: 'Attribute already has a value' };
    }

    // Rate limiting check: prevent spam requests
    const recentRequests = await db.query(
      'SELECT COUNT(*) as count FROM mtcli_interactions WHERE user_id = ? AND event_type = ? AND created_at > ? AND event_payload->"$.entity_id" = ?',
      [request.user.id, 'attribute_info_requested', new Date(Date.now() - 3600000), entityId] // 1 hour ago
    );
    
    if (recentRequests.data && recentRequests.data[0]?.count >= 5) {
      reply.status(429);
      return { error: 'Too many requests. Please wait before requesting again.' };
    }

    // Get owner email - For now using a placeholder, should be fetched from user service
    const ownerEmail = 'owner@example.com'; // TODO: Implement user lookup by user_id
    
    // Send notification email to entity owner
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const attributeDisplayName = attribute.charAt(0).toUpperCase() + attribute.slice(1).replace(/([A-Z])/g, ' $1');
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [ownerEmail],
      subject: `Information Request for ${entity.attributes.name || 'Your Entity'}`,
      html: `
        <h2>Attribute Information Request</h2>
        <p>A user has requested more information about your entity.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Entity Details:</h3>
          <p><strong>Name:</strong> ${entity.attributes.name || 'Unnamed Entity'}</p>
          <p><strong>Type:</strong> ${entity.entity_type || 'N/A'}</p>
          <p><strong>Requested Attribute:</strong> ${attributeDisplayName}</p>
        </div>
        
        <p>The user is requesting additional information for the <strong>${attributeDisplayName}</strong> attribute, which currently appears to be empty or incomplete.</p>
        
        <p>Please consider updating your entity with the requested information to help users find what they're looking for.</p>
        
        <p style="color: #6c757d; font-size: 0.9em;">Sent at: ${new Date().toISOString()}</p>
      `
    });

    if (error) {
      reply.status(500);
      return { error: 'Failed to send notification email' };
    }

    // Log the interaction
    await db.logInteraction(
      'attribute_info_requested',
      request.user.id,
      tenantId,
      {
        entity_id: entityId,
        attribute: attribute,
        owner_id: entity.user_id,
        requested_at: new Date().toISOString()
      },
      entityId
    );

    return {
      success: true,
      message: 'Information request sent to entity owner',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    reply.status(500);
    return { error: error.message };
  }
});

// API info endpoint
fastify.get('/api/info', async (request, reply) => {
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
      notifications: '/api/notifications/*',
      docs: '/api-docs'
    }
  };
});

// Database setup endpoint
fastify.post('/api/setup', async (request, reply) => {
  try {
    return {
      success: true,
      message: 'Database setup completed - using Supabase managed tables',
      note: 'Tables are managed through Supabase dashboard or SQL editor',
      available_tables: [
        'mtcli_entities',
        'mtcli_entity_categories', 
        'mtcli_interactions',
        'mtcli_images'
      ],
      setup_instructions: 'Run the SQL files in src/db/migrations/ through Supabase SQL editor',
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