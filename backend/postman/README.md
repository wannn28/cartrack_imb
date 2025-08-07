# 📮 Postman Collection for Cartrack API

## 📋 Overview
This folder contains comprehensive Postman collection and documentation for testing Cartrack Fleet Management System API.

## 📁 Files Included

### 1. `Cartrack_API_Collection.json`
Complete Postman collection with all API endpoints:
- 🔐 Authentication (Register, Login, Refresh)
- 👤 User Management (Profile, Update, Password)
- 🚗 Vehicle Management (CRUD operations)
- 📍 Location Tracking (GPS, History, Real-time)
- ⛽ Fuel Management (Logs, Statistics)
- 📹 Camera Management (Feeds, Active feeds)
- 📋 System Logs (Create, Filter, Statistics)
- 👨‍💼 Admin Operations (User management, Dashboard)

### 2. `Cartrack_Environment.json`
Environment variables for different deployment stages:
- `base_url`: API base URL
- `access_token`: JWT access token (auto-managed)
- `refresh_token`: JWT refresh token (auto-managed)
- `user_id`: Current user ID (auto-set)
- `vehicle_id`: Current vehicle ID (auto-set)

### 3. `API_Documentation.md`
Complete API documentation including:
- Endpoint descriptions
- Request/response examples
- Authentication guide
- Error handling
- Testing workflows

### 4. `Test_Cases.md`
Comprehensive test scenarios covering:
- Functional testing
- Authorization testing
- Data validation testing
- Performance testing
- Edge cases and error handling

## 🚀 Quick Setup

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Cartrack_API_Collection.json`
4. Collection will be imported with all endpoints

### Step 2: Import Environment
1. Click **Environments** in sidebar
2. Click **Import**
3. Select `Cartrack_Environment.json`
4. Activate the imported environment

### Step 3: Start Testing
1. Ensure Cartrack backend server is running on `localhost:8081`
2. Start with **Authentication → Register User**
3. Then **Authentication → Login User**
4. Access tokens will be automatically stored
5. Proceed with other endpoints

## 🔄 Testing Workflow

### Basic Flow
```
1. Register User → 2. Login → 3. Create Vehicle → 4. Test Features
```

### Complete Flow
```
1. Register User
   ↓
2. Login (get tokens)
   ↓
3. Create Vehicle
   ↓
4. Add Location Logs
   ↓
5. Add Fuel Logs
   ↓
6. Add Camera Feeds
   ↓
7. Create System Logs
   ↓
8. Test Admin Operations (if admin)
```

## 🔧 Environment Variables

### Auto-managed Variables
These are automatically set by test scripts:
- `access_token` - Set after login
- `refresh_token` - Set after login
- `user_id` - Set after registration/login
- `vehicle_id` - Set after creating vehicle

### Manual Configuration
You may need to update:
- `base_url` - Change for different environments
- `admin_token` - Set manually for admin testing

## 🎯 Key Features

### 1. Auto Token Management
- Tokens automatically extracted and stored after login
- Bearer token automatically used in Authorization headers
- Refresh token workflow included

### 2. Dynamic ID Management
- User ID and Vehicle ID automatically captured
- Used in subsequent API calls
- No manual ID copying required

### 3. Comprehensive Testing
- All CRUD operations covered
- Authentication flows tested
- Error scenarios included
- Data validation testing

### 4. Real-world Scenarios
- Fleet management workflows
- Location tracking simulation
- Fuel monitoring patterns
- Camera feed management

## 📊 Test Categories

### 🔐 Authentication Tests
- User registration
- Login/logout
- Token refresh
- Invalid credentials

### 👤 User Management Tests
- Profile operations
- Password changes
- User preferences
- Account management

### 🚗 Vehicle Management Tests
- Vehicle CRUD operations
- Vehicle ownership
- Plate number validation
- IMEI tracking

### 📍 Location Tracking Tests
- GPS coordinate validation
- Location history queries
- Real-time tracking
- Route analysis

### ⛽ Fuel Management Tests
- Fuel level logging
- Consumption analytics
- Statistical reports
- Low fuel alerts

### 📹 Camera Management Tests
- Feed URL validation
- Active feed monitoring
- Feed history
- Camera status

### 📋 System Logging Tests
- Log level filtering
- System monitoring
- Error tracking
- Analytics dashboard

### 👨‍💼 Admin Tests
- User management
- Fleet overview
- System administration
- Access control

## 🛠️ Customization

### Environment Setup
For different environments, create new environment files:

```json
{
    "name": "Cartrack Production",
    "values": [
        {
            "key": "base_url",
            "value": "https://api.cartrack.com"
        }
    ]
}
```

### Custom Test Scripts
Add to collection pre-request scripts:

```javascript
// Generate random test data
pm.environment.set("random_plate", "TEST" + Math.floor(Math.random() * 1000));
pm.environment.set("random_fuel", Math.floor(Math.random() * 100));
```

### Response Validation
Add to collection test scripts:

```javascript
// Validate response structure
pm.test("Response has meta and data", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('meta');
    pm.expect(response).to.have.property('data');
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Connection refused"
- Ensure backend server is running
- Check `base_url` in environment
- Verify port number (default: 8081)

#### 2. "Unauthorized" errors
- Check if tokens are properly set
- Re-login to refresh tokens
- Verify Bearer token format

#### 3. "Validation failed"
- Check request body format
- Verify required fields
- Validate data types and ranges

#### 4. "Vehicle not found"
- Ensure vehicle is created first
- Check `vehicle_id` environment variable
- Verify user owns the vehicle

### Debug Tips
1. Check **Console** tab for detailed errors
2. Use **Tests** tab to see assertion results
3. Enable **Request/Response** logging
4. Verify environment variables are set

## 📈 Performance Testing

### Load Testing
Use Postman Collection Runner:
1. Select collection
2. Choose environment
3. Set iterations (e.g., 100)
4. Set delay between requests
5. Monitor response times

### Stress Testing
Test with high concurrency:
1. Use Newman CLI for automation
2. Run multiple instances
3. Monitor server resources
4. Check for race conditions

## 🔒 Security Testing

### Authentication Testing
- Invalid tokens
- Expired tokens
- Token tampering
- Cross-user access

### Authorization Testing
- Role-based access
- Resource ownership
- Admin vs user permissions
- Data isolation

### Input Validation
- SQL injection attempts
- XSS payload testing
- Data type validation
- Range boundary testing

## 📱 Integration Testing

### Mobile App Simulation
Test mobile app scenarios:
1. User registration flow
2. Vehicle registration
3. Real-time location updates
4. Offline synchronization
5. Push notification triggers

### IoT Device Simulation
Test device integration:
1. GPS tracker data submission
2. Fuel sensor readings
3. Camera feed uploads
4. System status reporting

## 📞 Support

### Documentation
- API Documentation: `API_Documentation.md`
- Test Cases: `Test_Cases.md`
- Backend README: `../README.md`

### Help Resources
- Postman Documentation: https://learning.postman.com/
- REST API Testing Guide
- JWT Authentication Guide

### Contact
For technical support or questions:
- Development Team
- API Documentation Issues
- Bug Reports

---

🚀 **Ready to test!** Import the collection and start exploring the Cartrack API.
📋 **Need help?** Check the documentation files or contact the development team.