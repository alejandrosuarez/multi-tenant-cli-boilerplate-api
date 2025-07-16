# Comprehensive Frontend Management System

A complete administrative interface for the multi-tenant entity management platform, providing advanced management capabilities for entities, attributes, notifications, analytics, and system administration.

## 🚀 Features

### Core Management
- **Entity Management**: Advanced CRUD operations with bulk actions, filtering, and search
- **Attribute Management**: Dynamic schema editing and request/response tracking
- **Media Management**: Comprehensive file upload, organization, and optimization
- **Notification Center**: Real-time notifications with device management
- **Analytics Dashboard**: Interactive charts and comprehensive reporting
- **Search & Discovery**: Global search with advanced filtering and data exploration

### Advanced Features
- **Multi-Tenant Support**: Complete tenant isolation and management
- **Real-Time Updates**: WebSocket-based live data synchronization
- **Progressive Web App**: Offline support and native app experience
- **Mobile Responsive**: Optimized for all device sizes
- **Role-Based Access**: Granular permissions and security controls
- **API Integration**: Built-in API testing and monitoring tools

### Technical Features
- **Performance Optimized**: Code splitting, lazy loading, and caching
- **Accessibility Compliant**: WCAG 2.1 AA standards
- **Error Handling**: Comprehensive error boundaries and recovery
- **Testing Suite**: Unit, integration, and E2E tests
- **CI/CD Pipeline**: Automated testing and deployment

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- **Modern Browser** (Chrome 90+, Firefox 88+, Safari 14+)

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>/ui

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Configure environment variables
nano .env.local
```

## ⚙️ Configuration

### Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_PWA=true

# OneSignal (Optional)
VITE_ONESIGNAL_APP_ID=your_app_id

# Performance
VITE_POLLING_INTERVAL=5000
VITE_CACHE_DURATION=300000
```

### Build Configurations

- **Development**: `.env.local`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

## 🚀 Development

```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- --port 3000

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Accessibility tests
npm run test:accessibility

# Performance tests
npm run lighthouse
```

## 📦 Deployment

### Quick Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Dry run (preview changes)
npm run deploy:dry-run
```

### Manual Deployment

```bash
# Build application
npm run build:production

# Deploy with Vercel CLI
vercel --prod

# Verify deployment
./scripts/verify-deployment.sh https://your-domain.com
```

### CI/CD Pipeline

The application includes a complete GitHub Actions workflow:

1. **Code Quality**: ESLint, unit tests, integration tests
2. **Accessibility**: Automated accessibility testing
3. **Performance**: Lighthouse CI with performance budgets
4. **Security**: Dependency scanning and security headers
5. **Deployment**: Automatic staging and production deployment

## 🏗️ Architecture

### Component Structure

```
src/
├── components/
│   ├── Admin/           # System administration
│   ├── Analytics/       # Analytics and reporting
│   ├── Attributes/      # Attribute management
│   ├── Dashboard/       # Main dashboard and entity management
│   ├── Layout/          # Navigation and layout components
│   ├── Media/           # Media management
│   ├── Notifications/   # Notification center
│   ├── Search/          # Search and discovery
│   ├── Tenants/         # Multi-tenant management
│   └── UI/              # Reusable UI components
├── contexts/            # React contexts for state management
├── hooks/               # Custom React hooks
├── services/            # API services and utilities
├── utils/               # Helper functions and utilities
└── styles/              # Global styles and themes
```

### State Management

- **React Context**: Global state management
- **Custom Hooks**: Reusable stateful logic
- **Local State**: Component-specific state
- **Caching**: Intelligent API response caching

### Performance Optimizations

- **Code Splitting**: Route-based and component-based
- **Lazy Loading**: Components and images
- **Virtual Scrolling**: Large data sets
- **Service Worker**: Caching and offline support
- **Bundle Analysis**: Regular size monitoring

## 🔐 Security

### Authentication & Authorization
- JWT token management with refresh
- Role-based access control (RBAC)
- Permission-based UI rendering
- Secure token storage

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### Data Protection
- Input validation and sanitization
- XSS and CSRF protection
- Secure API communication
- Data encryption for sensitive information

## 📱 Mobile Support

### Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Optimized navigation
- Adaptive layouts

### Progressive Web App
- Offline functionality
- Push notifications
- App-like experience
- Install prompts

## 🎯 User Roles

### Entity Owner
- Create and manage own entities
- Respond to attribute requests
- View basic analytics
- Manage media files

### Tenant Administrator
- Manage all tenant entities
- User management within tenant
- Advanced analytics and reporting
- Bulk operations

### System Administrator
- Full system access
- Multi-tenant management
- System health monitoring
- API testing and debugging

## 📊 Analytics & Monitoring

### Built-in Analytics
- Entity creation and modification tracking
- User activity monitoring
- Performance metrics
- Error tracking and reporting

### External Integrations
- Google Analytics (optional)
- Sentry error tracking (optional)
- Custom analytics endpoints

## 🔧 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

#### Performance Issues
```bash
# Analyze bundle size
npm run analyze

# Run performance tests
npm run lighthouse
```

#### API Connection Issues
```bash
# Check API status
curl https://your-api-url.com/health

# Verify environment variables
echo $VITE_API_URL
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment
export VITE_DEBUG=true

# Run with verbose output
npm run dev -- --debug
```

## 📚 Documentation

- **[Deployment Guide](../docs/DEPLOYMENT_GUIDE.md)**: Complete deployment instructions
- **[User Guide](../docs/USER_GUIDE.md)**: End-user documentation
- **[API Reference](../docs/api-reference.md)**: API documentation
- **[Contributing](../CONTRIBUTING.md)**: Development guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow semantic versioning
- Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE.md) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Email**: Contact your system administrator

## 🎉 Acknowledgments

- React team for the excellent framework
- Vite team for the fast build tool
- All contributors and testers
- Open source community

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintainer**: Development Team