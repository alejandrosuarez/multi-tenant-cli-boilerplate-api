import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthContainer from './components/Auth/AuthContainer';
import Dashboard from './components/Dashboard/Dashboard';
import ListingPage from './components/Listing/ListingPage';
import { authAPI } from './services/api';
import './styles/globals.css';

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
          <Route path="/listing" element={<ListingPage />} />
          <Route
            path="/*"
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <AuthContainer onAuth={handleAuth} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App
