const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const crypto = require('crypto');

class AuthMiddleware {
  constructor() {
    this.client = null;
    this.clerkJwksUrl = process.env.CLERK_JWKS_URL;
    this.jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    this.activeSessions = new Map(); // Store active sessions for logout
    
    if (this.clerkJwksUrl) {
      this.client = jwksClient({
        jwksUri: this.clerkJwksUrl,
        requestHeaders: {},
        timeout: 30000,
      });
    }
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
      iat: Math.floor(Date.now() / 1000)
      // No exp field = no expiry
    };

    const token = jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
    
    // Store session for logout capability
    this.activeSessions.set(token, {
      userId: payload.sub,
      email: payload.email,
      tenant: payload.tenant,
      createdAt: new Date()
    });

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
          // Check if token is still in active sessions (not logged out)
          if (this.activeSessions.has(token)) {
            resolve(decoded);
            return;
          } else {
            reject(new Error('Token has been logged out'));
            return;
          }
        }
      } catch (err) {
        // Not our token, try Clerk
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

  // Logout - invalidate token
  logout(token) {
    if (this.activeSessions.has(token)) {
      this.activeSessions.delete(token);
      return true;
    }
    return false;
  }

  // Get active sessions count (for debugging)
  getActiveSessionsCount() {
    return this.activeSessions.size;
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
    } catch (error) {
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
}

module.exports = AuthMiddleware;