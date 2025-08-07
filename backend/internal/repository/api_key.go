package repository

import (
	"time"

	"github.com/cartrack/backend/internal/entity"
	"gorm.io/gorm"
)

// APIKeyRepository defines API key repository interface
type APIKeyRepository interface {
	Create(apiKey *entity.APIKey) error
	GetByID(id uint) (*entity.APIKey, error)
	GetByKey(key string) (*entity.APIKey, error)
	GetByUserID(userID uint) ([]entity.APIKey, error)
	Update(apiKey *entity.APIKey) error
	Delete(id uint) error
	UpdateLastUsed(id uint) error
	GetAll(limit, offset int) ([]entity.APIKey, error)
	GetAllWithPagination(limit, offset int) ([]entity.APIKey, int64, error)
}

// apiKeyRepository implements APIKeyRepository interface
type apiKeyRepository struct {
	db *gorm.DB
}

// NewAPIKeyRepository creates new API key repository instance
func NewAPIKeyRepository(db *gorm.DB) APIKeyRepository {
	return &apiKeyRepository{db: db}
}

// Create creates a new API key
func (r *apiKeyRepository) Create(apiKey *entity.APIKey) error {
	return r.db.Create(apiKey).Error
}

// GetByID gets API key by ID
func (r *apiKeyRepository) GetByID(id uint) (*entity.APIKey, error) {
	var apiKey entity.APIKey
	err := r.db.Preload("User").First(&apiKey, id).Error
	if err != nil {
		return nil, err
	}
	return &apiKey, nil
}

// GetByKey gets API key by key string
func (r *apiKeyRepository) GetByKey(key string) (*entity.APIKey, error) {
	var apiKey entity.APIKey
	err := r.db.Preload("User").Where("key = ? AND is_active = ?", key, true).First(&apiKey).Error
	if err != nil {
		return nil, err
	}
	return &apiKey, nil
}

// GetByUserID gets API keys by user ID
func (r *apiKeyRepository) GetByUserID(userID uint) ([]entity.APIKey, error) {
	var apiKeys []entity.APIKey
	err := r.db.Preload("User").Where("user_id = ?", userID).Find(&apiKeys).Error
	return apiKeys, err
}

// Update updates API key data
func (r *apiKeyRepository) Update(apiKey *entity.APIKey) error {
	return r.db.Save(apiKey).Error
}

// Delete soft deletes API key by ID
func (r *apiKeyRepository) Delete(id uint) error {
	return r.db.Delete(&entity.APIKey{}, id).Error
}

// UpdateLastUsed updates the last used timestamp
func (r *apiKeyRepository) UpdateLastUsed(id uint) error {
	now := time.Now()
	return r.db.Model(&entity.APIKey{}).Where("id = ?", id).Update("last_used_at", now).Error
}

// GetAll gets all API keys with pagination
func (r *apiKeyRepository) GetAll(limit, offset int) ([]entity.APIKey, error) {
	var apiKeys []entity.APIKey
	err := r.db.Preload("User").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&apiKeys).Error
	return apiKeys, err
}

// GetAllWithPagination gets all API keys with pagination info
func (r *apiKeyRepository) GetAllWithPagination(limit, offset int) ([]entity.APIKey, int64, error) {
	var apiKeys []entity.APIKey
	var total int64

	// Get total count
	err := r.db.Model(&entity.APIKey{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get paginated data
	err = r.db.Preload("User").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&apiKeys).Error

	return apiKeys, total, err
}
