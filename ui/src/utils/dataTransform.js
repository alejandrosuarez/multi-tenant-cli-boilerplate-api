/**
 * Data transformation utilities for export/import functionality
 */

// CSV transformation utilities
export const transformToCSV = (data, options = {}) => {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const { 
    includeHeaders = true, 
    delimiter = ',', 
    flattenObjects = true,
    excludeFields = []
  } = options;

  // Flatten nested objects if requested
  const processedData = flattenObjects ? data.map(flattenObject) : data;
  
  // Get all unique keys from the data
  const allKeys = [...new Set(processedData.flatMap(Object.keys))]
    .filter(key => !excludeFields.includes(key));

  const rows = [];

  // Add headers if requested
  if (includeHeaders) {
    rows.push(allKeys.map(escapeCSVField).join(delimiter));
  }

  // Add data rows
  processedData.forEach(item => {
    const row = allKeys.map(key => {
      const value = item[key];
      return escapeCSVField(formatValueForCSV(value));
    });
    rows.push(row.join(delimiter));
  });

  return rows.join('\n');
};

// JSON transformation utilities
export const transformToJSON = (data, options = {}) => {
  const { 
    pretty = true, 
    excludeFields = [],
    includeMetadata = false 
  } = options;

  const processedData = Array.isArray(data) ? data : [data];
  
  const cleanedData = processedData.map(item => {
    const cleaned = { ...item };
    excludeFields.forEach(field => delete cleaned[field]);
    return cleaned;
  });

  const result = {
    ...(includeMetadata && {
      metadata: {
        exportDate: new Date().toISOString(),
        recordCount: cleanedData.length,
        version: '1.0'
      }
    }),
    data: cleanedData
  };

  return pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
};

// PDF data preparation (for use with PDF libraries)
export const transformForPDF = (data, options = {}) => {
  const { 
    title = 'Data Export',
    includeTimestamp = true,
    maxRowsPerPage = 50,
    columnWidths = {}
  } = options;

  if (!Array.isArray(data) || data.length === 0) {
    return { title, headers: [], rows: [], pages: 1 };
  }

  const processedData = data.map(flattenObject);
  const headers = Object.keys(processedData[0] || {});
  
  const rows = processedData.map(item => 
    headers.map(header => formatValueForDisplay(item[header]))
  );

  const pages = Math.ceil(rows.length / maxRowsPerPage);
  
  return {
    title: includeTimestamp ? `${title} - ${new Date().toLocaleDateString()}` : title,
    headers,
    rows,
    pages,
    columnWidths,
    totalRecords: rows.length
  };
};

// Import validation utilities
export const validateCSVData = (csvText, schema = {}) => {
  const errors = [];
  const warnings = [];
  
  if (!csvText || csvText.trim() === '') {
    errors.push('CSV data is empty');
    return { isValid: false, errors, warnings, data: [] };
  }

  try {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    const data = [];

    // Validate headers against schema
    if (schema.requiredFields) {
      const missingFields = schema.requiredFields.filter(field => 
        !headers.includes(field)
      );
      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      }
    }

    // Parse and validate data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line);
        const rowData = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        // Validate row against schema
        const rowValidation = validateRowData(rowData, schema, i + 1);
        if (rowValidation.errors.length > 0) {
          errors.push(...rowValidation.errors);
        }
        if (rowValidation.warnings.length > 0) {
          warnings.push(...rowValidation.warnings);
        }

        data.push(rowData);
      } catch (error) {
        errors.push(`Error parsing line ${i + 1}: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data,
      headers,
      recordCount: data.length
    };
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error.message}`);
    return { isValid: false, errors, warnings, data: [] };
  }
};

