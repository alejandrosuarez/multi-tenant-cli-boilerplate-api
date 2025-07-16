// Data export utilities for various formats
import { transformToCSV, transformToJSON, transformForPDF } from './dataTransform';

export const dataExport = {
  // Export entities to JSON format
  exportToJSON(entities, filename = null) {
    const data = {
      exported_at: new Date().toISOString(),
      total_entities: entities.length,
      entities: entities
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    this.downloadFile(
      blob, 
      filename || `entities_export_${this.getDateString()}.json`
    );

    return {
      success: true,
      format: 'json',
      count: entities.length
    };
  },

  // Export entities to CSV format
  exportToCSV(entities, filename = null) {
    if (entities.length === 0) {
      throw new Error('No entities to export');
    }

    // Get all unique attribute keys
    const attributeKeys = new Set();
    entities.forEach(entity => {
      if (entity.attributes) {
        Object.keys(entity.attributes).forEach(key => attributeKeys.add(key));
      }
    });

    // Create headers
    const headers = [
      'ID',
      'Entity Type',
      'Tenant ID',
      'User ID',
      'Status',
      'Created At',
      'Updated At',
      ...Array.from(attributeKeys).sort()
    ];

    // Create rows
    const rows = entities.map(entity => {
      const row = [
        entity.id || '',
        entity.entity_type || '',
        entity.tenant_id || '',
        entity.user_id || '',
        entity.status || 'active',
        entity.created_at || '',
        entity.updated_at || ''
      ];

      // Add attribute values in the same order as headers
      attributeKeys.forEach(key => {
        const value = entity.attributes?.[key];
        if (value === null || value === undefined) {
          row.push('');
        } else if (typeof value === 'object') {
          row.push(JSON.stringify(value));
        } else {
          row.push(String(value));
        }
      });

      return row;
    });

    // Convert to CSV string
    const csvContent = [headers, ...rows]
      .map(row => 
        row.map(field => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const stringField = String(field);
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        }).join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    this.downloadFile(
      blob, 
      filename || `entities_export_${this.getDateString()}.csv`
    );

    return {
      success: true,
      format: 'csv',
      count: entities.length
    };
  },

  // Export entities to Excel format (using CSV for now, can be enhanced with xlsx library)
  exportToExcel(entities, filename = null) {
    // For now, we'll use CSV format with .xlsx extension
    // In a real implementation, you'd use a library like xlsx or exceljs
    const result = this.exportToCSV(entities, filename || `entities_export_${this.getDateString()}.xlsx`);
    result.format = 'excel';
    return result;
  },

  // Export entities to XML format
  exportToXML(entities, filename = null) {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<entities>\n';
    xmlContent += `  <metadata>\n`;
    xmlContent += `    <exported_at>${new Date().toISOString()}</exported_at>\n`;
    xmlContent += `    <total_count>${entities.length}</total_count>\n`;
    xmlContent += `  </metadata>\n`;

    entities.forEach(entity => {
      xmlContent += '  <entity>\n';
      xmlContent += `    <id>${this.escapeXML(entity.id || '')}</id>\n`;
      xmlContent += `    <entity_type>${this.escapeXML(entity.entity_type || '')}</entity_type>\n`;
      xmlContent += `    <tenant_id>${this.escapeXML(entity.tenant_id || '')}</tenant_id>\n`;
      xmlContent += `    <user_id>${this.escapeXML(entity.user_id || '')}</user_id>\n`;
      xmlContent += `    <status>${this.escapeXML(entity.status || 'active')}</status>\n`;
      xmlContent += `    <created_at>${this.escapeXML(entity.created_at || '')}</created_at>\n`;
      xmlContent += `    <updated_at>${this.escapeXML(entity.updated_at || '')}</updated_at>\n`;
      
      if (entity.attributes && Object.keys(entity.attributes).length > 0) {
        xmlContent += '    <attributes>\n';
        Object.entries(entity.attributes).forEach(([key, value]) => {
          const xmlValue = typeof value === 'object' 
            ? this.escapeXML(JSON.stringify(value))
            : this.escapeXML(String(value));
          xmlContent += `      <${this.escapeXMLTag(key)}>${xmlValue}</${this.escapeXMLTag(key)}>\n`;
        });
        xmlContent += '    </attributes>\n';
      }
      
      xmlContent += '  </entity>\n';
    });

    xmlContent += '</entities>';

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    
    this.downloadFile(
      blob, 
      filename || `entities_export_${this.getDateString()}.xml`
    );

    return {
      success: true,
      format: 'xml',
      count: entities.length
    };
  },

  // Export filtered/summary data
  exportSummary(entities, filters = {}, filename = null) {
    const summary = this.generateSummary(entities, filters);
    
    const data = {
      exported_at: new Date().toISOString(),
      filters_applied: filters,
      summary: summary,
      detailed_entities: entities
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    this.downloadFile(
      blob, 
      filename || `entities_summary_${this.getDateString()}.json`
    );

    return {
      success: true,
      format: 'summary',
      count: entities.length
    };
  },

  // Generate summary statistics
  generateSummary(entities, filters = {}) {
    const summary = {
      total_entities: entities.length,
      by_type: {},
      by_status: {},
      by_tenant: {},
      date_range: {
        earliest_created: null,
        latest_created: null,
        earliest_updated: null,
        latest_updated: null
      },
      attribute_stats: {},
      filters_applied: filters
    };

    entities.forEach(entity => {
      // Count by type
      const type = entity.entity_type || 'unknown';
      summary.by_type[type] = (summary.by_type[type] || 0) + 1;

      // Count by status
      const status = entity.status || 'active';
      summary.by_status[status] = (summary.by_status[status] || 0) + 1;

      // Count by tenant
      if (entity.tenant_id) {
        summary.by_tenant[entity.tenant_id] = (summary.by_tenant[entity.tenant_id] || 0) + 1;
      }

      // Track date ranges
      if (entity.created_at) {
        const createdDate = new Date(entity.created_at);
        if (!summary.date_range.earliest_created || createdDate < new Date(summary.date_range.earliest_created)) {
          summary.date_range.earliest_created = entity.created_at;
        }
        if (!summary.date_range.latest_created || createdDate > new Date(summary.date_range.latest_created)) {
          summary.date_range.latest_created = entity.created_at;
        }
      }

      if (entity.updated_at) {
        const updatedDate = new Date(entity.updated_at);
        if (!summary.date_range.earliest_updated || updatedDate < new Date(summary.date_range.earliest_updated)) {
          summary.date_range.earliest_updated = entity.updated_at;
        }
        if (!summary.date_range.latest_updated || updatedDate > new Date(summary.date_range.latest_updated)) {
          summary.date_range.latest_updated = entity.updated_at;
        }
      }

      // Count attribute usage
      if (entity.attributes) {
        Object.keys(entity.attributes).forEach(attr => {
          if (!summary.attribute_stats[attr]) {
            summary.attribute_stats[attr] = {
              count: 0,
              sample_values: new Set()
            };
          }
          summary.attribute_stats[attr].count++;
          
          // Store sample values (limit to 5)
          if (summary.attribute_stats[attr].sample_values.size < 5) {
            const value = entity.attributes[attr];
            if (value !== null && value !== undefined) {
              summary.attribute_stats[attr].sample_values.add(
                typeof value === 'object' ? JSON.stringify(value) : String(value)
              );
            }
          }
        });
      }
    });

    // Convert sample_values Sets to arrays for JSON serialization
    Object.keys(summary.attribute_stats).forEach(attr => {
      summary.attribute_stats[attr].sample_values = Array.from(summary.attribute_stats[attr].sample_values);
      summary.attribute_stats[attr].usage_percentage = 
        ((summary.attribute_stats[attr].count / entities.length) * 100).toFixed(1);
    });

    return summary;
  },

  // Helper function to download file
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Helper function to get formatted date string
  getDateString() {
    return new Date().toISOString().split('T')[0];
  },

  // Helper function to escape XML content
  escapeXML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  // Helper function to escape XML tag names
  escapeXMLTag(str) {
    return String(str)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/^[^a-zA-Z_]/, '_');
  },

  // Batch export multiple formats
  async exportMultipleFormats(entities, formats = ['json', 'csv'], baseFilename = null) {
    const results = [];
    const baseName = baseFilename || `entities_export_${this.getDateString()}`;

    for (const format of formats) {
      try {
        let result;
        switch (format.toLowerCase()) {
          case 'json':
            result = this.exportToJSON(entities, `${baseName}.json`);
            break;
          case 'csv':
            result = this.exportToCSV(entities, `${baseName}.csv`);
            break;
          case 'excel':
          case 'xlsx':
            result = this.exportToExcel(entities, `${baseName}.xlsx`);
            break;
          case 'xml':
            result = this.exportToXML(entities, `${baseName}.xml`);
            break;
          case 'summary':
            result = this.exportSummary(entities, {}, `${baseName}_summary.json`);
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          format: format,
          error: error.message
        });
      }
    }

    return results;
  },

  // Get available export formats
  getAvailableFormats() {
    return [
      { id: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
      { id: 'csv', label: 'CSV', description: 'Comma Separated Values' },
      { id: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
      { id: 'xml', label: 'XML', description: 'Extensible Markup Language' },
      { id: 'summary', label: 'Summary', description: 'Statistical summary with data' }
    ];
  },

  // Enhanced export using new transform utilities
  exportWithTransform(data, format, options = {}) {
    const filename = options.filename || `export_${this.getDateString()}`;
    
    try {
      switch (format.toLowerCase()) {
        case 'csv':
          const csvData = transformToCSV(data, options);
          const csvBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
          this.downloadFile(csvBlob, `${filename}.csv`);
          break;
          
        case 'json':
          const jsonData = transformToJSON(data, options);
          const jsonBlob = new Blob([jsonData], { type: 'application/json' });
          this.downloadFile(jsonBlob, `${filename}.json`);
          break;
          
        case 'pdf':
          const pdfData = transformForPDF(data, { title: options.title || 'Data Export', ...options });
          // This would integrate with a PDF library in a real implementation
          const pdfContent = this.generateSimplePDF(pdfData);
          const pdfBlob = new Blob([pdfContent], { type: 'text/plain' });
          this.downloadFile(pdfBlob, `${filename}.txt`);
          break;
          
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      return {
        success: true,
        format,
        count: Array.isArray(data) ? data.length : 1,
        filename: `${filename}.${format}`
      };
    } catch (error) {
      return {
        success: false,
        format,
        error: error.message
      };
    }
  },

  // Generate simple PDF content (placeholder for real PDF library)
  generateSimplePDF(pdfData) {
    let content = `${pdfData.title}\n`;
    content += '='.repeat(pdfData.title.length) + '\n\n';
    content += `Total Records: ${pdfData.totalRecords}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    if (pdfData.headers && pdfData.rows) {
      content += pdfData.headers.join(' | ') + '\n';
      content += '-'.repeat(pdfData.headers.join(' | ').length) + '\n';
      
      pdfData.rows.forEach(row => {
        content += row.join(' | ') + '\n';
      });
    }
    
    return content;
  },

  // Validation schema for different data types
  getValidationSchema(entityType) {
    const schemas = {
      entity: {
        requiredFields: ['entity_type', 'user_id'],
        fields: {
          id: { type: 'string', required: false },
          entity_type: { type: 'string', required: true, maxLength: 100 },
          user_id: { type: 'string', required: true },
          tenant_id: { type: 'string', required: false },
          status: { type: 'string', enum: ['active', 'inactive', 'pending'], required: false },
          created_at: { type: 'date', required: false },
          updated_at: { type: 'date', required: false }
        }
      },
      user: {
        requiredFields: ['email'],
        fields: {
          id: { type: 'string', required: false },
          email: { type: 'email', required: true },
          name: { type: 'string', required: false, maxLength: 255 },
          role: { type: 'string', enum: ['user', 'admin', 'tenant_admin'], required: false },
          status: { type: 'string', enum: ['active', 'inactive'], required: false },
          created_at: { type: 'date', required: false }
        }
      },
      notification: {
        requiredFields: ['user_id', 'type', 'message'],
        fields: {
          id: { type: 'string', required: false },
          user_id: { type: 'string', required: true },
          type: { type: 'string', required: true, maxLength: 50 },
          title: { type: 'string', required: false, maxLength: 255 },
          message: { type: 'string', required: true },
          read: { type: 'boolean', required: false },
          created_at: { type: 'date', required: false }
        }
      }
    };

    return schemas[entityType] || schemas.entity;
  },

  // Generate import templates
  generateImportTemplate(entityType, format = 'csv') {
    const schema = this.getValidationSchema(entityType);
    
    if (format === 'csv') {
      const headers = Object.keys(schema.fields);
      const sampleRow = headers.map(field => {
        const fieldSchema = schema.fields[field];
        return this.generateSampleValue(fieldSchema);
      });
      
      return `${headers.join(',')}\n${sampleRow.join(',')}`;
    } else if (format === 'json') {
      const sampleObject = {};
      Object.entries(schema.fields).forEach(([fieldName, fieldSchema]) => {
        sampleObject[fieldName] = this.generateSampleValue(fieldSchema);
      });
      
      return JSON.stringify([sampleObject], null, 2);
    }
    
    return '';
  },

  // Generate sample values for templates
  generateSampleValue(fieldSchema) {
    if (fieldSchema.example) return fieldSchema.example;
    
    switch (fieldSchema.type) {
      case 'string':
        return fieldSchema.enum ? fieldSchema.enum[0] : 'Sample text';
      case 'number':
        return 123;
      case 'boolean':
        return true;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'email':
        return 'example@email.com';
      case 'url':
        return 'https://example.com';
      default:
        return 'Sample value';
    }
  }
};