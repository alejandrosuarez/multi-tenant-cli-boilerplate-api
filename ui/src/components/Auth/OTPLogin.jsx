import { useState } from 'react';
import { authAPI } from '../../services/api';
import { Form, Button, Alert, InputGroup, ProgressBar } from 'react-bootstrap';

const OTPLogin = ({ onLogin }) => {
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    tenantId: 'default'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.sendOTP(formData.email, formData.tenantId);
      
      if (response.data.devMode) {
        setSuccess(`Development Mode: Check the backend console for your OTP code!`);
      } else {
        setSuccess('OTP sent to your email! Please check your inbox.');
      }
      setOtpExpiry(response.data.expiresAt);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP(formData.email, formData.otp, formData.tenantId);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(user, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBackToEmail = () => {
    setStep('email');
    setFormData({ ...formData, otp: '' });
    setError('');
    setSuccess('');
  };

  if (step === 'email') {
    return (
      <div className="otp-login-container">
        <div className="login-header">
          <div className="login-icon">
            <i className="fas fa-envelope-open-text" style={{ fontSize: '2.5rem', color: '#0d6efd' }}></i>
          </div>
          <h2 className="login-title">Access Your Account</h2>
          <p className="login-subtitle">Enter your email to receive a verification code</p>
        </div>
        
        <Form onSubmit={handleSendOTP} className="login-form">
          {error && (
            <Alert variant="danger" className="login-alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="login-alert">
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label className="form-label">
              <i className="fas fa-at me-2"></i>
              Email Address
            </Form.Label>
            <InputGroup>
              <InputGroup.Text className="input-group-text">
                <i className="fas fa-envelope"></i>
              </InputGroup.Text>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
                className="neumorphic-input"
              />
            </InputGroup>
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label className="form-label">
              <i className="fas fa-building me-2"></i>
              Tenant ID
            </Form.Label>
            <InputGroup>
              <InputGroup.Text className="input-group-text">
                <i className="fas fa-layer-group"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                name="tenantId"
                placeholder="Enter tenant ID (optional)"
                value={formData.tenantId}
                onChange={handleChange}
                className="neumorphic-input"
              />
            </InputGroup>
            <Form.Text className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Leave as 'default' if unsure
            </Form.Text>
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 login-submit-btn"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Sending Code...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane me-2"></i>
                Send Verification Code
              </>
            )}
          </Button>
          
          <div className="login-footer">
            <div className="security-info">
              <i className="fas fa-shield-alt me-2"></i>
              <span>Secure email verification - no passwords required</span>
            </div>
          </div>
        </Form>
      </div>
    );
  }

  return (
    <div className="otp-verification-container">
      <div className="verification-header">
        <div className="verification-icon">
          <i className="fas fa-mobile-alt" style={{ fontSize: '2.5rem', color: '#198754' }}></i>
        </div>
        <h2 className="verification-title">Enter Verification Code</h2>
        <p className="verification-subtitle">
          We've sent a 6-digit code to
          <br />
          <strong>{formData.email}</strong>
        </p>
      </div>
      
      <Form onSubmit={handleVerifyOTP} className="verification-form">
        {error && (
          <Alert variant="danger" className="verification-alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        <Form.Group className="mb-4">
          <Form.Label className="form-label text-center d-block">
            <i className="fas fa-key me-2"></i>
            Verification Code
          </Form.Label>
          <Form.Control
            type="text"
            name="otp"
            placeholder="000000"
            value={formData.otp}
            onChange={handleChange}
            maxLength="6"
            className="otp-input neumorphic-input"
            required
          />
        </Form.Group>
        
        {otpExpiry && (
          <div className="expiry-info">
            <i className="fas fa-clock me-2"></i>
            <span className="text-muted">Expires at: {new Date(otpExpiry).toLocaleTimeString()}</span>
          </div>
        )}
        
        <Button 
          variant="success" 
          type="submit" 
          className="w-100 verification-submit-btn"
          disabled={loading || formData.otp.length !== 6}
          size="lg"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Verifying...
            </>
          ) : (
            <>
              <i className="fas fa-check-circle me-2"></i>
              Verify Code
            </>
          )}
        </Button>
        
        <div className="verification-actions">
          <Button 
            variant="outline-secondary" 
            onClick={handleBackToEmail}
            className="action-btn"
          >
            <i className="fas fa-arrow-left me-1"></i>
            Back to Email
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={handleSendOTP}
            disabled={loading}
            className="action-btn"
          >
            <i className="fas fa-redo me-1"></i>
            Resend Code
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default OTPLogin;