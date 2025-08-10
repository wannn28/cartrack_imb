package handler

import (
	"strconv"
	"time"

	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/service"
	"github.com/cartrack/backend/pkg/response"
	"github.com/labstack/echo/v4"
)

// FuelLogHandler defines fuel log handler interface
type FuelLogHandler interface {
	Create(c echo.Context) error
	GetByVehicleID(c echo.Context) error
	GetCurrentFuelLevel(c echo.Context) error
	GetFuelStatistics(c echo.Context) error
	GetAll(c echo.Context) error // Admin only
}

// fuelLogHandler implements FuelLogHandler interface
type fuelLogHandler struct {
	fuelLogService service.FuelLogService
}

// NewFuelLogHandler creates new fuel log handler instance
func NewFuelLogHandler(fuelLogService service.FuelLogService) FuelLogHandler {
	return &fuelLogHandler{
		fuelLogService: fuelLogService,
	}
}

// Create creates a new fuel log
func (h *fuelLogHandler) Create(c echo.Context) error {
	userID := getUserIDFromContext(c)

	var req dto.CreateFuelLogRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request body", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	log, err := h.fuelLogService.Create(userID, &req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Created(c, "Fuel log created successfully", log)
}

// GetByVehicleID gets fuel logs by vehicle ID
func (h *fuelLogHandler) GetByVehicleID(c echo.Context) error {
	userID := getUserIDFromContext(c)

	// Get vehicle ID from query parameter
	vehicleIDStr := c.QueryParam("vehicle_id")
	if vehicleIDStr == "" {
		return response.BadRequest(c, "vehicle_id parameter is required", nil)
	}

	vehicleID, err := strconv.ParseUint(vehicleIDStr, 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid vehicle ID", nil)
	}

	// Get pagination parameters
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	if limit <= 0 || limit > 1000000000000000000 {
		limit = 1000000000000000000
	}
	if offset < 0 {
		offset = 0
	}

	logs, err := h.fuelLogService.GetByVehicleID(userID, uint(vehicleID), limit, offset)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "Fuel logs retrieved successfully", logs)
}

// GetCurrentFuelLevel gets current fuel level for vehicle
func (h *fuelLogHandler) GetCurrentFuelLevel(c echo.Context) error {
	userID := getUserIDFromContext(c)

	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid vehicle ID", nil)
	}

	log, err := h.fuelLogService.GetCurrentFuelLevel(userID, uint(vehicleID))
	if err != nil {
		return response.NotFound(c, err.Error(), nil)
	}

	return response.Success(c, "Current fuel level retrieved successfully", log)
}

// GetFuelStatistics gets fuel statistics for vehicle
func (h *fuelLogHandler) GetFuelStatistics(c echo.Context) error {
	userID := getUserIDFromContext(c)

	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid vehicle ID", nil)
	}

	// Get date range parameters
	startDateStr := c.QueryParam("start_date")
	endDateStr := c.QueryParam("end_date")

	var startDate, endDate time.Time

	if startDateStr != "" {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			return response.BadRequest(c, "Invalid start_date format. Use YYYY-MM-DD", nil)
		}
	} else {
		// Default to 30 days ago
		startDate = time.Now().AddDate(0, 0, -30)
	}

	if endDateStr != "" {
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			return response.BadRequest(c, "Invalid end_date format. Use YYYY-MM-DD", nil)
		}
		// Set end date to end of day
		endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
	} else {
		// Default to now
		endDate = time.Now()
	}

	stats, err := h.fuelLogService.GetFuelStatistics(userID, uint(vehicleID), startDate, endDate)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "Fuel statistics retrieved successfully", stats)
}

// GetAll gets all fuel logs (admin only)
func (h *fuelLogHandler) GetAll(c echo.Context) error {
	// Get pagination parameters
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	if limit <= 0 || limit > 1000 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	logs, err := h.fuelLogService.GetAll(limit, offset)
	if err != nil {
		return response.InternalServerError(c, "Failed to get fuel logs", nil)
	}

	return response.Success(c, "All fuel logs retrieved successfully", logs)
}
