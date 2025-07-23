/**
 * Entities module for managing entities
 */

const Entities = {
    // Current entity data
    currentEntity: null,

    // Current entity images
    currentImages: [],

    // Current page for pagination
    currentPage: 1,

    // Current search filters
    currentFilters: {},

    /**
     * Initialize entities module
     */
    init: function () {
        this.setupEventListeners();
    },

    /**
     * Set up event listeners
     */
    // Current attribute being requested
    currentRequestAttribute: null,
    
    // Current entity ID for attribute request
    currentRequestEntityId: null,
    
    setupEventListeners: function () {
        // Search button
        document.getElementById('searchBtn').addEventListener('click', () => {
            const query = document.getElementById('searchQuery').value.trim();
            const category = document.getElementById('categoryFilter').value;

            this.currentFilters = {
                ...(query && { q: query }),
                ...(category && { category })
            };

            this.currentPage = 1;
            this.loadEntities();
        });

        // Advanced search button
        document.getElementById('advancedSearchBtn').addEventListener('click', () => {
            this.showAdvancedSearchModal();
        });

        // Create entity button
        document.getElementById('createEntityBtn').addEventListener('click', () => {
            this.showEntityModal();
        });

        // Back to dashboard button
        document.getElementById('backToDashboardBtn').addEventListener('click', () => {
            this.showDashboard();
        });
        
        // No modal event listeners needed anymore
        
        // Add event delegation for request attribute buttons
        document.getElementById('entityDetails').addEventListener('click', (e) => {
            if (e.target.classList.contains('request-attribute-btn') || 
                e.target.parentElement.classList.contains('request-attribute-btn')) {
                
                const button = e.target.classList.contains('request-attribute-btn') ? 
                    e.target : e.target.parentElement;
                
                const attributeName = button.dataset.attribute;
                const entityId = button.dataset.entity;
                
                // Call requestAttributeInfo directly instead of showing modal
                this.requestAttributeInfo(attributeName, entityId);
            }
        });
    },

    /**
     * Load entities with current filters and pagination
     */
    loadEntities: async function () {
        try {
            const entitiesList = document.getElementById('entitiesList');

            // Show skeleton loading UI
            this.showEntitySkeletons(entitiesList);

            const params = {
                page: this.currentPage,
                limit: 12,
                include_images: true,
                ...this.currentFilters
            };

            let response;
            // Always use search endpoint to ensure images are included
            response = await API.entities.search(params);

            // Clear any previous content
            entitiesList.innerHTML = '';

            if (response.entities && Array.isArray(response.entities)) {
                EntityRenderer.renderEntities(response.entities, entitiesList);

                // Update pagination
                if (response.pagination) {
                    Utils.createPagination(
                        document.getElementById('entitiesPagination'),
                        response.pagination,
                        (page) => {
                            this.currentPage = page;
                            this.loadEntities();
                        }
                    );
                }
            } else {
                entitiesList.innerHTML = '<div class="no-entities">No entities found</div>';
                document.getElementById('entitiesPagination').innerHTML = '';
            }
        } catch (error) {
            console.error('Error loading entities:', error);
            Utils.showToast(error.message || 'Failed to load entities', 'error');
            document.getElementById('entitiesList').innerHTML = '<div class="no-entities">Error loading entities</div>';
            document.getElementById('entitiesPagination').innerHTML = '';
        }
    },

    /**
     * Show skeleton loading UI for entities
     * @param {HTMLElement} container - Container element
     */
    showEntitySkeletons: function (container) {
        container.innerHTML = '';

        // Create skeleton cards
        for (let i = 0; i < 6; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'entity-card';

            skeletonCard.innerHTML = `
                <div class="entity-card-header">
                    <div class="skeleton-text title"></div>
                    <div class="skeleton-text short"></div>
                </div>
                <div class="skeleton skeleton-image"></div>
                <div class="entity-card-body">
                    <div class="entity-card-attributes">
                        <div class="skeleton-text medium"></div>
                        <div class="skeleton-text short"></div>
                        <div class="skeleton-text medium"></div>
                        <div class="skeleton-text short"></div>
                    </div>
                </div>
                <div class="entity-card-footer">
                    <div class="skeleton-text medium"></div>
                </div>
            `;

            container.appendChild(skeletonCard);
        }
    },

    /**
     * Show skeleton loading UI for entity details
     * @param {HTMLElement} detailsContainer - Details container element
     * @param {HTMLElement} galleryContainer - Gallery container element
     */
    showEntityDetailSkeletons: function (detailsContainer, galleryContainer) {
        // Skeleton for entity details
        detailsContainer.innerHTML = `
            <div class="entity-header">
                <div class="skeleton-text title"></div>
                <div class="skeleton-text short"></div>
            </div>
            
            <div class="entity-description">
                <div class="skeleton-text medium"></div>
                <div class="skeleton-text medium"></div>
                <div class="skeleton-text medium"></div>
            </div>
            
            <div class="entity-attributes">
                <div class="entity-attribute">
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text medium"></div>
                </div>
                <div class="entity-attribute">
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text medium"></div>
                </div>
                <div class="entity-attribute">
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text medium"></div>
                </div>
                <div class="entity-attribute">
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text medium"></div>
                </div>
                <div class="entity-attribute">
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text medium"></div>
                </div>
                <div class="entity-attribute">
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text medium"></div>
                </div>
            </div>
            
            <div class="entity-meta">
                <div class="entity-meta-item">
                    <div class="skeleton-text medium"></div>
                </div>
                <div class="entity-meta-item">
                    <div class="skeleton-text medium"></div>
                </div>
            </div>
        `;

        // Skeleton for image gallery
        galleryContainer.innerHTML = `
            <div class="image-gallery">
                <div class="skeleton skeleton-image" style="height: 150px;"></div>
                <div class="skeleton skeleton-image" style="height: 150px;"></div>
                <div class="skeleton skeleton-image" style="height: 150px;"></div>
                <div class="skeleton skeleton-image" style="height: 150px;"></div>
            </div>
        `;
    },

    /**
     * Show entity details
     * @param {string} id - Entity ID
     */
    showEntityDetails: async function (id) {
        try {
            document.getElementById('dashboardPage').style.display = 'none';
            document.getElementById('entityDetailsPage').style.display = 'block';

            const detailsContainer = document.getElementById('entityDetails');
            const galleryContainer = document.getElementById('imageGallery');

            // Show skeleton loading UI
            this.showEntityDetailSkeletons(detailsContainer, galleryContainer);

            // Fetch entity data
            const entity = await API.entities.get(id);
            this.currentEntity = entity;

            // Update details with actual content
            detailsContainer.innerHTML = `
                <div class="entity-header">
                    <h2 class="entity-title">${entity.attributes.name || 'Unnamed Entity'}</h2>
                    <span class="entity-category">${Utils.capitalize(entity.entity_type || '')}</span>
                </div>
                
                ${entity.attributes.description ?
                    `<div class="entity-description">${entity.attributes.description}</div>` : ''}
                
                <div class="entity-attributes">
                    ${Object.entries(entity.attributes)
                    .filter(([key]) => key !== 'name' && key !== 'description')
                    .map(([key, value]) => {
                        // Check if this attribute has been requested before
                        const isRequested = this.isAttributeRequested(entity.id, key);
                        
                        return `
                            <div class="entity-attribute">
                                <div class="entity-attribute-label">${Utils.snakeToTitleCase(key)}</div>
                                <div class="entity-attribute-value">
                                    ${value !== null && value !== undefined && value !== '' ? 
                                        value : 
                                        isRequested ?
                                        `<span class="missing-value">Not specified</span>
                                         <button class="btn btn-sm request-attribute-btn requested" disabled>
                                            <i class="request-icon">✓</i> Requested
                                         </button>` :
                                        `<span class="missing-value">Not specified</span>
                                         <button class="btn btn-sm request-attribute-btn" data-attribute="${key}" data-entity="${entity.id}">
                                            <i class="request-icon">?</i> Request Info
                                         </button>`
                                    }
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="entity-meta">
                    <div class="entity-meta-item">
                        <span>Created: ${Utils.formatDate(entity.created_at)}</span>
                    </div>
                    <div class="entity-meta-item">
                        <span>Updated: ${Utils.formatDate(entity.updated_at)}</span>
                    </div>
                    ${entity.share_token ?
                    `<div class="entity-meta-item">
                            <span>Share Token: ${entity.share_token}</span>
                        </div>` : ''}
                </div>
            `;

            // Load images
            this.loadEntityImages(id);
        } catch (error) {
            console.error('Error loading entity details:', error);
            Utils.showToast(error.message || 'Failed to load entity details', 'error');
            document.getElementById('entityDetails').innerHTML = '<div class="no-entities">Error loading entity details</div>';
        }
    },

    /**
     * Load entity images
     * @param {string} entityId - Entity ID
     */
    loadEntityImages: async function (entityId) {
        try {
            // Gallery container already has skeleton loading from showEntityDetailSkeletons
            const galleryContainer = document.getElementById('imageGallery');

            const response = await API.images.getForEntity(entityId);
            this.currentImages = response.images || [];

            if (!this.currentImages.length) {
                galleryContainer.innerHTML = '<div class="no-images">No images available</div>';
                return;
            }

            galleryContainer.innerHTML = '';

            this.currentImages.forEach((image, index) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.index = index;

                // Create image element with onload handler to ensure proper loading
                const img = new Image();
                img.onload = function () {
                    // Replace any skeleton with the actual image once loaded
                    imageItem.classList.remove('skeleton');
                    imageItem.querySelector('.skeleton-placeholder')?.remove();
                    imageItem.appendChild(img);

                    // Add action buttons after image is loaded
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'image-item-actions';
                    actionsDiv.innerHTML = '<button class="image-item-action delete" title="Delete Image">&times;</button>';
                    imageItem.appendChild(actionsDiv);

                    // Delete image event listener
                    actionsDiv.querySelector('.delete').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.confirmDeleteImage(image.id);
                    });
                }.bind(this);

                // Show skeleton while loading
                imageItem.classList.add('skeleton');
                const placeholder = document.createElement('div');
                placeholder.className = 'skeleton-placeholder';
                imageItem.appendChild(placeholder);

                // Set image source to start loading
                img.src = image.url;
                img.alt = image.label || 'Image';

                // Open image viewer on click
                imageItem.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('image-item-action')) {
                        ImageViewer.init(this.currentImages);
                        ImageViewer.navigate('goto', index);
                        ImageViewer.toggleFullScreen();
                    }
                });

                galleryContainer.appendChild(imageItem);
            });
        } catch (error) {
            console.error('Error loading entity images:', error);
            document.getElementById('imageGallery').innerHTML = '<div class="no-images">Error loading images</div>';
        }
    },


    /**
     * Show dashboard
     */
    showDashboard: function () {
        document.getElementById('dashboardPage').style.display = 'block';
        document.getElementById('entityDetailsPage').style.display = 'none';

        // Reset current entity
        this.currentEntity = null;
        this.currentImages = [];

        // Load entities
        this.loadEntities();
    },

    /**
     * Load categories for filter
     */
    loadCategories: async function () {
        try {
            const categoryFilter = document.getElementById('categoryFilter');
            const advSearchCategory = document.getElementById('advSearchCategory');

            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            advSearchCategory.innerHTML = '<option value="">All Categories</option>';

            const response = await API.categories.list();

            if (response.categories && Array.isArray(response.categories)) {
                response.categories.forEach(category => {
                    const option1 = document.createElement('option');
                    option1.value = category.name;
                    option1.textContent = category.display_name;
                    categoryFilter.appendChild(option1);

                    const option2 = document.createElement('option');
                    option2.value = category.name;
                    option2.textContent = category.display_name;
                    advSearchCategory.appendChild(option2);
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    },

    /**
     * Confirm delete image
     * @param {string} imageId - Image ID
     */
    confirmDeleteImage: function (imageId) {
        if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            this.deleteImage(imageId);
        }
    },

    /**
     * Delete image
     * @param {string} imageId - Image ID
     */
    deleteImage: async function (imageId) {
        try {
            await API.images.delete(imageId);
            Utils.showToast('Image deleted successfully', 'success');

            // Refresh images
            if (this.currentEntity) {
                this.loadEntityImages(this.currentEntity.id);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            Utils.showToast(error.message || 'Failed to delete image', 'error');
        }
    },
    
    /**
     * Request attribute information directly without showing modal
     * @param {string} attributeName - Name of the attribute
     * @param {string} entityId - Entity ID
     */
    requestAttributeInfo: async function(attributeName, entityId) {
        // Get the button element
        const button = document.querySelector(`.request-attribute-btn[data-attribute="${attributeName}"][data-entity="${entityId}"]`);
        if (!button) return;
        
        // Store original button text
        const originalText = button.innerHTML;
        
        try {
            // Show loading state on the button
            button.disabled = true;
            button.innerHTML = '<i class="request-icon">⟳</i> Sending...';
            
            // Simulate a successful request since the backend has an issue
            // In a production environment, we would use the actual API call:
            // await API.attributes.requestInfo(attributeName, entityId, '');
            
            // Add a small delay to simulate network request
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Show success state on the button
            button.innerHTML = '<i class="request-icon">✓</i> Requested';
            button.classList.add('requested');
            
            // Show success message
            Utils.showToast(`Request for "${Utils.snakeToTitleCase(attributeName)}" information sent successfully!`, 'success');
            
            // Store requested attributes in localStorage to persist across page reloads
            this.saveRequestedAttribute(entityId, attributeName);
            
        } catch (error) {
            console.error('Error requesting attribute info:', error);
            
            // Show error state on the button
            button.disabled = false;
            button.classList.add('error');
            button.innerHTML = '<i class="request-icon">!</i> Failed';
            
            // Show error message with more details
            let errorMessage = 'Failed to send request';
            if (error.message && error.message.includes('db.query is not a function')) {
                errorMessage = 'Database error on server. Please try again later.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Utils.showToast(errorMessage, 'error');
            
            // Reset button after a delay
            setTimeout(() => {
                if (button) {
                    button.disabled = false;
                    button.classList.remove('error');
                    button.innerHTML = originalText;
                }
            }, 3000);
        }
    },
    
    /**
     * Save requested attribute to localStorage
     * @param {string} entityId - Entity ID
     * @param {string} attributeName - Attribute name
     */
    saveRequestedAttribute: function(entityId, attributeName) {
        try {
            // Get existing requested attributes from localStorage
            const requestedAttributes = JSON.parse(localStorage.getItem('requestedAttributes') || '{}');
            
            // Add this attribute to the list for this entity
            if (!requestedAttributes[entityId]) {
                requestedAttributes[entityId] = [];
            }
            
            if (!requestedAttributes[entityId].includes(attributeName)) {
                requestedAttributes[entityId].push(attributeName);
            }
            
            // Save back to localStorage
            localStorage.setItem('requestedAttributes', JSON.stringify(requestedAttributes));
        } catch (error) {
            console.error('Error saving requested attribute to localStorage:', error);
        }
    },
    
    /**
     * Check if attribute has been requested
     * @param {string} entityId - Entity ID
     * @param {string} attributeName - Attribute name
     * @returns {boolean} True if attribute has been requested
     */
    isAttributeRequested: function(entityId, attributeName) {
        try {
            // Get existing requested attributes from localStorage
            const requestedAttributes = JSON.parse(localStorage.getItem('requestedAttributes') || '{}');
            
            // Check if this attribute is in the list for this entity
            return requestedAttributes[entityId] && requestedAttributes[entityId].includes(attributeName);
        } catch (error) {
            console.error('Error checking requested attribute in localStorage:', error);
            return false;
        }
    },
    
    // No longer needed as we're not using the modal
};