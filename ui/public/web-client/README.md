# API Web Client

This is a simple web client for interacting with the Multi-tenant CLI Boilerplate API. It provides a user-friendly interface for managing entities, uploading images, and more.

## Features

- **Authentication**: OTP-based login system
- **Entity Management**: Create, read, update, and delete entities
- **Image Management**: Upload and manage images for entities
- **Search & Filtering**: Advanced search with multiple filters
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Local Development

1. Clone the repository
2. Navigate to the `ui/public/web-client` directory
3. Open `index.html` in your browser or use a local server

### Configuration

The API base URL is automatically detected:
- If running on `localhost`, it uses `http://localhost:3000`
- If running on a production server, it uses the current domain

If you need to change this behavior, edit the `apiBaseUrl` in `js/app.js`.

## Usage

### Authentication

1. Enter your email address
2. Click "Request OTP"
3. Check your email for the OTP code
4. Enter the OTP code
5. Click "Verify OTP"

### Entity Management

- **View Entities**: All entities are displayed on the dashboard
- **Create Entity**: Click "Create New Entity" and fill in the form
- **View Entity Details**: Click on any entity card
- **Edit Entity**: Click "Edit" on the entity details page
- **Delete Entity**: Click "Delete" on the entity details page

### Image Management

- **Upload Images**: On the entity details page, click "Upload Images"
- **View Images**: Click on any image to open the image viewer
- **Delete Images**: Click the delete button (×) on any image

### Search & Filtering

- **Basic Search**: Use the search bar at the top of the dashboard
- **Advanced Search**: Click "Advanced Search" for more options
- **Filter by Category**: Select a category from the dropdown

## File Structure

```
web-client/
├── index.html              # Main HTML file
├── css/
│   ├── styles.css          # Main stylesheet
│   ├── login.css           # Login page styles
│   ├── dashboard.css       # Dashboard styles
│   └── entity-details.css  # Entity details styles
├── js/
│   ├── app.js              # Main JavaScript file
│   ├── api.js              # API service
│   ├── auth.js             # Authentication logic
│   ├── entities.js         # Entity management
│   ├── ui.js               # UI components
│   └── utils.js            # Utility functions
└── README.md               # This file
```

## API Integration

The client integrates with the following API endpoints:

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and get token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Entities
- `GET /api/entities` - List entities
- `GET /api/entities/{id}` - Get entity details
- `POST /api/entities` - Create entity
- `PATCH /api/entities/{id}` - Update entity
- `DELETE /api/entities/{id}` - Delete entity
- `GET /api/entities/search` - Advanced search

### Images
- `POST /api/entities/{id}/images` - Upload images
- `GET /api/entities/{id}/images` - Get entity images
- `DELETE /api/images/{id}` - Delete image

### Categories
- `GET /api/categories` - Get all categories

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT