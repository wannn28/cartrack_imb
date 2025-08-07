package dto

import "time"

// CreateVehicleRequest represents create vehicle request
type CreateVehicleRequest struct {
	PlateNumber string `json:"plate_number" validate:"required,min=1,max=20"`
	Model       string `json:"model,omitempty" validate:"omitempty,max=100"`
	IMEI        string `json:"imei,omitempty" validate:"omitempty,max=50"`
}

// UpdateVehicleRequest represents update vehicle request
type UpdateVehicleRequest struct {
	PlateNumber string `json:"plate_number,omitempty" validate:"omitempty,min=1,max=20"`
	Model       string `json:"model,omitempty" validate:"omitempty,max=100"`
	IMEI        string `json:"imei,omitempty" validate:"omitempty,max=50"`
}

// VehicleResponse represents vehicle data in response
type VehicleResponse struct {
	ID          uint          `json:"id"`
	UserID      uint          `json:"user_id"`
	PlateNumber string        `json:"plate_number"`
	Model       *string       `json:"model"`
	IMEI        *string       `json:"imei"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
	User        *UserResponse `json:"user,omitempty"`
}

// VehicleWithLocationResponse represents vehicle with latest location
type VehicleWithLocationResponse struct {
	ID             uint                 `json:"id"`
	UserID         uint                 `json:"user_id"`
	PlateNumber    string               `json:"plate_number"`
	Model          *string              `json:"model"`
	IMEI           *string              `json:"imei"`
	CreatedAt      time.Time            `json:"created_at"`
	UpdatedAt      time.Time            `json:"updated_at"`
	LatestLocation *LocationLogResponse `json:"latest_location,omitempty"`
}
