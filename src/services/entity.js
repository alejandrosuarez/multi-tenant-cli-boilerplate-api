const { v4: uuidv4 } = require('uuid');

class EntityService {
  constructor(databaseService) {
    this.db = databaseService;
  }

  // Create a new entity
  async createEntity(entityData, userId, tenantId) {
    try {
      // Validate required fields
      if (!entityData.entity_type) {
        throw new Error('entity_type is required');
      }

      // Validate entity type exists
      const validation = await this.db.validateEntityType(entityData.entity_type, tenantId);
      if (!validation.valid) {
        throw new Error(`Invalid entity type: ${entityData.entity_type}`);
      }

      // Merge base schema with provided attributes
      const baseAttributes = validation.category.base_schema || {};
      const mergedAttributes = { ...baseAttributes, ...entityData.attributes };

      // Create entity object
      const entityToCreate = {
        id: uuidv4(),
        entity_type: entityData.entity_type,
        tenant_id: tenantId,
        owner_id: userId,
        attributes: mergedAttributes,
        public_shareable: entityData.public_shareable || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.db.table('entities', true) // Use service role
        .insert(entityToCreate)
        .select()
        .single();

      if (error) throw error;

      // Log entity creation
      await this.db.logInteraction(
        'entity_created',
        userId,
        tenantId,
        { entity_id: data.id, entity_type: entityData.entity_type }
      );

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Get entity by ID
  async getEntity(entityId, userId = null, tenantId = null) {
    try {
      let query = this.db.table('entities', true) // Use service role
        .select(`
          *,
          mtcli_entity_categories!mtcli_entities_entity_type_fkey (
            id,
            display_name,
            description,
            base_schema
          )
        `)
        .eq('id', entityId);

      // Apply tenant filtering if specified
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Entity not found' };
        }
        throw error;
      }

      // Check access permissions
      const isOwner = userId && data.owner_id === userId;
      const isPublic = data.public_shareable;
      const hasTenantAccess = !tenantId || data.tenant_id === tenantId;

      if (!isOwner && !isPublic && !hasTenantAccess) {
        return { success: false, error: 'Access denied' };
      }

      // Log entity view (only for non-owners)
      if (userId && !isOwner) {
        await this.db.logInteraction(
          'entity_viewed',
          userId,
          data.tenant_id,
          { entity_id: entityId },
          entityId
        );
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Update entity
  async updateEntity(entityId, updateData, userId, tenantId) {
    try {
      // First check if entity exists and user has permission
      const existingResult = await this.getEntity(entityId, userId, tenantId);
      if (!existingResult.success) {
        return existingResult;
      }

      const existing = existingResult.data;
      
      // Check ownership
      if (existing.owner_id !== userId) {
        return { success: false, error: 'Only entity owner can update' };
      }

      // Prepare update data
      const updateObject = {
        updated_at: new Date().toISOString()
      };

      // Handle attribute updates
      if (updateData.attributes) {
        // Merge existing attributes with updates
        const mergedAttributes = { ...existing.attributes, ...updateData.attributes };
        updateObject.attributes = mergedAttributes;
      }

      // Handle other field updates
      if (updateData.public_shareable !== undefined) {
        updateObject.public_shareable = updateData.public_shareable;
      }

      if (updateData.disabled !== undefined) {
        updateObject.disabled = updateData.disabled;
      }

      // Update entity
      const { data, error } = await this.db.table('entities', true) // Use service role
        .update(updateObject)
        .eq('id', entityId)
        .select()
        .single();

      if (error) throw error;

      // Log entity update
      await this.db.logInteraction(
        'entity_updated',
        userId,
        tenantId,
        { 
          entity_id: entityId, 
          updated_fields: Object.keys(updateData),
          attribute_changes: updateData.attributes ? Object.keys(updateData.attributes) : []
        },
        entityId
      );

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Delete entity (soft delete)
  async deleteEntity(entityId, userId, tenantId) {
    try {
      // First check if entity exists and user has permission
      const existingResult = await this.getEntity(entityId, userId, tenantId);
      if (!existingResult.success) {
        return existingResult;
      }

      const existing = existingResult.data;
      
      // Check ownership
      if (existing.owner_id !== userId) {
        return { success: false, error: 'Only entity owner can delete' };
      }

      // Soft delete
      const { data, error } = await this.db.table('entities')
        .update({ 
          disabled: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', entityId)
        .select()
        .single();

      if (error) throw error;

      // Log entity deletion
      await this.db.logInteraction(
        'entity_deleted',
        userId,
        tenantId,
        { entity_id: entityId },
        entityId
      );

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Search entities with filters
  async searchEntities(filters, userId = null, tenantId = null, page = 1, limit = 20) {
    try {
      let query = this.db.table('entities')
        .select(`
          *,
          mtcli_entity_categories!mtcli_entities_entity_type_fkey (
            id,
            display_name,
            description
          )
        `)
        .eq('disabled', false);

      // Apply tenant filtering
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      // Apply entity type filter
      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }

// Apply attribute filters
for (const [key, value] of Object.entries(filters)) {
  // Skip system filters
  if (['entity_type', 'page', 'limit', 'sort_by', 'sort_order', 'include_images', 'search_query', 'q', 'category'].includes(key)) {
    continue;
  }

  // Handle range filters (e.g., price[min], price[max], year[min], year[max])
  if (typeof value === 'object' && value !== null) {
    if (value.min !== undefined) {
      query = query.gte(`attributes->${key}`, value.min);
    }
    if (value.max !== undefined) {
      query = query.lte(`attributes->${key}`, value.max);
    }
  } else if (value && value !== 'null' && value !== 'NA') {
    // Handle exact match filters
    query = query.contains('attributes', { [key]: value });
  }
}

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      // Apply ordering
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Filter out non-public entities if user is not authenticated
      let filteredData = data;
      if (!userId) {
        filteredData = data.filter(entity => entity.public_shareable);
      }

      // Log search activity
      if (userId) {
        await this.db.logInteraction(
          'entities_searched',
          userId,
          tenantId || 'global',
          { 
            filters, 
            result_count: filteredData.length,
            page,
            limit
          }
        );
      }

      return { 
        success: true, 
        data: filteredData,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          has_more: filteredData.length === limit
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Get entities by owner
  async getMyEntities(userId, tenantId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error } = await this.db.table('entities')
        .select(`
          *,
          mtcli_entity_categories!mtcli_entities_entity_type_fkey (
            id,
            display_name,
            description
          )
        `)
        .eq('owner_id', userId)
        .eq('tenant_id', tenantId)
        .eq('disabled', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { 
        success: true, 
        data,
        pagination: {
          page,
          limit,
          total: data.length,
          has_more: data.length === limit
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Get entity by share token
  async getEntityByShareToken(shareToken) {
    try {
      const { data, error } = await this.db.table('entities')
        .select(`
          *,
          mtcli_entity_categories!mtcli_entities_entity_type_fkey (
            id,
            display_name,
            description,
            base_schema
          )
        `)
        .eq('share_token', shareToken)
        .eq('public_shareable', true)
        .eq('disabled', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Entity not found or not shareable' };
        }
        throw error;
      }

      // Log share access
      await this.db.logInteraction(
        'entity_shared_accessed',
        'anonymous',
        data.tenant_id,
        { entity_id: data.id, share_token: shareToken },
        data.id
      );

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = EntityService;