import { useState, useCallback, useRef } from 'react';
import { useTenant } from '../contexts/TenantContext';
import api from '../services/api';

const useAdvancedSearch = () => {
  const [searchState, setSearchState] = useState({
    query: '',
    filters: {
      conditions: [],
      logic: 'AND'
    },
    results: [],
    suggestions: [],
    isLoading: false,
    hasSearched: false,
    totalResults: 0,
    currentPage: 1,
    pageSize: 20
  });

  const [searchHistory, setSearchHistory] = useState([]);
  const { currentTenant } = useTenant();
  const abortControllerRef = useRef(null);

  // Load search history from localStorage
  const loadSearchHistory = useCallback(() => {
    const history = localStorage.getItem(`searchHistory_${currentTenant?.id || 'default'}`);
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, [currentTenant]);

  // Save search to history
  const saveToHistory = useCallback((searchData) => {
    const historyItem = {
      id: Date.now(),
      query: searchData.query,
      filters: searchData.filters,
      timestamp: new Date().toISOString(),
      resultsCount: searchData.totalResults || 0
    };

    const newHistory = [historyItem, ...searchHistory.filter(h => 
      h.query !== searchData.query || JSON.stringify(h.filters) !== JSON.stringify(searchData.filters)
    )].slice(0, 50); // Keep last 50 searches

    setSearchHistory(newHistory);
    localStorage.setItem(`searchHistory_${currentTenant?.id || 'default'}`, JSON.stringify(newHistory));
  }, [searchHistory, currentTenant]);

  // Perform search
  const performSearch = useCallback(async (searchParams = {}) => {
    // Cancel any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const {
      query = searchState.query,
      filters = searchState.filters,
      page = 1,
      pageSize = searchState.pageSize,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = searchParams;

    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      currentPage: page
    }));

    try {
      const response = await api.post('/search/advanced', {
        query: query.trim(),
        filters,
        pagination: {
          page,
          pageSize
        },
        sorting: {
          field: sortBy,
          order: sortOrder
        },
        tenant_id: currentTenant?.id
      }, {
        signal: controller.signal
      });

      const { results, total, suggestions, facets } = response.data;

      setSearchState(prev => ({
        ...prev,
        results: page === 1 ? results : [...prev.results, ...results],
        totalResults: total,
        suggestions: suggestions || [],
        facets: facets || {},
        isLoading: false,
        hasSearched: true,
        query,
        filters
      }));

      // Save to history if it's a new search (page 1)
      if (page === 1 && (query.trim() || filters.conditions.length > 0)) {
        saveToHistory({ query, filters, totalResults: total });
      }

      return { results, total, suggestions, facets };
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search failed:', error);
        setSearchState(prev => ({
          ...prev,
          isLoading: false,
          results: page === 1 ? [] : prev.results,
          totalResults: page === 1 ? 0 : prev.totalResults
        }));
      }
      throw error;
    }
  }, [searchState.query, searchState.filters, searchState.pageSize, currentTenant, saveToHistory]);

  // Get search suggestions
  const getSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchState(prev => ({ ...prev, suggestions: [] }));
      return [];
    }

    try {
      const response = await api.get('/search/suggestions', {
        params: {
          q: query,
          tenant_id: currentTenant?.id,
          limit: 10
        }
      });

      const suggestions = response.data.suggestions || [];
      setSearchState(prev => ({ ...prev, suggestions }));
      return suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }, [currentTenant]);

  // Update search query
  const updateQuery = useCallback((query) => {
    setSearchState(prev => ({ ...prev, query }));
  }, []);

  // Update search filters
  const updateFilters = useCallback((filters) => {
    setSearchState(prev => ({ ...prev, filters }));
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSearchState({
      query: '',
      filters: {
        conditions: [],
        logic: 'AND'
      },
      results: [],
      suggestions: [],
      isLoading: false,
      hasSearched: false,
      totalResults: 0,
      currentPage: 1,
      pageSize: 20
    });
  }, []);

  // Load more results (pagination)
  const loadMore = useCallback(async () => {
    if (searchState.isLoading || 
        searchState.results.length >= searchState.totalResults) {
      return;
    }

    const nextPage = searchState.currentPage + 1;
    await performSearch({ page: nextPage });
  }, [searchState.isLoading, searchState.results.length, searchState.totalResults, searchState.currentPage, performSearch]);

  // Export search results
  const exportResults = useCallback(async (format = 'csv') => {
    try {
      const response = await api.post('/search/export', {
        query: searchState.query,
        filters: searchState.filters,
        format,
        tenant_id: currentTenant?.id
      }, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `search-results-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [searchState.query, searchState.filters, currentTenant]);

  // Get available filter fields
  const getFilterFields = useCallback(async () => {
    try {
      const response = await api.get('/search/fields', {
        params: {
          tenant_id: currentTenant?.id
        }
      });
      return response.data.fields || [];
    } catch (error) {
      console.error('Failed to get filter fields:', error);
      return [];
    }
  }, [currentTenant]);

  // Build search query from filters
  const buildQueryFromFilters = useCallback((filters) => {
    if (!filters.conditions || filters.conditions.length === 0) {
      return '';
    }

    const conditions = filters.conditions
      .filter(c => c.field && c.value !== '' && c.value !== null)
      .map(condition => {
        const { field, operator, value } = condition;
        
        switch (operator) {
          case 'equals':
            return `${field}:"${value}"`;
          case 'not_equals':
            return `-${field}:"${value}"`;
          case 'contains':
            return `${field}:*${value}*`;
          case 'not_contains':
            return `-${field}:*${value}*`;
          case 'starts_with':
            return `${field}:${value}*`;
          case 'ends_with':
            return `${field}:*${value}`;
          case 'greater_than':
            return `${field}:>${value}`;
          case 'less_than':
            return `${field}:<${value}`;
          case 'between':
            return Array.isArray(value) ? `${field}:[${value[0]} TO ${value[1]}]` : '';
          case 'is_empty':
            return `-${field}:*`;
          case 'is_not_empty':
            return `${field}:*`;
          default:
            return `${field}:"${value}"`;
        }
      })
      .filter(Boolean);

    return conditions.length > 0 ? 
      conditions.join(` ${filters.logic} `) : '';
  }, []);

  // Parse query into filters (basic implementation)
  const parseQueryToFilters = useCallback((query) => {
    // This is a simplified parser - in a real implementation,
    // you'd want a more robust query parser
    const conditions = [];
    const regex = /(\w+):([^"\s]+|"[^"]*")/g;
    let match;

    while ((match = regex.exec(query)) !== null) {
      const [, field, value] = match;
      conditions.push({
        id: Date.now() + Math.random(),
        field,
        operator: 'equals',
        value: value.replace(/"/g, ''),
        dataType: 'string'
      });
    }

    return {
      conditions,
      logic: 'AND'
    };
  }, []);

  return {
    // State
    searchState,
    searchHistory,
    
    // Actions
    performSearch,
    getSuggestions,
    updateQuery,
    updateFilters,
    clearSearch,
    loadMore,
    exportResults,
    loadSearchHistory,
    
    // Utilities
    getFilterFields,
    buildQueryFromFilters,
    parseQueryToFilters,
    
    // Computed values
    hasResults: searchState.results.length > 0,
    hasMore: searchState.results.length < searchState.totalResults,
    isSearching: searchState.isLoading,
    isEmpty: !searchState.hasSearched || (searchState.hasSearched && searchState.results.length === 0)
  };
};

export default useAdvancedSearch;