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

// FuelLogService defines fuel log service interface
type FuelLogService interface {
	Create(userID uint, req *dto.CreateFuelLogRequest) (*dto.FuelLogResponse, error)
	GetByVehicleID(userID, vehicleID uint, limit, offset int) ([]dto.FuelLogResponse, error)
	GetCurrentFuelLevel(userID, vehicleID uint) (*dto.FuelLogResponse, error)
	GetFuelStatistics(userID, vehicleID uint, startDate, endDate time.Time) (*dto.FuelStatisticsResponse, error)
	GetAll(limit, offset int) ([]dto.FuelLogResponse, error) // Admin only
}

// fuelLogService implements FuelLogService interface
type fuelLogService struct {
	fuelLogRepo repository.FuelLogRepository
	vehicleRepo repository.VehicleRepository
}

// NewFuelLogService creates new fuel log service instance
func NewFuelLogService(fuelLogRepo repository.FuelLogRepository, vehicleRepo repository.VehicleRepository) FuelLogService {
	return &fuelLogService{
		fuelLogRepo: fuelLogRepo,
		vehicleRepo: vehicleRepo,
	}
}

// Create creates a new fuel log
func (s *fuelLogService) Create(userID uint, req *dto.CreateFuelLogRequest) (*dto.FuelLogResponse, error) {
	// Verify vehicle ownership
	vehicle, err := s.vehicleRepo.GetByID(req.VehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("vehicle not found")
		}
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}

	if vehicle.UserID != userID {
		return nil, errors.New("vehicle not found")
	}

	fuelLog := &entity.FuelLog{
		VehicleID: req.VehicleID,
		FuelLevel: req.FuelLevel,
	}

	if err := s.fuelLogRepo.Create(fuelLog); err != nil {
		return nil, fmt.Errorf("failed to create fuel log: %w", err)
	}

	return s.entityToResponse(fuelLog), nil
}

// GetByVehicleID gets fuel logs by vehicle ID
func (s *fuelLogService) GetByVehicleID(userID, vehicleID uint, limit, offset int) ([]dto.FuelLogResponse, error) {
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

	logs, err := s.fuelLogRepo.GetByVehicleID(vehicleID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get fuel logs: %w", err)
	}

	responses := make([]dto.FuelLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, nil
}

// GetCurrentFuelLevel gets current fuel level for vehicle
func (s *fuelLogService) GetCurrentFuelLevel(userID, vehicleID uint) (*dto.FuelLogResponse, error) {
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

	log, err := s.fuelLogRepo.GetLatestByVehicleID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("no fuel data found")
		}
		return nil, fmt.Errorf("failed to get current fuel level: %w", err)
	}

	return s.entityToResponse(log), nil
}

// GetFuelStatistics gets fuel statistics for vehicle
func (s *fuelLogService) GetFuelStatistics(userID, vehicleID uint, startDate, endDate time.Time) (*dto.FuelStatisticsResponse, error) {
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

	stats, err := s.fuelLogRepo.GetFuelStatistics(vehicleID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get fuel statistics: %w", err)
	}

	return &dto.FuelStatisticsResponse{
		VehicleID:        vehicleID,
		AverageFuelLevel: stats["average_fuel_level"].(float64),
		MinFuelLevel:     stats["min_fuel_level"].(float64),
		MaxFuelLevel:     stats["max_fuel_level"].(float64),
		CurrentFuelLevel: stats["current_fuel_level"].(float64),
		TotalEntries:     stats["total_entries"].(int64),
	}, nil
}

// GetAll gets all fuel logs (admin only)
func (s *fuelLogService) GetAll(limit, offset int) ([]dto.FuelLogResponse, error) {
	logs, err := s.fuelLogRepo.GetAll(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get all fuel logs: %w", err)
	}

	responses := make([]dto.FuelLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = *s.entityToResponse(&log)
	}

	return responses, nil
}

// entityToResponse converts entity to response DTO
func (s *fuelLogService) entityToResponse(log *entity.FuelLog) *dto.FuelLogResponse {
	return &dto.FuelLogResponse{
		ID:        log.ID,
		VehicleID: log.VehicleID,
		FuelLevel: log.FuelLevel,
		CreatedAt: log.CreatedAt,
	}
}
