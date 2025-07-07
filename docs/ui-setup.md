# UI Setup Guide

This guide covers setting up and deploying the React frontend for the Multi-Tenant CLI system.

## Overview

The UI is a modern React application built with Vite, featuring:
- Neumorphic design inspired by `UI_base_ref.html`
- Real-time updates with configurable polling
- Multi-tenant entity management
- Responsive design for desktop and mobile
- OTP-based email authentication (no passwords)

## Quick Start

### Local Development

1. **Navigate to UI directory**:
   ```bash
   cd ui/
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_TOKEN=your_optional_token
   VITE_POLLING_INTERVAL=5000
   ```

4. **Start development server**:
   ```bash
   npm run dev
   # or use the convenience script
   ./start-ui.sh
   ```

5. **Open browser**: Navigate to `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `http://localhost:3000` |
| `VITE_TOKEN` | Static API token (optional) | No | - |
| `VITE_WS_URL` | WebSocket URL for real-time | No | - |
| `VITE_POLLING_INTERVAL` | Auto-refresh interval (ms) | No | `5000` |

## Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repo to Vercel

2. **Configure Build Settings**:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables** in Vercel dashboard:
   ```
   VITE_API_URL=https://your-api-domain.vercel.app
   VITE_TOKEN=your_production_token
   ```

4. **Deploy**: Push to main branch for automatic deployment

### Manual Deployment

```bash
# Build the project
npm run build

# Upload dist/ folder to your hosting provider
# Ensure your server serves index.html for all routes (SPA)
```

## Project Structure

```
ui/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── AuthContainer.jsx    # Login/Register wrapper
│   │   │   ├── Login.jsx            # Login form
│   │   │   └── Register.jsx         # Registration form
│   │   └── Dashboard/
│   │       ├── Dashboard.jsx        # Main dashboard
│   │       ├── EntityList.jsx       # Entity display grid
│   │       ├── EntityForm.jsx       # Create/edit entity form
│   │       └── TenantSelector.jsx   # Tenant switching
│   ├── hooks/
│   │   └── useRealtime.js          # Real-time polling hooks
│   ├── services/
│   │   └── api.js                  # API integration layer
│   ├── styles/
│   │   └── globals.css             # Neumorphic design system
│   └── App.jsx                     # Main application component
├── public/                         # Static assets
├── .env.example                    # Environment template
├── .env.local                      # Local environment (gitignored)
├── vercel.json                     # Vercel deployment config
├── start-ui.sh                     # Quick start script
└── README.md                       # UI-specific documentation
```

## Features

### Authentication
- Email-based OTP verification (no passwords)
- JWT token management after verification
- Secure logout with cleanup
- Tenant-aware authentication

### Entity Management
- CRUD operations for entities
- Dynamic attribute management
- Image upload support
- Real-time search and filtering

### Multi-tenant Support
- Tenant selection dropdown
- Automatic filtering by tenant
- Tenant-specific entity isolation

### Real-time Updates
- Configurable auto-refresh polling
- Live/pause toggle with visual indicator
- Efficient API calls with debouncing

### Responsive Design
- Mobile-first approach
- Neumorphic design system
- Smooth animations and transitions
- Touch-friendly interface

## API Integration

The UI connects to these backend endpoints:

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and get token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Entities
- `GET /api/entities` - List entities (with tenant header)
- `GET /api/my/entities` - Get user's entities
- `POST /api/entities` - Create entity
- `PATCH /api/entities/:id` - Update entity
- `DELETE /api/entities/:id` - Delete entity
- `GET /api/entities/search?q=X` - Search entities

### Categories
- `GET /api/categories` - List entity categories
- `GET /api/categories/:category/entities` - Get entities by category

### Media
- `POST /api/entities/:id/images` - Upload images to entity
- `GET /api/entities/:id/images` - Get entity images
- `DELETE /api/images/:id` - Delete image

## Styling Guide

The UI uses a custom neumorphic design system:

### Color Palette
- Base: `#e0e5ec`
- Light shadow: `#ffffff`
- Dark shadow: `#c2c8d0`
- Inset light: `#f0f5fa`
- Inset dark: `#c8ccd1`

### Components
- `.neumorphic-container` - Main content areas
- `.neumorphic-button` - Interactive buttons
- `.neumorphic-input` - Form inputs
- `.neumorphic-card` - Content cards

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `VITE_API_URL` in `.env.local`
   - Ensure backend is running
   - Verify CORS settings

2. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Authentication Issues**
   - Check token format and expiration
   - Verify API endpoints are correct
   - Clear localStorage: `localStorage.clear()`

4. **Real-time Updates Not Working**
   - Check polling interval setting
   - Verify API responses
   - Check browser console for errors

### Development Tips

1. **Hot Reload**: Vite provides instant hot module replacement
2. **API Mocking**: Use browser dev tools to mock API responses
3. **State Debugging**: Install React Developer Tools extension
4. **Performance**: Use React Profiler for optimization

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Follow the existing code style
2. Use the neumorphic design system
3. Ensure responsive design
4. Add proper error handling
5. Test on multiple browsers
6. Update documentation as needed