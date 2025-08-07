package repository

import (
	"time"

	"github.com/cartrack/backend/internal/entity"
	"gorm.io/gorm"
)

// LocationLogRepository defines location log repository interface
type LocationLogRepository interface {
	Create(locationLog *entity.LocationLog) error
	GetByID(id uint) (*entity.LocationLog, error)
	GetByVehicleID(vehicleID uint, limit, offset int) ([]entity.LocationLog, error)
	GetByVehicleIDWithPagination(vehicleID uint, limit, offset int) ([]entity.LocationLog, int64, error)
	GetByVehicleIDAndDateRange(vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]entity.LocationLog, error)
	GetByVehicleIDAndDateRangeWithPagination(vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]entity.LocationLog, int64, error)
	GetByUserIDWithPagination(userID uint, limit, offset int) ([]entity.LocationLog, int64, error)
	GetLatestByVehicleID(vehicleID uint) (*entity.LocationLog, error)
	Update(locationLog *entity.LocationLog) error
	Delete(id uint) error
	GetAll(limit, offset int) ([]entity.LocationLog, error)
	GetAllWithPagination(limit, offset int) ([]entity.LocationLog, int64, error)
	CountByVehicleID(vehicleID uint) (int64, error)
	Count() (int64, error)
	GetLocationHistory(vehicleID uint, startDate, endDate time.Time) ([]entity.LocationLog, error)
}

// locationLogRepository implements LocationLogRepository interface
type locationLogRepository struct {
	db *gorm.DB
}

// NewLocationLogRepository creates new location log repository instance
func NewLocationLogRepository(db *gorm.DB) LocationLogRepository {
	return &locationLogRepository{db: db}
}

// Create creates a new location log
func (r *locationLogRepository) Create(locationLog *entity.LocationLog) error {
	return r.db.Create(locationLog).Error
}

// GetByID gets location log by ID
func (r *locationLogRepository) GetByID(id uint) (*entity.LocationLog, error) {
	var locationLog entity.LocationLog
	err := r.db.Preload("Vehicle").First(&locationLog, id).Error
	if err != nil {
		return nil, err
	}
	return &locationLog, nil
}

// GetByVehicleID gets location logs by vehicle ID with pagination
func (r *locationLogRepository) GetByVehicleID(vehicleID uint, limit, offset int) ([]entity.LocationLog, error) {
	var locationLogs []entity.LocationLog
	err := r.db.Where("vehicle_id = ?", vehicleID).
		Preload("Vehicle").
		Order("timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&locationLogs).Error
	return locationLogs, err
}

// GetByVehicleIDWithPagination gets location logs by vehicle ID with pagination info
func (r *locationLogRepository) GetByVehicleIDWithPagination(vehicleID uint, limit, offset int) ([]entity.LocationLog, int64, error) {
	var locationLogs []entity.LocationLog
	var total int64

	// Get total count
	err := r.db.Model(&entity.LocationLog{}).Where("vehicle_id = ?", vehicleID).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get paginated data
	err = r.db.Where("vehicle_id = ?", vehicleID).
		Preload("Vehicle").
		Order("timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&locationLogs).Error

	return locationLogs, total, err
}

// GetByVehicleIDAndDateRange gets location logs by vehicle ID and date range
func (r *locationLogRepository) GetByVehicleIDAndDateRange(vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]entity.LocationLog, error) {
	var locationLogs []entity.LocationLog
	err := r.db.Where("vehicle_id = ? AND timestamp BETWEEN ? AND ?", vehicleID, startDate, endDate).
		Preload("Vehicle").
		Order("timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&locationLogs).Error
	return locationLogs, err
}

// GetByVehicleIDAndDateRangeWithPagination gets location logs by vehicle ID and date range with pagination info
func (r *locationLogRepository) GetByVehicleIDAndDateRangeWithPagination(vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]entity.LocationLog, int64, error) {
	var locationLogs []entity.LocationLog
	var total int64

	// Get total count
	err := r.db.Model(&entity.LocationLog{}).Where("vehicle_id = ? AND timestamp BETWEEN ? AND ?", vehicleID, startDate, endDate).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get paginated data
	err = r.db.Where("vehicle_id = ? AND timestamp BETWEEN ? AND ?", vehicleID, startDate, endDate).
		Preload("Vehicle").
		Order("timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&locationLogs).Error

	return locationLogs, total, err
}

// GetByUserIDWithPagination gets location logs by user ID with pagination info
func (r *locationLogRepository) GetByUserIDWithPagination(userID uint, limit, offset int) ([]entity.LocationLog, int64, error) {
	var locationLogs []entity.LocationLog
	var total int64

	// Get total count by joining with vehicles table
	err := r.db.Model(&entity.LocationLog{}).
		Joins("JOIN vehicles ON location_logs.vehicle_id = vehicles.id").
		Where("vehicles.user_id = ?", userID).
		Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get paginated data by joining with vehicles table
	err = r.db.Joins("JOIN vehicles ON location_logs.vehicle_id = vehicles.id").
		Where("vehicles.user_id = ?", userID).
		Preload("Vehicle").
		Order("location_logs.timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&locationLogs).Error

	return locationLogs, total, err
}

// GetLatestByVehicleID gets latest location log by vehicle ID
func (r *locationLogRepository) GetLatestByVehicleID(vehicleID uint) (*entity.LocationLog, error) {
	var locationLog entity.LocationLog
	err := r.db.Where("vehicle_id = ?", vehicleID).
		Preload("Vehicle").
		Order("timestamp DESC").
		First(&locationLog).Error
	if err != nil {
		return nil, err
	}
	return &locationLog, nil
}

// Update updates location log data
func (r *locationLogRepository) Update(locationLog *entity.LocationLog) error {
	return r.db.Save(locationLog).Error
}

// Delete soft deletes location log by ID
func (r *locationLogRepository) Delete(id uint) error {
	return r.db.Delete(&entity.LocationLog{}, id).Error
}

// GetAll gets all location logs with pagination
func (r *locationLogRepository) GetAll(limit, offset int) ([]entity.LocationLog, error) {
	var locationLogs []entity.LocationLog
	err := r.db.Preload("Vehicle").
		Order("timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&locationLogs).Error
	return locationLogs, err
}

// GetAllWithPagination gets all location logs with pagination info
func (r *locationLogRepository) GetAllWithPagination(limit, offset int) ([]entity.LocationLog, int64, error) {
	var locationLogs []entity.LocationLog
	var total int64

	// Get total count
	err := r.db.Model(&entity.LocationLog{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get paginated data
	err = r.db.Preload("Vehicle").
		Order("timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&locationLogs).Error

	return locationLogs, total, err
}

// CountByVehicleID counts location logs by vehicle ID
func (r *locationLogRepository) CountByVehicleID(vehicleID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.LocationLog{}).Where("vehicle_id = ?", vehicleID).Count(&count).Error
	return count, err
}

// Count counts all location logs
func (r *locationLogRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.LocationLog{}).Count(&count).Error
	return count, err
}

// GetLocationHistory gets location history for tracking purposes
func (r *locationLogRepository) GetLocationHistory(vehicleID uint, startDate, endDate time.Time) ([]entity.LocationLog, error) {
	var locationLogs []entity.LocationLog
	err := r.db.Where("vehicle_id = ? AND timestamp BETWEEN ? AND ?", vehicleID, startDate, endDate).
		Preload("Vehicle").
		Order("timestamp ASC").
		Find(&locationLogs).Error
	return locationLogs, err
}
