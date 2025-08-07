# 📋 Cartrack Backend API Documentation

## 🚀 Overview
This is the complete API documentation for Cartrack Fleet Management System. The API provides endpoints for vehicle tracking, fuel monitoring, camera feed management, and system logging.

## 🔧 Setup Instructions

### 1. Import Postman Collection
1. Open Postman
2. Click **Import**
3. Select `Cartrack_API_Collection.json`
4. Import `Cartrack_Environment.json` as environment

### 2. Environment Variables
Set up the following environment variables:
- `base_url`: `http://localhost:8081`
- `access_token`: Will be auto-set after login
- `refresh_token`: Will be auto-set after login
- `user_id`: Will be auto-set after registration/login
- `vehicle_id`: Will be auto-set after creating a vehicle

## 🔐 Authentication

### Bearer Token
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer {{access_token}}
```

### API Key Authentication (ESP32)
ESP32 endpoints use API key authentication:
```
Authorization: Bearer {{api_key}}
```
or
```
Authorization: ApiKey {{api_key}}
```

### Token Management
- **Access Token**: Valid for 1 hour
- **Refresh Token**: Valid for 7 days
- Auto-refresh using refresh token endpoint

## 📚 API Endpoints

### 📡 ESP32 Device Endpoints

#### 1. Send Location Log (ESP32)
- **POST** `/api/v1/esp32/location`
- **Auth**: API Key (Bearer token)
- **Body**:
```json
{
    "vehicle_id": 1,
    "latitude": -6.2088,
    "longitude": 106.8456,
    "speed": 45.5,
    "direction": 180
}
```
- **Response**: Location log confirmation

#### 2. Get All Vehicles (ESP32)
- **GET** `/api/v1/esp32/vehicle`
- **Auth**: API Key (Bearer token)
- **Response**: Array of vehicles for the API key user

#### 3. Get Vehicle by ID (ESP32)
- **GET** `/api/v1/esp32/vehicle/:id`
- **Auth**: API Key (Bearer token)
- **Response**: Specific vehicle information

### 🔐 Authentication Endpoints

#### 1. Register User
- **POST** `/api/v1/auth/register`
- **Body**:
```json
{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "phone_number": "+1234567890"
}
```
- **Response**: User data without password

#### 2. Login User
- **POST** `/api/v1/auth/login`
- **Body**:
```json
{
    "email": "john.doe@example.com",
    "password": "password123"
}
```
- **Response**: User data + access_token + refresh_token

#### 3. Refresh Token
- **POST** `/api/v1/auth/refresh`
- **Body**:
```json
{
    "refresh_token": "{{refresh_token}}"
}
```
- **Response**: New access_token

### 👤 User Management

#### 1. Get Profile
- **GET** `/api/v1/user/profile`
- **Auth**: Required
- **Response**: Current user profile

#### 2. Update Profile
- **PUT** `/api/v1/user/profile`
- **Auth**: Required
- **Body**:
```json
{
    "name": "John Doe Updated",
    "phone_number": "+1234567891"
}
```

#### 3. Change Password
- **POST** `/api/v1/user/change-password`
- **Auth**: Required
- **Body**:
```json
{
    "old_password": "password123",
    "new_password": "newpassword123"
}
```

### 🚗 Vehicle Management

#### 1. Create Vehicle
- **POST** `/api/v1/vehicles`
- **Auth**: Required
- **Body**:
```json
{
    "plate_number": "B1234ABC",
    "model": "Toyota Avanza",
    "imei": "123456789012345"
}
```

#### 2. Get My Vehicles
- **GET** `/api/v1/vehicles?limit=10&offset=0`
- **Auth**: Required
- **Query Params**: limit, offset

#### 3. Get Vehicle by ID
- **GET** `/api/v1/vehicles/{id}`
- **Auth**: Required

#### 4. Update Vehicle
- **PUT** `/api/v1/vehicles/{id}`
- **Auth**: Required
- **Body**:
```json
{
    "plate_number": "B5678XYZ",
    "model": "Honda Civic"
}
```

#### 5. Delete Vehicle
- **DELETE** `/api/v1/vehicles/{id}`
- **Auth**: Required

### 📍 Location Tracking

#### 1. Add Location Log
- **POST** `/api/v1/location-logs`
- **Auth**: Required
- **Body**:
```json
{
    "vehicle_id": 1,
    "latitude": -6.2088,
    "longitude": 106.8456,
    "speed": 45.5,
    "direction": 180
}
```

#### 2. Get All My Location Logs
- **GET** `/api/v1/location-logs?limit=50&offset=0`
- **Auth**: Required
- **Description**: Returns all location logs for the authenticated user across all their vehicles
- **Query Params**: limit, offset
- **Response**: Includes vehicle information including plate number
- **Sample Response**:
```json
{
    "status": "success",
    "message": "Location logs retrieved successfully",
    "data": [
        {
            "id": 1,
            "vehicle_id": 1,
            "latitude": -6.2088,
            "longitude": 106.8456,
            "speed": 45.5,
            "direction": 180,
            "timestamp": "2025-01-15T10:30:00Z",
            "created_at": "2025-01-15T10:30:00Z",
            "updated_at": "2025-01-15T10:30:00Z",
            "vehicle": {
                "id": 1,
                "user_id": 1,
                "plate_number": "B 1234 ABC",
                "model": "Toyota Avanza",
                "imei": "123456789012345",
                "created_at": "2025-01-01T00:00:00Z",
                "updated_at": "2025-01-01T00:00:00Z"
            }
        }
    ],
    "pagination": {
        "total": 150,
        "limit": 50,
        "offset": 0
    }
}
```

#### 3. Get Vehicle Location History (Specific Vehicle)
- **GET** `/api/v1/location-logs/vehicle?vehicle_id={id}&limit=50&offset=0`
- **Auth**: Required
- **Description**: Returns location logs for a specific vehicle only
- **Query Params**: vehicle_id (required), limit, offset, start_date, end_date
- **Note**: This endpoint returns logs for the specified vehicle only, unlike the general location logs endpoint which returns logs for all user's vehicles

#### 4. Get Latest Vehicle Location
- **GET** `/api/v1/vehicles/{id}/latest-location`
- **Auth**: Required

#### 5. Real-time Location Tracking
- **POST** `/api/v1/tracking/location`
- **Auth**: Required
- **Body**: Same as Add Location Log

### ⛽ Fuel Management

#### 1. Add Fuel Log
- **POST** `/api/v1/fuel-logs`
- **Auth**: Required
- **Body**:
```json
{
    "vehicle_id": 1,
    "fuel_level": 75.5
}
```

#### 2. Get Vehicle Fuel History
- **GET** `/api/v1/fuel-logs?vehicle_id={id}&limit=50&offset=0`
- **Auth**: Required

#### 3. Get Fuel Statistics
- **GET** `/api/v1/vehicles/{id}/fuel-stats?start_date=2025-01-01&end_date=2025-01-31`
- **Auth**: Required
- **Response**:
```json
{
    "vehicle_id": 1,
    "average_fuel_level": 65.2,
    "min_fuel_level": 15.0,
    "max_fuel_level": 95.5,
    "current_fuel_level": 75.5,
    "total_entries": 150
}
```

#### 4. Get Current Fuel Level
- **GET** `/api/v1/vehicles/{id}/current-fuel`
- **Auth**: Required

### 📹 Camera Management

#### 1. Add Camera Feed
- **POST** `/api/v1/camera-feeds`
- **Auth**: Required
- **Body**:
```json
{
    "vehicle_id": 1,
    "feed_url": "https://example.com/camera/feed1.jpg"
}
```

#### 2. Get Vehicle Camera Feeds
- **GET** `/api/v1/camera-feeds?vehicle_id={id}&limit=20&offset=0`
- **Auth**: Required

#### 3. Get Active Camera Feeds
- **GET** `/api/v1/vehicles/{id}/active-cameras`
- **Auth**: Required
- **Note**: Returns feeds from last 24 hours

#### 4. Get Latest Camera Feed
- **GET** `/api/v1/vehicles/{id}/latest-camera`
- **Auth**: Required

### 📋 System Logs

#### 1. Create System Log
- **POST** `/api/v1/system-logs`
- **Auth**: Required
- **Body**:
```json
{
    "vehicle_id": 1,
    "log_type": "INFO",
    "message": "Vehicle started successfully"
}
```
- **Log Types**: INFO, WARNING, ERROR

#### 2. Get All System Logs
- **GET** `/api/v1/system-logs?limit=50&offset=0`
- **Auth**: Required

#### 3. Get Vehicle System Logs
- **GET** `/api/v1/system-logs?vehicle_id={id}&limit=50&offset=0`
- **Auth**: Required

#### 4. Get Logs by Type
- **GET** `/api/v1/system-logs?log_type=ERROR&limit=50&offset=0`
- **Auth**: Required

#### 5. Get Log Statistics
- **GET** `/api/v1/system-logs/statistics`
- **Auth**: Required
- **Response**:
```json
{
    "total_logs": 1500,
    "info_logs": 1200,
    "warning_logs": 250,
    "error_logs": 50,
    "today_logs": 45,
    "vehicle_count": 25
}
```

#### 6. Get Today's Logs
- **GET** `/api/v1/system-logs/today?limit=100&offset=0`
- **Auth**: Required

### 👨‍💼 Admin Operations

#### 1. Get All Users
- **GET** `/api/v1/admin/users?limit=20&offset=0`
- **Auth**: Required (Admin only)

#### 2. Get User by ID
- **GET** `/api/v1/admin/users/{id}`
- **Auth**: Required (Admin only)

#### 3. Delete User
- **DELETE** `/api/v1/admin/users/{id}`
- **Auth**: Required (Admin only)

#### 4. Get All Vehicles (Admin)
- **GET** `/api/v1/admin/vehicles?limit=50&offset=0`
- **Auth**: Required (Admin only)

#### 5. Fleet Overview Dashboard
- **GET** `/api/v1/admin/dashboard`
- **Auth**: Required (Admin only)
- **Response**: Fleet statistics and overview

#### 6. User Dashboard
- **GET** `/api/v1/user/dashboard`
- **Auth**: Required (User only)
- **Description**: Returns dashboard statistics specific to the authenticated user (their vehicles, logs, API keys, etc.)
- **Response**: User-specific dashboard statistics filtered by user ID

## 📊 Response Format

### Success Response
```json
{
    "meta": {
        "code": 200,
        "message": "Success message"
    },
    "data": {
        // Response data
    }
}
```

### Error Response
```json
{
    "meta": {
        "code": 400,
        "message": "Error message"
    },
    "data": null
}
```

### Validation Error Response
```json
{
    "meta": {
        "code": 400,
        "message": "Validation failed"
    },
    "data": {
        "field_name": "Validation error message"
    }
}
```

## 🔄 Testing Workflow

### 1. Basic Flow
1. **Register** a new user → Get user_id
2. **Login** → Get access_token & refresh_token
3. **Create Vehicle** → Get vehicle_id
4. **Add Location Log** → Test GPS tracking
5. **Add Fuel Log** → Test fuel monitoring
6. **Add Camera Feed** → Test camera management
7. **Create System Log** → Test logging

### 2. Advanced Testing
1. **Location History** → Test date range queries
2. **Fuel Statistics** → Test analytics
3. **Active Camera Feeds** → Test real-time features
4. **Log Statistics** → Test admin analytics
5. **Token Refresh** → Test authentication flow

### 3. Admin Testing
1. **Admin Login** → Use admin credentials
2. **Get All Users** → Test admin access
3. **Fleet Dashboard** → Test admin analytics
4. **User Management** → Test admin operations

## 🛠️ Development Notes

### Rate Limiting
- No rate limiting implemented yet
- Consider implementing for production

### Pagination
- Default limit: 10-50 depending on endpoint
- Maximum limit: 1000 for most endpoints
- Use offset for pagination

### Date Formats
- Use ISO 8601 format: `2025-01-01T00:00:00Z`
- Query params accept: `YYYY-MM-DD` format

### Error Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request / Validation Error
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

## 📱 Mobile App Integration

### Real-time Updates
- Use WebSocket for real-time location updates
- Polling interval: 30 seconds for location updates
- Battery optimization: Adjust frequency based on movement

### Offline Support
- Cache essential data locally
- Queue API calls when offline
- Sync when connection restored

### Push Notifications
- Low fuel alerts
- System error notifications
- Geofence entry/exit alerts

## 🔒 Security Considerations

### API Security
- Always use HTTPS in production
- Implement rate limiting
- Add API key authentication for mobile apps
- Validate all input data

### Token Security
- Store tokens securely on client
- Implement token rotation
- Add device fingerprinting
- Monitor suspicious activities

### Data Privacy
- Encrypt sensitive data
- Implement data retention policies
- Add user consent management
- GDPR compliance considerations

---

📞 **Support**: For technical support, contact the development team.
📖 **Updates**: Check this documentation for API changes and updates.