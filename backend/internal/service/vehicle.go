package service

import (
	"errors"
	"fmt"

	"github.com/cartrack/backend/internal/entity"
	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/repository"
	"gorm.io/gorm"
)

// VehicleService defines vehicle service interface
type VehicleService interface {
	Create(userID uint, req *dto.CreateVehicleRequest) (*dto.VehicleResponse, error)
	GetByUserID(userID uint, limit, offset int) ([]dto.VehicleResponse, error)
	GetByID(userID, vehicleID uint) (*dto.VehicleResponse, error)
	Update(userID, vehicleID uint, req *dto.UpdateVehicleRequest) (*dto.VehicleResponse, error)
	Delete(userID, vehicleID uint) error
	GetAll(limit, offset int) ([]dto.VehicleResponse, error) // Admin only
}

// vehicleService implements VehicleService interface
type vehicleService struct {
	vehicleRepo repository.VehicleRepository
}

// NewVehicleService creates new vehicle service instance
func NewVehicleService(vehicleRepo repository.VehicleRepository) VehicleService {
	return &vehicleService{
		vehicleRepo: vehicleRepo,
	}
}

// Create creates a new vehicle
func (s *vehicleService) Create(userID uint, req *dto.CreateVehicleRequest) (*dto.VehicleResponse, error) {
	// Check if plate number already exists
	existingVehicle, err := s.vehicleRepo.GetByPlateNumber(req.PlateNumber)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing vehicle: %w", err)
	}
	if existingVehicle != nil {
		return nil, errors.New("plate number already exists")
	}

	// Check if IMEI already exists
	if req.IMEI != "" {
		existingIMEI, err := s.vehicleRepo.GetByIMEI(req.IMEI)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check existing IMEI: %w", err)
		}
		if existingIMEI != nil {
			return nil, errors.New("IMEI already exists")
		}
	}

	vehicle := &entity.Vehicle{
		UserID:      userID,
		PlateNumber: req.PlateNumber,
	}

	if req.Model != "" {
		vehicle.Model = &req.Model
	}

	if req.IMEI != "" {
		vehicle.IMEI = &req.IMEI
	}

	if err := s.vehicleRepo.Create(vehicle); err != nil {
		return nil, fmt.Errorf("failed to create vehicle: %w", err)
	}

	return s.entityToResponse(vehicle), nil
}

// GetByUserID gets vehicles by user ID with pagination
func (s *vehicleService) GetByUserID(userID uint, limit, offset int) ([]dto.VehicleResponse, error) {
	vehicles, err := s.vehicleRepo.GetByUserID(userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get vehicles: %w", err)
	}

	responses := make([]dto.VehicleResponse, len(vehicles))
	for i, vehicle := range vehicles {
		responses[i] = *s.entityToResponse(&vehicle)
	}

	return responses, nil
}

// GetByID gets vehicle by ID (with ownership check)
func (s *vehicleService) GetByID(userID, vehicleID uint) (*dto.VehicleResponse, error) {
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("vehicle not found")
		}
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}

	// If userID is 0, this is ESP32 access - skip ownership verification
	// Otherwise, check ownership
	if userID != 0 && vehicle.UserID != userID {
		return nil, errors.New("vehicle not found") // Don't reveal existence of other user's vehicles
	}

	return s.entityToResponse(vehicle), nil
}

// Update updates vehicle information
func (s *vehicleService) Update(userID, vehicleID uint, req *dto.UpdateVehicleRequest) (*dto.VehicleResponse, error) {
	// Get existing vehicle
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("vehicle not found")
		}
		return nil, fmt.Errorf("failed to get vehicle: %w", err)
	}

	// Check ownership
	if vehicle.UserID != userID {
		return nil, errors.New("vehicle not found")
	}

	// Check if new plate number already exists (exclude current vehicle)
	if req.PlateNumber != "" && req.PlateNumber != vehicle.PlateNumber {
		existing, err := s.vehicleRepo.GetByPlateNumber(req.PlateNumber)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check existing plate number: %w", err)
		}
		if existing != nil && existing.ID != vehicleID {
			return nil, errors.New("plate number already exists")
		}
		vehicle.PlateNumber = req.PlateNumber
	}

	// Check if new IMEI already exists (exclude current vehicle)
	if req.IMEI != "" && (vehicle.IMEI == nil || req.IMEI != *vehicle.IMEI) {
		existing, err := s.vehicleRepo.GetByIMEI(req.IMEI)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check existing IMEI: %w", err)
		}
		if existing != nil && existing.ID != vehicleID {
			return nil, errors.New("IMEI already exists")
		}
		vehicle.IMEI = &req.IMEI
	}

	// Update fields
	if req.Model != "" {
		vehicle.Model = &req.Model
	}

	if err := s.vehicleRepo.Update(vehicle); err != nil {
		return nil, fmt.Errorf("failed to update vehicle: %w", err)
	}

	return s.entityToResponse(vehicle), nil
}

// Delete deletes a vehicle
func (s *vehicleService) Delete(userID, vehicleID uint) error {
	// Get existing vehicle
	vehicle, err := s.vehicleRepo.GetByID(vehicleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("vehicle not found")
		}
		return fmt.Errorf("failed to get vehicle: %w", err)
	}

	// Check ownership
	if vehicle.UserID != userID {
		return errors.New("vehicle not found")
	}

	if err := s.vehicleRepo.Delete(vehicleID); err != nil {
		return fmt.Errorf("failed to delete vehicle: %w", err)
	}

	return nil
}

// GetAll gets all vehicles (admin only)
func (s *vehicleService) GetAll(limit, offset int) ([]dto.VehicleResponse, error) {
	vehicles, err := s.vehicleRepo.GetAll(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get all vehicles: %w", err)
	}

	responses := make([]dto.VehicleResponse, len(vehicles))
	for i, vehicle := range vehicles {
		responses[i] = *s.entityToResponse(&vehicle)
	}

	return responses, nil
}

// entityToResponse converts entity to response DTO
func (s *vehicleService) entityToResponse(vehicle *entity.Vehicle) *dto.VehicleResponse {
	return &dto.VehicleResponse{
		ID:          vehicle.ID,
		UserID:      vehicle.UserID,
		PlateNumber: vehicle.PlateNumber,
		Model:       vehicle.Model,
		IMEI:        vehicle.IMEI,
		CreatedAt:   vehicle.CreatedAt,
		UpdatedAt:   vehicle.UpdatedAt,
	}
}
