/**
 * UI module for handling UI components
 */

const UI = {
    /**
     * Initialize UI
     */
    init: function() {
        this.setupModalClosers();
    },
    
    /**
     * Set up modal closers
     */
    setupModalClosers: function() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Utils.hideModal(modal.id);
                }
            });
        });
        
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    if (modal.style.display === 'block') {
                        Utils.hideModal(modal.id);
                    }
                });
            }
        });
    }
};