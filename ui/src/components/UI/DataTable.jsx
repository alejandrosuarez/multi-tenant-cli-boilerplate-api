import React, { useState, useMemo } from 'react';
import CollapsibleSection from './CollapsibleSection';
import TouchButton from './TouchButton';
import './DataTable.css';

const DataTable = ({
  data = [],
  columns = [],
  sortable = true,
  filterable = true,
  paginated = true,
  pageSize = 10,
  onRowClick = null,
  onSelectionChange = null,
  selectable = false,
  loading = false,
  emptyMessage = "No data available",
  mobileCardView = true
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Filtering logic
  const filteredData = useMemo(() => {
    if (!filterText) return sortedData;
    
    return sortedData.filter(row =>
      columns.some(column => {
        const value = row[column.key];
        return value && value.toString().toLowerCase().includes(filterText.toLowerCase());
      })
    );
  }, [sortedData, filterText, columns]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRowSelection = (rowId, isSelected) => {
    const newSelection = new Set(selectedRows);
    if (isSelected) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    setSelectedRows(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allIds = new Set(paginatedData.map(row => row.id));
      setSelectedRows(allIds);
      onSelectionChange?.(Array.from(allIds));
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Mobile card view renderer
  const renderMobileCards = () => (
    <div className="data-table-cards">
      {paginatedData.length === 0 ? (
        <div className="empty-message-card">
          {emptyMessage}
        </div>
      ) : (
        paginatedData.map((row, index) => (
          <div 
            key={row.id || index}
            className={`data-card ${onRowClick ? 'clickable' : ''} ${selectedRows.has(row.id) ? 'selected' : ''}`}
            onClick={() => onRowClick?.(row)}
          >
            {selectable && (
              <div className="data-card-checkbox">
                <input
                  type="checkbox"
                  checked={selectedRows.has(row.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleRowSelection(row.id, e.target.checked);
                  }}
                />
              </div>
            )}
            
            <div className="data-card-header">
              <div className="data-card-title">
                {columns[0] && (columns[0].render ? columns[0].render(row[columns[0].key], row) : row[columns[0].key])}
              </div>
              {columns[1] && (
                <div className="data-card-meta">
                  {columns[1].render ? columns[1].render(row[columns[1].key], row) : row[columns[1].key]}
                </div>
              )}
            </div>
            
            <div className="data-card-content">
              {columns.slice(2).map(column => (
                <div key={column.key} className="data-card-field">
                  <span className="field-label">{column.label}:</span>
                  <span className="field-value">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Desktop table view renderer
  const renderDesktopTable = () => (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th className="select-column">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                />
              </th>
            )}
            {columns.map(column => (
              <th
                key={column.key}
                className={`${sortable ? 'sortable' : ''} ${column.className || ''}`}
                onClick={() => handleSort(column.key)}
                style={{ width: column.width }}
              >
                <div className="header-content">
                  <span>{column.label}</span>
                  {sortable && <span className="sort-icon">{getSortIcon(column.key)}</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="empty-message">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginatedData.map((row, index) => (
              <tr
                key={row.id || index}
                className={`${onRowClick ? 'clickable' : ''} ${selectedRows.has(row.id) ? 'selected' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="select-column">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleRowSelection(row.id, e.target.checked);
                      }}
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td key={column.key} className={column.className || ''}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="data-table-loading">
        <div className="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      {filterable && (
        <CollapsibleSection 
          title="Search & Filter" 
          icon="fas fa-search"
          defaultExpanded={!isMobile}
        >
          <div className="data-table-filter">
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="form-control-mobile"
            />
          </div>
        </CollapsibleSection>
      )}

      {isMobile && mobileCardView ? renderMobileCards() : renderDesktopTable()}

      {paginated && totalPages > 1 && (
        <div className="data-table-pagination">
          <div className="pagination-info">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="pagination-controls">
            <TouchButton
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="secondary"
              icon="fas fa-chevron-left"
            >
              Previous
            </TouchButton>
            
            {!isMobile && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <TouchButton
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  variant={currentPage === pageNum ? 'primary' : 'secondary'}
                >
                  {pageNum}
                </TouchButton>
              );
            })}
            
            <TouchButton
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="secondary"
              icon="fas fa-chevron-right"
            >
              Next
            </TouchButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;