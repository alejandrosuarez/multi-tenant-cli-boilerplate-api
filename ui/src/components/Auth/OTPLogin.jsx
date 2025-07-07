import { useState } from 'react';
import { authAPI } from '../../services/api';
import { Form, Button, Alert } from 'react-bootstrap';

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
      <Form onSubmit={handleSendOTP}>
        <h2 className="text-center mb-4">Access Your Account</h2>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form.Group className="mb-3">
          <Form.Control
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            name="tenantId"
            placeholder="Tenant ID (optional)"
            value={formData.tenantId}
            onChange={handleChange}
          />
        </Form.Group>
        
        <Button 
          variant="primary" 
          type="submit" 
          className="w-100"
          disabled={loading}
        >
          {loading ? 'Sending OTP...' : 'Send Verification Code'}
        </Button>
        
        <p className="text-center mt-3 text-muted small">
          We'll send a 6-digit code to your email
        </p>
      </Form>
    );
  }

  return (
    <Form onSubmit={handleVerifyOTP}>
      <h2 className="text-center mb-4">Enter Verification Code</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <p className="text-center mb-3 text-muted small">
        Code sent to: <strong>{formData.email}</strong>
      </p>
      
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          name="otp"
          placeholder="Enter 6-digit code"
          value={formData.otp}
          onChange={handleChange}
          maxLength="6"
          className="text-center fs-4 fw-bold"
          required
        />
      </Form.Group>
      
      {otpExpiry && (
        <p className="text-center mb-3 text-muted small">
          Code expires at: {new Date(otpExpiry).toLocaleTimeString()}
        </p>
      )}
      
      <Button 
        variant="primary" 
        type="submit" 
        className="w-100"
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </Button>
      
      <div className="d-grid gap-2 mt-3">
        <Button 
          variant="outline-secondary" 
          onClick={handleBackToEmail}
        >
          Back
        </Button>
        <Button 
          variant="outline-primary" 
          onClick={handleSendOTP}
          disabled={loading}
        >
          Resend Code
        </Button>
      </div>
    </Form>
  );
};

export default OTPLogin;