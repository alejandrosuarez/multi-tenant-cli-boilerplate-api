/**
 * Image Viewer module for handling image viewing functionality
 */

const ImageViewer = {
    // Current image index
    currentIndex: 0,
    
    // Images array
    images: [],
    
    /**
     * Initialize image viewer
     * @param {Array} images - Array of image objects
     */
    init: function(images) {
        this.images = images || [];
        this.currentIndex = 0;
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // Main image click for full screen
        const mainImage = document.getElementById('galleryMainImage');
        if (mainImage) {
            mainImage.addEventListener('click', () => {
                this.toggleFullScreen();
            });
        }
        
        // Full screen button
        const fullScreenBtn = document.getElementById('galleryFullScreenBtn');
        if (fullScreenBtn) {
            fullScreenBtn.addEventListener('click', () => {
                this.toggleFullScreen();
            });
        }
        
        // Previous button
        const prevBtn = document.getElementById('galleryPrevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.navigate('prev');
            });
        }
        
        // Next button
        const nextBtn = document.getElementById('galleryNextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.navigate('next');
            });
        }
        
        // Thumbnail clicks
        document.querySelectorAll('.image-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                this.navigate('goto', parseInt(thumb.dataset.index));
            });
        });
        
        // Preload images
        this.preloadImages();
    },
    
    /**
     * Navigate between images
     * @param {string} direction - 'prev', 'next', or 'goto'
     * @param {number} index - Index for 'goto'
     */
    navigate: function(direction, index) {
        if (!this.images || this.images.length <= 1) return;
        
        // Calculate new index
        let newIndex;
        if (direction === 'prev') {
            newIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        } else if (direction === 'next') {
            newIndex = (this.currentIndex + 1) % this.images.length;
        } else if (direction === 'goto') {
            newIndex = index;
        }
        
        // Update current index
        this.currentIndex = newIndex;
        
        // Update main image
        const mainImage = document.getElementById('galleryMainImage');
        if (mainImage) {
            mainImage.src = this.images[newIndex].url;
        }
        
        // Update image info
        const labelEl = document.getElementById('galleryImageLabel');
        if (labelEl) {
            labelEl.textContent = this.images[newIndex].label || '';
        }
        
        const indexEl = document.getElementById('galleryImageIndex');
        if (indexEl) {
            indexEl.textContent = `Image ${newIndex + 1} of ${this.images.length}`;
        }
        
        // Update active thumbnail
        document.querySelectorAll('.image-thumbnail').forEach((thumb, idx) => {
            if (idx === newIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    },
    
    /**
     * Toggle full screen mode
     */
    toggleFullScreen: function() {
        const mainImage = document.getElementById('galleryMainImage');
        if (!mainImage) return;
        
        if (mainImage.classList.contains('zoomed')) {
            // Exit full screen
            mainImage.classList.remove('zoomed');
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', this.handleKeyPress);
        } else {
            // Enter full screen
            mainImage.classList.add('zoomed');
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', this.handleKeyPress);
        }
    },
    
    /**
     * Handle key press in full screen mode
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyPress: function(e) {
        if (e.key === 'Escape') {
            ImageViewer.exitFullScreen();
        } else if (e.key === 'ArrowLeft') {
            ImageViewer.navigate('prev');
        } else if (e.key === 'ArrowRight') {
            ImageViewer.navigate('next');
        }
    },
    
    /**
     * Exit full screen mode
     */
    exitFullScreen: function() {
        const mainImage = document.getElementById('galleryMainImage');
        if (mainImage && mainImage.classList.contains('zoomed')) {
            mainImage.classList.remove('zoomed');
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', this.handleKeyPress);
        }
    },
    
    /**
     * Preload images
     */
    preloadImages: function() {
        if (!this.images || !this.images.length) return;
        
        this.images.forEach(img => {
            const preloadImg = new Image();
            preloadImg.src = img.url;
        });
    }
};