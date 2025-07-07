import OTPLogin from './OTPLogin';
import { Container, Card } from 'react-bootstrap';

const AuthContainer = ({ onAuth }) => {
  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card className="shadow-lg p-4" style={{ width: '450px', maxWidth: '90vw' }}>
        <Card.Body>
          <div className="text-center mb-4">
            <h1 className="text-dark mb-2">Multi-Tenant CLI</h1>
            <p className="text-muted small">Secure access with email verification</p>
          </div>

          <OTPLogin onLogin={onAuth} />
          
          <div className="text-center mt-4 small text-muted">
            <p>🔐 We use email-based authentication for security</p>
            <p>No passwords required - just verify your email</p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AuthContainer;