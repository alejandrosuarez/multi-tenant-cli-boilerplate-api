/**
 * API Service for making requests to the backend
 */

const API = {
    // Base URL for API requests
    baseUrl: '',
    
    /**
     * Initialize the API service
     * @param {string} baseUrl - Base URL for API requests
     */
    init: function(baseUrl) {
        this.baseUrl = baseUrl || '';
        console.log('API initialized with base URL:', this.baseUrl);
    },
    
    /**
     * Get the authorization header
     * @returns {Object} Headers object with Authorization
     */
    getAuthHeader: function() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },
    
    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Response data
     */
    async get(endpoint, params = {}) {
        try {
            // Build query string
            const queryString = Object.keys(params)
                .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');
            
            const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An error occurred');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    
    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @returns {Promise<Object>} Response data
     */
    async post(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An error occurred');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },
    
    /**
     * Make a PATCH request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @returns {Promise<Object>} Response data
     */
    async patch(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An error occurred');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API PATCH Error:', error);
            throw error;
        }
    },
    
    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} Response data
     */
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An error occurred');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    },
    
    /**
     * Upload files
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - Form data with files
     * @returns {Promise<Object>} Response data
     */
    async upload(endpoint, formData) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    ...this.getAuthHeader()
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An error occurred');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Upload Error:', error);
            throw error;
        }
    },
    
    // Authentication endpoints
    auth: {
        /**
         * Send OTP to email
         * @param {string} email - User email
         * @param {string} tenantId - Tenant ID
         * @returns {Promise<Object>} Response data
         */
        async sendOtp(email, tenantId = 'default') {
            return API.post('/api/auth/send-otp', { email, tenantId });
        },
        
        /**
         * Verify OTP and get token
         * @param {string} email - User email
         * @param {string} otp - One-time password
         * @param {string} tenantId - Tenant ID
         * @returns {Promise<Object>} Response data with token
         */
        async verifyOtp(email, otp, tenantId = 'default') {
            return API.post('/api/auth/verify-otp', { email, otp, tenantId });
        },
        
        /**
         * Get current user info
         * @returns {Promise<Object>} User data
         */
        async me() {
            return API.get('/api/auth/me');
        },
        
        /**
         * Logout user
         * @returns {Promise<Object>} Response data
         */
        async logout() {
            return API.post('/api/auth/logout');
        }
    },
    
    // Entity endpoints
    entities: {
        /**
         * Get entities with pagination and filters
         * @param {Object} params - Query parameters
         * @returns {Promise<Object>} Entities with pagination
         */
        async list(params = {}) {
            return API.get('/api/entities', params);
        },
        
        /**
         * Get entity by ID
         * @param {string} id - Entity ID
         * @returns {Promise<Object>} Entity data
         */
        async get(id) {
            return API.get(`/api/entities/${id}`);
        },
        
        /**
         * Create a new entity
         * @param {Object} data - Entity data
         * @returns {Promise<Object>} Created entity
         */
        async create(data) {
            return API.post('/api/entities', data);
        },
        
        /**
         * Update an entity
         * @param {string} id - Entity ID
         * @param {Object} data - Entity data to update
         * @returns {Promise<Object>} Updated entity
         */
        async update(id, data) {
            return API.patch(`/api/entities/${id}`, data);
        },
        
        /**
         * Delete an entity
         * @param {string} id - Entity ID
         * @returns {Promise<Object>} Response data
         */
        async delete(id) {
            return API.delete(`/api/entities/${id}`);
        },
        
        /**
         * Get entities owned by current user
         * @param {Object} params - Query parameters
         * @returns {Promise<Object>} Entities with pagination
         */
        async getMyEntities(params = {}) {
            return API.get('/api/my/entities', params);
        },
        
        /**
         * Advanced search for entities
         * @param {Object} params - Search parameters
         * @returns {Promise<Object>} Search results with pagination
         */
        async search(params = {}) {
            return API.get('/api/entities/search', params);
        },
        
        /**
         * Get entity by share token
         * @param {string} shareToken - Share token
         * @returns {Promise<Object>} Entity data
         */
        async getByShareToken(shareToken) {
            return API.get(`/api/shared/${shareToken}`);
        }
    },
    
    // Category endpoints
    categories: {
        /**
         * Get all categories
         * @returns {Promise<Object>} Categories list
         */
        async list() {
            return API.get('/api/categories');
        },
        
        /**
         * Get entities by category
         * @param {string} category - Category name
         * @param {Object} params - Query parameters
         * @returns {Promise<Object>} Entities with pagination
         */
        async getEntities(category, params = {}) {
            return API.get(`/api/categories/${category}/entities`, params);
        }
    },
    
    // Image endpoints
    images: {
        /**
         * Upload images to an entity
         * @param {string} entityId - Entity ID
         * @param {FormData} formData - Form data with images
         * @returns {Promise<Object>} Upload result
         */
        async upload(entityId, formData) {
            return API.upload(`/api/entities/${entityId}/images`, formData);
        },
        
        /**
         * Get images for an entity
         * @param {string} entityId - Entity ID
         * @param {string} size - Image size (thumbnail, small, medium, large)
         * @returns {Promise<Object>} Images data
         */
        async getForEntity(entityId, size = 'medium') {
            return API.get(`/api/entities/${entityId}/images`, { size });
        },
        
        /**
         * Delete an image
         * @param {string} imageId - Image ID
         * @returns {Promise<Object>} Response data
         */
        async delete(imageId) {
            return API.delete(`/api/images/${imageId}`);
        }
    },
    
    // Attribute endpoints
    attributes: {
        /**
         * Request more information about a specific attribute from entity owner
         * @param {string} attributeName - Name of the attribute
         * @param {string} entityId - Entity ID
         * @param {string} message - Optional message to the entity owner
         * @returns {Promise<Object>} Response data
         */
        async requestInfo(attributeName, entityId, message = '') {
            return API.post('/api/request-attribute', {
                attribute: attributeName,
                entityId: entityId,
                message: message
            });
        }
    },
    
    // Notification endpoints
    notifications: {
        /**
         * Subscribe device for push notifications
         * @param {string} deviceToken - Device token
         * @param {string} tenantContext - Tenant context
         * @returns {Promise<Object>} Subscription data
         */
        async subscribeDevice(deviceToken, tenantContext = 'default') {
            return API.post('/api/notifications/subscribe-device', { deviceToken, tenantContext });
        },
        
        /**
         * Send a notification
         * @param {Object} data - Notification data
         * @returns {Promise<Object>} Response data
         */
        async send(data) {
            return API.post('/api/notifications/send', data);
        },
        
        /**
         * Send a chat request notification
         * @param {string} entityId - Entity ID
         * @param {string} chatUrl - Chat URL
         * @returns {Promise<Object>} Response data
         */
        async chatRequest(entityId, chatUrl) {
            return API.post('/api/notifications/chat-request', { entityId, chatUrl });
        },
        
        /**
         * Get notification preferences
         * @returns {Promise<Object>} Preferences data
         */
        async getPreferences() {
            return API.get('/api/notifications/preferences');
        },
        
        /**
         * Update notification preferences
         * @param {Object} preferences - Preferences data
         * @returns {Promise<Object>} Updated preferences
         */
        async updatePreferences(preferences) {
            return API.post('/api/notifications/preferences', { preferences });
        },
        
        /**
         * Get notification history
         * @param {Object} params - Query parameters
         * @returns {Promise<Object>} Notifications with pagination
         */
        async getHistory(params = {}) {
            return API.get('/api/notifications/history', params);
        },
        
        /**
         * Mark a notification as seen
         * @param {string} id - Notification ID
         * @returns {Promise<Object>} Response data
         */
        async markAsSeen(id) {
            return API.post(`/api/notifications/${id}/seen`);
        },
        
        /**
         * Send a test notification
         * @returns {Promise<Object>} Response data
         */
        async test() {
            return API.post('/api/notifications/test');
        }
    }
};