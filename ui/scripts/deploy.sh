#!/bin/bash

# Deployment Script for Comprehensive Frontend Management System
# =============================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENTS=("staging" "production")
DEFAULT_ENV="staging"

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

show_usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  staging     Deploy to staging environment"
    echo "  production  Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --skip-tests    Skip running tests before deployment"
    echo "  --skip-build    Skip building the application"
    echo "  --dry-run       Show what would be deployed without actually deploying"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --skip-tests"
    echo "  $0 staging --dry-run"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    log_success "Dependencies check completed"
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping tests as requested"
        return
    fi
    
    log_info "Running tests..."
    
    # Run unit tests
    npm run test:unit -- --run
    
    # Run integration tests
    npm run test:integration -- --run
    
    # Run accessibility tests
    npm run test:accessibility
    
    log_success "All tests passed"
}

run_linting() {
    log_info "Running linting and code quality checks..."
    
    # ESLint
    npm run lint
    
    # Type checking (if using TypeScript)
    if [ -f "tsconfig.json" ]; then
        npm run type-check
    fi
    
    log_success "Code quality checks passed"
}

build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "Skipping build as requested"
        return
    fi
    
    log_info "Building application for $ENVIRONMENT environment..."
    
    # Set environment variables
    export NODE_ENV=$ENVIRONMENT
    
    # Copy environment file
    if [ -f ".env.$ENVIRONMENT" ]; then
        cp ".env.$ENVIRONMENT" ".env.local"
        log_info "Using .env.$ENVIRONMENT configuration"
    else
        log_warning "No .env.$ENVIRONMENT file found, using default configuration"
    fi
    
    # Build the application
    npm run build
    
    # Verify build output
    if [ ! -d "dist" ]; then
        log_error "Build failed - dist directory not found"
        exit 1
    fi
    
    log_success "Application built successfully"
}

deploy_to_vercel() {
    log_info "Deploying to Vercel ($ENVIRONMENT)..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would deploy to $ENVIRONMENT environment"
        vercel --prod=$([[ "$ENVIRONMENT" == "production" ]] && echo "true" || echo "false") --dry-run
        return
    fi
    
    # Deploy based on environment
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod
    else
        vercel
    fi
    
    log_success "Deployment completed successfully"
}

run_post_deploy_tests() {
    log_info "Running post-deployment tests..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Run smoke tests against deployed application
    if [ -f "cypress.config.js" ]; then
        npm run test:e2e:headless
    fi
    
    log_success "Post-deployment tests completed"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove temporary environment file
    if [ -f ".env.local" ]; then
        rm ".env.local"
    fi
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Skip Tests: $SKIP_TESTS"
    log_info "Skip Build: $SKIP_BUILD"
    log_info "Dry Run: $DRY_RUN"
    
    check_dependencies
    run_linting
    run_tests
    build_application
    deploy_to_vercel
    run_post_deploy_tests
    cleanup
    
    log_success "Deployment process completed successfully!"
    log_info "Your application is now live!"
}

# Parse command line arguments
ENVIRONMENT="$DEFAULT_ENV"
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! " ${ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_error "Valid environments: ${ENVIRONMENTS[*]}"
    exit 1
fi

# Run main deployment process
main