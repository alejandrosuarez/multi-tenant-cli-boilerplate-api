const { createClient } = require('@supabase/supabase-js');

// Initialize Sentry if available
let Sentry = null;
try {
  Sentry = require('@sentry/node');
} catch (e) {
  // Sentry not available
}

class DatabaseService {
  constructor() {
    this.supabase = null;
    this.serviceSupabase = null;
    this.prefix = 'mtcli_';
    
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }
    
    // Service role client for admin operations
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.serviceSupabase = createClient(
        process.env.SUPABASE_URL, 
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
  }

  // Table name helpers with prefix
  get tables() {
    return {
      entities: `${this.prefix}entities`,
      entityCategories: `${this.prefix}entity_categories`,
      attributeRequests: `${this.prefix}attribute_requests`,
      interactionLogs: `${this.prefix}interaction_logs`,
      notifications: `${this.prefix}notifications`,
      deviceLinks: `${this.prefix}device_links`,
      entityImages: `${this.prefix}entity_images`
    };
  }

  // Validation helpers
  async validateEntityType(entityType, tenantId) {
    try {
      const { data, error } = await this.table('entityCategories')
        .select('name, base_schema')
        .eq('name', entityType)
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .single();
      
      return { valid: !error, category: data, error };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  // Entity operations with validation
  async createEntity(entityData) {
    try {
      // Validate entity type
      const validation = await this.validateEntityType(entityData.entity_type, entityData.tenant_id);
      if (!validation.valid) {
        throw new Error(`Invalid entity type: ${entityData.entity_type}`);
      }

      // Merge base schema with provided attributes
      const baseAttributes = validation.category.base_schema || {};
      const mergedAttributes = { ...baseAttributes, ...entityData.attributes };

      const entityToCreate = {
        ...entityData,
        attributes: mergedAttributes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.table('entities').insert(entityToCreate).select().single();
      
      if (error) {
        const errorMsg = `[DB-Fail] operation=create entityId=${entityToCreate.id}`;
        console.error(errorMsg, error);
        if (Sentry) {
          Sentry.captureException(error, { 
            tags: { 
              entityId: entityToCreate.id, 
              tenantId: entityToCreate.tenant_id,
              operation: 'entity_create'
            }
          });
        }
        throw error;
      }
      
      console.info(`[DB-Success] operation=create entityId=${entityToCreate.id}`);
      return { success: true, data };
    } catch (err) {
      const errorMsg = `[DB-Create-Error] entityId=${entityToCreate.id || 'unknown'}`;
      console.error(errorMsg, err);
      if (Sentry) {
        Sentry.captureException(err, { 
          tags: { 
            entityId: entityToCreate.id || 'unknown', 
            tenantId: entityToCreate.tenant_id || 'unknown',
            operation: 'entity_create'
          }
        });
      }
      return { success: false, error: err.message };
    }
  }

  // Get Supabase client
  getClient() {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }
    return this.supabase;
  }

  // Helper method to get table with prefix
  table(tableName, useServiceRole = false) {
    const client = useServiceRole ? this.serviceSupabase : this.supabase;
    
    if (!client) {
      throw new Error('Supabase not configured');
    }
    
    // Check if table name already has prefix to avoid double-prefixing
    let prefixedName;
    if (this.tables[tableName]) {
      prefixedName = this.tables[tableName];
    } else if (tableName.startsWith(this.prefix)) {
      prefixedName = tableName; // Already has prefix
    } else {
      prefixedName = `${this.prefix}${tableName}`; // Add prefix
    }
    return client.from(prefixedName);
  }

  // Get service role client for admin operations
  getServiceClient() {
    if (!this.serviceSupabase) {
      throw new Error('Service role not configured');
    }
    return this.serviceSupabase;
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.supabase) {
        return { status: 'not_configured' };
      }
      
      const { data, error } = await this.table('entities').select('count').limit(1);
      return { status: error ? 'error' : 'healthy', error: error?.message };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  // Run migration
  async runMigration(sqlContent) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not configured');
      }

      // Note: This requires service role key for DDL operations
      const serviceRoleClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await serviceRoleClient.rpc('exec_sql', {
        sql: sqlContent
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  // Log interaction
  async logInteraction(eventType, userId, tenantContext, eventPayload = {}, entityId = null) {
    try {
      const logData = {
        event_type: eventType,
        user_id: userId,
        tenant_context: tenantContext,
        event_payload: eventPayload,
        timestamp: new Date().toISOString()
      };

      if (entityId) {
        logData.entity_id = entityId;
      }

      const { data, error } = await this.table('interactionLogs').insert(logData);
      
      if (error) {
        const errorMsg = `[DB-Fail] operation=log_interaction userId=${userId} eventType=${eventType}`;
        console.error(errorMsg, error);
        if (Sentry) {
          Sentry.captureException(error, { 
            tags: { 
              userId, 
              eventType,
              entityId: entityId || 'none',
              operation: 'interaction_log'
            }
          });
        }
      } else {
        console.info(`[DB-Success] operation=log_interaction userId=${userId} eventType=${eventType}`);
      }

      return { success: !error, data, error };
    } catch (err) {
      const errorMsg = `[DB-Log-Error] userId=${userId} eventType=${eventType}`;
      console.error(errorMsg, err);
      if (Sentry) {
        Sentry.captureException(err, { 
          tags: { 
            userId, 
            eventType,
            entityId: entityId || 'none',
            operation: 'interaction_log'
          }
        });
      }
      return { success: false, error: err.message };
    }
  }
}

module.exports = DatabaseService;