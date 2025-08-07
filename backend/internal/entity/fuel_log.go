package entity

import (
	"time"

	"gorm.io/gorm"
)

// FuelLog represents fuel log entity in the system
type FuelLog struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	VehicleID uint           `json:"vehicle_id" gorm:"not null"`
	FuelLevel float64        `json:"fuel_level" gorm:"type:decimal(5,2);not null"`
	Timestamp time.Time      `json:"timestamp" gorm:"default:now()"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	Vehicle Vehicle `json:"vehicle" gorm:"foreignKey:VehicleID"`
}

// TableName returns the table name for FuelLog entity
func (FuelLog) TableName() string {
	return "fuel_logs"
}
