import OTPLogin from './OTPLogin';

const AuthContainer = ({ onAuth }) => {
  return (
    <div className="page-container">
      <div className="neumorphic-container" style={{ width: '450px', maxWidth: '90vw' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#333', marginBottom: '10px' }}>Multi-Tenant CLI</h1>
          <p style={{ color: '#666', fontSize: '0.9em' }}>Secure access with email verification</p>
        </div>

        <OTPLogin onLogin={onAuth} />
        
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8em', color: '#999' }}>
          <p>🔐 We use email-based authentication for security</p>
          <p>No passwords required - just verify your email</p>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;