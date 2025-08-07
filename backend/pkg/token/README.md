# Token Package

JWT token management package for Cartrack backend authentication.

## Features

- **Token Generation**: Create access and refresh tokens
- **Token Validation**: Validate JWT tokens and extract claims
- **Token Refresh**: Generate new tokens with extended expiration
- **User Extraction**: Extract user information from tokens
- **Expiration Checking**: Check if tokens are expired
- **Token Pairs**: Generate both access and refresh tokens at once

## Usage

### Basic Setup

```go
import "github.com/cartrack/backend/pkg/token"

// Initialize token manager
secretKey := "your-super-secret-jwt-key"
tm := token.NewTokenManager(secretKey)
```

### Generate Tokens

```go
// Generate access token (1 hour expiration)
accessToken, err := tm.GenerateAccessToken(userID, email, username)

// Generate refresh token (7 days expiration)
refreshToken, err := tm.GenerateRefreshToken(userID, email, username)

// Generate both tokens at once
accessToken, refreshToken, err := tm.GenerateTokenPair(userID, email, username)
```

### Validate Tokens

```go
// Validate token and get claims
claims, err := tm.ValidateToken(tokenString)
if err != nil {
    // Handle invalid token
    return
}

// Access user information
userID := claims.UserID
email := claims.Email
username := claims.Username
```

### Extract User Information

```go
// Extract user ID without full validation
userID, err := tm.ExtractUserID(tokenString)

// Check if token is expired
isExpired, err := tm.IsTokenExpired(tokenString)

// Get token expiration time
expirationTime, err := tm.GetTokenExpiration(tokenString)
```

### Refresh Tokens

```go
// Refresh token with new expiration (2 hours)
newToken, err := tm.RefreshToken(refreshToken, 2)
```

## Token Structure

The JWT token contains the following claims:

```json
{
  "user_id": 123,
  "email": "user@example.com",
  "username": "john_doe",
  "exp": 1640995200,
  "iat": 1640991600,
  "nbf": 1640991600,
  "iss": "cartrack-backend",
  "sub": "123"
}
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

### Integration with Config

```go
import (
    "github.com/cartrack/backend/configs"
    "github.com/cartrack/backend/pkg/token"
)

// Load configuration
config, err := configs.NewConfig(".env")
if err != nil {
    log.Fatal(err)
}

// Initialize token manager with config
tm := token.NewTokenManager(config.JWT.SecretKey)
```

## Security Best Practices

1. **Use Strong Secret Keys**: Use a strong, randomly generated secret key
2. **Rotate Keys**: Regularly rotate your JWT secret keys
3. **Set Appropriate Expiration**: Use short expiration for access tokens (1 hour)
4. **Use HTTPS**: Always use HTTPS in production
5. **Validate Tokens**: Always validate tokens on protected endpoints
6. **Store Securely**: Store refresh tokens securely (database, Redis)

## Example Integration

```go
package main

import (
    "github.com/cartrack/backend/configs"
    "github.com/cartrack/backend/pkg/token"
)

func main() {
    // Load configuration
    config, err := configs.NewConfig(".env")
    if err != nil {
        log.Fatal(err)
    }

    // Initialize token manager
    tm := token.NewTokenManager(config.JWT.SecretKey)

    // Generate tokens for user
    userID := 1
    email := "user@example.com"
    username := "john_doe"

    accessToken, refreshToken, err := tm.GenerateTokenPair(userID, email, username)
    if err != nil {
        log.Fatal(err)
    }

    // Use tokens in your application
    fmt.Printf("Access Token: %s\n", accessToken)
    fmt.Printf("Refresh Token: %s\n", refreshToken)
}
```

## Error Handling

The package returns descriptive errors for various scenarios:

- `invalid token`: Token format is invalid
- `token expired`: Token has expired
- `unexpected signing method`: Token uses wrong signing algorithm
- `invalid token claims`: Token claims are malformed

## Testing

Run the example to test the token functionality:

```bash
go run pkg/token/example.go
``` 