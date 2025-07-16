/**
 * Performance monitoring and optimization utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = import.meta.env.DEV || localStorage.getItem('performance-monitoring') === 'true';
  }

  /**
   * Start timing a performance metric
   */
  startTiming(name) {
    if (!this.isEnabled) return;
    
    this.metrics.set(name, {
      startTime: performance.now(),
      name
    });
  }

  /**
   * End timing and log the result
   */
  endTiming(name) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric) return;
    
    const duration = performance.now() - metric.startTime;
    
    console.log(`⏱️ Performance: ${name} took ${duration.toFixed(2)}ms`);
    
    // Store for analytics
    this.recordMetric(name, duration);
    
    this.metrics.delete(name);
    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, type = 'timing') {
    if (!this.isEnabled) return;
    
    const metric = {
      name,
      value,
      type,
      timestamp: Date.now(),
      url: window.location.pathname
    };
    
    // Store in session storage for analysis
    const stored = JSON.parse(sessionStorage.getItem('performance-metrics') || '[]');
    stored.push(metric);
    
    // Keep only last 100 metrics
    if (stored.length > 100) {
      stored.splice(0, stored.length - 100);
    }
    
    sessionStorage.setItem('performance-metrics', JSON.stringify(stored));
  }

  /**
   * Monitor component render performance
   */
  monitorComponent(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();
    
    this.startTiming(`component-${componentName}`);
    const result = renderFn();
    this.endTiming(`component-${componentName}`);
    
    return result;
  }

  /**
   * Monitor API call performance
   */
  async monitorApiCall(name, apiCall) {
    if (!this.isEnabled) return await apiCall();
    
    this.startTiming(`api-${name}`);
    try {
      const result = await apiCall();
      this.endTiming(`api-${name}`);
      return result;
    } catch (error) {
      this.endTiming(`api-${name}`);
      throw error;
    }
  }

  /**
   * Monitor bundle loading performance
   */
  monitorBundleLoad(bundleName) {
    if (!this.isEnabled) return;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes(bundleName)) {
          console.log(`📦 Bundle Load: ${bundleName} took ${entry.duration.toFixed(2)}ms`);
          this.recordMetric(`bundle-${bundleName}`, entry.duration, 'bundle-load');
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
    this.observers.set(bundleName, observer);
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorWebVitals() {
    if (!this.isEnabled) return;
    
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`🎨 LCP: ${entry.startTime.toFixed(2)}ms`);
        this.recordMetric('lcp', entry.startTime, 'web-vital');
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`⚡ FID: ${entry.processingStart - entry.startTime}ms`);
        this.recordMetric('fid', entry.processingStart - entry.startTime, 'web-vital');
      }
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
      this.recordMetric('cls', clsValue, 'web-vital');
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Monitor memory usage
   */
  monitorMemory() {
    if (!this.isEnabled || !performance.memory) return;
    
    const memory = performance.memory;
    const memoryInfo = {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };
    
    console.log(`🧠 Memory: ${memoryInfo.used}MB / ${memoryInfo.total}MB (limit: ${memoryInfo.limit}MB)`);
    this.recordMetric('memory-used', memoryInfo.used, 'memory');
    this.recordMetric('memory-total', memoryInfo.total, 'memory');
    
    return memoryInfo;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    if (!this.isEnabled) return null;
    
    const stored = JSON.parse(sessionStorage.getItem('performance-metrics') || '[]');
    
    const summary = {
      totalMetrics: stored.length,
      byType: {},
      averages: {},
      recent: stored.slice(-10)
    };
    
    // Group by type
    stored.forEach(metric => {
      if (!summary.byType[metric.type]) {
        summary.byType[metric.type] = [];
      }
      summary.byType[metric.type].push(metric);
    });
    
    // Calculate averages
    Object.keys(summary.byType).forEach(type => {
      const metrics = summary.byType[type];
      const values = metrics.map(m => m.value);
      summary.averages[type] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });
    
    return summary;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    sessionStorage.removeItem('performance-metrics');
    this.metrics.clear();
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('performance-monitoring', enabled.toString());
    
    if (enabled) {
      this.monitorWebVitals();
    } else {
      this.clearMetrics();
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (import.meta.env.DEV) {
  performanceMonitor.monitorWebVitals();
  
  // Monitor memory every 30 seconds
  setInterval(() => {
    performanceMonitor.monitorMemory();
  }, 30000);
}

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  return {
    startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
    endTiming: performanceMonitor.endTiming.bind(performanceMonitor),
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    monitorComponent: performanceMonitor.monitorComponent.bind(performanceMonitor),
    monitorApiCall: performanceMonitor.monitorApiCall.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor),
    setEnabled: performanceMonitor.setEnabled.bind(performanceMonitor)
  };
};

/**
 * Higher-order component for performance monitoring
 */
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    return performanceMonitor.monitorComponent(
      componentName || WrappedComponent.name,
      () => <WrappedComponent {...props} />
    );
  };
};

/**
 * Decorator for API calls
 */
export const monitorApiCall = (name) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      return await performanceMonitor.monitorApiCall(
        name || `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args)
      );
    };
    
    return descriptor;
  };
};

export default performanceMonitor;