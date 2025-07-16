import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthContainer from './components/Auth/AuthContainer';
import Dashboard from './components/Dashboard/Dashboard';
import ListingPage from './components/Listing/ListingPage';
import EntityDetailsPage from './pages/EntityDetailsPage';
import SearchPage from './pages/SearchPage';
import PublicLayout from './components/Layout/PublicLayout';
import AdminLayout from './components/Layout/AdminLayout';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import ResponsiveLayout from './components/Layout/ResponsiveLayout';
import PWAInstallPrompt from './components/UI/PWAInstallPrompt';
import ApiStatusIndicator from './components/UI/ApiStatusIndicator';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { ToastProvider } from './components/UI/ToastContainer';
import FeedbackModal from './components/UI/FeedbackModal';
import GlobalErrorHandler from './components/UI/GlobalErrorHandler';
import ErrorReportingPanel from './components/UI/ErrorReportingPanel';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Lazy load all management components for code splitting
const EntityManager = lazy(() => import('./components/Dashboard/EntityManager'));
const BulkOperations = lazy(() => import('./components/Dashboard/BulkOperations'));
const EntityAnalytics = lazy(() => import('./components/Dashboard/EntityAnalytics'));

const AttributeManager = lazy(() => import('./components/Attributes/AttributeManager'));
const RequestDashboard = lazy(() => import('./components/Attributes/RequestDashboard'));
const SchemaEditor = lazy(() => import('./components/Attributes/SchemaEditor'));
const AttributeAnalytics = lazy(() => import('./components/Attributes/AttributeAnalytics'));

const MediaManager = lazy(() => import('./components/Media/MediaManager'));
const ImageGallery = lazy(() => import('./components/Media/ImageGallery'));
const BulkUpload = lazy(() => import('./components/Media/BulkUpload'));
const MediaAnalytics = lazy(() => import('./components/Media/MediaAnalytics'));

const NotificationCenter = lazy(() => import('./components/Notifications/NotificationCenter'));
const NotificationHistory = lazy(() => import('./components/Notifications/NotificationHistory'));
const DeviceManager = lazy(() => import('./components/Notifications/DeviceManager'));
const NotificationTesting = lazy(() => import('./components/Notifications/NotificationTesting'));

const GlobalSearch = lazy(() => import('./components/Search/GlobalSearch'));
const SavedSearches = lazy(() => import('./components/Search/SavedSearches'));
const DataExplorer = lazy(() => import('./components/Search/DataExplorer'));

const AnalyticsDashboard = lazy(() => import('./components/Analytics/AnalyticsDashboard'));
const ReportsGenerator = lazy(() => import('./components/Analytics/ReportsGenerator'));
const InteractionAnalytics = lazy(() => import('./components/Analytics/InteractionAnalytics'));
const TrendAnalysis = lazy(() => import('./components/Analytics/TrendAnalysis'));

const TenantDashboard = lazy(() => import('./components/Tenants/TenantDashboard'));
const TenantUsers = lazy(() => import('./components/Tenants/TenantUsers'));
const TenantSettings = lazy(() => import('./components/Tenants/TenantSettings'));
const TenantAnalytics = lazy(() => import('./components/Tenants/TenantAnalytics'));

const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const SystemHealth = lazy(() => import('./components/Admin/SystemHealth'));
const APITesting = lazy(() => import('./components/Admin/APITesting'));
const APIDocumentation = lazy(() => import('./components/Admin/APIDocumentation'));
const DebugConsole = lazy(() => import('./components/Admin/DebugConsole'));
const ErrorHandlingDemo = lazy(() => import('./components/UI/ErrorHandlingDemo'));
const DataExportImportDemo = lazy(() => import('./components/UI/DataExportImportDemo'));

