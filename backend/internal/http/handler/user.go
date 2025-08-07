package handler

import (
	"strconv"

	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/service"
	"github.com/cartrack/backend/pkg/response"
	"github.com/cartrack/backend/pkg/token"
	"github.com/labstack/echo/v4"
)

// UserHandler defines user handler interface
type UserHandler interface {
	Register(c echo.Context) error
	Login(c echo.Context) error
	GetProfile(c echo.Context) error
	UpdateProfile(c echo.Context) error
	ChangePassword(c echo.Context) error
	RefreshToken(c echo.Context) error
	GetAllUsers(c echo.Context) error
	GetUserByID(c echo.Context) error
	DeleteUser(c echo.Context) error
}

// userHandler implements UserHandler interface
type userHandler struct {
	userService  service.UserService
	tokenManager *token.TokenManager
}

// NewUserHandler creates new user handler instance
func NewUserHandler(userService service.UserService, tokenManager *token.TokenManager) UserHandler {
	return &userHandler{
		userService:  userService,
		tokenManager: tokenManager,
	}
}

// Register handles user registration
func (h *userHandler) Register(c echo.Context) error {
	var req dto.RegisterRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request format", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, "Validation failed", err.Error())
	}

	user, err := h.userService.Register(&req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "User registered successfully", user)
}

// Login handles user login
func (h *userHandler) Login(c echo.Context) error {
	var req dto.LoginRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request format", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, "Validation failed", err.Error())
	}

	loginResponse, err := h.userService.Login(&req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "Login successful", loginResponse)
}

// GetProfile handles get user profile
func (h *userHandler) GetProfile(c echo.Context) error {
	userID := h.getUserIDFromContext(c)
	if userID == 0 {
		return response.Unauthorized(c, "Invalid token", nil)
	}

	user, err := h.userService.GetProfile(userID)
	if err != nil {
		return response.NotFound(c, err.Error(), nil)
	}

	return response.Success(c, "Profile retrieved successfully", user)
}

// UpdateProfile handles update user profile
func (h *userHandler) UpdateProfile(c echo.Context) error {
	userID := h.getUserIDFromContext(c)
	if userID == 0 {
		return response.Unauthorized(c, "Invalid token", nil)
	}

	var req dto.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request format", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, "Validation failed", err.Error())
	}

	user, err := h.userService.UpdateProfile(userID, &req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "Profile updated successfully", user)
}

// ChangePassword handles change user password
func (h *userHandler) ChangePassword(c echo.Context) error {
	userID := h.getUserIDFromContext(c)
	if userID == 0 {
		return response.Unauthorized(c, "Invalid token", nil)
	}

	var req dto.ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request format", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, "Validation failed", err.Error())
	}

	if err := h.userService.ChangePassword(userID, &req); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "Password changed successfully", nil)
}

// RefreshToken handles refresh access token
func (h *userHandler) RefreshToken(c echo.Context) error {
	var req dto.RefreshTokenRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request format", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, "Validation failed", err.Error())
	}

	tokenResponse, err := h.userService.RefreshToken(&req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "Token refreshed successfully", tokenResponse)
}

// GetAllUsers handles get all users (admin only)
func (h *userHandler) GetAllUsers(c echo.Context) error {
	// Parse pagination parameters
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}

	users, err := h.userService.GetAllUsers(limit, offset)
	if err != nil {
		return response.InternalServerError(c, err.Error(), nil)
	}

	return response.Success(c, "Users retrieved successfully", users)
}

// GetUserByID handles get user by ID (admin only)
func (h *userHandler) GetUserByID(c echo.Context) error {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid user ID", nil)
	}

	user, err := h.userService.GetUserByID(uint(id))
	if err != nil {
		return response.NotFound(c, err.Error(), nil)
	}

	return response.Success(c, "User retrieved successfully", user)
}

// DeleteUser handles delete user (admin only)
func (h *userHandler) DeleteUser(c echo.Context) error {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid user ID", nil)
	}

	if err := h.userService.DeleteUser(uint(id)); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "User deleted successfully", nil)
}

// getUserIDFromContext extracts user ID from JWT token in context
func (h *userHandler) getUserIDFromContext(c echo.Context) uint {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" {
		return 0
	}

	// Remove "Bearer " prefix
	tokenString := authHeader[7:]

	claims, err := h.tokenManager.ValidateToken(tokenString)
	if err != nil {
		return 0
	}

	return uint(claims.UserID)
}
