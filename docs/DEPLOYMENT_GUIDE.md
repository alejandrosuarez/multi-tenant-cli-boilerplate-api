# Deployment Guide - Comprehensive Frontend Management System

## Overview

This guide covers the deployment process for the comprehensive frontend management system, including environment setup, CI/CD pipeline configuration, and production deployment best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git** (v2.30 or higher)
- **Vercel CLI** (latest version)

### Required Accounts

- **Vercel** account for hosting
- **GitHub** account for CI/CD
- **OneSignal** account for push notifications (optional)
- **Sentry** account for error tracking (optional)

### Installation

```bash
# Install Node.js dependencies
cd ui
npm install

# Install Vercel CLI globally
npm install -g vercel@latest

# Install development tools
npm install -g @lhci/cli@0.12.x
```

## Environment Configuration

### Environment Files

The application supports multiple environment configurations:

- `.env.local` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Required Environment Variables

#### Core Configuration

```bash
# API Configuration
VITE_API_URL=https://your-api-domain.com
VITE_API_TIMEOUT=30000

# Environment
VITE_NODE_ENV=production
VITE_BUILD_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_PWA=true
```

#### Optional Configuration

```bash
# OneSignal Push Notifications
VITE_ONESIGNAL_APP_ID=your_onesignal_app_id
VITE_ONESIGNAL_SAFARI_WEB_ID=your_safari_web_id

# Monitoring
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=production

# Performance
VITE_POLLING_INTERVAL=10000
VITE_CACHE_DURATION=300000
VITE_MAX_UPLOAD_SIZE=10485760
```

### Vercel Configuration

Create a `vercel.json` file in the `ui` directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_ONESIGNAL_APP_ID": "@vite_onesignal_app_id"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Local Development

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Install dependencies
cd ui
npm install

# Copy environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### Development Server

```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- --port 3000

# Start with host binding
npm run dev -- --host 0.0.0.0
```

### Testing

```bash
# Run all tests
npm run test:all

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:accessibility
```

## Staging Deployment

### Manual Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy with options
./scripts/deploy.sh staging --skip-tests
```

### Automatic Deployment

Staging deployments are triggered automatically when:
- Code is pushed to the `develop` branch
- Pull requests are created against `main` or `develop`

### Staging Environment Features

- **Test Data**: Pre-populated with sample data
- **Debug Mode**: Enhanced logging and error reporting
- **Feature Flags**: All features enabled for testing
- **Performance Monitoring**: Detailed metrics collection

## Production Deployment

### Prerequisites

1. **Environment Variables**: Set in Vercel dashboard
2. **Domain Configuration**: Custom domain configured
3. **SSL Certificate**: Automatically managed by Vercel
4. **CDN Setup**: Configured for static assets

### Manual Deployment

```bash
# Deploy to production
npm run deploy:production

# Dry run (preview changes)
npm run deploy:dry-run
```

### Automatic Deployment

Production deployments are triggered when:
- Code is pushed to the `main` branch
- All tests pass successfully
- Manual approval is provided (if configured)

### Production Checklist

- [ ] Environment variables configured
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] CDN configured
- [ ] Monitoring setup
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Backup strategy in place

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes the following stages:

1. **Code Quality Check**
   - ESLint validation
   - Unit tests
   - Integration tests
   - Coverage reporting

2. **Accessibility Testing**
   - Automated accessibility checks
   - WCAG compliance validation

3. **End-to-End Testing**
   - Full user workflow testing
   - Cross-browser compatibility

4. **Performance Testing**
   - Lighthouse CI
   - Bundle size analysis
   - Core Web Vitals

5. **Deployment**
   - Staging deployment (develop branch)
   - Production deployment (main branch)

### Required Secrets

Configure the following secrets in GitHub:

```bash
# Vercel Configuration
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Environment Variables
VITE_API_URL_STAGING=https://staging-api.example.com
VITE_API_URL_PRODUCTION=https://api.example.com
VITE_ONESIGNAL_APP_ID=your_onesignal_app_id

# Optional
LHCI_GITHUB_APP_TOKEN=your_lighthouse_token
CODECOV_TOKEN=your_codecov_token
```

### Workflow Configuration

The workflow is defined in `.github/workflows/deploy.yml` and includes:

- **Parallel Testing**: Multiple test suites run simultaneously
- **Environment Promotion**: Automatic staging → production flow
- **Rollback Support**: Quick rollback on deployment failure
- **Notification Integration**: Slack/email notifications

## Monitoring and Maintenance

### Performance Monitoring

- **Lighthouse CI**: Automated performance testing
- **Core Web Vitals**: Real user monitoring
- **Bundle Analysis**: Regular bundle size monitoring
- **Error Tracking**: Sentry integration

### Health Checks

```bash
# Check application health
curl https://your-domain.com/health

# Check API connectivity
curl https://your-domain.com/api/health

# Monitor performance
npm run lighthouse
```

### Maintenance Tasks

#### Weekly Tasks

- Review performance metrics
- Check error logs
- Update dependencies
- Run security audits

#### Monthly Tasks

- Performance optimization review
- Accessibility audit
- Security vulnerability scan
- Backup verification

### Monitoring Dashboard

Set up monitoring for:

- **Uptime**: 99.9% availability target
- **Response Time**: < 2s average
- **Error Rate**: < 1% target
- **Core Web Vitals**: All metrics in "Good" range

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

#### Environment Variable Issues

```bash
# Check environment variables
npm run build -- --debug

# Verify Vercel environment
vercel env ls
```

#### Performance Issues

```bash
# Analyze bundle size
npm run analyze

# Run performance tests
npm run lighthouse
```

#### Deployment Failures

```bash
# Check Vercel logs
vercel logs

# Rollback to previous version
vercel rollback
```

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Set debug environment variable
export VITE_DEBUG=true

# Run with verbose logging
npm run build -- --verbose
```

### Support Resources

- **Documentation**: `/docs` directory
- **API Reference**: `/docs/api-reference.md`
- **Troubleshooting**: `/docs/troubleshooting.md`
- **Community**: GitHub Discussions
- **Support**: Create GitHub issue

## Security Considerations

### Content Security Policy

```javascript
// Implemented in vercel.json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
}
```

### Environment Security

- **Secrets Management**: Use Vercel environment variables
- **API Keys**: Never commit to repository
- **HTTPS Only**: Enforce HTTPS in production
- **CORS Configuration**: Restrict allowed origins

### Regular Security Tasks

- Update dependencies monthly
- Run security audits weekly
- Review access logs regularly
- Monitor for vulnerabilities

## Performance Optimization

### Build Optimization

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Remove unused code
- **Minification**: Compress JavaScript and CSS
- **Asset Optimization**: Optimize images and fonts

### Runtime Optimization

- **Lazy Loading**: Components and images
- **Caching Strategy**: Service worker implementation
- **CDN Usage**: Static asset delivery
- **Bundle Analysis**: Regular size monitoring

### Monitoring

- **Lighthouse CI**: Automated performance testing
- **Real User Monitoring**: Core Web Vitals tracking
- **Performance Budgets**: Automated alerts
- **Regular Audits**: Monthly performance reviews

---

For additional help, refer to the [API Documentation](./api-reference.md) or create an issue in the GitHub repository.