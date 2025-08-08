package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/cartrack/backend/internal/entity"
	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/repository"
	"gorm.io/gorm"
)

// LocationLogService defines location log service interface
type LocationLogService interface {
	Create(userID uint, req *dto.CreateLocationLogRequest) (*dto.LocationLogResponse, error)
	GetByVehicleID(userID, vehicleID uint, limit, offset int) ([]dto.LocationLogResponse, error)
	GetByVehicleIDWithPagination(userID, vehicleID uint, limit, offset int) ([]dto.LocationLogResponse, int64, error)
	GetByDateRange(userID, vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]dto.LocationLogResponse, error)
	GetByDateRangeWithPagination(userID, vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]dto.LocationLogResponse, int64, error)
	GetByUserID(userID uint, limit, offset int) ([]dto.LocationLogResponse, int64, error)
	GetByUserIDWithDateRange(userID uint, startDate, endDate time.Time, limit, offset int) ([]dto.LocationLogResponse, int64, error)
	GetLatestByVehicleID(userID, vehicleID uint) (*dto.LocationLogResponse, error)
	GetAll(limit, offset int) ([]dto.LocationLogResponse, error)                      // Admin only
	GetAllWithPagination(limit, offset int) ([]dto.LocationLogResponse, int64, error) // Admin only
}

// locationLogService implements LocationLogService interface
type locationLogService struct {
	locationLogRepo repository.LocationLogRepository
	vehicleRepo     repository.VehicleRepository
}

// NewLocationLogService creates new location log service instance
func NewLocationLogService(locationLogRepo repository.LocationLogRepository, vehicleRepo repository.VehicleRepository) LocationLogService {
	return &locationLogService{
		locationLogRepo: locationLogRepo,
		vehicleRepo:     vehicleRepo,
	}
}

// Create creates a new location log
func (s *locationLogService) Create(userID uint, req *dto.CreateLocationLogRequest) (*dto.LocationLogResponse, error) {
	// Verify vehicle exists
	vehicle, err := s.vehicleRepo.GetByID(req.VehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("vehicle not found")
		}
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}

	// If userID is 0, this is a public endpoint - skip ownership verification
	// Otherwise, verify vehicle ownership
	if userID != 0 && vehicle.UserID != userID {
		return nil, errors.New("vehicle not found")
	}

	locationLog := &entity.LocationLog{
		VehicleID: req.VehicleID,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Speed:     req.Speed,
		Direction: req.Direction,
	}

	if err := s.locationLogRepo.Create(locationLog); err != nil {
		return nil, fmt.Errorf("failed to create location log: %w", err)
	}

	return s.entityToResponse(locationLog), nil
}

// GetByVehicleID gets location logs by vehicle ID
func (s *locationLogService) GetByVehicleID(userID, vehicleID uint, limit, offset int) ([]dto.LocationLogResponse, error) {
	// Verify vehicle ownership
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("vehicle not found")
		}
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}

	if vehicle.UserID != userID {
		return nil, errors.New("vehicle not found")
	}

	logs, err := s.locationLogRepo.GetByVehicleID(vehicleID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get location logs: %w", err)
	}

	responses := make([]dto.LocationLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, nil
}

// GetByVehicleIDWithPagination gets location logs by vehicle ID with pagination info
func (s *locationLogService) GetByVehicleIDWithPagination(userID, vehicleID uint, limit, offset int) ([]dto.LocationLogResponse, int64, error) {
	// Verify vehicle ownership
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, errors.New("vehicle not found")
		}
		return nil, 0, fmt.Errorf("failed to get vehicle: %w", err)
	}

	if vehicle.UserID != userID {
		return nil, 0, errors.New("vehicle not found")
	}

	logs, total, err := s.locationLogRepo.GetByVehicleIDWithPagination(vehicleID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get location logs: %w", err)
	}

	responses := make([]dto.LocationLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, total, nil
}

