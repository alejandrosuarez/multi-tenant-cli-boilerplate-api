import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthContainer from './components/Auth/AuthContainer';
import Dashboard from './components/Dashboard/Dashboard';
import ListingPage from './components/Listing/ListingPage';
import EntityDetailsPage from './pages/EntityDetailsPage';
import PublicLayout from './components/Layout/PublicLayout';
import { authAPI } from './services/api';
import './styles/globals.css';
import '@fortawesome/fontawesome-free/css/all.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const handleAuth = (userData, token) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="page-container">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<ListingPage />} />
            <Route path="listing" element={<ListingPage />} />
            <Route path="entity/:entityId" element={<EntityDetailsPage />} />
            <Route path="tenant/:tenantId" element={<ListingPage />} />
            <Route path="tenant/:tenantId/entity/:entityId" element={<EntityDetailsPage />} />
          </Route>
          
          {/* Protected routes */}
          <Route
            path="/dashboard/*"
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <AuthContainer onAuth={handleAuth} />}
          />
          
          {/* Auth route */}
          <Route
            path="/auth"
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <AuthContainer onAuth={handleAuth} />}
          />
          
          {/* Fallback - redirect to public listing */}
          <Route path="*" element={<ListingPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App
