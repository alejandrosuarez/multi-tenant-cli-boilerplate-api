import React, { useState, useEffect, useRef } from 'react';
import './DebugConsole.css';

const DebugConsole = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [filters, setFilters] = useState({
    level: 'all',
    source: 'all',
    search: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);
  const originalConsole = useRef({});

  const logLevels = ['all', 'error', 'warn', 'info', 'debug'];
  const logSources = ['all', 'api', 'component', 'service', 'system'];

  // Mock log data for demonstration
  const generateMockLog = (level, source) => ({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    level,
    source,
    message: `Sample ${level} message from ${source}`,
    details: {
      url: '/api/entities',
      method: 'GET',
      status: level === 'error' ? 500 : 200,
      responseTime: Math.floor(Math.random() * 1000) + 100,
      userAgent: navigator.userAgent,
      userId: 'user_123'
    },
    stack: level === 'error' ? 'Error: Sample error\n    at Component.render\n    at ReactDOM.render' : null
  });

  // Intercept console methods
  const interceptConsole = () => {
    if (isCapturing) return;

    originalConsole.current = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    const createInterceptor = (level) => (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      const logEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        level,
        source: 'console',
        message,
        details: {
          args: args,
          stack: new Error().stack
        }
      };

      setLogs(prev => [...prev, logEntry]);
      originalConsole.current[level](...args);
    };

    console.log = createInterceptor('info');
    console.error = createInterceptor('error');
    console.warn = createInterceptor('warn');
    console.info = createInterceptor('info');
    console.debug = createInterceptor('debug');
  };

  // Restore original console methods
  const restoreConsole = () => {
    if (originalConsole.current.log) {
      console.log = originalConsole.current.log;
      console.error = originalConsole.current.error;
      console.warn = originalConsole.current.warn;
      console.info = originalConsole.current.info;
      console.debug = originalConsole.current.debug;
    }
  };

  // Simulate API request logging
  const simulateApiLog = () => {
    const levels = ['info', 'warn', 'error'];
    const sources = ['api', 'service', 'component'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    const mockLog = generateMockLog(level, source);
    setLogs(prev => [...prev, mockLog]);
  };

  const startCapturing = () => {
    setIsCapturing(true);
    interceptConsole();
    
    // Simulate periodic logs
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        simulateApiLog();
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const stopCapturing = () => {
    setIsCapturing(false);
    restoreConsole();
  };

  const clearLogs = () => {
    setLogs([]);
    setSelectedLog(null);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filterLogs = () => {
    let filtered = logs;

    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters.source !== 'all') {
      filtered = filtered.filter(log => log.source === filters.source);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm) ||
        log.source.toLowerCase().includes(searchTerm) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm))
      );
    }

    setFilteredLogs(filtered);
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🐛';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const copyLogToClipboard = (log) => {
    const logText = `[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()} (${log.source}): ${log.message}`;
    navigator.clipboard.writeText(logText);
  };

  useEffect(() => {
    filterLogs();
  }, [logs, filters]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  useEffect(() => {
    return () => {
      restoreConsole();
    };
  }, []);

  return (
    <div className="debug-console">
      <div className="debug-header">
        <div className="header-content">
          <h2>Debug Console</h2>
          <p>Real-time error logs and request tracing</p>
        </div>

        <div className="debug-controls">
          <button
            className={`capture-btn ${isCapturing ? 'stop' : 'start'}`}
            onClick={isCapturing ? stopCapturing : startCapturing}
          >
            {isCapturing ? 'Stop Capture' : 'Start Capture'}
          </button>
          
          <button className="simulate-btn" onClick={simulateApiLog}>
            Simulate Log
          </button>
          
          <button className="clear-btn" onClick={clearLogs}>
            Clear Logs
          </button>
          
          <button className="export-btn" onClick={exportLogs}>
            Export Logs
          </button>
        </div>
      </div>

      <div className="debug-filters">
        <div className="filter-group">
          <label>Level:</label>
          <select
            value={filters.level}
            onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
          >
            {logLevels.map(level => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Source:</label>
          <select
            value={filters.source}
            onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
          >
            {logSources.map(source => (
              <option key={source} value={source}>
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
        </div>

        <div className="log-stats">
          <span className="log-count">
            {filteredLogs.length} of {logs.length} logs
          </span>
          {isCapturing && <span className="capturing-indicator">🔴 Capturing</span>}
        </div>
      </div>

      <div className="debug-content">
        <div className="logs-panel">
          <div className="logs-list">
            {filteredLogs.length === 0 ? (
              <div className="empty-logs">
                <p>No logs to display</p>
                <p className="empty-hint">
                  {isCapturing ? 'Waiting for new logs...' : 'Start capturing to see logs'}
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`log-entry ${log.level} ${selectedLog?.id === log.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="log-header">
                    <span className="log-icon">{getLogIcon(log.level)}</span>
                    <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                    <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}</span>
                    <span className="log-source">{log.source}</span>
                    <button
                      className="copy-log-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyLogToClipboard(log);
                      }}
                      title="Copy log"
                    >
                      📋
                    </button>
                  </div>
                  <div className="log-message">{log.message}</div>
                  {log.details && (
                    <div className="log-preview">
                      {log.details.url && <span className="detail-item">URL: {log.details.url}</span>}
                      {log.details.status && <span className="detail-item">Status: {log.details.status}</span>}
                      {log.details.responseTime && <span className="detail-item">Time: {log.details.responseTime}ms</span>}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {selectedLog && (
          <div className="log-details">
            <div className="details-header">
              <h3>Log Details</h3>
              <button
                className="close-details"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </button>
            </div>

            <div className="details-content">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Timestamp:</span>
                    <span className="detail-value">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Level:</span>
                    <span className={`detail-value log-level ${selectedLog.level}`}>
                      {selectedLog.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Source:</span>
                    <span className="detail-value">{selectedLog.source}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Message</h4>
                <div className="message-content">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.details && (
                <div className="detail-section">
                  <h4>Additional Details</h4>
                  <div className="json-content">
                    <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                  </div>
                </div>
              )}

              {selectedLog.stack && (
                <div className="detail-section">
                  <h4>Stack Trace</h4>
                  <div className="stack-trace">
                    <pre>{selectedLog.stack}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugConsole;