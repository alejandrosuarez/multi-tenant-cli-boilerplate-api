const { Resend } = require('resend');
const crypto = require('crypto');

class OTPService {
  constructor() {
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    this.otpStore = new Map();
    this.fromEmail = process.env.RESEND_FROM_EMAIL;
  }

  generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
  }

  async sendOTP(email, tenantId = 'default') {
    try {
      if (!this.resend) {
        throw new Error('Resend not configured - missing API key');
      }

      const otp = this.generateOTP();
      const expiry = Date.now() + (5 * 60 * 1000); // 5 minutes
      
      // Store OTP with expiry
      const key = `${email}:${tenantId}`;
      this.otpStore.set(key, {
        otp,
        expiry,
        attempts: 0,
        email,
        tenantId
      });

      // Send email
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Your Verification Code',
        html: this.generateEmailTemplate(otp, email, tenantId)
      });

      if (error) {
        console.error('Resend error:', error);
        throw new Error('Failed to send OTP email');
      }

      return {
        success: true,
        messageId: data.id,
        expiresAt: new Date(expiry).toISOString()
      };
    } catch (error) {
      console.error('OTP send error:', error);
      throw error;
    }
  }

  async verifyOTP(email, otp, tenantId = 'default') {
    const key = `${email}:${tenantId}`;
    const storedData = this.otpStore.get(key);

    if (!storedData) {
      return { valid: false, error: 'OTP not found' };
    }

    // Check expiry
    if (Date.now() > storedData.expiry) {
      this.otpStore.delete(key);
      return { valid: false, error: 'OTP expired' };
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      this.otpStore.delete(key);
      return { valid: false, error: 'Too many attempts' };
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts++;
      return { valid: false, error: 'Invalid OTP' };
    }

    // Success - remove OTP
    this.otpStore.delete(key);
    return { 
      valid: true, 
      user: { email, tenantId },
      timestamp: new Date().toISOString()
    };
  }

  generateEmailTemplate(otp, email, tenantId) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verification Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; 
                       letter-spacing: 8px; margin: 20px 0; padding: 20px; background: #f8f9fa; 
                       border-radius: 8px; }
            .footer { font-size: 14px; color: #666; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verification Code</h1>
              <p>Your verification code for ${tenantId} tenant:</p>
            </div>
            
            <div class="otp-code">${otp}</div>
            
            <p>This code will expire in <strong>5 minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            
            <div class="footer">
              <p>Sent to: ${email}</p>
              <p>Generated at: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Cleanup expired OTPs
  cleanupExpired() {
    const now = Date.now();
    for (const [key, data] of this.otpStore.entries()) {
      if (now > data.expiry) {
        this.otpStore.delete(key);
      }
    }
  }

  // Get stats for debugging
  getStats() {
    return {
      activeOTPs: this.otpStore.size,
      otps: Array.from(this.otpStore.entries()).map(([key, data]) => ({
        key,
        email: data.email,
        tenantId: data.tenantId,
        attempts: data.attempts,
        expiresAt: new Date(data.expiry).toISOString(),
        // Include OTP code in development for testing
        ...(process.env.NODE_ENV !== 'production' && { otp: data.otp })
      }))
    };
  }
}

module.exports = OTPService;