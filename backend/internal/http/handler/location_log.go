package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/service"
	"github.com/cartrack/backend/pkg/response"
	"github.com/labstack/echo/v4"
)

// LocationLogHandler defines location log handler interface
type LocationLogHandler interface {
	Create(c echo.Context) error
	GetByVehicleID(c echo.Context) error
	GetMyLocationLogs(c echo.Context) error
	GetLatestByVehicleID(c echo.Context) error
	RealTimeTracking(c echo.Context) error
	GetAll(c echo.Context) error // Admin only
}

// locationLogHandler implements LocationLogHandler interface
type locationLogHandler struct {
	locationLogService service.LocationLogService
}

// NewLocationLogHandler creates new location log handler instance
func NewLocationLogHandler(locationLogService service.LocationLogService) LocationLogHandler {
	return &locationLogHandler{
		locationLogService: locationLogService,
	}
}

// Create creates a new location log
func (h *locationLogHandler) Create(c echo.Context) error {
	userID := getUserIDFromContext(c)

	var req dto.CreateLocationLogRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request body", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	log, err := h.locationLogService.Create(userID, &req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Created(c, "Location log created successfully", log)
}

// GetByVehicleID gets location logs by vehicle ID
func (h *locationLogHandler) GetByVehicleID(c echo.Context) error {
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

	// Check for date range
	startDateStr := c.QueryParam("start_date")
	endDateStr := c.QueryParam("end_date")
	startTimeStr := c.QueryParam("start_time")
	endTimeStr := c.QueryParam("end_time")

	var logs []dto.LocationLogResponse
	var total int64

	if startDateStr != "" && endDateStr != "" {
		startDate, err := time.Parse("2006-01-02", startDateStr)
		if err != nil {
			return response.BadRequest(c, "Invalid start_date format. Use YYYY-MM-DD", nil)
		}

		endDate, err := time.Parse("2006-01-02", endDateStr)
		if err != nil {
			return response.BadRequest(c, "Invalid end_date format. Use YYYY-MM-DD", nil)
		}

		// Parse time if provided, otherwise use default start/end of day
		if startTimeStr != "" {
			startTime, err := time.Parse("15:04", startTimeStr)
			if err != nil {
				return response.BadRequest(c, "Invalid start_time format. Use HH:MM (24-hour format)", nil)
			}
			startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(),
				startTime.Hour(), startTime.Minute(), 0, 0, startDate.Location())
		} else {
			// Default to start of day
			startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(),
				0, 0, 0, 0, startDate.Location())
		}

		if endTimeStr != "" {
			endTime, err := time.Parse("15:04", endTimeStr)
			if err != nil {
				return response.BadRequest(c, "Invalid end_time format. Use HH:MM (24-hour format)", nil)
			}
			endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(),
				endTime.Hour(), endTime.Minute(), 59, 999999999, endDate.Location())
		} else {
			// Default to end of day
			endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(),
				23, 59, 59, 999999999, endDate.Location())
		}

		logs, total, err = h.locationLogService.GetByDateRangeWithPagination(userID, uint(vehicleID), startDate, endDate, limit, offset)
		if err != nil {
			return response.BadRequest(c, err.Error(), nil)
		}
	} else {
		logs, total, err = h.locationLogService.GetByVehicleIDWithPagination(userID, uint(vehicleID), limit, offset)
		if err != nil {
			return response.BadRequest(c, err.Error(), nil)
		}
	}

	// Calculate pagination info
	page := int64(offset/limit + 1)
	perPage := int64(limit)

	return c.JSON(http.StatusOK, response.SuccessResponseWithPagination("Location logs retrieved successfully", logs, page, perPage, total))
}

// GetMyLocationLogs gets all location logs for the authenticated user
func (h *locationLogHandler) GetMyLocationLogs(c echo.Context) error {
	userID := getUserIDFromContext(c)

	// Get pagination parameters
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	if limit <= 0 || limit > 1000000000000000000 {
		limit = 1000000000000000000
	}
	if offset < 0 {
		offset = 0
	}

	// Check for date range
	startDateStr := c.QueryParam("start_date")
	endDateStr := c.QueryParam("end_date")
	startTimeStr := c.QueryParam("start_time")
	endTimeStr := c.QueryParam("end_time")

	var logs []dto.LocationLogResponse
	var total int64
	var err error

	if startDateStr != "" && endDateStr != "" {
		startDate, err := time.Parse("2006-01-02", startDateStr)
		if err != nil {
			return response.BadRequest(c, "Invalid start_date format. Use YYYY-MM-DD", nil)
		}

		endDate, err := time.Parse("2006-01-02", endDateStr)
		if err != nil {
			return response.BadRequest(c, "Invalid end_date format. Use YYYY-MM-DD", nil)
		}

		// Parse time if provided, otherwise use default start/end of day
		if startTimeStr != "" {
			startTime, err := time.Parse("15:04", startTimeStr)
			if err != nil {
				return response.BadRequest(c, "Invalid start_time format. Use HH:MM (24-hour format)", nil)
			}
			startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(),
				startTime.Hour(), startTime.Minute(), 0, 0, startDate.Location())
		} else {
			// Default to start of day
			startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(),
				0, 0, 0, 0, startDate.Location())
		}

		if endTimeStr != "" {
			endTime, err := time.Parse("15:04", endTimeStr)
			if err != nil {
				return response.BadRequest(c, "Invalid end_time format. Use HH:MM (24-hour format)", nil)
			}
			endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(),
				endTime.Hour(), endTime.Minute(), 59, 999999999, endDate.Location())
		} else {
			// Default to end of day
			endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(),
				23, 59, 59, 999999999, endDate.Location())
		}

		logs, total, err = h.locationLogService.GetByUserIDWithDateRange(userID, startDate, endDate, limit, offset)
		if err != nil {
			return response.InternalServerError(c, "Failed to get location logs", err)
		}
	} else {
		logs, total, err = h.locationLogService.GetByUserID(userID, limit, offset)
		if err != nil {
			return response.InternalServerError(c, "Failed to get location logs", err)
		}
	}

	// Calculate pagination info
	page := int64(offset/limit + 1)
	perPage := int64(limit)

	return c.JSON(http.StatusOK, response.SuccessResponseWithPagination("Location logs retrieved successfully", logs, page, perPage, total))
}

// GetLatestByVehicleID gets latest location for vehicle
func (h *locationLogHandler) GetLatestByVehicleID(c echo.Context) error {
	userID := getUserIDFromContext(c)

	vehicleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid vehicle ID", nil)
	}

	log, err := h.locationLogService.GetLatestByVehicleID(userID, uint(vehicleID))
	if err != nil {
		return response.NotFound(c, err.Error(), nil)
	}

	return response.Success(c, "Latest location retrieved successfully", log)
}

// RealTimeTracking handles real-time location tracking (same as Create for now)
func (h *locationLogHandler) RealTimeTracking(c echo.Context) error {
	return h.Create(c)
}

// GetAll gets all location logs (admin only)
func (h *locationLogHandler) GetAll(c echo.Context) error {
	// Get pagination parameters
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	if limit <= 0 || limit > 1000 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	logs, total, err := h.locationLogService.GetAllWithPagination(limit, offset)
	if err != nil {
		return response.InternalServerError(c, "Failed to get location logs", nil)
	}

	// Calculate pagination info
	page := int64(offset/limit + 1)
	perPage := int64(limit)

	return c.JSON(http.StatusOK, response.SuccessResponseWithPagination("All location logs retrieved successfully", logs, page, perPage, total))
}
