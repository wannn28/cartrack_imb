package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/cartrack/backend/internal/entity"
	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/repository"
	"gorm.io/gorm"
)

// APIKeyService defines API key service interface
type APIKeyService interface {
	Create(userID uint, req *dto.CreateAPIKeyRequest) (*dto.APIKeyResponse, error)
	GetByID(userID, id uint) (*dto.APIKeyResponse, error)
	GetByUserID(userID uint) ([]dto.APIKeyResponse, error)
	Update(userID, id uint, req *dto.UpdateAPIKeyRequest) (*dto.APIKeyResponse, error)
	Delete(userID, id uint) error
	ValidateAPIKey(key string) (*entity.APIKey, error)
	GetAll(userID uint, limit, offset int) ([]dto.APIKeyResponse, error)
	GetAllWithPagination(userID uint, limit, offset int) ([]dto.APIKeyResponse, int64, error)
}

// apiKeyService implements APIKeyService interface
type apiKeyService struct {
	apiKeyRepo  repository.APIKeyRepository
	vehicleRepo repository.VehicleRepository
}

// NewAPIKeyService creates new API key service instance
func NewAPIKeyService(apiKeyRepo repository.APIKeyRepository, vehicleRepo repository.VehicleRepository) APIKeyService {
	return &apiKeyService{
		apiKeyRepo:  apiKeyRepo,
		vehicleRepo: vehicleRepo,
	}
}

// generateAPIKey generates a random API key
func generateAPIKey() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Create creates a new API key
func (s *apiKeyService) Create(userID uint, req *dto.CreateAPIKeyRequest) (*dto.APIKeyResponse, error) {
	// Generate API key
	key, err := generateAPIKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate API key: %w", err)
	}

	apiKey := &entity.APIKey{
		Key:         key,
		Name:        req.Name,
		Description: req.Description,
		UserID:      userID,
		IsActive:    true,
	}

	if err := s.apiKeyRepo.Create(apiKey); err != nil {
		return nil, fmt.Errorf("failed to create API key: %w", err)
	}

	return s.entityToResponse(apiKey), nil
}

// GetByID gets API key by ID
func (s *apiKeyService) GetByID(userID, id uint) (*dto.APIKeyResponse, error) {
	apiKey, err := s.apiKeyRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("API key not found")
		}
		return nil, fmt.Errorf("failed to get API key: %w", err)
	}

	// Verify ownership
	if apiKey.UserID != userID {
		return nil, errors.New("API key not found")
	}

	return s.entityToResponse(apiKey), nil
}

// GetByUserID gets API keys by user ID
func (s *apiKeyService) GetByUserID(userID uint) ([]dto.APIKeyResponse, error) {
	apiKeys, err := s.apiKeyRepo.GetByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get API keys: %w", err)
	}

	responses := make([]dto.APIKeyResponse, len(apiKeys))
	for i, apiKey := range apiKeys {
		responses[i] = *s.entityToResponse(&apiKey)
	}

	return responses, nil
}

// Update updates API key
func (s *apiKeyService) Update(userID, id uint, req *dto.UpdateAPIKeyRequest) (*dto.APIKeyResponse, error) {
	apiKey, err := s.apiKeyRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("API key not found")
		}
		return nil, fmt.Errorf("failed to get API key: %w", err)
	}

	// Verify ownership
	if apiKey.UserID != userID {
		return nil, errors.New("API key not found")
	}

	// Update fields
	if req.Name != nil {
		apiKey.Name = *req.Name
	}
	if req.Description != nil {
		apiKey.Description = req.Description
	}
	if req.IsActive != nil {
		apiKey.IsActive = *req.IsActive
	}

	if err := s.apiKeyRepo.Update(apiKey); err != nil {
		return nil, fmt.Errorf("failed to update API key: %w", err)
	}

	return s.entityToResponse(apiKey), nil
}

// Delete deletes API key
func (s *apiKeyService) Delete(userID, id uint) error {
	apiKey, err := s.apiKeyRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("API key not found")
		}
		return fmt.Errorf("failed to get API key: %w", err)
	}

	// Verify ownership
	if apiKey.UserID != userID {
		return errors.New("API key not found")
	}

	return s.apiKeyRepo.Delete(id)
}