export const validateJSONData = (jsonText, schema = {}) => {
  const errors = [];
  const warnings = [];

  if (!jsonText || jsonText.trim() === '') {
    errors.push('JSON data is empty');
    return { isValid: false, errors, warnings, data: [] };
  }

  try {
    const parsed = JSON.parse(jsonText);
    let data = [];

    // Handle different JSON structures
    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      data = parsed.data;
    } else if (typeof parsed === 'object') {
      data = [parsed];
    } else {
      errors.push('Invalid JSON structure - expected array or object with data property');
      return { isValid: false, errors, warnings, data: [] };
    }

    // Validate each record
    data.forEach((record, index) => {
      const rowValidation = validateRowData(record, schema, index + 1);
      if (rowValidation.errors.length > 0) {
        errors.push(...rowValidation.errors);
      }
      if (rowValidation.warnings.length > 0) {
        warnings.push(...rowValidation.warnings);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data,
      recordCount: data.length
    };
  } catch (error) {
    errors.push(`Invalid JSON format: ${error.message}`);
    return { isValid: false, errors, warnings, data: [] };
  }
};

// Helper functions
const flattenObject = (obj, prefix = '', result = {}) => {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  });
  return result;
};

const escapeCSVField = (field) => {
  if (field === null || field === undefined) return '';
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

const formatValueForCSV = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join('; ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const formatValueForDisplay = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).substring(0, 100); // Truncate long values for display
};

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

const validateRowData = (rowData, schema, rowNumber) => {
  const errors = [];
  const warnings = [];

  if (!schema.fields) return { errors, warnings };

  Object.entries(schema.fields).forEach(([fieldName, fieldSchema]) => {
    const value = rowData[fieldName];

    // Check required fields
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors.push(`Row ${rowNumber}: Missing required field '${fieldName}'`);
      return;
    }

    // Skip validation if field is empty and not required
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Type validation
    if (fieldSchema.type) {
      const isValid = validateFieldType(value, fieldSchema.type);
      if (!isValid) {
        errors.push(`Row ${rowNumber}: Invalid type for field '${fieldName}', expected ${fieldSchema.type}`);
      }
    }

    // Length validation
    if (fieldSchema.maxLength && String(value).length > fieldSchema.maxLength) {
      warnings.push(`Row ${rowNumber}: Field '${fieldName}' exceeds maximum length of ${fieldSchema.maxLength}`);
    }

    // Pattern validation
    if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(String(value))) {
      errors.push(`Row ${rowNumber}: Field '${fieldName}' does not match required pattern`);
    }

    // Enum validation
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      errors.push(`Row ${rowNumber}: Field '${fieldName}' must be one of: ${fieldSchema.enum.join(', ')}`);
    }
  });

  return { errors, warnings };
};

const validateFieldType = (value, expectedType) => {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return !isNaN(Number(value));
    case 'boolean':
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    case 'date':
      return !isNaN(Date.parse(value));
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    default:
      return true;
  }
};

// Export templates
export const generateImportTemplate = (entityType, schema = {}) => {
  const templates = {
    csv: generateCSVTemplate(schema),
    json: generateJSONTemplate(schema)
  };

  return templates;
};

const generateCSVTemplate = (schema) => {
  if (!schema.fields) {
    return 'id,name,description,created_at\n1,Sample Entity,Sample description,2024-01-01';
  }

  const headers = Object.keys(schema.fields);
  const sampleRow = headers.map(field => {
    const fieldSchema = schema.fields[field];
    return generateSampleValue(fieldSchema);
  });

  return `${headers.join(',')}\n${sampleRow.join(',')}`;
};

const generateJSONTemplate = (schema) => {
  if (!schema.fields) {
    return JSON.stringify([{
      id: 1,
      name: "Sample Entity",
      description: "Sample description",
      created_at: "2024-01-01"
    }], null, 2);
  }

  const sampleObject = {};
  Object.entries(schema.fields).forEach(([fieldName, fieldSchema]) => {
    sampleObject[fieldName] = generateSampleValue(fieldSchema);
  });

  return JSON.stringify([sampleObject], null, 2);
};

const generateSampleValue = (fieldSchema) => {
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
};