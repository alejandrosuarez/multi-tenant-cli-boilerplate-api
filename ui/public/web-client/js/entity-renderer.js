/**
 * Entity Renderer module for rendering entities and quick view
 */

const EntityRenderer = {
    /**
     * Render entities in the list
     * @param {Array} entities - Array of entities
     * @param {HTMLElement} container - Container element
     */
    renderEntities: function(entities, container) {
        container.innerHTML = '';
        
        if (!entities || entities.length === 0) {
            container.innerHTML = '<div class="no-entities">No entities found</div>';
            return;
        }
        
        entities.forEach(entity => {
            const card = document.createElement('div');
            card.className = 'entity-card';
            card.dataset.id = entity.id;
            
            // Get main attributes for display
            const mainAttributes = this.getMainAttributes(entity.attributes);
            
            // Create image carousel if images exist
            let imageCarousel = '';
            if (entity.images && entity.images.length > 0) {
                const carouselId = `carousel-${entity.id}`;
                imageCarousel = `
                    <div class="entity-card-carousel" id="${carouselId}">
                        <div class="carousel-container">
                            ${entity.images.map((img, index) => `
                                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                    <img src="${img.url}" alt="${img.label || 'Entity image'}" class="entity-card-thumbnail">
                                </div>
                            `).join('')}
                        </div>
                        ${entity.images.length > 1 ? `
                            <button class="carousel-nav prev" data-carousel="${carouselId}">&lt;</button>
                            <button class="carousel-nav next" data-carousel="${carouselId}">&gt;</button>
                            <div class="carousel-dots">
                                ${entity.images.map((_, index) => `
                                    <span class="carousel-dot ${index === 0 ? 'active' : ''}" data-carousel="${carouselId}" data-index="${index}"></span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            
            card.innerHTML = `
                <div class="entity-card-header">
                    <h3 class="entity-card-title">${entity.attributes.name || 'Unnamed Entity'}</h3>
                    <span class="entity-card-category">${Utils.capitalize(entity.entity_type || '')}</span>
                </div>
                ${imageCarousel}
                <div class="entity-card-body">
                    <div class="entity-card-attributes">
                        ${mainAttributes.map(attr => `
                            <div class="entity-card-attribute">
                                <div class="entity-card-attribute-label">${Utils.snakeToTitleCase(attr.key)}</div>
                                <div>${attr.value}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="entity-card-footer">
                    <span>Created ${Utils.formatRelativeTime(entity.created_at)}</span>
                    <button class="btn btn-text quick-view-btn" data-id="${entity.id}">Quick View</button>
                </div>
            `;
            
            // Add event listener for the whole card
            card.addEventListener('click', (e) => {
                // Don't navigate if clicking on carousel controls or quick view button
                if (e.target.classList.contains('carousel-nav') || 
                    e.target.classList.contains('carousel-dot') ||
                    e.target.classList.contains('quick-view-btn')) {
                    return;
                }
                Entities.showEntityDetails(entity.id);
            });
            
            // Add to container
            container.appendChild(card);
            
            // Add event listeners for carousel controls
            if (entity.images && entity.images.length > 1) {
                const carouselId = `carousel-${entity.id}`;
                
                // Previous button
                card.querySelector(`.carousel-nav.prev[data-carousel="${carouselId}"]`).addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.carouselNav('prev', carouselId);
                });
                
                // Next button
                card.querySelector(`.carousel-nav.next[data-carousel="${carouselId}"]`).addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.carouselNav('next', carouselId);
                });
                
                // Dots
                card.querySelectorAll(`.carousel-dot[data-carousel="${carouselId}"]`).forEach(dot => {
                    dot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.carouselNav('goto', carouselId, parseInt(dot.dataset.index));
                    });
                });
            }
            
            // Add event listener for quick view button
            card.querySelector('.quick-view-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showQuickView(entity);
            });
        });
    },
    
    /**
     * Get main attributes for display
     * @param {Object} attributes - Entity attributes
     * @returns {Array} Array of key-value pairs
     */
    getMainAttributes: function(attributes) {
        if (!attributes) return [];
        
        // Priority attributes to show first
        const priorityKeys = ['price', 'address', 'bedrooms', 'bathrooms', 'make', 'model', 'year'];
        const result = [];
        
        // Add priority attributes first
        priorityKeys.forEach(key => {
            if (attributes[key]) {
                result.push({ key, value: attributes[key] });
            }
        });
        
        // Add other attributes (up to 4 total)
        const otherKeys = Object.keys(attributes).filter(key => 
            !priorityKeys.includes(key) && key !== 'name' && key !== 'description'
        );
        
        otherKeys.slice(0, 4 - result.length).forEach(key => {
            result.push({ key, value: attributes[key] });
        });
        
        return result;
    },
    
    /**
     * Navigate carousel
     * @param {string} direction - 'prev', 'next', or 'goto'
     * @param {string} carouselId - Carousel ID
     * @param {number} index - Index for 'goto'
     */
    carouselNav: function(direction, carouselId, index) {
        const carousel = document.getElementById(carouselId);
        if (!carousel) return;
        
        const items = carousel.querySelectorAll('.carousel-item');
        const dots = carousel.querySelectorAll('.carousel-dot');
        
        let activeIndex = 0;
        items.forEach((item, idx) => {
            if (item.classList.contains('active')) {
                activeIndex = idx;
                item.classList.remove('active');
            }
        });
        
        dots.forEach(dot => dot.classList.remove('active'));
        
        let newIndex;
        if (direction === 'prev') {
            newIndex = (activeIndex - 1 + items.length) % items.length;
        } else if (direction === 'next') {
            newIndex = (activeIndex + 1) % items.length;
        } else if (direction === 'goto') {
            newIndex = index;
        }
        
        items[newIndex].classList.add('active');
        dots[newIndex].classList.add('active');
    },
    
    /**
     * Navigate carousel in details tab
     * @param {string} direction - 'prev', 'next', or 'goto'
     * @param {Array} images - Array of image objects
     * @param {number} index - Index for 'goto'
     */
    detailsCarouselNav: function(direction, images, index) {
        const container = document.querySelector('.quick-view-carousel .carousel-container');
        const dots = document.querySelectorAll('.carousel-dot[data-carousel="details"]');
        
        if (!container || !images || images.length <= 1) return;
        
        const items = container.querySelectorAll('.carousel-item');
        
        let activeIndex = 0;
        items.forEach((item, idx) => {
            if (item.classList.contains('active')) {
                activeIndex = idx;
                item.classList.remove('active');
            }
        });
        
        dots.forEach(dot => dot.classList.remove('active'));
        
        let newIndex;
        if (direction === 'prev') {
            newIndex = (activeIndex - 1 + items.length) % items.length;
        } else if (direction === 'next') {
            newIndex = (activeIndex + 1) % items.length;
        } else if (direction === 'goto') {
            newIndex = index;
        }
        
        items[newIndex].classList.add('active');
        dots[newIndex].classList.add('active');
    },
    
    /**
     * Show skeleton loading UI for quick view
     * @param {HTMLElement} detailsTab - Details tab element
     * @param {HTMLElement} imagesTab - Images tab element
     */
    showQuickViewSkeletons: function(detailsTab, imagesTab) {
        // Skeleton for details tab
        detailsTab.innerHTML = `
            <div class="skeleton skeleton-image" style="height: 200px; margin-bottom: 1rem;"></div>
            <div class="quick-view-description">
                <div class="skeleton-text title"></div>
                <div class="skeleton-text medium"></div>
                <div class="skeleton-text medium"></div>
            </div>
            <div class="quick-view-attributes">
                <div class="skeleton-text title"></div>
                <div class="quick-view-attributes-grid">
                    <div class="quick-view-attribute">
                        <div class="skeleton-text short"></div>
                        <div class="skeleton-text medium"></div>
                    </div>
                    <div class="quick-view-attribute">
                        <div class="skeleton-text short"></div>
                        <div class="skeleton-text medium"></div>
                    </div>
                    <div class="quick-view-attribute">
                        <div class="skeleton-text short"></div>
                        <div class="skeleton-text medium"></div>
                    </div>
                    <div class="quick-view-attribute">
                        <div class="skeleton-text short"></div>
                        <div class="skeleton-text medium"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Skeleton for images tab
        imagesTab.innerHTML = `
            <div class="image-gallery-viewer">
                <div class="image-gallery-main">
                    <div class="skeleton skeleton-image" style="height: 300px;"></div>
                </div>
                <div class="image-gallery-info">
                    <div class="skeleton-text medium"></div>
                    <div class="skeleton-text short"></div>
                </div>
                <div class="image-gallery-controls">
                    <div class="skeleton-text medium" style="width: 100px;"></div>
                    <div class="skeleton-text medium" style="width: 100px;"></div>
                    <div class="skeleton-text medium" style="width: 100px;"></div>
                </div>
                <div class="image-gallery-thumbnails">
                    <div class="skeleton skeleton-image" style="width: 80px; height: 80px; display: inline-block; margin-right: 8px;"></div>
                    <div class="skeleton skeleton-image" style="width: 80px; height: 80px; display: inline-block; margin-right: 8px;"></div>
                    <div class="skeleton skeleton-image" style="width: 80px; height: 80px; display: inline-block; margin-right: 8px;"></div>
                </div>
            </div>
        `;
    },
    
    /**
     * Show quick view modal for entity
     * @param {Object} entity - Entity object
     */
    showQuickView: function(entity) {
        // Create modal if it doesn't exist
        let quickViewModal = document.getElementById('quickViewModal');
        if (!quickViewModal) {
            quickViewModal = document.createElement('div');
            quickViewModal.id = 'quickViewModal';
            quickViewModal.className = 'modal';
            quickViewModal.innerHTML = `
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3 id="quickViewTitle">Entity Quick View</h3>
                        <button id="closeQuickViewBtn" class="btn-close">&times;</button>
                    </div>
                    <div class="modal-tabs">
                        <button class="tab-btn active" data-tab="details">Details</button>
                        <button class="tab-btn" data-tab="images">Images</button>
                    </div>
                    <div class="modal-body">
                        <div id="detailsTab" class="tab-content active">
                            <!-- Details content will be inserted here -->
                        </div>
                        <div id="imagesTab" class="tab-content">
                            <!-- Images content will be inserted here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="viewDetailsBtn" class="btn btn-primary">View Full Details</button>
                        <button id="closeQuickViewFooterBtn" class="btn btn-text">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(quickViewModal);
            
            // Add event listeners
            document.getElementById('closeQuickViewBtn').addEventListener('click', () => {
                Utils.hideModal('quickViewModal');
            });
            
            document.getElementById('closeQuickViewFooterBtn').addEventListener('click', () => {
                Utils.hideModal('quickViewModal');
            });
            
            quickViewModal.addEventListener('click', (e) => {
                if (e.target === quickViewModal) {
                    Utils.hideModal('quickViewModal');
                }
            });
            
            // Tab switching
            quickViewModal.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active tab button
                    quickViewModal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Update active tab content
                    const tabId = btn.dataset.tab;
                    quickViewModal.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                    document.getElementById(`${tabId}Tab`).classList.add('active');
                });
            });
        }
        
        // Update modal content
        document.getElementById('quickViewTitle').textContent = entity.attributes.name || 'Entity Quick View';
        
        // Get tab elements
        const detailsTab = document.getElementById('detailsTab');
        const imagesTab = document.getElementById('imagesTab');
        
        // Show skeleton loading UI
        this.showQuickViewSkeletons(detailsTab, imagesTab);
        
        // Show modal immediately with skeleton loading
        Utils.showModal('quickViewModal');
        
        // Use setTimeout to simulate loading and improve perceived performance
        setTimeout(() => {
            // Create summary carousel for details tab
            let summaryCarousel = '';
            if (entity.images && entity.images.length > 0) {
                summaryCarousel = `
                    <div class="quick-view-carousel">
                        <div class="carousel-container">
                            ${entity.images.map((img, index) => `
                                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                    <img src="${img.url}" alt="${img.label || 'Entity image'}" class="quick-view-image">
                                </div>
                            `).join('')}
                        </div>
                        ${entity.images.length > 1 ? `
                            <button class="carousel-nav prev" id="detailsCarouselPrev">&lt;</button>
                            <button class="carousel-nav next" id="detailsCarouselNext">&gt;</button>
                            <div class="carousel-dots">
                                ${entity.images.map((_, index) => `
                                    <span class="carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}" data-carousel="details"></span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            
            // Get all attributes for display
            const attributes = Object.entries(entity.attributes)
                .filter(([key]) => key !== 'name' && key !== 'description')
                .map(([key, value]) => `
                    <div class="quick-view-attribute">
                        <div class="quick-view-attribute-label">${Utils.snakeToTitleCase(key)}</div>
                        <div class="quick-view-attribute-value">${value}</div>
                    </div>
                `).join('');
            
            detailsTab.innerHTML = `
                ${summaryCarousel}
                ${entity.attributes.description ? `
                    <div class="quick-view-description">
                        <h4>Description</h4>
                        <p>${entity.attributes.description}</p>
                    </div>
                ` : ''}
                <div class="quick-view-attributes">
                    <h4>Details</h4>
                    <div class="quick-view-attributes-grid">
                        ${attributes}
                    </div>
                </div>
                <div class="quick-view-meta">
                    <div>Category: ${Utils.capitalize(entity.entity_type || '')}</div>
                    <div>Created: ${Utils.formatDate(entity.created_at)}</div>
                </div>
            `;
            
            // Add event listeners for carousel controls in details tab
            if (entity.images && entity.images.length > 1) {
                const prevBtn = document.getElementById('detailsCarouselPrev');
                const nextBtn = document.getElementById('detailsCarouselNext');
                const dots = document.querySelectorAll('.carousel-dot[data-carousel="details"]');
                
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        this.detailsCarouselNav('prev', entity.images);
                    });
                }
                
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        this.detailsCarouselNav('next', entity.images);
                    });
                }
                
                dots.forEach(dot => {
                    dot.addEventListener('click', () => {
                        this.detailsCarouselNav('goto', entity.images, parseInt(dot.dataset.index));
                    });
                });
            }
            
            // Populate images tab
            if (entity.images && entity.images.length > 0) {
                // Preload images before showing them
                entity.images.forEach(img => {
                    const preloadImg = new Image();
                    preloadImg.src = img.url;
                });
                
                imagesTab.innerHTML = `
                    <div class="image-gallery-viewer">
                        <div class="image-gallery-main">
                            <img id="galleryMainImage" src="${entity.images[0].url}" alt="${entity.images[0].label || 'Entity image'}" class="gallery-main-image">
                            <div class="image-zoom-hint">Click image to view full size</div>
                        </div>
                        <div class="image-gallery-info">
                            <div id="galleryImageLabel">${entity.images[0].label || ''}</div>
                            <div id="galleryImageIndex">Image 1 of ${entity.images.length}</div>
                        </div>
                        <div class="image-gallery-controls">
                            <button id="galleryPrevBtn" class="btn btn-secondary">&lt; Previous</button>
                            <button id="galleryNextBtn" class="btn btn-secondary">Next &gt;</button>
                            <button id="galleryFullScreenBtn" class="btn btn-secondary">Full Screen</button>
                        </div>
                        <div class="image-gallery-thumbnails">
                            ${entity.images.map((img, index) => `
                                <div class="image-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                                    <img src="${img.url}" alt="${img.label || 'Thumbnail'}" class="thumbnail-image">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                imagesTab.innerHTML = '<div class="no-images">No images available</div>';
            }
            
            // Update view details button
            const viewDetailsBtn = document.getElementById('viewDetailsBtn');
            viewDetailsBtn.onclick = () => {
                Utils.hideModal('quickViewModal');
                Entities.showEntityDetails(entity.id);
            };
            
            // Initialize image viewer if images exist
            if (entity.images && entity.images.length > 0) {
                // Initialize image viewer
                ImageViewer.init(entity.images);
            }
        }, 300); // Short delay for better UX
    }
};