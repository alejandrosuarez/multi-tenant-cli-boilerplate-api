import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlobalSearch from '../components/Search/GlobalSearch';
import AdvancedFilters from '../components/Search/AdvancedFilters';
import SavedSearches from '../components/Search/SavedSearches';
import DataExplorer from '../components/Search/DataExplorer';
import DataTable from '../components/UI/DataTable';
import useAdvancedSearch from '../hooks/useAdvancedSearch';
import './SearchPage.css';

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [showFilters, setShowFilters] = useState(false);
  const [filterFields, setFilterFields] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table, cards, explorer
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    searchState,
    searchHistory,
    performSearch,
    updateQuery,
    updateFilters,
    clearSearch,
    loadMore,
    exportResults,
    loadSearchHistory,
    getFilterFields,
    hasResults,
    hasMore,
    isSearching,
    isEmpty
  } = useAdvancedSearch();

  useEffect(() => {
    const loadInitialData = async () => {
      loadSearchHistory();
      await loadFilterFields();
      
      // Load search from URL params
      const query = searchParams.get('q');
      const filters = searchParams.get('filters');
      
      if (query || filters) {
        const parsedFilters = filters ? JSON.parse(decodeURIComponent(filters)) : { conditions: [], logic: 'AND' };
        updateQuery(query || '');
        updateFilters(parsedFilters);
        performSearch({ query: query || '', filters: parsedFilters });
      }
    };
    
    loadInitialData();
  }, [loadSearchHistory, getFilterFields, searchParams, updateQuery, updateFilters, performSearch, loadFilterFields]);

  const loadFilterFields = async () => {
    try {
      const fields = await getFilterFields();
      setFilterFields(fields);
    } catch (error) {
      console.error('Failed to load filter fields:', error);
    }
  };

  const handleSearch = async (searchData = {}) => {
    const query = searchData.query || searchState.query;
    const filters = searchData.filters || searchState.filters;
    
    // Update URL params
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.conditions.length > 0) {
      params.set('filters', encodeURIComponent(JSON.stringify(filters)));
    }
    setSearchParams(params);
    
    try {
      await performSearch({ query, filters });
      setActiveTab('results');
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleGlobalSearchResult = (result) => {
    // Navigate to entity details or handle result selection
    if (result.type === 'entity') {
      navigate(`/entities/${result.id}`);
    } else {
      // Handle other result types
      console.log('Selected result:', result);
    }
  };

  const handleFiltersChange = (filters) => {
    updateFilters(filters);
  };

  const handleSavedSearchLoad = (savedSearch) => {
    updateQuery(savedSearch.query || '');
    updateFilters(savedSearch.filters || { conditions: [], logic: 'AND' });
    handleSearch({
      query: savedSearch.query || '',
      filters: savedSearch.filters || { conditions: [], logic: 'AND' }
    });
  };

  const handleExport = async (format) => {
    try {
      await exportResults(format);
    } catch (error) {
      alert('Export failed. Please try again.');
    }
  };

  const handleBulkAction = (action, selectedIds) => {
    console.log('Bulk action:', action, selectedIds);
    // Implement bulk actions like delete, update, etc.
  };

  const getCurrentSearch = () => {
    if (!searchState.query && searchState.filters.conditions.length === 0) {
      return null;
    }
    
    return {
      query: searchState.query,
      filters: searchState.filters
    };
  };

  const getTableColumns = () => {
    return [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (value, row) => (
          <div className="entity-name">
            <span className="name">{value || row.id}</span>
            <span className="type">{row.entity_type || row.type}</span>
          </div>
        )
      },
      {
        key: 'entity_type',
        label: 'Type',
        sortable: true
      },
      {
        key: 'created_at',
        label: 'Created',
        sortable: true,
        render: (value) => new Date(value).toLocaleDateString()
      },
      {
        key: 'updated_at',
        label: 'Updated',
        sortable: true,
        render: (value) => new Date(value).toLocaleDateString()
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => (
          <div className="row-actions">
            <button
              onClick={() => navigate(`/entities/${row.id}`)}
              className="view-button"
              title="View Details"
            >
              👁️
            </button>
            <button
              onClick={() => navigate(`/entities/${row.id}/edit`)}
              className="edit-button"
              title="Edit"
            >
              ✏️
            </button>
          </div>
        )
      }
    ];
  };

  const renderResultsView = () => {
    if (isEmpty && !isSearching) {
      return (
        <div className="empty-results">
          <div className="empty-icon">🔍</div>
          <h3>No Results Found</h3>
          <p>Try adjusting your search query or filters.</p>
        </div>
      );
    }

    switch (viewMode) {
      case 'explorer':
        return (
          <DataExplorer
            searchResults={searchState.results}
            onEntitySelect={handleGlobalSearchResult}
          />
        );
      
      case 'cards':
        return (
          <div className="results-cards">
            {searchState.results.map(result => (
              <div key={result.id} className="result-card">
                <div className="card-header">
                  <h4>{result.name || result.id}</h4>
                  <span className="card-type">{result.entity_type || result.type}</span>
                </div>
                <div className="card-content">
                  {result.description && (
                    <p className="card-description">{result.description}</p>
                  )}
                  <div className="card-meta">
                    <span>Created: {new Date(result.created_at).toLocaleDateString()}</span>
                    {result.attributes && (
                      <span>Attributes: {Object.keys(result.attributes).length}</span>
                    )}
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => navigate(`/entities/${result.id}`)}
                    className="card-action-button"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <DataTable
            data={searchState.results}
            columns={getTableColumns()}
            loading={isSearching}
            selectable={true}
            onBulkAction={handleBulkAction}
            pagination={{
              total: searchState.totalResults,
              current: searchState.currentPage,
              pageSize: searchState.pageSize,
              hasMore,
              onLoadMore: loadMore
            }}
          />
        );
    }
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-title">
          <h1>Advanced Search</h1>
          <p>Search and explore your data with powerful filters and visualizations</p>
        </div>
        
        <div className="search-input-section">
          <GlobalSearch
            onResultSelect={handleGlobalSearchResult}
            placeholder="Search entities, attributes, and more..."
          />
          
          <div className="search-actions">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`filters-toggle ${showFilters ? 'active' : ''}`}
            >
              🔧 Filters
            </button>
            <button
              onClick={() => handleSearch()}
              className="search-button"
              disabled={isSearching}
            >
              {isSearching ? '⏳' : '🔍'} Search
            </button>
            <button
              onClick={clearSearch}
              className="clear-button"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {showFilters && (
          <AdvancedFilters
            onFiltersChange={handleFiltersChange}
            initialFilters={searchState.filters}
            availableFields={filterFields}
          />
        )}
      </div>

      <div className="search-content">
        <div className="search-tabs">
          <button
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            🔍 Search
          </button>
          <button
            className={activeTab === 'results' ? 'active' : ''}
            onClick={() => setActiveTab('results')}
            disabled={!hasResults}
          >
            📊 Results ({searchState.totalResults})
          </button>
          <button
            className={activeTab === 'saved' ? 'active' : ''}
            onClick={() => setActiveTab('saved')}
          >
            💾 Saved Searches
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'search' && (
            <div className="search-tab">
              <div className="search-help">
                <h3>Search Tips</h3>
                <ul>
                  <li>Use quotes for exact phrases: "exact phrase"</li>
                  <li>Use field:value syntax: name:"John Doe"</li>
                  <li>Use wildcards: name:John*</li>
                  <li>Combine with AND/OR: name:John AND type:user</li>
                  <li>Use advanced filters for complex queries</li>
                </ul>
              </div>
              
              {searchHistory.length > 0 && (
                <div className="recent-searches">
                  <h3>Recent Searches</h3>
                  <div className="history-list">
                    {searchHistory.slice(0, 5).map(item => (
                      <div key={item.id} className="history-item">
                        <div className="history-content">
                          <div className="history-query">
                            {item.query || 'Advanced Filter Search'}
                          </div>
                          <div className="history-meta">
                            {new Date(item.timestamp).toLocaleDateString()} • 
                            {item.resultsCount} results
                          </div>
                        </div>
                        <button
                          onClick={() => handleSavedSearchLoad(item)}
                          className="load-history-button"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="results-tab">
              <div className="results-header">
                <div className="results-info">
                  <span className="results-count">
                    {searchState.totalResults.toLocaleString()} results
                  </span>
                  {searchState.query && (
                    <span className="search-query">for "{searchState.query}"</span>
                  )}
                </div>
                
                <div className="results-controls">
                  <div className="view-mode-selector">
                    <button
                      className={viewMode === 'table' ? 'active' : ''}
                      onClick={() => setViewMode('table')}
                      title="Table View"
                    >
                      📋
                    </button>
                    <button
                      className={viewMode === 'cards' ? 'active' : ''}
                      onClick={() => setViewMode('cards')}
                      title="Card View"
                    >
                      🗃️
                    </button>
                    <button
                      className={viewMode === 'explorer' ? 'active' : ''}
                      onClick={() => setViewMode('explorer')}
                      title="Data Explorer"
                    >
                      📊
                    </button>
                  </div>
                  
                  <div className="export-controls">
                    <button
                      onClick={() => handleExport('csv')}
                      className="export-button"
                    >
                      📄 CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="export-button"
                    >
                      📋 JSON
                    </button>
                  </div>
                </div>
              </div>

              {renderResultsView()}
            </div>
          )}

          {activeTab === 'saved' && (
            <SavedSearches
              onSearchLoad={handleSavedSearchLoad}
              currentSearch={getCurrentSearch()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;