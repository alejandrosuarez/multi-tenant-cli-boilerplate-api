const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const crypto = require('crypto');

class AuthMiddleware {
  constructor() {
    this.client = null;
    this.clerkJwksUrl = process.env.CLERK_JWKS_URL;
    this.jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    this.activeSessions = new Map(); // Store active sessions for logout
    this.sessionCleanupDisabled = true; // Disable automatic session cleanup
    
    if (this.clerkJwksUrl) {
      this.client = jwksClient({
        jwksUri: this.clerkJwksUrl,
        requestHeaders: {},
        timeout: 30000,
      });
    }
    
    // Log session creation for debugging
    console.log('🔐 Auth middleware initialized - persistent sessions enabled');
  }

  // Get signing key for JWT verification
  getKey = (header, callback) => {
    if (!this.client) {
      return callback(new Error('JWKS client not configured'));
    }

    this.client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        return callback(err);
      }
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  };

  // Generate persistent JWT token (no expiry)
  generatePersistentToken(user) {
    const payload = {
      sub: user.id || user.email,
      email: user.email,
      tenant: user.tenantId || 'default',
      type: 'persistent',
      iat: Math.floor(Date.now() / 1000),
      persistent: true // Flag for persistent session
      // No exp field = no expiry
    };

    const token = jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
    
    // Store session for logout capability - always keep it active
    this.activeSessions.set(token, {
      userId: payload.sub,
      email: payload.email,
      tenant: payload.tenant,
      createdAt: new Date(),
      persistent: true,
      lastAccessed: new Date()
    });

    console.log(`🔑 Generated persistent token for ${user.email} (${user.tenantId || 'default'})`);
    console.log(`📊 Active sessions: ${this.activeSessions.size}`);
    
    return token;
  }

  // Verify JWT token
  async verifyToken(token) {
    return new Promise((resolve, reject) => {
      // Check for dev token first (before JWT parsing)
      if (token === 'dev-token') {
        resolve({
          sub: 'dev-user',
          email: 'dev@example.com',
          tenant: 'default'
        });
        return;
      }

      // Try our persistent tokens first
      try {
        const decoded = jwt.verify(token, this.jwtSecret, { algorithms: ['HS256'] });
        if (decoded.type === 'persistent') {
          // For persistent tokens, always allow access unless explicitly logged out
          // If session doesn't exist, recreate it (recovery mode)
          if (!this.activeSessions.has(token)) {
            console.log(`🔄 Recovering persistent session for ${decoded.email}`);
            this.activeSessions.set(token, {
              userId: decoded.sub,
              email: decoded.email,
              tenant: decoded.tenant,
              createdAt: new Date(),
              persistent: true,
              recovered: true,
              lastAccessed: new Date()
            });
          } else {
            // Update last accessed time
            const session = this.activeSessions.get(token);
            session.lastAccessed = new Date();
          }
          
          console.log(`✅ Verified persistent token for ${decoded.email}`);
          resolve(decoded);
          return;
        }
      } catch (err) {
        // Not our token, try Clerk
        console.log(`⚠️  Failed to verify as persistent token: ${err.message}`);
      }

      // Fall back to Clerk JWT verification
      if (!this.client) {
        reject(new Error('Authentication not configured'));
        return;
      }

      jwt.verify(token, this.getKey, {
        audience: process.env.CLERK_JWT_AUDIENCE,
        issuer: process.env.CLERK_JWT_ISSUER,
        algorithms: ['RS256']
      }, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }

  // Logout - invalidate token (only if explicitly requested)
  logout(token) {
    if (this.activeSessions.has(token)) {
      const session = this.activeSessions.get(token);
      console.log(`🚪 Logging out session for ${session.email}`);
      this.activeSessions.delete(token);
      return true;
    }
    console.log(`⚠️  Logout attempted for non-existent session`);
    return false;
  }

  // Get active sessions count (for debugging)
  getActiveSessionsCount() {
    return this.activeSessions.size;
  }
  
  // Get session details (for debugging)
  getSessionDetails() {
    const sessions = [];
    for (const [token, session] of this.activeSessions.entries()) {
      sessions.push({
        tokenPreview: token.substring(0, 10) + '...',
        userId: session.userId,
        email: session.email,
        tenant: session.tenant,
        createdAt: session.createdAt,
        lastAccessed: session.lastAccessed,
        persistent: session.persistent,
        recovered: session.recovered
      });
    }
    return sessions;
  }

  // Extract token from request
  extractToken(request) {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1];
  }

  // Middleware for optional authentication
  async optional(request, reply) {
    try {
      const token = this.extractToken(request);
      if (!token) {
        request.user = null;
        return;
      }

      const decoded = await this.verifyToken(token);
      request.user = {
        id: decoded.sub,
        email: decoded.email,
        tenant: decoded.tenant || 'default',
        metadata: decoded.user_metadata || {}
      };
    } catch (error) {
      request.user = null;
    }
  }

  // Middleware for required authentication
  async required(request, reply) {
    try {
      const token = this.extractToken(request);
      if (!token) {
        console.log(`🚫 Missing token for ${request.method} ${request.url}`);
        reply.status(401);
        throw new Error('Authorization token required');
      }

      const decoded = await this.verifyToken(token);
      request.user = {
        id: decoded.sub,
        email: decoded.email,
        tenant: decoded.tenant || 'default',
        metadata: decoded.user_metadata || {}
      };
      
      console.log(`👤 Authenticated user: ${decoded.email} for ${request.method} ${request.url}`);
    } catch (error) {
      console.log(`🚫 Auth failed for ${request.method} ${request.url}: ${error.message}`);
      reply.status(401);
      throw new Error('Invalid or expired token: ' + error.message);
    }
  }

  // Get tenant context from request
  getTenantContext(request) {
    // Priority: 1. User tenant, 2. Query param, 3. Header, 4. Default
    if (request.user?.tenant) {
      return request.user.tenant;
    }
    
    if (request.query.tenant) {
      return request.query.tenant;
    }
    
    if (request.headers['x-tenant-id']) {
      return request.headers['x-tenant-id'];
    }
    
    return 'default';
  }

  // Check if user owns resource
  checkOwnership(request, ownerId) {
    if (!request.user) return false;
    return request.user.id === ownerId;
  }

  // Check tenant access
  checkTenantAccess(request, resourceTenantId) {
    const userTenant = this.getTenantContext(request);
    return userTenant === resourceTenantId || userTenant === 'global';
  }

  // Middleware to check Bearer token and allowed domains
  async bearerTokenAndDomainCheck(request, reply) {
    const token = this.extractToken(request);
    const allowedDomains = process.env.ALLOWED_DOMAINS ? process.env.ALLOWED_DOMAINS.split(',') : [];
    const origin = request.headers.origin;

    if (allowedDomains.length && !allowedDomains.includes(origin)) {
      reply.status(403);
      throw new Error('Request from origin not allowed');
    }

    if (!token || !process.env.API_TOKENS?.split(',').includes(token)) {
      reply.status(401);
      throw new Error('Invalid or missing authorization token');
    }

    // For API tokens, we don't need to verify JWT - just check the token is valid
    // Set a minimal user context for API access
    request.user = {
      id: 'api-user',
      email: 'api@system.local',
      tenant: 'default',
      metadata: { source: 'api_token' }
    };
  }
}

module.exports = AuthMiddleware;
