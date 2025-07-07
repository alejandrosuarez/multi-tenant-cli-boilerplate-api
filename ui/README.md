# Multi-Tenant CLI UI

A modern React frontend for the Multi-Tenant CLI API, featuring a beautiful neumorphic design and real-time updates.

## Features

- 🎨 **Neumorphic Design** - Beautiful soft UI inspired by the reference design
- 🔄 **Real-time Updates** - Auto-refresh entities with configurable polling
- 🏢 **Multi-tenant Support** - Switch between tenants seamlessly
- 🔍 **Search & Filter** - Find entities quickly
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔐 **OTP Authentication** - Secure email-based verification with JWT tokens
- 📸 **Image Upload** - Support for entity images
- ⚡ **Fast Development** - Built with Vite for instant HMR

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_TOKEN=your_optional_static_token

# Optional: WebSocket URL for realtime updates
VITE_WS_URL=ws://localhost:3000/ws

# Development settings
VITE_POLLING_INTERVAL=5000
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_API_URL`: Your production API URL
   - `VITE_TOKEN`: Optional static token for API access

3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy the dist/ folder to your hosting provider
```

## Project Structure

```
ui/
├── src/
│   ├── components/
│   │   ├── Auth/           # Login/Register components
│   │   └── Dashboard/      # Main app components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── styles/             # Global styles
│   └── App.jsx             # Main app component
├── public/                 # Static assets
├── .env.example           # Environment variables template
└── vercel.json            # Vercel deployment config
```

## API Integration

The UI connects to the Multi-Tenant CLI API with the following endpoints:

- **Authentication**: `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/me`
- **Entities**: `/api/entities` (CRUD operations), `/api/my/entities`
- **Categories**: `/api/categories` (entity categorization)
- **Media**: `/api/entities/:id/images` (image uploads)

## Real-time Features

- **Auto-refresh**: Configurable polling for live data updates
- **Live indicator**: Visual feedback for real-time status
- **Pause/Resume**: Toggle real-time updates as needed

## Styling

The UI uses a custom neumorphic design system with:

- Soft shadows and highlights
- Consistent color palette (#e0e5ec base)
- Responsive grid layouts
- Smooth transitions and animations

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)
