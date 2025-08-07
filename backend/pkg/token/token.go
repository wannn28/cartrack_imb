package token

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the JWT claims structure
type Claims struct {
	UserID   int    `json:"user_id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// JwtCustomClaims for compatibility with echo-jwt middleware (deprecated, use Claims instead)
// type JwtCustomClaims struct {
// 	UserID   int    `json:"user_id"`
// 	Email    string `json:"email"`
// 	Username string `json:"username"`
// 	Role     string `json:"role"`
// 	jwt.RegisteredClaims
// }

// TokenManager handles JWT token operations
type TokenManager struct {
	secretKey []byte
}

// NewTokenManager creates a new token manager instance
func NewTokenManager(secretKey string) *TokenManager {
	return &TokenManager{
		secretKey: []byte(secretKey),
	}
}

// GenerateToken creates a new JWT token for a user
func (tm *TokenManager) GenerateToken(userID int, email, username, role string, expirationHours int) (string, error) {
	// Set expiration time
	expirationTime := time.Now().Add(time.Duration(expirationHours) * time.Hour)

	// Create claims
	claims := &Claims{
		UserID:   userID,
		Email:    email,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "cartrack-backend",
			Subject:   fmt.Sprintf("%d", userID),
		},
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token
	tokenString, err := token.SignedString(tm.secretKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken validates and parses a JWT token
func (tm *TokenManager) ValidateToken(tokenString string) (*Claims, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return tm.secretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Check if token is valid
	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Extract claims
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

// RefreshToken creates a new token with extended expiration
func (tm *TokenManager) RefreshToken(tokenString string, newExpirationHours int) (string, error) {
	// Validate the existing token
	claims, err := tm.ValidateToken(tokenString)
	if err != nil {
		return "", fmt.Errorf("invalid token for refresh: %w", err)
	}

	// Generate new token with extended expiration
	newToken, err := tm.GenerateToken(claims.UserID, claims.Email, claims.Username, claims.Role, newExpirationHours)
	if err != nil {
		return "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return newToken, nil
}

// ExtractUserID extracts user ID from token without full validation
func (tm *TokenManager) ExtractUserID(tokenString string) (int, error) {
	// Parse token without validation (for quick extraction)
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return 0, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return 0, errors.New("invalid token claims")
	}

	return claims.UserID, nil
}

// IsTokenExpired checks if a token is expired without full validation
func (tm *TokenManager) IsTokenExpired(tokenString string) (bool, error) {
	// Parse token without validation
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return false, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return false, errors.New("invalid token claims")
	}

	// Check if token is expired
	return time.Now().After(claims.ExpiresAt.Time), nil
}

// GetTokenExpiration returns the expiration time of a token
func (tm *TokenManager) GetTokenExpiration(tokenString string) (time.Time, error) {
	// Parse token without validation
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return time.Time{}, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return time.Time{}, errors.New("invalid token claims")
	}

	return claims.ExpiresAt.Time, nil
}

// GenerateAccessToken creates a short-lived access token
func (tm *TokenManager) GenerateAccessToken(userID int, email, username, role string) (string, error) {
	return tm.GenerateToken(userID, email, username, role, 1) // 1 hour expiration
}

// GenerateRefreshToken creates a long-lived refresh token
func (tm *TokenManager) GenerateRefreshToken(userID int, email, username, role string) (string, error) {
	return tm.GenerateToken(userID, email, username, role, 168) // 7 days expiration
}

// GenerateTokenPair creates both access and refresh tokens
func (tm *TokenManager) GenerateTokenPair(userID int, email, username, role string) (accessToken, refreshToken string, err error) {
	accessToken, err = tm.GenerateAccessToken(userID, email, username, role)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err = tm.GenerateRefreshToken(userID, email, username, role)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}
