/**
 * Utility functions for the application
 */

const Utils = {
    /**
     * Format a date string to a readable format
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate: function(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
    
    /**
     * Format a date string to a relative time (e.g., "2 hours ago")
     * @param {string} dateString - ISO date string
     * @returns {string} Relative time
     */
    formatRelativeTime: function(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);
        
        if (diffSec < 60) {
            return 'just now';
        } else if (diffMin < 60) {
            return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        } else if (diffHour < 24) {
            return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        } else if (diffDay < 30) {
            return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        } else {
            return this.formatDate(dateString);
        }
    },
    
    /**
     * Format a number with commas
     * @param {number|string} number - Number to format
     * @returns {string} Formatted number
     */
    formatNumber: function(number) {
        if (!number) return '0';
        return Number(number).toLocaleString();
    },
    
    /**
     * Truncate a string to a specified length
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @returns {string} Truncated string
     */
    truncate: function(str, length = 100) {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    },
    
    /**
     * Capitalize the first letter of a string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalize: function(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    /**
     * Convert snake_case to Title Case
     * @param {string} str - String in snake_case
     * @returns {string} String in Title Case
     */
    snakeToTitleCase: function(str) {
        if (!str) return '';
        return str
            .split('_')
            .map(word => this.capitalize(word))
            .join(' ');
    },
    
    /**
     * Generate a random ID
     * @returns {string} Random ID
     */
    generateId: function() {
        return Math.random().toString(36).substring(2, 15);
    },
    
    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, error, info)
     * @param {number} duration - Duration in milliseconds
     */
    showToast: function(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="btn-close">&times;</button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Add event listener to close button
        toast.querySelector('.btn-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto-remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    },
    
    /**
     * Show a loading spinner
     * @param {HTMLElement} container - Container element
     * @param {string} message - Loading message
     * @returns {HTMLElement} Loading spinner element
     */
    showLoading: function(container, message = 'Loading...') {
        const loading = document.createElement('div');
        loading.className = 'loading-spinner';
        loading.textContent = message;
        container.innerHTML = '';
        container.appendChild(loading);
        return loading;
    },
    
    /**
     * Hide a loading spinner
     * @param {HTMLElement} loading - Loading spinner element
     */
    hideLoading: function(loading) {
        if (loading && loading.parentNode) {
            loading.parentNode.removeChild(loading);
        }
    },
    
    /**
     * Show a modal
     * @param {string} modalId - ID of the modal
     */
    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    },
    
    /**
     * Hide a modal
     * @param {string} modalId - ID of the modal
     */
    hideModal: function(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
        document.body.style.overflow = '';
    },
    
    /**
     * Create pagination controls
     * @param {HTMLElement} container - Container element
     * @param {Object} pagination - Pagination data
     * @param {Function} callback - Callback function when page changes
     */
    createPagination: function(container, pagination, callback) {
        const { page, limit, total, has_more } = pagination;
        const totalPages = Math.ceil(total / limit) || 1;
        
        container.innerHTML = '';
        
        // Previous button
        const prevBtn = document.createElement('div');
        prevBtn.className = `pagination-item ${page <= 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '&lt;';
        if (page > 1) {
            prevBtn.addEventListener('click', () => callback(page - 1));
        }
        container.appendChild(prevBtn);
        
        // Page numbers
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, page + 2);
        
        // Ensure we always show 5 pages if possible
        if (endPage - startPage < 4) {
            if (startPage === 1) {
                endPage = Math.min(5, totalPages);
            } else {
                startPage = Math.max(1, endPage - 4);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('div');
            pageBtn.className = `pagination-item ${i === page ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                if (i !== page) {
                    callback(i);
                }
            });
            container.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('div');
        nextBtn.className = `pagination-item ${!has_more ? 'disabled' : ''}`;
        nextBtn.innerHTML = '&gt;';
        if (has_more) {
            nextBtn.addEventListener('click', () => callback(page + 1));
        }
        container.appendChild(nextBtn);
    },
    
    /**
     * Debounce a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait = 300) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
};