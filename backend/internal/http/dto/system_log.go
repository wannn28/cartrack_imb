package dto

import "time"

// CreateSystemLogRequest represents create system log request
type CreateSystemLogRequest struct {
	VehicleID *uint  `json:"vehicle_id,omitempty"`
	LogType   string `json:"log_type" validate:"required,oneof=INFO WARNING ERROR"`
	Message   string `json:"message" validate:"required,min=1"`
}

// UpdateSystemLogRequest represents update system log request
type UpdateSystemLogRequest struct {
	LogType string `json:"log_type,omitempty" validate:"omitempty,oneof=INFO WARNING ERROR"`
	Message string `json:"message,omitempty" validate:"omitempty,min=1"`
}

// SystemLogResponse represents system log data in response
type SystemLogResponse struct {
	ID        uint             `json:"id"`
	VehicleID *uint            `json:"vehicle_id"`
	LogType   string           `json:"log_type"`
	Message   string           `json:"message"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
	Vehicle   *VehicleResponse `json:"vehicle,omitempty"`
}

// SystemLogQuery represents system log query parameters
type SystemLogQuery struct {
	VehicleID *uint     `query:"vehicle_id"`
	LogType   string    `query:"log_type" validate:"omitempty,oneof=INFO WARNING ERROR"`
	StartDate time.Time `query:"start_date"`
	EndDate   time.Time `query:"end_date"`
	Limit     int       `query:"limit" validate:"min=1,max=1000"`
	Offset    int       `query:"offset" validate:"min=0"`
}

// SystemLogStatsResponse represents system log statistics
type SystemLogStatsResponse struct {
	TotalLogs    int64 `json:"total_logs"`
	InfoLogs     int64 `json:"info_logs"`
	WarningLogs  int64 `json:"warning_logs"`
	ErrorLogs    int64 `json:"error_logs"`
	TodayLogs    int64 `json:"today_logs"`
	VehicleCount int64 `json:"vehicle_count"`
}
