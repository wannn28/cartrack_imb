package repository

import (
	"github.com/cartrack/backend/internal/entity"
	"gorm.io/gorm"
)

type DashboardRepository interface {
	GetTotalVehicles() (int, error)
	GetTotalAPIKeys() (int, error)
	GetTotalFuelLogs() (int, error)
	GetTotalLocationLogs() (int, error)
	GetTotalUsers() (int, error)
	GetTotalAdmins() (int, error)
	GetTotalCustomers() (int, error)
	GetTotalVehiclesByUser(userID uint) (int, error)
	GetTotalAPIKeysByUser(userID uint) (int, error)
	GetTotalFuelLogsByUser(userID uint) (int, error)
	GetTotalLocationLogsByUser(userID uint) (int, error)
	GetTotalDashboardByUser(userID uint) (entity.Dashboard, error)
	GetTotalDashboardByAdmin() (entity.Dashboard, error)
}

type dashboardRepository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) DashboardRepository {
	return &dashboardRepository{db: db}
}

func (r *dashboardRepository) GetTotalVehicles() (int, error) {
	var total int64
	err := r.db.Model(&entity.Vehicle{}).Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalAPIKeys() (int, error) {
	var total int64
	err := r.db.Model(&entity.APIKey{}).Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalFuelLogs() (int, error) {
	var total int64
	err := r.db.Model(&entity.FuelLog{}).Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalLocationLogs() (int, error) {
	var total int64
	err := r.db.Model(&entity.LocationLog{}).Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalUsers() (int, error) {
	var total int64
	err := r.db.Model(&entity.User{}).Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalAdmins() (int, error) {
	var total int64
	err := r.db.Model(&entity.User{}).Where("role = ?", "admin").Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalCustomers() (int, error) {
	var total int64
	err := r.db.Model(&entity.User{}).Where("role = ?", "customer").Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalVehiclesByUser(userID uint) (int, error) {
	var total int64
	err := r.db.Model(&entity.Vehicle{}).Where("user_id = ?", userID).Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalAPIKeysByUser(userID uint) (int, error) {
	var total int64
	err := r.db.Model(&entity.APIKey{}).Where("user_id = ?", userID).Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalFuelLogsByUser(userID uint) (int, error) {
	var total int64
	err := r.db.Model(&entity.FuelLog{}).
		Joins("JOIN vehicles ON fuel_logs.vehicle_id = vehicles.id").
		Where("vehicles.user_id = ?", userID).
		Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalLocationLogsByUser(userID uint) (int, error) {
	var total int64
	err := r.db.Model(&entity.LocationLog{}).
		Joins("JOIN vehicles ON location_logs.vehicle_id = vehicles.id").
		Where("vehicles.user_id = ?", userID).
		Count(&total).Error
	return int(total), err
}

func (r *dashboardRepository) GetTotalDashboardByUser(userID uint) (entity.Dashboard, error) {
	var dashboard entity.Dashboard
	var err error

	dashboard.TotalVehicles, err = r.GetTotalVehiclesByUser(userID)
	if err != nil {
		return dashboard, err
	}

	dashboard.TotalAPIKeys, err = r.GetTotalAPIKeysByUser(userID)
	if err != nil {
		return dashboard, err
	}

	dashboard.TotalFuelLogs, err = r.GetTotalFuelLogsByUser(userID)
	if err != nil {
		return dashboard, err
	}

	dashboard.TotalLocationLogs, err = r.GetTotalLocationLogsByUser(userID)
	if err != nil {
		return dashboard, err
	}
	return dashboard, nil
}

func (r *dashboardRepository) GetTotalDashboardByAdmin() (entity.Dashboard, error) {
	var dashboard entity.Dashboard
	var err error

	dashboard.TotalVehicles, err = r.GetTotalVehicles()
	if err != nil {
		return dashboard, err
	}

	dashboard.TotalAPIKeys, err = r.GetTotalAPIKeys()
	if err != nil {
		return dashboard, err
	}

	dashboard.TotalFuelLogs, err = r.GetTotalFuelLogs()
	if err != nil {
		return dashboard, err
	}

	dashboard.TotalLocationLogs, err = r.GetTotalLocationLogs()
	if err != nil {
		return dashboard, err
	}
	dashboard.TotalUsers, err = r.GetTotalUsers()
	if err != nil {
		return dashboard, err
	}
	dashboard.TotalAdmins, err = r.GetTotalAdmins()
	if err != nil {
		return dashboard, err
	}
	dashboard.TotalCustomers, err = r.GetTotalCustomers()
	if err != nil {
		return dashboard, err
	}
	return dashboard, nil
}