// GetByDateRange gets location logs by date range
func (s *locationLogService) GetByDateRange(userID, vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]dto.LocationLogResponse, error) {
	// Verify vehicle ownership
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("vehicle not found")
		}
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}

	if vehicle.UserID != userID {
		return nil, errors.New("vehicle not found")
	}

	logs, err := s.locationLogRepo.GetByVehicleIDAndDateRange(vehicleID, startDate, endDate, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get location logs: %w", err)
	}

	responses := make([]dto.LocationLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, nil
}

// GetByDateRangeWithPagination gets location logs by date range with pagination info
func (s *locationLogService) GetByDateRangeWithPagination(userID, vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]dto.LocationLogResponse, int64, error) {
	// Verify vehicle ownership
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, errors.New("vehicle not found")
		}
		return nil, 0, fmt.Errorf("failed to get vehicle: %w", err)
	}

	if vehicle.UserID != userID {
		return nil, 0, errors.New("vehicle not found")
	}

	logs, total, err := s.locationLogRepo.GetByVehicleIDAndDateRangeWithPagination(vehicleID, startDate, endDate, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get location logs: %w", err)
	}

	responses := make([]dto.LocationLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, total, nil
}

// GetLatestByVehicleID gets latest location log for vehicle
func (s *locationLogService) GetLatestByVehicleID(userID, vehicleID uint) (*dto.LocationLogResponse, error) {
	// Verify vehicle ownership
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("vehicle not found")
		}
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}

	if vehicle.UserID != userID {
		return nil, errors.New("vehicle not found")
	}

	log, err := s.locationLogRepo.GetLatestByVehicleID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("no location data found")
		}
		return nil, fmt.Errorf("failed to get latest location: %w", err)
	}

	return s.entityToResponse(log), nil
}

// GetByUserID gets all location logs for a specific user across all their vehicles
func (s *locationLogService) GetByUserID(userID uint, limit, offset int) ([]dto.LocationLogResponse, int64, error) {
	logs, total, err := s.locationLogRepo.GetByUserIDWithPagination(userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get location logs for user: %w", err)
	}

	responses := make([]dto.LocationLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, total, nil
}

// GetByUserIDWithDateRange gets location logs for a specific user by date range
func (s *locationLogService) GetByUserIDWithDateRange(userID uint, startDate, endDate time.Time, limit, offset int) ([]dto.LocationLogResponse, int64, error) {
	logs, total, err := s.locationLogRepo.GetByUserIDWithDateRange(userID, startDate, endDate, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get location logs for user by date range: %w", err)
	}

	responses := make([]dto.LocationLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, total, nil
}

// GetAll gets all location logs (admin only)
func (s *locationLogService) GetAll(limit, offset int) ([]dto.LocationLogResponse, error) {
	logs, err := s.locationLogRepo.GetAll(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get all location logs: %w", err)
	}

	responses := make([]dto.LocationLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, nil
}

// GetAllWithPagination gets all location logs with pagination info (admin only)
func (s *locationLogService) GetAllWithPagination(limit, offset int) ([]dto.LocationLogResponse, int64, error) {
	logs, total, err := s.locationLogRepo.GetAllWithPagination(limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get all location logs: %w", err)
	}

	responses := make([]dto.LocationLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, total, nil
}

// entityToResponse converts entity to response DTO
func (s *locationLogService) entityToResponse(log *entity.LocationLog) *dto.LocationLogResponse {
	response := &dto.LocationLogResponse{
		ID:        log.ID,
		VehicleID: log.VehicleID,
		Latitude:  log.Latitude,
		Longitude: log.Longitude,
		Speed:     log.Speed,
		Direction: log.Direction,
		Timestamp: log.Timestamp,
		CreatedAt: log.CreatedAt,
		UpdatedAt: log.UpdatedAt,
	}

	// Map Vehicle data if available
	if log.Vehicle.ID != 0 {
		response.Vehicle = &dto.VehicleResponse{
			ID:          log.Vehicle.ID,
			UserID:      log.Vehicle.UserID,
			PlateNumber: log.Vehicle.PlateNumber,
			Model:       log.Vehicle.Model,
			IMEI:        log.Vehicle.IMEI,
			CreatedAt:   log.Vehicle.CreatedAt,
			UpdatedAt:   log.Vehicle.UpdatedAt,
		}
	}

	return response
}
