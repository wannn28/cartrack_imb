package handler

import (
	"github.com/cartrack/backend/internal/service"
	"github.com/cartrack/backend/pkg/response"
	"github.com/labstack/echo/v4"
)

type DashboardHandler interface {
	GetTotalDashboard(c echo.Context) error
	GetTotalDashboardByAdmin(c echo.Context) error
}

type dashboardHandler struct {
	dashboardService service.DashboardService
}

func NewDashboardHandler(dashboardService service.DashboardService) DashboardHandler {
	return &dashboardHandler{dashboardService: dashboardService}
}

func (h *dashboardHandler) GetTotalDashboard(c echo.Context) error {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		return response.Unauthorized(c, "Invalid token", nil)
	}

	dashboard, err := h.dashboardService.GetTotalDashboard(userID)
	if err != nil {
		return response.InternalServerError(c, "Failed to get dashboard data", err)
	}
	return response.Success(c, "Dashboard data retrieved successfully", dashboard)
}

func (h *dashboardHandler) GetTotalDashboardByAdmin(c echo.Context) error {
	dashboard, err := h.dashboardService.GetTotalDashboardByAdmin()
	if err != nil {
		return response.InternalServerError(c, "Failed to get admin dashboard data", err)
	}
	return response.Success(c, "Admin dashboard data retrieved successfully", dashboard)
}
