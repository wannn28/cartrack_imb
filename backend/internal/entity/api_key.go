package entity

import (
	"time"

	"gorm.io/gorm"
)

// APIKey represents API key entity for ESP32 access
type APIKey struct {
	ID          uint           `json:"id" gorm:"primarykey"`
	Key         string         `json:"key" gorm:"type:varchar(64);unique;not null"`
	Name        string         `json:"name" gorm:"type:varchar(100);not null"`
	Description *string        `json:"description" gorm:"type:text"`
	UserID      uint           `json:"user_id" gorm:"not null"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	LastUsedAt  *time.Time     `json:"last_used_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// TableName returns the table name for APIKey entity
func (APIKey) TableName() string {
	return "api_keys"
}
