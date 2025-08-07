package dto

import "time"

// CreateFuelLogRequest represents create fuel log request
type CreateFuelLogRequest struct {
	VehicleID uint    `json:"vehicle_id" validate:"required"`
	FuelLevel float64 `json:"fuel_level" validate:"required,min=0,max=100"`
}

// UpdateFuelLogRequest represents update fuel log request
type UpdateFuelLogRequest struct {
	FuelLevel float64 `json:"fuel_level" validate:"required,min=0,max=100"`
}

// FuelLogResponse represents fuel log data in response
type FuelLogResponse struct {
	ID        uint             `json:"id"`
	VehicleID uint             `json:"vehicle_id"`
	FuelLevel float64          `json:"fuel_level"`
	Timestamp time.Time        `json:"timestamp"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
	Vehicle   *VehicleResponse `json:"vehicle,omitempty"`
}

// FuelConsumptionQuery represents fuel consumption query parameters
type FuelConsumptionQuery struct {
	VehicleID uint      `query:"vehicle_id" validate:"required"`
	StartDate time.Time `query:"start_date"`
	EndDate   time.Time `query:"end_date"`
	Limit     int       `query:"limit" validate:"min=1,max=1000"`
	Offset    int       `query:"offset" validate:"min=0"`
}

// FuelStatisticsResponse represents fuel statistics
type FuelStatisticsResponse struct {
	VehicleID        uint    `json:"vehicle_id"`
	AverageFuelLevel float64 `json:"average_fuel_level"`
	MinFuelLevel     float64 `json:"min_fuel_level"`
	MaxFuelLevel     float64 `json:"max_fuel_level"`
	CurrentFuelLevel float64 `json:"current_fuel_level"`
	TotalEntries     int64   `json:"total_entries"`
}
