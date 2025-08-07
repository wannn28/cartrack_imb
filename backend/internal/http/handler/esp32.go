package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/service"
	"github.com/cartrack/backend/pkg/response"
	"github.com/labstack/echo/v4"
)

// ESP32Handler defines ESP32 handler interface
type ESP32Handler interface {
	SendLocationLog(c echo.Context) error
	GetVehicleInfo(c echo.Context) error
	GetUserVehicles(c echo.Context) error
}

// esp32Handler implements ESP32Handler interface
type esp32Handler struct {
	apiKeyService      service.APIKeyService
	locationLogService service.LocationLogService
	vehicleService     service.VehicleService
}

// NewESP32Handler creates new ESP32 handler instance
func NewESP32Handler(apiKeyService service.APIKeyService, locationLogService service.LocationLogService, vehicleService service.VehicleService) ESP32Handler {
	return &esp32Handler{
		apiKeyService:      apiKeyService,
		locationLogService: locationLogService,
		vehicleService:     vehicleService,
	}
}

// getAPIKeyFromHeader extracts API key from Authorization header
func getAPIKeyFromHeader(c echo.Context) (string, error) {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "API key required")
	}

	// Debug logging
	fmt.Printf("DEBUG: Authorization header: '%s'\n", authHeader)

	// Check if it's Bearer token format
	if strings.HasPrefix(authHeader, "Bearer ") {
		apiKey := strings.TrimPrefix(authHeader, "Bearer ")
		fmt.Printf("DEBUG: Extracted API key from Bearer format: '%s'\n", apiKey)
		return apiKey, nil
	}

	// Check if it's API key format
	if strings.HasPrefix(authHeader, "ApiKey ") {
		apiKey := strings.TrimPrefix(authHeader, "ApiKey ")
		fmt.Printf("DEBUG: Extracted API key from ApiKey format: '%s'\n", apiKey)
		return apiKey, nil
	}

	// Assume it's just the API key
	fmt.Printf("DEBUG: Using authorization header as-is as API key: '%s'\n", authHeader)
	return authHeader, nil
}

// SendLocationLog handles ESP32 location log submission
func (h *esp32Handler) SendLocationLog(c echo.Context) error {
	// Get API key from header
	apiKeyStr, err := getAPIKeyFromHeader(c)
	if err != nil {
		return response.Unauthorized(c, err.Error(), nil)
	}

	// Validate API key
	apiKey, err := h.apiKeyService.ValidateAPIKey(apiKeyStr)
	if err != nil {
		return response.Unauthorized(c, "Invalid API key", nil)
	}

	// Parse request
	var req dto.ESP32LocationLogRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request body", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	// Verify that the vehicle belongs to the API key's user
	_, err = h.vehicleService.GetByID(apiKey.UserID, req.VehicleID)
	if err != nil {
		return response.BadRequest(c, "Vehicle not found or not accessible with this API key", nil)
	}

	// Create location log request
	locationLogReq := &dto.CreateLocationLogRequest{
		VehicleID: req.VehicleID,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Speed:     req.Speed,
		Direction: req.Direction,
	}

	// Create location log using the API key's user ID
	log, err := h.locationLogService.Create(apiKey.UserID, locationLogReq)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Created(c, "Location log sent successfully", log)
}

// GetVehicleInfo handles ESP32 vehicle info request
func (h *esp32Handler) GetVehicleInfo(c echo.Context) error {
	// Get API key from header
	apiKeyStr, err := getAPIKeyFromHeader(c)
	if err != nil {
		return response.Unauthorized(c, err.Error(), nil)
	}

	// Validate API key
	apiKey, err := h.apiKeyService.ValidateAPIKey(apiKeyStr)
	if err != nil {
		return response.Unauthorized(c, "Invalid API key", nil)
	}

	// Get vehicle ID from query parameter or path parameter
	vehicleIDStr := c.QueryParam("vehicle_id")
	if vehicleIDStr == "" {
		vehicleIDStr = c.Param("vehicle_id")
	}

	if vehicleIDStr == "" {
		return response.BadRequest(c, "Vehicle ID is required", nil)
	}

	vehicleID, err := strconv.ParseUint(vehicleIDStr, 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid vehicle ID", nil)
	}

	// Get vehicle info using the API key's user ID
	vehicle, err := h.vehicleService.GetByID(apiKey.UserID, uint(vehicleID))
	if err != nil {
		return response.NotFound(c, "Vehicle not found or not accessible with this API key", nil)
	}

	// Convert to ESP32 response format
	esp32Vehicle := &dto.ESP32VehicleResponse{
		ID:          vehicle.ID,
		PlateNumber: vehicle.PlateNumber,
		Model:       vehicle.Model,
		IMEI:        vehicle.IMEI,
	}

	return response.Success(c, "Vehicle info retrieved successfully", esp32Vehicle)
}

// GetUserVehicles handles ESP32 request to get all vehicles for the API key user
func (h *esp32Handler) GetUserVehicles(c echo.Context) error {
	// Get API key from header
	apiKeyStr, err := getAPIKeyFromHeader(c)
	if err != nil {
		return response.Unauthorized(c, err.Error(), nil)
	}

	// Validate API key
	apiKey, err := h.apiKeyService.ValidateAPIKey(apiKeyStr)
	if err != nil {
		return response.Unauthorized(c, "Invalid API key", nil)
	}

	// Get all vehicles for the user (using a large limit to get all vehicles)
	vehicles, err := h.vehicleService.GetByUserID(apiKey.UserID, 1000, 0)
	if err != nil {
		return response.InternalServerError(c, "Failed to get vehicles", nil)
	}

	// Convert to ESP32 response format
	esp32Vehicles := make([]dto.ESP32VehicleResponse, len(vehicles))
	for i, vehicle := range vehicles {
		esp32Vehicles[i] = dto.ESP32VehicleResponse{
			ID:          vehicle.ID,
			PlateNumber: vehicle.PlateNumber,
			Model:       vehicle.Model,
			IMEI:        vehicle.IMEI,
		}
	}

	return response.Success(c, "Vehicles retrieved successfully", esp32Vehicles)
}