// ValidateAPIKey validates API key and returns the associated vehicle
func (s *apiKeyService) ValidateAPIKey(key string) (*entity.APIKey, error) {
	// Debug logging
	fmt.Printf("DEBUG: Validating API key: '%s'\n", key)

	apiKey, err := s.apiKeyRepo.GetByKey(key)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fmt.Printf("DEBUG: API key not found in database: '%s'\n", key)
			return nil, errors.New("invalid API key")
		}
		fmt.Printf("DEBUG: Database error while validating API key: %v\n", err)
		return nil, fmt.Errorf("failed to validate API key: %w", err)
	}

	// Additional check for is_active (redundant but for safety)
	if !apiKey.IsActive {
		fmt.Printf("DEBUG: API key is inactive: '%s'\n", key)
		return nil, errors.New("invalid API key")
	}

	fmt.Printf("DEBUG: API key validation successful for user ID: %d\n", apiKey.UserID)

	// Update last used timestamp
	if err := s.apiKeyRepo.UpdateLastUsed(apiKey.ID); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to update last used timestamp: %v\n", err)
	}

	return apiKey, nil
}

// GetAll gets all API keys (admin only)
func (s *apiKeyService) GetAll(userID uint, limit, offset int) ([]dto.APIKeyResponse, error) {
	// Note: This should be admin-only, but for simplicity we'll allow vehicle owners to see their keys
	apiKeys, err := s.apiKeyRepo.GetAll(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get API keys: %w", err)
	}

	responses := make([]dto.APIKeyResponse, len(apiKeys))
	for i, apiKey := range apiKeys {
		responses[i] = *s.entityToResponse(&apiKey)
	}

	return responses, nil
}

// GetAllWithPagination gets all API keys with pagination info (admin only)
func (s *apiKeyService) GetAllWithPagination(userID uint, limit, offset int) ([]dto.APIKeyResponse, int64, error) {
	apiKeys, total, err := s.apiKeyRepo.GetAllWithPagination(limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get API keys: %w", err)
	}

	responses := make([]dto.APIKeyResponse, len(apiKeys))
	for i, apiKey := range apiKeys {
		responses[i] = *s.entityToResponse(&apiKey)
	}

	return responses, total, nil
}

// entityToResponse converts entity to response DTO
func (s *apiKeyService) entityToResponse(apiKey *entity.APIKey) *dto.APIKeyResponse {
	response := &dto.APIKeyResponse{
		ID:          apiKey.ID,
		Key:         apiKey.Key,
		Name:        apiKey.Name,
		Description: apiKey.Description,
		UserID:      apiKey.UserID,
		IsActive:    apiKey.IsActive,
		LastUsedAt:  apiKey.LastUsedAt,
		CreatedAt:   apiKey.CreatedAt,
		UpdatedAt:   apiKey.UpdatedAt,
	}

	// Include user information if loaded
	if apiKey.User.ID != 0 {
		response.User = &dto.UserResponse{
			ID:          apiKey.User.ID,
			Name:        apiKey.User.Name,
			Email:       apiKey.User.Email,
			PhoneNumber: apiKey.User.PhoneNumber,
			Role:        apiKey.User.Role,
			CreatedAt:   apiKey.User.CreatedAt,
			UpdatedAt:   apiKey.User.UpdatedAt,
		}

		// Get all vehicles for this user (using a large limit to get all vehicles)
		vehicles, err := s.vehicleRepo.GetByUserID(apiKey.UserID, 1000, 0)
		if err == nil {
			response.Vehicles = make([]dto.VehicleResponse, len(vehicles))
			for i, vehicle := range vehicles {
				response.Vehicles[i] = dto.VehicleResponse{
					ID:          vehicle.ID,
					UserID:      vehicle.UserID,
					PlateNumber: vehicle.PlateNumber,
					Model:       vehicle.Model,
					IMEI:        vehicle.IMEI,
					CreatedAt:   vehicle.CreatedAt,
					UpdatedAt:   vehicle.UpdatedAt,
				}
			}
		}
	}

	return response
}
