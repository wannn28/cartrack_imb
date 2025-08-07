package handler

import (
	"strconv"

	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/service"
	"github.com/cartrack/backend/pkg/response"
	"github.com/labstack/echo/v4"
)

// VehicleHandler defines vehicle handler interface
type VehicleHandler interface {
	Create(c echo.Context) error
	GetMyVehicles(c echo.Context) error
	GetByID(c echo.Context) error
	Update(c echo.Context) error
	Delete(c echo.Context) error
	GetAll(c echo.Context) error // Admin only
}

// vehicleHandler implements VehicleHandler interface
type vehicleHandler struct {
	vehicleService service.VehicleService
}

// NewVehicleHandler creates new vehicle handler instance
func NewVehicleHandler(vehicleService service.VehicleService) VehicleHandler {
	return &vehicleHandler{
		vehicleService: vehicleService,
	}
}

// Create creates a new vehicle
func (h *vehicleHandler) Create(c echo.Context) error {
	userID := getUserIDFromContext(c)

	var req dto.CreateVehicleRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request body", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	vehicle, err := h.vehicleService.Create(userID, &req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Created(c, "Vehicle created successfully", vehicle)
}

// GetMyVehicles gets current user's vehicles
func (h *vehicleHandler) GetMyVehicles(c echo.Context) error {
	userID := getUserIDFromContext(c)

	// Get pagination parameters
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	if limit <= 0 || limit > 100 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}

	vehicles, err := h.vehicleService.GetByUserID(userID, limit, offset)
	if err != nil {
		return response.InternalServerError(c, "Failed to get vehicles", nil)
	}

	return response.Success(c, "Vehicles retrieved successfully", vehicles)
}

// GetByID gets vehicle by ID
func (h *vehicleHandler) GetByID(c echo.Context) error {
	userID := getUserIDFromContext(c)

	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid vehicle ID", nil)
	}

	vehicle, err := h.vehicleService.GetByID(userID, uint(vehicleID))
	if err != nil {
		return response.NotFound(c, err.Error(), nil)
	}

	return response.Success(c, "Vehicle retrieved successfully", vehicle)
}

// Update updates vehicle information
func (h *vehicleHandler) Update(c echo.Context) error {
	userID := getUserIDFromContext(c)

	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid vehicle ID", nil)
	}

	var req dto.UpdateVehicleRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request body", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	vehicle, err := h.vehicleService.Update(userID, uint(vehicleID), &req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "Vehicle updated successfully", vehicle)
}

// Delete deletes a vehicle
func (h *vehicleHandler) Delete(c echo.Context) error {
	userID := getUserIDFromContext(c)

	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid vehicle ID", nil)
	}

	if err := h.vehicleService.Delete(userID, uint(vehicleID)); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "Vehicle deleted successfully", nil)
}

// GetAll gets all vehicles (admin only)
func (h *vehicleHandler) GetAll(c echo.Context) error {
	// Get pagination parameters
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	vehicles, err := h.vehicleService.GetAll(limit, offset)
	if err != nil {
		return response.InternalServerError(c, "Failed to get vehicles", nil)
	}

	return response.Success(c, "All vehicles retrieved successfully", vehicles)
}
