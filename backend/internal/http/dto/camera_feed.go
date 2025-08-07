package dto

import "time"

// CreateCameraFeedRequest represents create camera feed request
type CreateCameraFeedRequest struct {
	VehicleID uint   `json:"vehicle_id" validate:"required"`
	FeedURL   string `json:"feed_url" validate:"required,url"`
}

// UpdateCameraFeedRequest represents update camera feed request
type UpdateCameraFeedRequest struct {
	FeedURL string `json:"feed_url" validate:"required,url"`
}

// CameraFeedResponse represents camera feed data in response
type CameraFeedResponse struct {
	ID         uint             `json:"id"`
	VehicleID  uint             `json:"vehicle_id"`
	FeedURL    string           `json:"feed_url"`
	CapturedAt time.Time        `json:"captured_at"`
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`
	Vehicle    *VehicleResponse `json:"vehicle,omitempty"`
}

// CameraFeedQuery represents camera feed query parameters
type CameraFeedQuery struct {
	VehicleID uint      `query:"vehicle_id"`
	StartDate time.Time `query:"start_date"`
	EndDate   time.Time `query:"end_date"`
	Limit     int       `query:"limit" validate:"min=1,max=100"`
	Offset    int       `query:"offset" validate:"min=0"`
}

// LiveCameraFeedResponse represents live camera feed data
type LiveCameraFeedResponse struct {
	VehicleID    uint      `json:"vehicle_id"`
	FeedURL      string    `json:"feed_url"`
	IsActive     bool      `json:"is_active"`
	LastCaptured time.Time `json:"last_captured"`
}
