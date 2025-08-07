package repository

import (
	"time"

	"github.com/cartrack/backend/internal/entity"
	"gorm.io/gorm"
)

// FuelLogRepository defines fuel log repository interface
type FuelLogRepository interface {
	Create(fuelLog *entity.FuelLog) error
	GetByID(id uint) (*entity.FuelLog, error)
	GetByVehicleID(vehicleID uint, limit, offset int) ([]entity.FuelLog, error)
	GetByVehicleIDAndDateRange(vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]entity.FuelLog, error)
	GetLatestByVehicleID(vehicleID uint) (*entity.FuelLog, error)
	Update(fuelLog *entity.FuelLog) error
	Delete(id uint) error
	GetAll(limit, offset int) ([]entity.FuelLog, error)
	CountByVehicleID(vehicleID uint) (int64, error)
	Count() (int64, error)
	GetFuelStatistics(vehicleID uint, startDate, endDate time.Time) (map[string]interface{}, error)
}

// fuelLogRepository implements FuelLogRepository interface
type fuelLogRepository struct {
	db *gorm.DB
}

// NewFuelLogRepository creates new fuel log repository instance
func NewFuelLogRepository(db *gorm.DB) FuelLogRepository {
	return &fuelLogRepository{db: db}
}

// Create creates a new fuel log
func (r *fuelLogRepository) Create(fuelLog *entity.FuelLog) error {
	return r.db.Create(fuelLog).Error
}

// GetByID gets fuel log by ID
func (r *fuelLogRepository) GetByID(id uint) (*entity.FuelLog, error) {
	var fuelLog entity.FuelLog
	err := r.db.Preload("Vehicle").First(&fuelLog, id).Error
	if err != nil {
		return nil, err
	}
	return &fuelLog, nil
}

// GetByVehicleID gets fuel logs by vehicle ID with pagination
func (r *fuelLogRepository) GetByVehicleID(vehicleID uint, limit, offset int) ([]entity.FuelLog, error) {
	var fuelLogs []entity.FuelLog
	err := r.db.Where("vehicle_id = ?", vehicleID).
		Preload("Vehicle").
		Order("timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&fuelLogs).Error
	return fuelLogs, err
}

// GetByVehicleIDAndDateRange gets fuel logs by vehicle ID and date range
func (r *fuelLogRepository) GetByVehicleIDAndDateRange(vehicleID uint, startDate, endDate time.Time, limit, offset int) ([]entity.FuelLog, error) {
	var fuelLogs []entity.FuelLog
	err := r.db.Where("vehicle_id = ? AND timestamp BETWEEN ? AND ?", vehicleID, startDate, endDate).
		Preload("Vehicle").
		Order("timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&fuelLogs).Error
	return fuelLogs, err
}

// GetLatestByVehicleID gets latest fuel log by vehicle ID
func (r *fuelLogRepository) GetLatestByVehicleID(vehicleID uint) (*entity.FuelLog, error) {
	var fuelLog entity.FuelLog
	err := r.db.Where("vehicle_id = ?", vehicleID).
		Preload("Vehicle").
		Order("timestamp DESC").
		First(&fuelLog).Error
	if err != nil {
		return nil, err
	}
	return &fuelLog, nil
}

// Update updates fuel log data
func (r *fuelLogRepository) Update(fuelLog *entity.FuelLog) error {
	return r.db.Save(fuelLog).Error
}

// Delete soft deletes fuel log by ID
func (r *fuelLogRepository) Delete(id uint) error {
	return r.db.Delete(&entity.FuelLog{}, id).Error
}

// GetAll gets all fuel logs with pagination
func (r *fuelLogRepository) GetAll(limit, offset int) ([]entity.FuelLog, error) {
	var fuelLogs []entity.FuelLog
	err := r.db.Preload("Vehicle").
		Order("timestamp DESC").
		Limit(limit).Offset(offset).
		Find(&fuelLogs).Error
	return fuelLogs, err
}

// CountByVehicleID counts fuel logs by vehicle ID
func (r *fuelLogRepository) CountByVehicleID(vehicleID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.FuelLog{}).Where("vehicle_id = ?", vehicleID).Count(&count).Error
	return count, err
}

// Count counts all fuel logs
func (r *fuelLogRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.FuelLog{}).Count(&count).Error
	return count, err
}

// GetFuelStatistics gets fuel statistics for a vehicle
func (r *fuelLogRepository) GetFuelStatistics(vehicleID uint, startDate, endDate time.Time) (map[string]interface{}, error) {
	var result struct {
		AvgFuelLevel float64
		MinFuelLevel float64
		MaxFuelLevel float64
		Count        int64
	}

	err := r.db.Model(&entity.FuelLog{}).
		Select("AVG(fuel_level) as avg_fuel_level, MIN(fuel_level) as min_fuel_level, MAX(fuel_level) as max_fuel_level, COUNT(*) as count").
		Where("vehicle_id = ? AND created_at BETWEEN ? AND ?", vehicleID, startDate, endDate).
		Scan(&result).Error

	if err != nil {
		return nil, err
	}

	// Get current fuel level
	currentFuel, _ := r.GetLatestByVehicleID(vehicleID)
	currentLevel := 0.0
	if currentFuel != nil {
		currentLevel = currentFuel.FuelLevel
	}

	return map[string]interface{}{
		"average_fuel_level": result.AvgFuelLevel,
		"min_fuel_level":     result.MinFuelLevel,
		"max_fuel_level":     result.MaxFuelLevel,
		"current_fuel_level": currentLevel,
		"total_entries":      result.Count,
	}, nil
}
