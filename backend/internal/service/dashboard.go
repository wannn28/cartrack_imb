package service

import (
	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/repository"
)

type DashboardService interface {
	GetTotalDashboard(userID uint) (dto.DashboardDTO, error)
	GetTotalDashboardByAdmin() (dto.DashboardDTO, error)
}

type dashboardService struct {
	dashboardRepo repository.DashboardRepository
}

func NewDashboardService(dashboardRepo repository.DashboardRepository) DashboardService {
	return &dashboardService{dashboardRepo: dashboardRepo}
}

func (s *dashboardService) GetTotalDashboard(userID uint) (dto.DashboardDTO, error) {
	dashboard, err := s.dashboardRepo.GetTotalDashboardByUser(userID)
	if err != nil {
		return dto.DashboardDTO{}, err
	}
	return dto.DashboardDTO{
		TotalVehicles:     dashboard.TotalVehicles,
		TotalAPIKeys:      dashboard.TotalAPIKeys,
		TotalFuelLogs:     dashboard.TotalFuelLogs,
		TotalLocationLogs: dashboard.TotalLocationLogs,
	}, nil
}

func (s *dashboardService) GetTotalDashboardByAdmin() (dto.DashboardDTO, error) {
	dashboard, err := s.dashboardRepo.GetTotalDashboardByAdmin()
	if err != nil {
		return dto.DashboardDTO{}, err
	}
	return dto.DashboardDTO{
		TotalVehicles:     dashboard.TotalVehicles,
		TotalAPIKeys:      dashboard.TotalAPIKeys,
		TotalFuelLogs:     dashboard.TotalFuelLogs,
		TotalLocationLogs: dashboard.TotalLocationLogs,
		TotalUsers:        dashboard.TotalUsers,
		TotalAdmins:       dashboard.TotalAdmins,
		TotalCustomers:    dashboard.TotalCustomers,
	}, nil
}
