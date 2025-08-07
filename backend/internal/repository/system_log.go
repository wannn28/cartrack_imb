package repository

import (
	"time"

	"github.com/cartrack/backend/internal/entity"
	"gorm.io/gorm"
)

// SystemLogRepository defines system log repository interface
type SystemLogRepository interface {
	Create(systemLog *entity.SystemLog) error
	GetByID(id uint) (*entity.SystemLog, error)
	GetByVehicleID(vehicleID uint, limit, offset int) ([]entity.SystemLog, error)
	GetByLogType(logType entity.LogType, limit, offset int) ([]entity.SystemLog, error)
	GetByVehicleIDAndLogType(vehicleID uint, logType entity.LogType, limit, offset int) ([]entity.SystemLog, error)
	GetByDateRange(startDate, endDate time.Time, limit, offset int) ([]entity.SystemLog, error)
	Update(systemLog *entity.SystemLog) error
	Delete(id uint) error
	GetAll(limit, offset int) ([]entity.SystemLog, error)
	CountByVehicleID(vehicleID uint) (int64, error)
	CountByLogType(logType entity.LogType) (int64, error)
	Count() (int64, error)
	GetLogStatistics() (map[string]interface{}, error)
	GetTodayLogs(limit, offset int) ([]entity.SystemLog, error)
}

// systemLogRepository implements SystemLogRepository interface
type systemLogRepository struct {
	db *gorm.DB
}

// NewSystemLogRepository creates new system log repository instance
func NewSystemLogRepository(db *gorm.DB) SystemLogRepository {
	return &systemLogRepository{db: db}
}

// Create creates a new system log
func (r *systemLogRepository) Create(systemLog *entity.SystemLog) error {
	return r.db.Create(systemLog).Error
}

// GetByID gets system log by ID
func (r *systemLogRepository) GetByID(id uint) (*entity.SystemLog, error) {
	var systemLog entity.SystemLog
	err := r.db.Preload("Vehicle").First(&systemLog, id).Error
	if err != nil {
		return nil, err
	}
	return &systemLog, nil
}

// GetByVehicleID gets system logs by vehicle ID with pagination
func (r *systemLogRepository) GetByVehicleID(vehicleID uint, limit, offset int) ([]entity.SystemLog, error) {
	var systemLogs []entity.SystemLog
	err := r.db.Where("vehicle_id = ?", vehicleID).
		Preload("Vehicle").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&systemLogs).Error
	return systemLogs, err
}

// GetByLogType gets system logs by log type with pagination
func (r *systemLogRepository) GetByLogType(logType entity.LogType, limit, offset int) ([]entity.SystemLog, error) {
	var systemLogs []entity.SystemLog
	err := r.db.Where("log_type = ?", logType).
		Preload("Vehicle").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&systemLogs).Error
	return systemLogs, err
}

// GetByVehicleIDAndLogType gets system logs by vehicle ID and log type
func (r *systemLogRepository) GetByVehicleIDAndLogType(vehicleID uint, logType entity.LogType, limit, offset int) ([]entity.SystemLog, error) {
	var systemLogs []entity.SystemLog
	err := r.db.Where("vehicle_id = ? AND log_type = ?", vehicleID, logType).
		Preload("Vehicle").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&systemLogs).Error
	return systemLogs, err
}

// GetByDateRange gets system logs by date range
func (r *systemLogRepository) GetByDateRange(startDate, endDate time.Time, limit, offset int) ([]entity.SystemLog, error) {
	var systemLogs []entity.SystemLog
	err := r.db.Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Preload("Vehicle").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&systemLogs).Error
	return systemLogs, err
}

// Update updates system log data
func (r *systemLogRepository) Update(systemLog *entity.SystemLog) error {
	return r.db.Save(systemLog).Error
}

// Delete soft deletes system log by ID
func (r *systemLogRepository) Delete(id uint) error {
	return r.db.Delete(&entity.SystemLog{}, id).Error
}

// GetAll gets all system logs with pagination
func (r *systemLogRepository) GetAll(limit, offset int) ([]entity.SystemLog, error) {
	var systemLogs []entity.SystemLog
	err := r.db.Preload("Vehicle").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&systemLogs).Error
	return systemLogs, err
}

// CountByVehicleID counts system logs by vehicle ID
func (r *systemLogRepository) CountByVehicleID(vehicleID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.SystemLog{}).Where("vehicle_id = ?", vehicleID).Count(&count).Error
	return count, err
}

// CountByLogType counts system logs by log type
func (r *systemLogRepository) CountByLogType(logType entity.LogType) (int64, error) {
	var count int64
	err := r.db.Model(&entity.SystemLog{}).Where("log_type = ?", logType).Count(&count).Error
	return count, err
}

// Count counts all system logs
func (r *systemLogRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.SystemLog{}).Count(&count).Error
	return count, err
}

// GetLogStatistics gets system log statistics
func (r *systemLogRepository) GetLogStatistics() (map[string]interface{}, error) {
	var stats struct {
		TotalLogs    int64
		InfoLogs     int64
		WarningLogs  int64
		ErrorLogs    int64
		TodayLogs    int64
		VehicleCount int64
	}

	// Get total logs
	r.db.Model(&entity.SystemLog{}).Count(&stats.TotalLogs)

	// Get logs by type
	r.db.Model(&entity.SystemLog{}).Where("log_type = ?", entity.LogTypeInfo).Count(&stats.InfoLogs)
	r.db.Model(&entity.SystemLog{}).Where("log_type = ?", entity.LogTypeWarning).Count(&stats.WarningLogs)
	r.db.Model(&entity.SystemLog{}).Where("log_type = ?", entity.LogTypeError).Count(&stats.ErrorLogs)

	// Get today's logs
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)
	r.db.Model(&entity.SystemLog{}).Where("created_at BETWEEN ? AND ?", today, tomorrow).Count(&stats.TodayLogs)

	// Get vehicle count that have logs
	r.db.Model(&entity.SystemLog{}).Distinct("vehicle_id").Where("vehicle_id IS NOT NULL").Count(&stats.VehicleCount)

	return map[string]interface{}{
		"total_logs":    stats.TotalLogs,
		"info_logs":     stats.InfoLogs,
		"warning_logs":  stats.WarningLogs,
		"error_logs":    stats.ErrorLogs,
		"today_logs":    stats.TodayLogs,
		"vehicle_count": stats.VehicleCount,
	}, nil
}

// GetTodayLogs gets today's system logs
func (r *systemLogRepository) GetTodayLogs(limit, offset int) ([]entity.SystemLog, error) {
	var systemLogs []entity.SystemLog
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	err := r.db.Where("created_at BETWEEN ? AND ?", today, tomorrow).
		Preload("Vehicle").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&systemLogs).Error
	return systemLogs, err
}
