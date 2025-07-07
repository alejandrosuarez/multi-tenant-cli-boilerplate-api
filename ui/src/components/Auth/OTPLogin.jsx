import { useState } from 'react';
import { authAPI } from '../../services/api';

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
      <form onSubmit={handleSendOTP} className="form">
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Access Your Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          className="neumorphic-input"
          required
        />
        
        <input
          type="text"
          name="tenantId"
          placeholder="Tenant ID (optional)"
          value={formData.tenantId}
          onChange={handleChange}
          className="neumorphic-input"
        />
        
        <button 
          type="submit" 
          className="neumorphic-button"
          disabled={loading}
        >
          {loading ? 'Sending OTP...' : 'Send Verification Code'}
        </button>
        
        <p style={{ textAlign: 'center', margin: '15px 0', fontSize: '0.9em', color: '#666' }}>
          We'll send a 6-digit code to your email
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOTP} className="form">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Enter Verification Code</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9em', color: '#666' }}>
        Code sent to: <strong>{formData.email}</strong>
      </div>
      
      <input
        type="text"
        name="otp"
        placeholder="Enter 6-digit code"
        value={formData.otp}
        onChange={handleChange}
        className="neumorphic-input"
        maxLength="6"
        style={{ textAlign: 'center', fontSize: '1.2em', letterSpacing: '0.2em' }}
        required
      />
      
      {otpExpiry && (
        <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '0.8em', color: '#666' }}>
          Code expires at: {new Date(otpExpiry).toLocaleTimeString()}
        </div>
      )}
      
      <button 
        type="submit" 
        className="neumorphic-button"
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </button>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button 
          type="button" 
          onClick={handleBackToEmail}
          className="neumorphic-button"
          style={{ flex: 1, background: '#f8d7da', color: '#721c24' }}
        >
          Back
        </button>
        <button 
          type="button" 
          onClick={handleSendOTP}
          className="neumorphic-button"
          style={{ flex: 1 }}
          disabled={loading}
        >
          Resend Code
        </button>
      </div>
    </form>
  );
};

export default OTPLogin;