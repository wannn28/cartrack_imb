package handler

import (
	"github.com/cartrack/backend/pkg/token"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// getUserIDFromContext extracts user ID from JWT token in context
func getUserIDFromContext(c echo.Context) uint {
	user := c.Get("user").(*jwt.Token)
	if user == nil {
		return 0
	}

	claims := user.Claims.(*token.Claims)
	return uint(claims.UserID)
}
