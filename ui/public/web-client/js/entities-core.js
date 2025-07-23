/**
 * Core Entities module for managing entities
 */

const EntitiesCore = {
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
    init: function() {
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
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
    },
    
    /**
     * Load entities with current filters and pagination
     */
    loadEntities: async function() {
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
            if (this.currentFilters.q || Object.keys(this.currentFilters).length > 0) {
                response = await API.entities.search(params);
            } else {
                response = await API.entities.list(params);
            }
            
            // Clear any previous content
            entitiesList.innerHTML = '';
            
            if (response.entities && Array.isArray(response.entities)) {
                this.renderEntities(response.entities, entitiesList);
                
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
    showEntitySkeletons: function(container) {
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
     * Show dashboard
     */
    showDashboard: function() {
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
    loadCategories: async function() {
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
    }
};