# 🧪 Cartrack API Test Cases

## 🎯 Test Scenarios

### 1. Authentication Flow Tests

#### Test Case 1.1: User Registration
**Steps:**
1. POST `/api/v1/auth/register` with valid data
2. Verify response contains user data
3. Verify password is not in response
4. Check user_id is stored in environment

**Expected Result:**
- Status: 200
- Response contains: id, name, email, role
- user_id environment variable set

#### Test Case 1.2: User Login
**Steps:**
1. POST `/api/v1/auth/login` with valid credentials
2. Verify response contains tokens
3. Check tokens are stored in environment

**Expected Result:**
- Status: 200
- Response contains: access_token, refresh_token, user data
- Tokens stored in environment

#### Test Case 1.3: Invalid Login
**Steps:**
1. POST `/api/v1/auth/login` with invalid credentials
2. Verify error response

**Expected Result:**
- Status: 400
- Error message about invalid credentials

#### Test Case 1.4: Token Refresh
**Steps:**
1. Login to get refresh_token
2. POST `/api/v1/auth/refresh` with refresh_token
3. Verify new access_token received

**Expected Result:**
- Status: 200
- New access_token in response

### 2. User Management Tests

#### Test Case 2.1: Get Profile
**Steps:**
1. Login and get access_token
2. GET `/api/v1/user/profile` with Bearer token
3. Verify profile data

**Expected Result:**
- Status: 200
- User profile data returned

#### Test Case 2.2: Update Profile
**Steps:**
1. PUT `/api/v1/user/profile` with new data
2. Verify updated data in response
3. GET profile to confirm changes

**Expected Result:**
- Status: 200
- Updated data reflected

#### Test Case 2.3: Change Password
**Steps:**
1. POST `/api/v1/user/change-password` with valid old/new passwords
2. Verify success response
3. Login with new password

**Expected Result:**
- Status: 200
- Can login with new password

### 3. Vehicle Management Tests

#### Test Case 3.1: Create Vehicle
**Steps:**
1. POST `/api/v1/vehicles` with valid vehicle data
2. Verify vehicle created
3. Check vehicle_id stored in environment

**Expected Result:**
- Status: 201
- Vehicle data in response
- vehicle_id environment variable set

#### Test Case 3.2: Get User Vehicles
**Steps:**
1. GET `/api/v1/vehicles` with pagination
2. Verify vehicle list returned

**Expected Result:**
- Status: 200
- Array of user's vehicles

#### Test Case 3.3: Get Vehicle by ID
**Steps:**
1. GET `/api/v1/vehicles/{vehicle_id}`
2. Verify specific vehicle data

**Expected Result:**
- Status: 200
- Vehicle details with relationships

#### Test Case 3.4: Update Vehicle
**Steps:**
1. PUT `/api/v1/vehicles/{vehicle_id}` with new data
2. Verify update successful

**Expected Result:**
- Status: 200
- Updated vehicle data

#### Test Case 3.5: Duplicate Plate Number
**Steps:**
1. Create vehicle with plate number "TEST123"
2. Try to create another vehicle with same plate number
3. Verify error response

**Expected Result:**
- Status: 400
- Error about duplicate plate number

### 4. Location Tracking Tests

#### Test Case 4.1: Add Location Log
**Steps:**
1. POST `/api/v1/location-logs` with valid GPS data
2. Verify location log created

**Expected Result:**
- Status: 201
- Location log data in response

#### Test Case 4.2: Invalid Coordinates
**Steps:**
1. POST location log with latitude > 90
2. Verify validation error

**Expected Result:**
- Status: 400
- Validation error for latitude

#### Test Case 4.3: Get Location History
**Steps:**
1. Create multiple location logs
2. GET `/api/v1/location-logs?vehicle_id={id}`
3. Verify chronological order

**Expected Result:**
- Status: 200
- Locations ordered by timestamp DESC

#### Test Case 4.4: Date Range Query
**Steps:**
1. GET locations with start_date and end_date
2. Verify only logs in range returned

**Expected Result:**
- Status: 200
- Filtered results by date range

#### Test Case 4.5: Real-time Tracking
**Steps:**
1. POST `/api/v1/tracking/location` multiple times
2. Verify each location recorded

