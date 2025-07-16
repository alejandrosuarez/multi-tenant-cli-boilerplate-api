import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['bootstrap', 'react-bootstrap'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'icons-vendor': ['@fortawesome/fontawesome-free'],
          
          // Feature chunks
          'dashboard': [
            './src/components/Dashboard/Dashboard.jsx',
            './src/components/Dashboard/EntityManager.jsx',
            './src/components/Dashboard/BulkOperations.jsx',
            './src/components/Dashboard/EntityAnalytics.jsx'
          ],
          'analytics': [
            './src/components/Analytics/AnalyticsDashboard.jsx',
            './src/components/Analytics/ReportsGenerator.jsx',
            './src/components/Analytics/InteractionAnalytics.jsx',
            './src/components/Analytics/TrendAnalysis.jsx'
          ],
          'media': [
            './src/components/Media/MediaManager.jsx',
            './src/components/Media/ImageGallery.jsx',
            './src/components/Media/BulkUpload.jsx',
            './src/components/Media/MediaAnalytics.jsx'
          ],
          'notifications': [
            './src/components/Notifications/NotificationCenter.jsx',
            './src/components/Notifications/NotificationHistory.jsx',
            './src/components/Notifications/DeviceManager.jsx',
            './src/components/Notifications/NotificationTesting.jsx'
          ],
          'search': [
            './src/components/Search/GlobalSearch.jsx',
            './src/components/Search/AdvancedFilters.jsx',
            './src/components/Search/SavedSearches.jsx',
            './src/components/Search/DataExplorer.jsx'
          ],
          'tenants': [
            './src/components/Tenants/TenantDashboard.jsx',
            './src/components/Tenants/TenantUsers.jsx',
            './src/components/Tenants/TenantSettings.jsx',
            './src/components/Tenants/TenantAnalytics.jsx'
          ],
          'admin': [
            './src/components/Admin/AdminDashboard.jsx',
            './src/components/Admin/SystemHealth.jsx',
            './src/components/Admin/APITesting.jsx',
            './src/components/Admin/APIDocumentation.jsx',
            './src/components/Admin/DebugConsole.jsx'
          ],
          'attributes': [
            './src/components/Attributes/AttributeManager.jsx',
            './src/components/Attributes/RequestDashboard.jsx',
            './src/components/Attributes/SchemaEditor.jsx',
            './src/components/Attributes/AttributeAnalytics.jsx'
          ]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'chart.js',
      'react-chartjs-2'
    ]
  },
  // Development server configuration
  server: {
    // Enable HTTP/2 for better performance
    https: false,
    // Optimize HMR
    hmr: {
      overlay: false
    },
    // Proxy configuration for CORS handling
    proxy: {
      '/api': {
        target: 'https://multi-tenant-cli-boilerplate-api.vercel.app',
        changeOrigin: true,
        secure: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚨 API Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 API Request to Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 API Response from Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/health': {
        target: 'https://multi-tenant-cli-boilerplate-api.vercel.app',
        changeOrigin: true,
        secure: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚨 Health Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 Health Request to Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 Health Response from Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  // Preview server configuration
  preview: {
    port: 3001,
    strictPort: true
  }
})
