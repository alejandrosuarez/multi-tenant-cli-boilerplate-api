import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NavigationSearch.css';

const NavigationSearch = ({ navigationItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);
  const navigate = useNavigate();

  // Flatten navigation items for search
  const flattenNavItems = (items, parentLabel = '') => {
    let flattened = [];
    
    items.forEach(item => {
      const fullLabel = parentLabel ? `${parentLabel} > ${item.label}` : item.label;
      
      flattened.push({
        id: item.id,
        label: item.label,
        fullLabel,
        path: item.path,
        icon: item.icon,
        keywords: [item.label.toLowerCase(), fullLabel.toLowerCase()]
      });
      
      if (item.children && item.children.length > 0) {
        flattened = flattened.concat(flattenNavItems(item.children, fullLabel));
      }
    });
    
    return flattened;
  };

  const allNavItems = flattenNavItems(navigationItems);

  // Search function
  const performSearch = (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTermLower = term.toLowerCase();
    const results = allNavItems.filter(item => 
      item.keywords.some(keyword => keyword.includes(searchTermLower))
    ).slice(0, 8); // Limit to 8 results

    setSearchResults(results);
    setSelectedIndex(-1);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
    setIsSearchOpen(true);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsSearchOpen(true);
    if (searchTerm) {
      performSearch(searchTerm);
    }
  };

  // Handle search input blur
  const handleSearchBlur = (e) => {
    // Delay hiding to allow clicking on results
    setTimeout(() => {
      if (!searchResultsRef.current?.contains(document.activeElement)) {
        setIsSearchOpen(false);
      }
    }, 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isSearchOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleResultClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsSearchOpen(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result) => {
    navigate(result.path);
    setSearchTerm('');
    setSearchResults([]);
    setIsSearchOpen(false);
    setSelectedIndex(-1);
    searchInputRef.current?.blur();
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearchOpen(false);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
  };

  // Keyboard shortcut to focus search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="navigation-search">
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search navigation... (⌘K)"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {searchTerm && (
            <button
              className="search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="search-shortcut">
          <kbd>⌘K</kbd>
        </div>
      </div>

      {/* Search Results */}
      {isSearchOpen && (
        <div 
          ref={searchResultsRef}
          className={`search-results ${searchResults.length > 0 ? 'has-results' : ''}`}
        >
          {searchResults.length > 0 ? (
            <ul className="search-results-list">
              {searchResults.map((result, index) => (
                <li key={result.id} className="search-result-item">
                  <button
                    className={`search-result-button ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="search-result-content">
                      <div className="search-result-icon">
                        <i className={result.icon}></i>
                      </div>
                      <div className="search-result-text">
                        <div className="search-result-label">{result.label}</div>
                        <div className="search-result-path">{result.fullLabel}</div>
                      </div>
                    </div>
                    <div className="search-result-action">
                      <i className="fas fa-arrow-right"></i>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : searchTerm ? (
            <div className="search-no-results">
              <div className="no-results-icon">
                <i className="fas fa-search"></i>
              </div>
              <div className="no-results-text">
                No results found for "{searchTerm}"
              </div>
            </div>
          ) : (
            <div className="search-help">
              <div className="search-help-item">
                <kbd>↑</kbd><kbd>↓</kbd> Navigate
              </div>
              <div className="search-help-item">
                <kbd>↵</kbd> Select
              </div>
              <div className="search-help-item">
                <kbd>Esc</kbd> Close
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavigationSearch;