/**
 * Authentication module
 */

const Auth = {
    /**
     * Initialize authentication
     */
    init: function() {
        this.setupEventListeners();
        this.checkAuthentication();
    },
    
    /**
     * Set up event listeners for authentication
     */
    setupEventListeners: function() {
        // Request OTP button
        document.getElementById('requestOtpBtn').addEventListener('click', async () => {
            const email = document.getElementById('email').value.trim();
            
            if (!email) {
                Utils.showToast('Please enter your email', 'error');
                return;
            }
            
            try {
                const requestOtpBtn = document.getElementById('requestOtpBtn');
                requestOtpBtn.disabled = true;
                requestOtpBtn.textContent = 'Sending...';
                
                const response = await API.auth.sendOtp(email);
                
                if (response.success) {
                    Utils.showToast('OTP sent successfully', 'success');
                    document.getElementById('otpSection').style.display = 'block';
                    
                    // Start OTP timer
                    this.startOtpTimer(new Date(response.expiresAt));
                } else {
                    Utils.showToast('Failed to send OTP', 'error');
                }
            } catch (error) {
                Utils.showToast(error.message || 'Failed to send OTP', 'error');
            } finally {
                const requestOtpBtn = document.getElementById('requestOtpBtn');
                requestOtpBtn.disabled = false;
                requestOtpBtn.textContent = 'Request OTP';
            }
        });
        
        // Verify OTP button
        document.getElementById('verifyOtpBtn').addEventListener('click', async () => {
            const email = document.getElementById('email').value.trim();
            const otp = document.getElementById('otp').value.trim();
            
            if (!email || !otp) {
                Utils.showToast('Please enter email and OTP', 'error');
                return;
            }
            
            try {
                const verifyOtpBtn = document.getElementById('verifyOtpBtn');
                verifyOtpBtn.disabled = true;
                verifyOtpBtn.textContent = 'Verifying...';
                
                const response = await API.auth.verifyOtp(email, otp);
                
                if (response.success && response.token) {
                    // Save token and user info
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    
                    Utils.showToast('Login successful', 'success');
                    
                    // Navigate to dashboard
                    this.showDashboard();
                } else {
                    Utils.showToast('Invalid OTP', 'error');
                }
            } catch (error) {
                Utils.showToast(error.message || 'Failed to verify OTP', 'error');
            } finally {
                const verifyOtpBtn = document.getElementById('verifyOtpBtn');
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.textContent = 'Verify OTP';
            }
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            try {
                await API.auth.logout();
                this.logout();
                Utils.showToast('Logged out successfully', 'success');
            } catch (error) {
                console.error('Logout error:', error);
                // Force logout even if API call fails
                this.logout();
            }
        });
    },
    
    /**
     * Start OTP timer
     * @param {Date} expiresAt - Expiration date
     */
    startOtpTimer: function(expiresAt) {
        const timerElement = document.getElementById('otpTimer');
        
        // Clear any existing timer
        if (this.otpTimerInterval) {
            clearInterval(this.otpTimerInterval);
        }
        
        // Update timer every second
        this.otpTimerInterval = setInterval(() => {
            const now = new Date();
            const timeLeft = expiresAt - now;
            
            if (timeLeft <= 0) {
                clearInterval(this.otpTimerInterval);
                timerElement.textContent = 'OTP expired';
                return;
            }
            
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            timerElement.textContent = `Expires in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
        
        // Initial update
        const now = new Date();
        const timeLeft = expiresAt - now;
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        timerElement.textContent = `Expires in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    
    /**
     * Check if user is authenticated
     */
    checkAuthentication: function() {
        const token = localStorage.getItem('token');
        
        if (token) {
            // Verify token validity
            API.auth.me()
                .then(response => {
                    if (response.authenticated) {
                        this.showDashboard();
                    } else {
                        this.logout();
                    }
                })
                .catch(error => {
                    console.error('Auth check error:', error);
                    this.logout();
                });
        } else {
            this.showLogin();
        }
    },
    
    /**
     * Show login page
     */
    showLogin: function() {
        document.getElementById('loginPage').style.display = 'block';
        document.getElementById('dashboardPage').style.display = 'none';
        document.getElementById('entityDetailsPage').style.display = 'none';
        document.getElementById('userInfo').style.display = 'none';
        
        // Clear form
        document.getElementById('email').value = '';
        document.getElementById('otp').value = '';
        document.getElementById('otpSection').style.display = 'none';
        
        // Clear timer
        if (this.otpTimerInterval) {
            clearInterval(this.otpTimerInterval);
        }
    },
    
    /**
     * Show dashboard page
     */
    showDashboard: function() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardPage').style.display = 'block';
        document.getElementById('entityDetailsPage').style.display = 'none';
        document.getElementById('userInfo').style.display = 'flex';
        
        // Update user info
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        document.getElementById('userEmail').textContent = user.email || '';
        
        // Load entities
        Entities.loadEntities();
        
        // Load categories for filters
        Entities.loadCategories();
    },
    
    /**
     * Logout user
     */
    logout: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showLogin();
    },
    
    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated: function() {
        return !!localStorage.getItem('token');
    },
    
    /**
     * Get current user
     * @returns {Object|null} User object or null
     */
    getCurrentUser: function() {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    }
};