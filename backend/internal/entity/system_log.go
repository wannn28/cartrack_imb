package entity

import (
	"time"

	"gorm.io/gorm"
)

// LogType represents system log type
type LogType string

const (
	LogTypeInfo    LogType = "INFO"
	LogTypeWarning LogType = "WARNING"
	LogTypeError   LogType = "ERROR"
)

// SystemLog represents system log entity in the system
type SystemLog struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	VehicleID *uint          `json:"vehicle_id"`
	LogType   LogType        `json:"log_type" gorm:"type:varchar(10);check:log_type IN ('INFO', 'WARNING', 'ERROR')"`
	Message   string         `json:"message" gorm:"type:text;not null"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	Vehicle *Vehicle `json:"vehicle,omitempty" gorm:"foreignKey:VehicleID"`
}

// TableName returns the table name for SystemLog entity
func (SystemLog) TableName() string {
	return "system_logs"
}

// IsInfo checks if log type is INFO
func (s *SystemLog) IsInfo() bool {
	return s.LogType == LogTypeInfo
}

// IsWarning checks if log type is WARNING
func (s *SystemLog) IsWarning() bool {
	return s.LogType == LogTypeWarning
}

// IsError checks if log type is ERROR
func (s *SystemLog) IsError() bool {
	return s.LogType == LogTypeError
}
