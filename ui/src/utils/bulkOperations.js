import api from '../services/api';

export const bulkOperations = {
  // Delete multiple entities
  async deleteEntities(entityIds, onProgress) {
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < entityIds.length; i++) {
      try {
        await api.delete(`/entities/${entityIds[i]}`);
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          entityId: entityIds[i],
          error: error.message
        });
      }

      if (onProgress) {
        onProgress(((i + 1) / entityIds.length) * 100);
      }
    }

    results.success = results.failed === 0;
    return results;
  },

  // Update status for multiple entities
  async updateStatus(entityIds, status, onProgress) {
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < entityIds.length; i++) {
      try {
        await api.put(`/entities/${entityIds[i]}`, {
          status: status
        });
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          entityId: entityIds[i],
          error: error.message
        });
      }

      if (onProgress) {
        onProgress(((i + 1) / entityIds.length) * 100);
      }
    }

    results.success = results.failed === 0;
    return results;
  },

  // Update entity type for multiple entities
  async updateEntityType(entityIds, entityType, onProgress) {
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < entityIds.length; i++) {
      try {
        await api.put(`/entities/${entityIds[i]}`, {
          entity_type: entityType
        });
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          entityId: entityIds[i],
          error: error.message
        });
      }

      if (onProgress) {
        onProgress(((i + 1) / entityIds.length) * 100);
      }
    }

    results.success = results.failed === 0;
    return results;
  },

  // Add attributes to multiple entities
  async addAttributes(entityIds, attributes, onProgress) {
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < entityIds.length; i++) {
      try {
        // First get the current entity to merge attributes
        const entityResponse = await api.get(`/entities/${entityIds[i]}`);
        const currentAttributes = entityResponse.data.attributes || {};
        
        const updatedAttributes = {
          ...currentAttributes,
          ...attributes
        };

        await api.put(`/entities/${entityIds[i]}`, {
          attributes: updatedAttributes
        });
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          entityId: entityIds[i],
          error: error.message
        });
      }

      if (onProgress) {
        onProgress(((i + 1) / entityIds.length) * 100);
      }
    }

    results.success = results.failed === 0;
    return results;
  },

  // Remove attributes from multiple entities
  async removeAttributes(entityIds, attributeKeys, onProgress) {
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < entityIds.length; i++) {
      try {
        // First get the current entity
        const entityResponse = await api.get(`/entities/${entityIds[i]}`);
        const currentAttributes = { ...entityResponse.data.attributes } || {};
        
        // Remove specified keys
        attributeKeys.forEach(key => {
          delete currentAttributes[key];
        });

        await api.put(`/entities/${entityIds[i]}`, {
          attributes: currentAttributes
        });
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          entityId: entityIds[i],
          error: error.message
        });
      }

      if (onProgress) {
        onProgress(((i + 1) / entityIds.length) * 100);
      }
    }

    results.success = results.failed === 0;
    return results;
  },

  // Export entities data
  async exportEntities(entityIds, allEntities, format = 'json') {
    try {
      const entitiesToExport = allEntities.filter(entity => 
        entityIds.includes(entity.id)
      );

      let exportData;
      let filename;
      let mimeType;

      switch (format) {
        case 'csv':
          exportData = this.convertToCSV(entitiesToExport);
          filename = `entities_export_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'xlsx':
          // For Excel export, we'll use a simple CSV format for now
          // In a real implementation, you'd use a library like xlsx
          exportData = this.convertToCSV(entitiesToExport);
          filename = `entities_export_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
          
        default: // json
          exportData = JSON.stringify(entitiesToExport, null, 2);
          filename = `entities_export_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
      }

      // Create and trigger download
      const blob = new Blob([exportData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        processed: entitiesToExport.length,
        downloadUrl: url
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Duplicate entities
  async duplicateEntities(entityIds, allEntities, onProgress) {
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
      created: []
    };

    const entitiesToDuplicate = allEntities.filter(entity => 
      entityIds.includes(entity.id)
    );

    for (let i = 0; i < entitiesToDuplicate.length; i++) {
      try {
        const originalEntity = entitiesToDuplicate[i];
        const duplicatedEntity = {
          entity_type: originalEntity.entity_type,
          tenant_id: originalEntity.tenant_id,
          attributes: {
            ...originalEntity.attributes,
            name: `${originalEntity.attributes?.name || 'Unnamed'} (Copy)`
          }
        };

        const response = await api.post('/entities', duplicatedEntity);
        results.processed++;
        results.created.push(response.data.id);
      } catch (error) {
        results.failed++;
        results.errors.push({
          entityId: entitiesToDuplicate[i].id,
          error: error.message
        });
      }

      if (onProgress) {
        onProgress(((i + 1) / entitiesToDuplicate.length) * 100);
      }
    }

    results.success = results.failed === 0;
    return results;
  },

  // Helper function to convert entities to CSV format
  convertToCSV(entities) {
    if (entities.length === 0) return '';

    // Get all unique attribute keys
    const attributeKeys = new Set();
    entities.forEach(entity => {
      if (entity.attributes) {
        Object.keys(entity.attributes).forEach(key => attributeKeys.add(key));
      }
    });

    // Create headers
    const headers = [
      'id',
      'entity_type',
      'tenant_id',
      'user_id',
      'created_at',
      'updated_at',
      'status',
      ...Array.from(attributeKeys).map(key => `attr_${key}`)
    ];

    // Create rows
    const rows = entities.map(entity => {
      const row = [
        entity.id || '',
        entity.entity_type || '',
        entity.tenant_id || '',
        entity.user_id || '',
        entity.created_at || '',
        entity.updated_at || '',
        entity.status || 'active'
      ];

      // Add attribute values
      attributeKeys.forEach(key => {
        const value = entity.attributes?.[key];
        row.push(typeof value === 'object' ? JSON.stringify(value) : (value || ''));
      });

      return row;
    });

    // Convert to CSV string
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  },

  // Get analytics for selected entities
  async getEntityAnalytics(entityIds, allEntities) {
    const selectedEntities = allEntities.filter(entity => 
      entityIds.includes(entity.id)
    );

    const analytics = {
      total: selectedEntities.length,
      byType: {},
      byStatus: {},
      createdThisWeek: 0,
      updatedThisWeek: 0,
      averageAttributes: 0
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let totalAttributes = 0;

    selectedEntities.forEach(entity => {
      // Count by type
      analytics.byType[entity.entity_type] = (analytics.byType[entity.entity_type] || 0) + 1;
      
      // Count by status
      const status = entity.status || 'active';
      analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;
      
      // Count recent creations/updates
      if (new Date(entity.created_at) > oneWeekAgo) {
        analytics.createdThisWeek++;
      }
      if (new Date(entity.updated_at) > oneWeekAgo) {
        analytics.updatedThisWeek++;
      }
      
      // Count attributes
      if (entity.attributes) {
        totalAttributes += Object.keys(entity.attributes).length;
      }
    });

    analytics.averageAttributes = selectedEntities.length > 0 
      ? Math.round(totalAttributes / selectedEntities.length * 10) / 10 
      : 0;

    return analytics;
  }
};