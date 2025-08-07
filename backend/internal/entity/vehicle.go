package entity

import (
	"time"

	"gorm.io/gorm"
)

// Vehicle represents vehicle entity in the system
type Vehicle struct {
	ID          uint           `json:"id" gorm:"primarykey"`
	UserID      uint           `json:"user_id" gorm:"not null"`
	PlateNumber string         `json:"plate_number" gorm:"type:varchar(20);not null"`
	Model       *string        `json:"model" gorm:"type:varchar(100)"`
	IMEI        *string        `json:"imei" gorm:"type:varchar(50);unique"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	User         User          `json:"user" gorm:"foreignKey:UserID"`
	LocationLogs []LocationLog `json:"location_logs,omitempty" gorm:"foreignKey:VehicleID"`
	FuelLogs     []FuelLog     `json:"fuel_logs,omitempty" gorm:"foreignKey:VehicleID"`
	CameraFeeds  []CameraFeed  `json:"camera_feeds,omitempty" gorm:"foreignKey:VehicleID"`
	SystemLogs   []SystemLog   `json:"system_logs,omitempty" gorm:"foreignKey:VehicleID"`
}

// TableName returns the table name for Vehicle entity
func (Vehicle) TableName() string {
	return "vehicles"
}
