package entity

import (
	"time"

	"gorm.io/gorm"
)

// CameraFeed represents camera feed entity in the system
type CameraFeed struct {
	ID         uint           `json:"id" gorm:"primarykey"`
	VehicleID  uint           `json:"vehicle_id" gorm:"not null"`
	FeedURL    string         `json:"feed_url" gorm:"type:text;not null"`
	CapturedAt time.Time      `json:"captured_at" gorm:"default:now()"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	Vehicle Vehicle `json:"vehicle" gorm:"foreignKey:VehicleID"`
}

// TableName returns the table name for CameraFeed entity
func (CameraFeed) TableName() string {
	return "camera_feeds"
}
