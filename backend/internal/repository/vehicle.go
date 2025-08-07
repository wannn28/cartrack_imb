package repository

import (
	"github.com/cartrack/backend/internal/entity"
	"gorm.io/gorm"
)

// VehicleRepository defines vehicle repository interface
type VehicleRepository interface {
	Create(vehicle *entity.Vehicle) error
	GetByID(id uint) (*entity.Vehicle, error)
	GetByUserID(userID uint, limit, offset int) ([]entity.Vehicle, error)
	GetByPlateNumber(plateNumber string) (*entity.Vehicle, error)
	GetByIMEI(imei string) (*entity.Vehicle, error)
	Update(vehicle *entity.Vehicle) error
	Delete(id uint) error
	GetAll(limit, offset int) ([]entity.Vehicle, error)
	CountByUserID(userID uint) (int64, error)
	Count() (int64, error)
	GetWithLatestLocation(vehicleID uint) (*entity.Vehicle, error)
	GetAllWithLatestLocation(userID uint, limit, offset int) ([]entity.Vehicle, error)
}

// vehicleRepository implements VehicleRepository interface
type vehicleRepository struct {
	db *gorm.DB
}

// NewVehicleRepository creates new vehicle repository instance
func NewVehicleRepository(db *gorm.DB) VehicleRepository {
	return &vehicleRepository{db: db}
}

// Create creates a new vehicle
func (r *vehicleRepository) Create(vehicle *entity.Vehicle) error {
	return r.db.Create(vehicle).Error
}

// GetByID gets vehicle by ID
func (r *vehicleRepository) GetByID(id uint) (*entity.Vehicle, error) {
	var vehicle entity.Vehicle
	err := r.db.Preload("User").First(&vehicle, id).Error
	if err != nil {
		return nil, err
	}
	return &vehicle, nil
}

// GetByUserID gets vehicles by user ID with pagination
func (r *vehicleRepository) GetByUserID(userID uint, limit, offset int) ([]entity.Vehicle, error) {
	var vehicles []entity.Vehicle
	err := r.db.Where("user_id = ?", userID).
		Preload("User").
		Limit(limit).Offset(offset).
		Find(&vehicles).Error
	return vehicles, err
}

// GetByPlateNumber gets vehicle by plate number
func (r *vehicleRepository) GetByPlateNumber(plateNumber string) (*entity.Vehicle, error) {
	var vehicle entity.Vehicle
	err := r.db.Where("plate_number = ?", plateNumber).
		Preload("User").
		First(&vehicle).Error
	if err != nil {
		return nil, err
	}
	return &vehicle, nil
}

// GetByIMEI gets vehicle by IMEI
func (r *vehicleRepository) GetByIMEI(imei string) (*entity.Vehicle, error) {
	var vehicle entity.Vehicle
	err := r.db.Where("imei = ?", imei).
		Preload("User").
		First(&vehicle).Error
	if err != nil {
		return nil, err
	}
	return &vehicle, nil
}

// Update updates vehicle data
func (r *vehicleRepository) Update(vehicle *entity.Vehicle) error {
	return r.db.Save(vehicle).Error
}

// Delete soft deletes vehicle by ID
func (r *vehicleRepository) Delete(id uint) error {
	return r.db.Delete(&entity.Vehicle{}, id).Error
}

// GetAll gets all vehicles with pagination
func (r *vehicleRepository) GetAll(limit, offset int) ([]entity.Vehicle, error) {
	var vehicles []entity.Vehicle
	err := r.db.Preload("User").
		Limit(limit).Offset(offset).
		Find(&vehicles).Error
	return vehicles, err
}

// CountByUserID counts vehicles by user ID
func (r *vehicleRepository) CountByUserID(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.Vehicle{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

// Count counts all vehicles
func (r *vehicleRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.Vehicle{}).Count(&count).Error
	return count, err
}

// GetWithLatestLocation gets vehicle with its latest location
func (r *vehicleRepository) GetWithLatestLocation(vehicleID uint) (*entity.Vehicle, error) {
	var vehicle entity.Vehicle
	err := r.db.Preload("User").
		Preload("LocationLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("timestamp DESC").Limit(1)
		}).
		First(&vehicle, vehicleID).Error
	if err != nil {
		return nil, err
	}
	return &vehicle, nil
}

// GetAllWithLatestLocation gets all vehicles with their latest location
func (r *vehicleRepository) GetAllWithLatestLocation(userID uint, limit, offset int) ([]entity.Vehicle, error) {
	var vehicles []entity.Vehicle
	query := r.db.Preload("User").
		Preload("LocationLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("timestamp DESC").Limit(1)
		})

	if userID > 0 {
		query = query.Where("user_id = ?", userID)
	}

	err := query.Limit(limit).Offset(offset).Find(&vehicles).Error
	return vehicles, err
}
