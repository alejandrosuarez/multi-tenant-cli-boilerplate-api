import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import api from '../../services/api';
import './GlobalSearch.css';

const GlobalSearch = ({ onResultSelect, placeholder = "Search across all data..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState([]);
  
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    // Load search history from localStorage
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
        getSuggestions();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setResults([]);
      setSuggestions([]);
      setShowResults(false);
    }
  }, [query, currentTenant]);

  const performSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await api.get('/search/global', {
        params: {
          q: query,
          tenant_id: currentTenant?.id,
          limit: 20
        }
      });
      
      setResults(response.data.results || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = async () => {
    try {
      const response = await api.get('/search/suggestions', {
        params: {
          q: query,
          tenant_id: currentTenant?.id,
          limit: 5
        }
      });
      
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showResults) return;

    const totalItems = suggestions.length + results.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else {
            handleResultSelect(results[selectedIndex - suggestions.length]);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    
    // Add to search history
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    
    performSearch();
  };

  const handleSuggestionSelect = (suggestion) => {
    setQuery(suggestion);
    setShowResults(false);
    setTimeout(() => performSearch(), 100);
  };

  const handleResultSelect = (result) => {
    setShowResults(false);
    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const getResultIcon = (type) => {
    const icons = {
      entity: '📄',
      user: '👤',
      tenant: '🏢',
      attribute: '🏷️',
      interaction: '🔄',
      notification: '🔔'
    };
    return icons[type] || '📄';
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
        />
        <div className="search-actions">
          {isLoading && <div className="search-spinner">⏳</div>}
          {query && (
            <button onClick={clearSearch} className="clear-button">
              ✕
            </button>
          )}
          <button onClick={handleSearch} className="search-button">
            🔍
          </button>
        </div>
      </div>

      {showResults && (suggestions.length > 0 || results.length > 0) && (
        <div className="search-results" ref={resultsRef}>
          {suggestions.length > 0 && (
            <div className="suggestions-section">
              <div className="section-header">Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`suggestion-${index}`}
                  className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <span className="suggestion-icon">💡</span>
                  <span className="suggestion-text">{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="results-section">
              <div className="section-header">
                Results ({results.length})
              </div>
              {results.map((result, index) => (
                <div
                  key={`result-${result.id}`}
                  className={`result-item ${selectedIndex === suggestions.length + index ? 'selected' : ''}`}
                  onClick={() => handleResultSelect(result)}
                >
                  <div className="result-icon">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="result-content">
                    <div className="result-title">
                      <span 
                        dangerouslySetInnerHTML={{
                          __html: highlightMatch(result.title || result.name || 'Untitled', query)
                        }}
                      />
                      <span className="result-type">{result.type}</span>
                    </div>
                    {result.description && (
                      <div className="result-description">
                        <span 
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(result.description, query)
                          }}
                        />
                      </div>
                    )}
                    <div className="result-meta">
                      {result.entity_type && (
                        <span className="meta-item">Type: {result.entity_type}</span>
                      )}
                      {result.updated_at && (
                        <span className="meta-item">
                          Updated: {new Date(result.updated_at).toLocaleDateString()}
                        </span>
                      )}
                      {result.relevance_score && (
                        <span className="meta-item">
                          Relevance: {Math.round(result.relevance_score * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchHistory.length > 0 && query.length === 0 && (
            <div className="history-section">
              <div className="section-header">Recent Searches</div>
              {searchHistory.slice(0, 5).map((historyItem, index) => (
                <div
                  key={`history-${index}`}
                  className="history-item"
                  onClick={() => setQuery(historyItem)}
                >
                  <span className="history-icon">🕒</span>
                  <span className="history-text">{historyItem}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;