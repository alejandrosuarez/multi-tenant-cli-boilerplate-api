import OTPLogin from './OTPLogin';
import { Container, Card } from 'react-bootstrap';

const AuthContainer = ({ onAuth }) => {
  return (
    <div className="auth-container">
      <Container>
        <div className="auth-card neumorphic-card">
          <div className="auth-header">
            <div className="brand-section">
              <div className="brand-icon">
                <i className="fas fa-cube" style={{ fontSize: '3rem', color: '#0d6efd' }}></i>
              </div>
              <h1 className="brand-title">Multi-Tenant CLI</h1>
              <p className="brand-subtitle">Secure access with email verification</p>
            </div>
          </div>

          <div className="auth-content">
            <OTPLogin onLogin={onAuth} />
          </div>
          
          <div className="auth-footer">
            <div className="security-features">
              <div className="feature-item">
                <i className="fas fa-shield-alt"></i>
                <span>Email-based authentication</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-key"></i>
                <span>No passwords required</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-clock"></i>
                <span>Quick verification</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AuthContainer;