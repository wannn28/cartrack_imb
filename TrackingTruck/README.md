# CarTrack Frontend

A comprehensive React + TypeScript frontend application for the CarTrack vehicle tracking system.

## Features

### Authentication
- **Login/Register**: User authentication with JWT tokens
- **Profile Management**: Update user profile and change password
- **Role-based Access**: Admin and user role support
- **Auto Token Refresh**: Automatic token refresh for seamless experience

### Vehicle Management
- **Vehicle CRUD**: Create, read, update, and delete vehicles
- **Vehicle Details**: Model, license plate number, and IMEI for GPS tracking
- **Search and Filter**: Easy vehicle discovery
- **Vehicle Cards**: Visual representation with quick action buttons

### Location Tracking
- **Real-time Tracking**: Monitor vehicle locations in real-time
- **Location History**: View historical location data
- **GPS Integration**: Browser geolocation support for manual logging
- **Location Analytics**: Speed and direction tracking

### Fuel Management
- **Fuel Logging**: Record fuel levels and consumption
- **Fuel Statistics**: Efficiency calculations and consumption analytics
- **Visual Fuel Gauge**: Circular progress indicator for fuel levels
- **Fuel History**: Track fuel consumption over time

### API Key Management
- **API Key Creation**: Generate API keys for external integrations
- **Key Security**: Masked display with show/hide functionality
- **Expiration Management**: Set and monitor key expiration dates
- **Copy to Clipboard**: Easy key sharing

### Admin Panel
- **User Management**: View and manage all users
- **Vehicle Overview**: System-wide vehicle monitoring
- **Statistics Dashboard**: Key metrics and insights
- **Role-based Access**: Admin-only features

### Dashboard
- **Quick Stats**: Overview of vehicles, locations, and fuel data
- **Recent Activity**: Latest location updates and fuel logs
- **Quick Actions**: Fast access to common tasks
- **Visual Cards**: Clean, informative interface

## Technical Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite

## API Integration

The frontend is designed to work with the backend API routes:

### Public Routes
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `POST /location-logs` - Public location tracking
- ESP32 integration endpoints

### Protected Routes
- User profile management
- Vehicle CRUD operations
- Location tracking and logging
- Fuel management
- API key management

### Admin Routes
- User management
- System-wide vehicle access
- Administrative dashboards

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Base URL**
   The API base URL is already configured to match your backend at `http://localhost:8081/api/v1`.
   You can modify it in `src/config/environment.ts` or by setting environment variables.

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── Admin/           # Admin dashboard components
│   ├── ApiKeys/         # API key management
│   ├── Auth/            # Authentication components
│   ├── Dashboard/       # Main dashboard
│   ├── Fuel/            # Fuel management
│   ├── Layout/          # Layout components
│   ├── Tracking/        # Location tracking
│   └── Vehicles/        # Vehicle management
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── services/
│   └── api.ts           # API service layer
├── types/
│   └── index.ts         # TypeScript type definitions
└── App.tsx              # Main application component
```

## Features Implemented

✅ **Authentication System**
- Login/Register forms
- Protected routes
- JWT token management
- Role-based access control

✅ **Vehicle Management**
- Vehicle list with search
- Add/Edit vehicle forms
- Vehicle details and actions
- Fuel capacity visualization

✅ **Location Tracking**
- Real-time location dashboard
- Location history table
- Manual location logging
- GPS integration

✅ **Fuel Management**
- Fuel level visualization
- Consumption tracking
- Efficiency calculations
- Fuel statistics

✅ **API Key Management**
- Key generation and management
- Security features (masking, expiration)
- Copy to clipboard functionality

✅ **Admin Panel**
- User and vehicle overview
- System statistics
- Administrative controls

✅ **Responsive Design**
- Mobile-friendly interface
- Tailwind CSS styling
- Clean, modern UI

## Development Notes

- All TypeScript errors have been resolved
- Proper type safety throughout the application
- Clean component architecture
- Reusable UI components
- Error handling and loading states
- Accessibility considerations

## Future Enhancements

- Real-time WebSocket integration
- Map visualization for location tracking
- Advanced analytics and reporting
- Push notifications
- Mobile app integration
- Bulk operations support

## Support

This frontend application provides complete coverage for all API endpoints defined in the backend router.go file, offering a full-featured vehicle tracking management system.