**Expected Result:**
- Status: 200
- All tracking points saved

### 5. Fuel Management Tests

#### Test Case 5.1: Add Fuel Log
**Steps:**
1. POST `/api/v1/fuel-logs` with fuel level
2. Verify fuel log created

**Expected Result:**
- Status: 201
- Fuel log data in response

#### Test Case 5.2: Invalid Fuel Level
**Steps:**
1. POST fuel log with level > 100
2. Verify validation error

**Expected Result:**
- Status: 400
- Validation error for fuel_level

#### Test Case 5.3: Fuel Statistics
**Steps:**
1. Create multiple fuel logs with different levels
2. GET `/api/v1/vehicles/{id}/fuel-stats`
3. Verify statistics calculated correctly

**Expected Result:**
- Status: 200
- Correct avg, min, max fuel levels

#### Test Case 5.4: Current Fuel Level
**Steps:**
1. Add multiple fuel logs
2. GET `/api/v1/vehicles/{id}/current-fuel`
3. Verify latest fuel level returned

**Expected Result:**
- Status: 200
- Most recent fuel level

### 6. Camera Feed Tests

#### Test Case 6.1: Add Camera Feed
**Steps:**
1. POST `/api/v1/camera-feeds` with valid URL
2. Verify camera feed created

**Expected Result:**
- Status: 201
- Camera feed data in response

#### Test Case 6.2: Invalid URL
**Steps:**
1. POST camera feed with invalid URL
2. Verify validation error

**Expected Result:**
- Status: 400
- URL validation error

#### Test Case 6.3: Active Camera Feeds
**Steps:**
1. Create camera feeds with different timestamps
2. GET `/api/v1/vehicles/{id}/active-cameras`
3. Verify only recent feeds returned

**Expected Result:**
- Status: 200
- Only feeds from last 24 hours

#### Test Case 6.4: Latest Camera Feed
**Steps:**
1. Add multiple camera feeds
2. GET `/api/v1/vehicles/{id}/latest-camera`
3. Verify most recent feed returned

**Expected Result:**
- Status: 200
- Latest camera feed

### 7. System Logs Tests

#### Test Case 7.1: Create System Log
**Steps:**
1. POST `/api/v1/system-logs` with valid log data
2. Verify log created

**Expected Result:**
- Status: 201
- System log data in response

#### Test Case 7.2: Invalid Log Type
**Steps:**
1. POST system log with invalid log_type
2. Verify validation error

**Expected Result:**
- Status: 400
- Log type validation error

#### Test Case 7.3: Log Statistics
**Steps:**
1. Create logs with different types (INFO, WARNING, ERROR)
2. GET `/api/v1/system-logs/statistics`
3. Verify counts are correct

**Expected Result:**
- Status: 200
- Correct log counts by type

#### Test Case 7.4: Filter by Log Type
**Steps:**
1. Create mixed log types
2. GET `/api/v1/system-logs?log_type=ERROR`
3. Verify only ERROR logs returned

**Expected Result:**
- Status: 200
- Only ERROR type logs

#### Test Case 7.5: Today's Logs
**Steps:**
1. Create logs with different dates
2. GET `/api/v1/system-logs/today`
3. Verify only today's logs returned

**Expected Result:**
- Status: 200
- Only logs from today

### 8. Admin Operations Tests

#### Test Case 8.1: Admin Access
**Steps:**
1. Login with admin credentials
2. GET `/api/v1/admin/users`
3. Verify admin can access all users

**Expected Result:**
- Status: 200
- List of all users

#### Test Case 8.2: User Access Denied
**Steps:**
1. Login with regular user credentials
2. GET `/api/v1/admin/users`
3. Verify access denied

**Expected Result:**
- Status: 403
- Access forbidden error

#### Test Case 8.3: Fleet Dashboard
**Steps:**
1. Login as admin
2. GET `/api/v1/admin/dashboard`
3. Verify fleet statistics

**Expected Result:**
- Status: 200
- Fleet overview data

#### Test Case 8.4: Delete User
**Steps:**
1. Create test user
2. DELETE `/api/v1/admin/users/{id}` as admin
3. Verify user deleted

