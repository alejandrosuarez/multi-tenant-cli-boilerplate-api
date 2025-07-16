import React, { useState, useCallback } from 'react';
import { transformToCSV, transformToJSON, transformForPDF } from '../../utils/dataTransform';
import './DataExport.css';

const DataExport = ({ 
  data = [], 
  filename = 'export', 
  title = 'Data Export',
  onExportStart,
  onExportComplete,
  onExportError,
  availableFormats = ['csv', 'json', 'pdf'],
  customFields = null,
  excludeFields = []
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(availableFormats[0] || 'csv');
  const [exportOptions, setExportOptions] = useState({
    includeHeaders: true,
    includeMetadata: false,
    flattenObjects: true,
    dateRange: null,
    customFilters: {}
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExport = useCallback(async () => {
    if (!data || data.length === 0) {
      onExportError?.('No data available to export');
      return;
    }

    setIsExporting(true);
    onExportStart?.();

    try {
      // Filter data based on options
      let filteredData = [...data];
      
      // Apply date range filter if specified
      if (exportOptions.dateRange) {
        const { start, end } = exportOptions.dateRange;
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.created_at || item.date);
          return itemDate >= new Date(start) && itemDate <= new Date(end);
        });
      }

      // Apply custom filters
      Object.entries(exportOptions.customFilters).forEach(([field, value]) => {
        if (value) {
          filteredData = filteredData.filter(item => 
            String(item[field]).toLowerCase().includes(String(value).toLowerCase())
          );
        }
      });

      // Select only custom fields if specified
      if (customFields && customFields.length > 0) {
        filteredData = filteredData.map(item => {
          const filtered = {};
          customFields.forEach(field => {
            if (item.hasOwnProperty(field)) {
              filtered[field] = item[field];
            }
          });
          return filtered;
        });
      }

      let exportData;
      let mimeType;
      let fileExtension;

      switch (selectedFormat) {
        case 'csv':
          exportData = transformToCSV(filteredData, {
            includeHeaders: exportOptions.includeHeaders,
            flattenObjects: exportOptions.flattenObjects,
            excludeFields
          });
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;

        case 'json':
          exportData = transformToJSON(filteredData, {
            pretty: true,
            includeMetadata: exportOptions.includeMetadata,
            excludeFields
          });
          mimeType = 'application/json';
          fileExtension = 'json';
          break;

        case 'pdf':
          // For PDF, we'll prepare the data and use a PDF library
          const pdfData = transformForPDF(filteredData, {
            title,
            includeTimestamp: true,
            excludeFields
          });
          await generatePDF(pdfData, filename);
          onExportComplete?.({ format: selectedFormat, recordCount: filteredData.length });
          return;

        default:
          throw new Error(`Unsupported export format: ${selectedFormat}`);
      }

      // Create and download file
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onExportComplete?.({ 
        format: selectedFormat, 
        recordCount: filteredData.length,
        filename: link.download
      });

    } catch (error) {
      console.error('Export failed:', error);
      onExportError?.(error.message);
    } finally {
      setIsExporting(false);
    }
  }, [data, selectedFormat, exportOptions, filename, title, customFields, excludeFields, onExportStart, onExportComplete, onExportError]);

  const generatePDF = async (pdfData, filename) => {
    // This is a simplified PDF generation - in a real app, you'd use a library like jsPDF
    const pdfContent = `
${pdfData.title}
${'='.repeat(pdfData.title.length)}

Total Records: ${pdfData.totalRecords}
Export Date: ${new Date().toLocaleDateString()}

${pdfData.headers.join(' | ')}
${'-'.repeat(pdfData.headers.join(' | ').length)}
${pdfData.rows.map(row => row.join(' | ')).join('\n')}
    `.trim();

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOptionChange = (option, value) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const getRecordCount = () => {
    let count = data.length;
    
    if (exportOptions.dateRange) {
      const { start, end } = exportOptions.dateRange;
      count = data.filter(item => {
        const itemDate = new Date(item.created_at || item.date);
        return itemDate >= new Date(start) && itemDate <= new Date(end);
      }).length;
    }

    return count;
  };

  return (
    <div className="data-export">
      <div className="export-header">
        <h3>Export Data</h3>
        <p className="export-info">
          {getRecordCount()} records available for export
        </p>
      </div>

      <div className="export-form">
        <div className="form-group">
          <label htmlFor="format-select">Export Format</label>
          <select
            id="format-select"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            disabled={isExporting}
          >
            {availableFormats.map(format => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {selectedFormat === 'csv' && (
          <div className="format-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={exportOptions.includeHeaders}
                onChange={(e) => handleOptionChange('includeHeaders', e.target.checked)}
                disabled={isExporting}
              />
              Include column headers
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={exportOptions.flattenObjects}
                onChange={(e) => handleOptionChange('flattenObjects', e.target.checked)}
                disabled={isExporting}
              />
              Flatten nested objects
            </label>
          </div>
        )}

        {selectedFormat === 'json' && (
          <div className="format-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={exportOptions.includeMetadata}
                onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                disabled={isExporting}
              />
              Include export metadata
            </label>
          </div>
        )}

        <div className="advanced-options">
          <button
            type="button"
            className="toggle-advanced"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={isExporting}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="advanced-panel">
              <div className="form-group">
                <label htmlFor="date-start">Date Range (Optional)</label>
                <div className="date-range">
                  <input
                    type="date"
                    id="date-start"
                    value={exportOptions.dateRange?.start || ''}
                    onChange={(e) => handleOptionChange('dateRange', {
                      ...exportOptions.dateRange,
                      start: e.target.value
                    })}
                    disabled={isExporting}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={exportOptions.dateRange?.end || ''}
                    onChange={(e) => handleOptionChange('dateRange', {
                      ...exportOptions.dateRange,
                      end: e.target.value
                    })}
                    disabled={isExporting}
                  />
                </div>
              </div>

              {customFields && (
                <div className="form-group">
                  <label>Custom Field Selection</label>
                  <div className="field-selection">
                    {customFields.map(field => (
                      <label key={field} className="checkbox-label">
                        <input
                          type="checkbox"
                          defaultChecked
                          disabled={isExporting}
                        />
                        {field}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="export-actions">
          <button
            className="export-button primary"
            onClick={handleExport}
            disabled={isExporting || !data || data.length === 0}
          >
            {isExporting ? (
              <>
                <span className="spinner"></span>
                Exporting...
              </>
            ) : (
              `Export ${selectedFormat.toUpperCase()}`
            )}
          </button>
        </div>
      </div>

      {isExporting && (
        <div className="export-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>Preparing your export...</p>
        </div>
      )}
    </div>
  );
};

export default DataExport;