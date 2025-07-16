#!/bin/bash

# Deployment Verification Script
# =============================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_URL=${1:-"http://localhost:4173"}
TIMEOUT=30

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Health check function
check_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    log_info "Checking $description..."
    
    if curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" | grep -q "$expected_status"; then
        log_success "$description is accessible"
        return 0
    else
        log_error "$description is not accessible"
        return 1
    fi
}

# Check if URL is accessible
check_basic_connectivity() {
    log_info "Checking basic connectivity to $DEPLOYMENT_URL"
    
    if curl -s --max-time $TIMEOUT "$DEPLOYMENT_URL" > /dev/null; then
        log_success "Basic connectivity established"
        return 0
    else
        log_error "Cannot connect to $DEPLOYMENT_URL"
        return 1
    fi
}

# Check critical pages
check_critical_pages() {
    log_info "Checking critical pages..."
    
    local pages=(
        "$DEPLOYMENT_URL/"
        "$DEPLOYMENT_URL/auth"
        "$DEPLOYMENT_URL/dashboard"
    )
    
    local failed=0
    
    for page in "${pages[@]}"; do
        if ! check_endpoint "$page" "$(basename "$page")"; then
            ((failed++))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        log_success "All critical pages are accessible"
        return 0
    else
        log_error "$failed critical pages failed"
        return 1
    fi
}

# Check static assets
check_static_assets() {
    log_info "Checking static assets..."
    
    # Get the main page and extract asset URLs
    local main_page=$(curl -s "$DEPLOYMENT_URL/")
    
    # Check for CSS files
    if echo "$main_page" | grep -q "\.css"; then
        log_success "CSS assets found"
    else
        log_warning "No CSS assets found"
    fi
    
    # Check for JS files
    if echo "$main_page" | grep -q "\.js"; then
        log_success "JavaScript assets found"
    else
        log_warning "No JavaScript assets found"
    fi
    
    # Check for manifest
    if echo "$main_page" | grep -q "manifest.json"; then
        log_success "PWA manifest found"
    else
        log_warning "PWA manifest not found"
    fi
}

# Check PWA features
check_pwa_features() {
    log_info "Checking PWA features..."
    
    # Check service worker
    if check_endpoint "$DEPLOYMENT_URL/sw.js" "Service Worker"; then
        log_success "Service Worker is available"
    else
        log_warning "Service Worker not found"
    fi
    
    # Check manifest
    if check_endpoint "$DEPLOYMENT_URL/manifest.json" "PWA Manifest"; then
        log_success "PWA Manifest is available"
    else
        log_warning "PWA Manifest not found"
    fi
}

# Check security headers
check_security_headers() {
    log_info "Checking security headers..."
    
    local headers=$(curl -s -I "$DEPLOYMENT_URL/")
    
    # Check for security headers
    if echo "$headers" | grep -qi "x-content-type-options"; then
        log_success "X-Content-Type-Options header present"
    else
        log_warning "X-Content-Type-Options header missing"
    fi
    
    if echo "$headers" | grep -qi "x-frame-options"; then
        log_success "X-Frame-Options header present"
    else
        log_warning "X-Frame-Options header missing"
    fi
    
    if echo "$headers" | grep -qi "x-xss-protection"; then
        log_success "X-XSS-Protection header present"
    else
        log_warning "X-XSS-Protection header missing"
    fi
}

# Check performance
check_performance() {
    log_info "Checking basic performance metrics..."
    
    local start_time=$(date +%s%N)
    curl -s "$DEPLOYMENT_URL/" > /dev/null
    local end_time=$(date +%s%N)
    
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 2000 ]; then
        log_success "Page load time: ${duration}ms (Good)"
    elif [ $duration -lt 5000 ]; then
        log_warning "Page load time: ${duration}ms (Acceptable)"
    else
        log_error "Page load time: ${duration}ms (Slow)"
    fi
}

# Check responsive design
check_responsive_design() {
    log_info "Checking responsive design..."
    
    local main_page=$(curl -s "$DEPLOYMENT_URL/")
    
    # Check for viewport meta tag
    if echo "$main_page" | grep -q "viewport"; then
        log_success "Viewport meta tag found"
    else
        log_warning "Viewport meta tag missing"
    fi
    
    # Check for responsive CSS
    if echo "$main_page" | grep -q "@media\|responsive"; then
        log_success "Responsive CSS detected"
    else
        log_warning "Responsive CSS not detected"
    fi
}

# Main verification function
main() {
    log_info "Starting deployment verification for: $DEPLOYMENT_URL"
    log_info "Timeout: ${TIMEOUT}s"
    echo ""
    
    local failed_checks=0
    
    # Run all checks
    check_basic_connectivity || ((failed_checks++))
    echo ""
    
    check_critical_pages || ((failed_checks++))
    echo ""
    
    check_static_assets
    echo ""
    
    check_pwa_features
    echo ""
    
    check_security_headers
    echo ""
    
    check_performance
    echo ""
    
    check_responsive_design
    echo ""
    
    # Summary
    if [ $failed_checks -eq 0 ]; then
        log_success "✅ Deployment verification completed successfully!"
        log_success "🚀 Application is ready for production use"
        exit 0
    else
        log_error "❌ Deployment verification failed with $failed_checks critical issues"
        log_error "🔧 Please review and fix the issues before proceeding"
        exit 1
    fi
}

# Show usage if help requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [URL]"
    echo ""
    echo "Verify deployment health and functionality"
    echo ""
    echo "Arguments:"
    echo "  URL    The URL to verify (default: http://localhost:4173)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Verify local preview"
    echo "  $0 https://your-app.vercel.app       # Verify production deployment"
    exit 0
fi

# Run main verification
main