**Expected Result:**
- Status: 200
- User successfully deleted

### 9. Authorization Tests

#### Test Case 9.1: Access Without Token
**Steps:**
1. GET protected endpoint without Authorization header
2. Verify unauthorized error

**Expected Result:**
- Status: 401
- Unauthorized error

#### Test Case 9.2: Invalid Token
**Steps:**
1. GET protected endpoint with invalid token
2. Verify unauthorized error

**Expected Result:**
- Status: 401
- Invalid token error

#### Test Case 9.3: Expired Token
**Steps:**
1. Wait for token to expire (or use expired token)
2. GET protected endpoint
3. Verify token expired error

**Expected Result:**
- Status: 401
- Token expired error

#### Test Case 9.4: Vehicle Access Control
**Steps:**
1. User A creates vehicle
2. User B tries to access User A's vehicle
3. Verify access denied

**Expected Result:**
- Status: 403 or 404
- Access denied

### 10. Data Validation Tests

#### Test Case 10.1: Required Fields
**Steps:**
1. POST endpoints with missing required fields
2. Verify validation errors

**Expected Result:**
- Status: 400
- Required field errors

#### Test Case 10.2: Field Length Limits
**Steps:**
1. POST with fields exceeding max length
2. Verify validation errors

**Expected Result:**
- Status: 400
- Length validation errors

#### Test Case 10.3: Email Format
**Steps:**
1. Register with invalid email format
2. Verify email validation error

**Expected Result:**
- Status: 400
- Email format error

#### Test Case 10.4: Numeric Ranges
**Steps:**
1. POST coordinates outside valid ranges
2. Verify range validation errors

**Expected Result:**
- Status: 400
- Range validation errors

### 11. Performance Tests

#### Test Case 11.1: Pagination Performance
**Steps:**
1. Create 1000+ records
2. GET with various limit/offset values
3. Measure response times

**Expected Result:**
- Response time < 500ms
- Consistent performance

#### Test Case 11.2: Large Payload
**Steps:**
1. POST with maximum allowed data size
2. Verify successful processing

**Expected Result:**
- Status: 201
- Data processed successfully

#### Test Case 11.3: Concurrent Requests
**Steps:**
1. Send multiple simultaneous requests
2. Verify all processed correctly

**Expected Result:**
- All requests successful
- No race conditions

## 🔧 Automated Test Scripts

### Pre-request Scripts
```javascript
// Auto-set timestamp for logs
pm.environment.set("timestamp", new Date().toISOString());

// Generate random coordinates for testing
pm.environment.set("random_lat", (Math.random() * 180 - 90).toFixed(6));
pm.environment.set("random_lng", (Math.random() * 360 - 180).toFixed(6));
```

### Post-response Scripts
```javascript
// Auto-extract and store IDs
if (pm.response.code === 200 || pm.response.code === 201) {
    const response = pm.response.json();
    
    // Store various IDs based on endpoint
    if (response.data && response.data.id) {
        const endpoint = pm.request.url.path.join('/');
        
        if (endpoint.includes('vehicles')) {
            pm.environment.set('vehicle_id', response.data.id);
        } else if (endpoint.includes('users')) {
            pm.environment.set('user_id', response.data.id);
        }
    }
    
    // Store tokens from login
    if (response.data && response.data.access_token) {
        pm.environment.set('access_token', response.data.access_token);
        pm.environment.set('refresh_token', response.data.refresh_token);
    }
}

// Basic response validation
pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("Response has correct structure", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('meta');
    pm.expect(response.meta).to.have.property('code');
    pm.expect(response.meta).to.have.property('message');
});
```

## 📊 Test Results Tracking

### Success Criteria
- All test cases pass
- Response times < 500ms for normal operations
- No memory leaks during extended testing
- Proper error handling for all edge cases

### Test Environment
- Local development: https://trackerapi
- Staging: https://staging-api.cartrack.com
- Production: https://api.cartrack.com

### Test Data Management
- Use test-specific user accounts
- Clean up test data after runs
- Maintain separate test databases
- Use realistic but anonymized data

---

🧪 **Testing Guide**: Run tests in order for dependencies between test cases.
📋 **Reporting**: Document any failures with detailed reproduction steps.