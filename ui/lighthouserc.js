module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173',
        'http://localhost:4173/dashboard',
        'http://localhost:4173/dashboard/entities',
        'http://localhost:4173/dashboard/analytics',
        'http://localhost:4173/dashboard/notifications',
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:.*:4173',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // Performance budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }], // 1MB
        'resource-summary:font:size': ['warn', { maxNumericValue: 200000 }], // 200KB
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        
        // Best Practices
        'uses-https': 'error',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};