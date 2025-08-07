package token

import (
	"fmt"
	"log"
	"time"
)

// Example demonstrates how to use the TokenManager
func Example() {
	// Initialize token manager with secret key
	secretKey := "your-super-secret-jwt-key-change-this-in-production"
	tm := NewTokenManager(secretKey)

	// Example user data
	userID := 1
	email := "user@example.com"
	username := "john_doe"

	// Generate access token (1 hour expiration)
	accessToken, err := tm.GenerateAccessToken(userID, email, username, "user")
	if err != nil {
		log.Fatalf("Failed to generate access token: %v", err)
	}
	fmt.Printf("Access Token: %s\n", accessToken)

	// Generate refresh token (7 days expiration)
	refreshToken, err := tm.GenerateRefreshToken(userID, email, username, "user")
	if err != nil {
		log.Fatalf("Failed to generate refresh token: %v", err)
	}
	fmt.Printf("Refresh Token: %s\n", refreshToken)

	// Generate both tokens at once
	accessToken2, refreshToken2, err := tm.GenerateTokenPair(userID, email, username, "user")
	if err != nil {
		log.Fatalf("Failed to generate token pair: %v", err)
	}
	fmt.Printf("Token Pair - Access: %s\n", accessToken2)
	fmt.Printf("Token Pair - Refresh: %s\n", refreshToken2)

	// Validate token
	claims, err := tm.ValidateToken(accessToken)
	if err != nil {
		log.Fatalf("Failed to validate token: %v", err)
	}
	fmt.Printf("Validated Token - UserID: %d, Email: %s, Username: %s\n",
		claims.UserID, claims.Email, claims.Username)

	// Extract user ID from token
	extractedUserID, err := tm.ExtractUserID(accessToken)
	if err != nil {
		log.Fatalf("Failed to extract user ID: %v", err)
	}
	fmt.Printf("Extracted User ID: %d\n", extractedUserID)

	// Check if token is expired
	isExpired, err := tm.IsTokenExpired(accessToken)
	if err != nil {
		log.Fatalf("Failed to check token expiration: %v", err)
	}
	fmt.Printf("Token Expired: %t\n", isExpired)

	// Get token expiration time
	expirationTime, err := tm.GetTokenExpiration(accessToken)
	if err != nil {
		log.Fatalf("Failed to get token expiration: %v", err)
	}
	fmt.Printf("Token Expires At: %s\n", expirationTime.Format(time.RFC3339))

	// Refresh token
	newAccessToken, err := tm.RefreshToken(refreshToken, 2) // 2 hours
	if err != nil {
		log.Fatalf("Failed to refresh token: %v", err)
	}
	fmt.Printf("Refreshed Token: %s\n", newAccessToken)

	// Test with invalid token
	invalidToken := "invalid.token.here"
	_, err = tm.ValidateToken(invalidToken)
	if err != nil {
		fmt.Printf("Expected error for invalid token: %v\n", err)
	}
}
