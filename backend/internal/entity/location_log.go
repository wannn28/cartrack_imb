package entity

import (
	"time"

	"gorm.io/gorm"
)

// LocationLog represents location log entity in the system
type LocationLog struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	VehicleID uint           `json:"vehicle_id" gorm:"not null"`
	Latitude  float64        `json:"latitude" gorm:"type:decimal(10,6);not null"`
	Longitude float64        `json:"longitude" gorm:"type:decimal(10,6);not null"`
	Speed     *float64       `json:"speed" gorm:"type:decimal(5,2)"`
	Direction *int16         `json:"direction" gorm:"type:smallint"`
	Timestamp time.Time      `json:"timestamp" gorm:"default:now()"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	Vehicle Vehicle `json:"vehicle" gorm:"foreignKey:VehicleID"`
}

// TableName returns the table name for LocationLog entity
func (LocationLog) TableName() string {
	return "location_logs"
}
