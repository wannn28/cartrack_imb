package dto

import "time"

// CreateAPIKeyRequest represents create API key request
type CreateAPIKeyRequest struct {
	Name        string  `json:"name" validate:"required,min=1,max=100"`
	Description *string `json:"description,omitempty"`
}

// UpdateAPIKeyRequest represents update API key request
type UpdateAPIKeyRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	Description *string `json:"description,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

// APIKeyResponse represents API key data in response
type APIKeyResponse struct {
	ID          uint              `json:"id"`
	Key         string            `json:"key"`
	Name        string            `json:"name"`
	Description *string           `json:"description"`
	UserID      uint              `json:"user_id"`
	IsActive    bool              `json:"is_active"`
	LastUsedAt  *time.Time        `json:"last_used_at"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	User        *UserResponse     `json:"user,omitempty"`
	Vehicles    []VehicleResponse `json:"vehicles,omitempty"`
}

// ESP32LocationLogRequest represents ESP32 location log request
type ESP32LocationLogRequest struct {
	VehicleID uint     `json:"vehicle_id" validate:"required"`
	Latitude  float64  `json:"latitude" validate:"required,min=-90,max=90"`
	Longitude float64  `json:"longitude" validate:"required,min=-180,max=180"`
	Speed     *float64 `json:"speed,omitempty" validate:"omitempty,min=0"`
	Direction *int16   `json:"direction,omitempty" validate:"omitempty,min=0,max=359"`
}

// ESP32VehicleResponse represents vehicle data for ESP32
type ESP32VehicleResponse struct {
	ID          uint    `json:"id"`
	PlateNumber string  `json:"plate_number"`
	Model       *string `json:"model"`
	IMEI        *string `json:"imei"`
}
