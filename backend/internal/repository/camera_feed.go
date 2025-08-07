package repository

import (
	"time"

	"github.com/cartrack/backend/internal/entity"
	"gorm.io/gorm"
)

// CameraFeedRepository defines camera feed repository interface
type CameraFeedRepository interface {
	Create(cameraFeed *entity.CameraFeed) error
	GetByID(id uint) (*entity.CameraFeed, error)
	GetByVehicleID(vehicleID uint, limit, offset int) ([]entity.CameraFeed, error)
	GetByVehicleIDAndDateRange(vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]entity.CameraFeed, error)
	GetLatestByVehicleID(vehicleID uint) (*entity.CameraFeed, error)
	Update(cameraFeed *entity.CameraFeed) error
	Delete(id uint) error
	GetAll(limit, offset int) ([]entity.CameraFeed, error)
	CountByVehicleID(vehicleID uint) (int64, error)
	Count() (int64, error)
	GetActiveFeedsByVehicleID(vehicleID uint) ([]entity.CameraFeed, error)
}

// cameraFeedRepository implements CameraFeedRepository interface
type cameraFeedRepository struct {
	db *gorm.DB
}

// NewCameraFeedRepository creates new camera feed repository instance
func NewCameraFeedRepository(db *gorm.DB) CameraFeedRepository {
	return &cameraFeedRepository{db: db}
}

// Create creates a new camera feed
func (r *cameraFeedRepository) Create(cameraFeed *entity.CameraFeed) error {
	return r.db.Create(cameraFeed).Error
}

// GetByID gets camera feed by ID
func (r *cameraFeedRepository) GetByID(id uint) (*entity.CameraFeed, error) {
	var cameraFeed entity.CameraFeed
	err := r.db.Preload("Vehicle").First(&cameraFeed, id).Error
	if err != nil {
		return nil, err
	}
	return &cameraFeed, nil
}

// GetByVehicleID gets camera feeds by vehicle ID with pagination
func (r *cameraFeedRepository) GetByVehicleID(vehicleID uint, limit, offset int) ([]entity.CameraFeed, error) {
	var cameraFeeds []entity.CameraFeed
	err := r.db.Where("vehicle_id = ?", vehicleID).
		Preload("Vehicle").
		Order("captured_at DESC").
		Limit(limit).Offset(offset).
		Find(&cameraFeeds).Error
	return cameraFeeds, err
}

// GetByVehicleIDAndDateRange gets camera feeds by vehicle ID and date range
func (r *cameraFeedRepository) GetByVehicleIDAndDateRange(vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]entity.CameraFeed, error) {
	var cameraFeeds []entity.CameraFeed
	err := r.db.Where("vehicle_id = ? AND captured_at BETWEEN ? AND ?", vehicleID, startDate, endDate).
		Preload("Vehicle").
		Order("captured_at DESC").
		Limit(limit).Offset(offset).
		Find(&cameraFeeds).Error
	return cameraFeeds, err
}

// GetLatestByVehicleID gets latest camera feed by vehicle ID
func (r *cameraFeedRepository) GetLatestByVehicleID(vehicleID uint) (*entity.CameraFeed, error) {
	var cameraFeed entity.CameraFeed
	err := r.db.Where("vehicle_id = ?", vehicleID).
		Preload("Vehicle").
		Order("captured_at DESC").
		First(&cameraFeed).Error
	if err != nil {
		return nil, err
	}
	return &cameraFeed, nil
}

// Update updates camera feed data
func (r *cameraFeedRepository) Update(cameraFeed *entity.CameraFeed) error {
	return r.db.Save(cameraFeed).Error
}

// Delete soft deletes camera feed by ID
func (r *cameraFeedRepository) Delete(id uint) error {
	return r.db.Delete(&entity.CameraFeed{}, id).Error
}

// GetAll gets all camera feeds with pagination
func (r *cameraFeedRepository) GetAll(limit, offset int) ([]entity.CameraFeed, error) {
	var cameraFeeds []entity.CameraFeed
	err := r.db.Preload("Vehicle").
		Order("captured_at DESC").
		Limit(limit).Offset(offset).
		Find(&cameraFeeds).Error
	return cameraFeeds, err
}

// CountByVehicleID counts camera feeds by vehicle ID
func (r *cameraFeedRepository) CountByVehicleID(vehicleID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.CameraFeed{}).Where("vehicle_id = ?", vehicleID).Count(&count).Error
	return count, err
}

// Count counts all camera feeds
func (r *cameraFeedRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.CameraFeed{}).Count(&count).Error
	return count, err
}

// GetActiveFeedsByVehicleID gets active camera feeds by vehicle ID (feeds from last 24 hours)
func (r *cameraFeedRepository) GetActiveFeedsByVehicleID(vehicleID uint) ([]entity.CameraFeed, error) {
	var cameraFeeds []entity.CameraFeed
	yesterday := time.Now().Add(-24 * time.Hour)

	err := r.db.Where("vehicle_id = ? AND captured_at >= ?", vehicleID, yesterday).
		Preload("Vehicle").
		Order("captured_at DESC").
		Find(&cameraFeeds).Error
	return cameraFeeds, err
}
