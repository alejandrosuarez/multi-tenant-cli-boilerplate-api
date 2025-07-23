/**
 * Main application entry point
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize API with production endpoint
    const apiBaseUrl = 'https://multi-tenant-cli-boilerplate-api.vercel.app';
    API.init(apiBaseUrl);
    
    // Initialize modules
    UI.init();
    Auth.init();
    Entities.init();
    
    console.log('Application initialized with production API endpoint');
});