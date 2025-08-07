package dto

import "time"

// CreateLocationLogRequest represents create location log request
type CreateLocationLogRequest struct {
	VehicleID uint     `json:"vehicle_id" validate:"required"`
	Latitude  float64  `json:"latitude" validate:"required,min=-90,max=90"`
	Longitude float64  `json:"longitude" validate:"required,min=-180,max=180"`
	Speed     *float64 `json:"speed,omitempty" validate:"omitempty,min=0"`
	Direction *int16   `json:"direction,omitempty" validate:"omitempty,min=0,max=359"`
}

// UpdateLocationLogRequest represents update location log request
type UpdateLocationLogRequest struct {
	Latitude  float64  `json:"latitude,omitempty" validate:"omitempty,min=-90,max=90"`
	Longitude float64  `json:"longitude,omitempty" validate:"omitempty,min=-180,max=180"`
	Speed     *float64 `json:"speed,omitempty" validate:"omitempty,min=0"`
	Direction *int16   `json:"direction,omitempty" validate:"omitempty,min=0,max=359"`
}

// LocationLogResponse represents location log data in response
type LocationLogResponse struct {
	ID        uint             `json:"id"`
	VehicleID uint             `json:"vehicle_id"`
	Latitude  float64          `json:"latitude"`
	Longitude float64          `json:"longitude"`
	Speed     *float64         `json:"speed"`
	Direction *int16           `json:"direction"`
	Timestamp time.Time        `json:"timestamp"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
	Vehicle   *VehicleResponse `json:"vehicle,omitempty"`
}

// LocationTrackingRequest represents real-time location tracking request
type LocationTrackingRequest struct {
	VehicleID uint    `json:"vehicle_id" validate:"required"`
	Latitude  float64 `json:"latitude" validate:"required,min=-90,max=90"`
	Longitude float64 `json:"longitude" validate:"required,min=-180,max=180"`
	Speed     float64 `json:"speed" validate:"min=0"`
	Direction int16   `json:"direction" validate:"min=0,max=359"`
}

// LocationHistoryQuery represents location history query parameters
type LocationHistoryQuery struct {
	VehicleID uint      `query:"vehicle_id" validate:"required"`
	StartDate time.Time `query:"start_date"`
	EndDate   time.Time `query:"end_date"`
	Limit     int       `query:"limit" validate:"min=1,max=1000"`
	Offset    int       `query:"offset" validate:"min=0"`
}