import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { authAPI } from './services/api';
// import oneSignalService from './services/onesignal';
import './styles/globals.css';
import '@fortawesome/fontawesome-free/css/all.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('general');
  const [showErrorReporting, setShowErrorReporting] = useState(false);

  // Global feedback trigger function
  const triggerFeedback = (type = 'general') => {
    setFeedbackType(type);
    setShowFeedbackModal(true);
  };

  // Global error reporting trigger function
  const triggerErrorReporting = () => {
    setShowErrorReporting(true);
  };

  // Make global triggers available
  useEffect(() => {
    window.triggerFeedback = triggerFeedback;
    window.triggerErrorReporting = triggerErrorReporting;
    return () => {
      delete window.triggerFeedback;
      delete window.triggerErrorReporting;
    };
  }, []);

  useEffect(() => {
    checkAuth();
    // Initialize OneSignal for push notifications (safely) - only once
    if (!window.oneSignalInitialized) {
      window.oneSignalInitialized = true;
      initializeOneSignal();
    }
    
    // Test API connection in development
    if (import.meta.env.DEV) {
      import('./utils/apiTest').then(({ testApiConnection }) => {
        testApiConnection();
      });
    }
  }, []);
  
  const initializeOneSignal = async () => {
    try {
      console.log('🔔 OneSignal initialization skipped for testing');
      // await oneSignalService.initialize();
      console.log('✅ OneSignal initialization completed');
    } catch (error) {
      console.error('❌ Failed to initialize OneSignal:', error);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const handleAuth = async (userData) => {
    setUser(userData);
    
    // Set up OneSignal user context after login
    console.log('👤 User authenticated:', userData.email);
    
    // Give OneSignal a moment to initialize, then set user context
    setTimeout(async () => {
      try {
        const externalUserId = userData.id || userData.email;
        console.log('🔔 Setting OneSignal external user ID:', externalUserId);
        
        // await oneSignalService.setExternalUserId(externalUserId);
        
        // if (userData.email) {
        //   await oneSignalService.setUserEmail(userData.email);
        // }
        
        // await oneSignalService.setUserTags({
        //   userId: externalUserId,
        //   tenantId: userData.tenantId || 'default'
        // });
        
        console.log('✅ OneSignal user context set up for:', externalUserId);
        
        // Check subscription status after setting user context
        setTimeout(async () => {
          try {
            // if (typeof OneSignal !== 'undefined') {
            //   const isSubscribed = await OneSignal.isSubscribed();
            //   const playerId = await OneSignal.getPlayerId();
            //   console.log('📊 Post-Auth OneSignal Status:');
            //   console.log('  - Subscribed:', isSubscribed);
            //   console.log('  - Player ID:', playerId);
            //   console.log('  - External User ID:', externalUserId);
            // }
          } catch (error) {
            console.error('🚫 Error checking post-auth OneSignal status:', error);
          }
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error setting up OneSignal user context:', error);
      }
    }, 1000); // Wait 1 second for OneSignal to be ready
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      // Submit feedback using the enhanced API service
      const { feedbackAPI } = await import('./services/api');
      await feedbackAPI.submitFeedback(feedbackData);
      console.log('Feedback submitted successfully:', feedbackData);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };



  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <LoadingProvider>
          <AuthProvider>
            <TenantProvider>
              <NotificationProvider>
                <BrowserRouter>
                <ResponsiveLayout user={user}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<PublicLayout />}>
                      <Route index element={<ListingPage />} />
                      <Route path="listing" element={<ListingPage />} />
                      <Route path="entity/:entityId" element={<EntityDetailsPage />} />
                      <Route path="tenant/:tenantId" element={<ListingPage />} />
                      <Route path="tenant/:tenantId/entity/:entityId" element={<EntityDetailsPage />} />
                    </Route>
                    
                    {/* Auth route */}
                    <Route
                      path="/auth"
                      element={user ? <AdminLayout user={user} onLogout={handleLogout} /> : <AuthContainer onAuth={handleAuth} />}
                    />
                    
                    {/* Protected Admin routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <AdminLayout user={user} onLogout={handleLogout} />
                        </ProtectedRoute>
                      }
                    >
                      {/* Dashboard Home */}
                      <Route index element={<Dashboard user={user} />} />
                      
                      {/* Entity Management Routes */}
                      <Route path="entities" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <EntityManager />
                        </Suspense>
                      } />
                      <Route path="entities/create" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <EntityManager />
                        </Suspense>
                      } />
                      <Route path="entities/bulk" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <BulkOperations />
                        </Suspense>
                      } />
                      <Route path="entities/analytics" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <EntityAnalytics />
                        </Suspense>
                      } />
                      <Route path="entities/:entityId" element={<EntityDetailsPage />} />
                      
                      {/* Attribute Management Routes */}
                      <Route 
                        path="attributes" 
                        element={
                          <ProtectedRoute permission="manage_attributes">
                            <Suspense fallback={<LoadingSpinner />}>
                              <AttributeManager />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="attributes/requests" 
                        element={
                          <ProtectedRoute permission="respond_to_requests">
                            <Suspense fallback={<LoadingSpinner />}>
                              <RequestDashboard />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="attributes/schema" 
                        element={
                          <ProtectedRoute permission="manage_attributes">
                            <Suspense fallback={<LoadingSpinner />}>
                              <SchemaEditor />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="attributes/analytics" 
                        element={
                          <ProtectedRoute permission="view_attribute_analytics">
                            <Suspense fallback={<LoadingSpinner />}>
                              <AttributeAnalytics />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Media Management Routes */}
                      <Route path="media" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <MediaManager />
                        </Suspense>
                      } />
                      <Route path="media/gallery" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <ImageGallery />
                        </Suspense>
                      } />
                      <Route path="media/upload" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <BulkUpload />
                        </Suspense>
                      } />
                      <Route path="media/analytics" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <MediaAnalytics />
                        </Suspense>
                      } />
                      
                      {/* Notification Routes */}
                      <Route 
                        path="notifications" 
                        element={
                          <ProtectedRoute permission="manage_notifications">
                            <Suspense fallback={<LoadingSpinner />}>
                              <NotificationCenter />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="notifications/center" 
                        element={
                          <ProtectedRoute permission="manage_notifications">
                            <Suspense fallback={<LoadingSpinner />}>
                              <NotificationCenter />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="notifications/history" 
                        element={
                          <ProtectedRoute permission="view_notification_history">
                            <Suspense fallback={<LoadingSpinner />}>
                              <NotificationHistory />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="notifications/devices" 
                        element={
                          <ProtectedRoute permission="manage_notifications">
                            <Suspense fallback={<LoadingSpinner />}>
                              <DeviceManager />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="notifications/testing" 
                        element={
                          <ProtectedRoute permission="send_notifications">
                            <Suspense fallback={<LoadingSpinner />}>
                              <NotificationTesting />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Search Routes */}
                      <Route path="search" element={<SearchPage />} />
                      <Route path="search/global" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <GlobalSearch />
                        </Suspense>
                      } />
                      <Route path="search/saved" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <SavedSearches />
                        </Suspense>
                      } />
                      <Route path="search/explorer" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <DataExplorer />
                        </Suspense>
                      } />
                      
                      {/* Analytics Routes */}
                      <Route 
                        path="analytics" 
                        element={
                          <ProtectedRoute permission="view_tenant_analytics">
                            <Suspense fallback={<LoadingSpinner />}>
                              <AnalyticsDashboard />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="analytics/dashboard" 
                        element={
                          <ProtectedRoute permission="view_tenant_analytics">
                            <Suspense fallback={<LoadingSpinner />}>
                              <AnalyticsDashboard />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="analytics/reports" 
                        element={
                          <ProtectedRoute permission="view_tenant_analytics">
                            <Suspense fallback={<LoadingSpinner />}>
                              <ReportsGenerator />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="analytics/interactions" 
                        element={
                          <ProtectedRoute permission="view_tenant_analytics">
                            <Suspense fallback={<LoadingSpinner />}>
                              <InteractionAnalytics />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="analytics/trends" 
                        element={
                          <ProtectedRoute permission="view_tenant_analytics">
                            <Suspense fallback={<LoadingSpinner />}>
                              <TrendAnalysis />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Tenant Management Routes */}
                      <Route 
                        path="tenants" 
                        element={
                          <ProtectedRoute role="tenant_admin" permission="manage_tenant">
                            <Suspense fallback={<LoadingSpinner />}>
                              <TenantDashboard />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="tenants/dashboard" 
                        element={
                          <ProtectedRoute role="tenant_admin" permission="manage_tenant">
                            <Suspense fallback={<LoadingSpinner />}>
                              <TenantDashboard />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="tenants/users" 
                        element={
                          <ProtectedRoute permission="manage_tenant_users">
                            <Suspense fallback={<LoadingSpinner />}>
                              <TenantUsers />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="tenants/settings" 
                        element={
                          <ProtectedRoute permission="manage_tenant">
                            <Suspense fallback={<LoadingSpinner />}>
                              <TenantSettings />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="tenants/analytics" 
                        element={
                          <ProtectedRoute permission="view_tenant_analytics">
                            <Suspense fallback={<LoadingSpinner />}>
                              <TenantAnalytics />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* System Administration Routes */}
                      <Route 
                        path="system" 
                        element={
                          <ProtectedRoute role="system_admin" permission="system_admin">
                            <Suspense fallback={<LoadingSpinner />}>
                              <AdminDashboard />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="system/health" 
                        element={
                          <ProtectedRoute permission="view_system_health">
                            <Suspense fallback={<LoadingSpinner />}>
                              <SystemHealth />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="system/api-testing" 
                        element={
                          <ProtectedRoute permission="api_testing">
                            <Suspense fallback={<LoadingSpinner />}>
                              <APITesting />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="system/api-docs" 
                        element={
                          <ProtectedRoute permission="system_admin">
                            <Suspense fallback={<LoadingSpinner />}>
                              <APIDocumentation />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="system/debug" 
                        element={
                          <ProtectedRoute permission="system_admin">
                            <Suspense fallback={<LoadingSpinner />}>
                              <DebugConsole />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="system/tenants" 
                        element={
                          <ProtectedRoute permission="manage_all_tenants">
                            <Suspense fallback={<LoadingSpinner />}>
                              <TenantDashboard />
                            </Suspense>
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Demo Routes (Development) */}
                      <Route 
                        path="demo/error-handling" 
                        element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <ErrorHandlingDemo />
                          </Suspense>
                        } 
                      />
                      <Route 
                        path="demo/data-export-import" 
                        element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <DataExportImportDemo />
                          </Suspense>
                        } 
                      />
                    </Route>
                    
                    {/* Fallback - redirect to public listing */}
                    <Route path="*" element={<ListingPage />} />
                  </Routes>
                  
                  {/* PWA Install Prompt */}
                  <PWAInstallPrompt />
                  
                  {/* API Status Indicator */}
                  <ApiStatusIndicator />
                  
                  {/* Feedback Modal */}
                  <FeedbackModal
                    isOpen={showFeedbackModal}
                    onClose={() => setShowFeedbackModal(false)}
                    onSubmit={handleFeedbackSubmit}
                    type={feedbackType}
                  />
                  
                  {/* Error Reporting Panel */}
                  <ErrorReportingPanel
                    isOpen={showErrorReporting}
                    onClose={() => setShowErrorReporting(false)}
                  />
                  
                  {/* Global Error Handler */}
                  <GlobalErrorHandler />
                </ResponsiveLayout>
                </BrowserRouter>
              </NotificationProvider>
            </TenantProvider>
          </AuthProvider>
        </LoadingProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App
