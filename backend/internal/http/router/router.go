package router

import (
	"net/http"

	"github.com/cartrack/backend/internal/http/handler"
	"github.com/cartrack/backend/pkg/route"
)

var (
	adminOnly = []string{"admin"}
	userOnly  = []string{"user"}
	allRoles  = []string{"admin", "user"}
)

func PublicRoutes(
	userHandler handler.UserHandler,
	locationLogHandler handler.LocationLogHandler,
	esp32Handler handler.ESP32Handler,
) []route.Route {
	return []route.Route{
		// Auth routes
		{
			Method:  http.MethodPost,
			Path:    "auth/register",
			Handler: userHandler.Register,
		},
		{
			Method:  http.MethodPost,
			Path:    "auth/login",
			Handler: userHandler.Login,
		},
		{
			Method:  http.MethodPost,
			Path:    "auth/refresh",
			Handler: userHandler.RefreshToken,
		},
		// Public location tracking route
		{
			Method:  http.MethodPost,
			Path:    "location-logs",
			Handler: locationLogHandler.Create,
		},
		// ESP32 routes
		{
			Method:  http.MethodPost,
			Path:    "esp32/location",
			Handler: esp32Handler.SendLocationLog,
		},
		{
			Method:  http.MethodGet,
			Path:    "esp32/vehicle",
			Handler: esp32Handler.GetUserVehicles,
		},
		{
			Method:  http.MethodGet,
			Path:    "esp32/vehicle/:id",
			Handler: esp32Handler.GetVehicleInfo,
		},
		{
			Method:  http.MethodGet,
			Path:    "esp32/vehicles",
			Handler: esp32Handler.GetUserVehicles,
		},
	}
}

func PrivateRoutes(
	userHandler handler.UserHandler,
	vehicleHandler handler.VehicleHandler,
	locationLogHandler handler.LocationLogHandler,
	fuelLogHandler handler.FuelLogHandler,
	apiKeyHandler handler.APIKeyHandler,
	dashboardHandler handler.DashboardHandler,
) []route.Route {
	return []route.Route{
		// User profile routes
		{
			Method:  http.MethodGet,
			Path:    "user/profile",
			Handler: userHandler.GetProfile,
			Roles:   allRoles,
		},

		{
			Method:  http.MethodPut,
			Path:    "user/profile",
			Handler: userHandler.UpdateProfile,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodPost,
			Path:    "user/change-password",
			Handler: userHandler.ChangePassword,
			Roles:   allRoles,
		},

		// Vehicle routes
		{
			Method:  http.MethodPost,
			Path:    "vehicles",
			Handler: vehicleHandler.Create,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "vehicles",
			Handler: vehicleHandler.GetMyVehicles,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "vehicles/:id",
			Handler: vehicleHandler.GetByID,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodPut,
			Path:    "vehicles/:id",
			Handler: vehicleHandler.Update,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodDelete,
			Path:    "vehicles/:id",
			Handler: vehicleHandler.Delete,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "vehicles/:id/latest-location",
			Handler: locationLogHandler.GetLatestByVehicleID,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "vehicles/:id/current-fuel",
			Handler: fuelLogHandler.GetCurrentFuelLevel,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "vehicles/:id/fuel-stats",
			Handler: fuelLogHandler.GetFuelStatistics,
			Roles:   allRoles,
		},

		// Location tracking routes
		{
			Method:  http.MethodPost,
			Path:    "location-logs",
			Handler: locationLogHandler.Create,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodPost,
			Path:    "tracking/location",
			Handler: locationLogHandler.RealTimeTracking,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "location-logs",
			Handler: locationLogHandler.GetMyLocationLogs,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "location-logs/vehicle",
			Handler: locationLogHandler.GetByVehicleID,
			Roles:   allRoles,
		},

		// Fuel management routes
		{
			Method:  http.MethodPost,
			Path:    "fuel-logs",
			Handler: fuelLogHandler.Create,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "fuel-logs",
			Handler: fuelLogHandler.GetByVehicleID,
			Roles:   allRoles,
		},

		// API Key management routes
		{
			Method:  http.MethodPost,
			Path:    "api-keys",
			Handler: apiKeyHandler.Create,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "api-keys",
			Handler: apiKeyHandler.GetAll,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "api-keys/:id",
			Handler: apiKeyHandler.GetByID,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodPut,
			Path:    "api-keys/:id",
			Handler: apiKeyHandler.Update,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodDelete,
			Path:    "api-keys/:id",
			Handler: apiKeyHandler.Delete,
			Roles:   allRoles,
		},
		{
			Method:  http.MethodGet,
			Path:    "user/api-keys",
			Handler: apiKeyHandler.GetByUserID,
			Roles:   allRoles,
		},

		// Admin routes
		{
			Method:  http.MethodGet,
			Path:    "admin/users",
			Handler: userHandler.GetAllUsers,
			Roles:   adminOnly,
		},
		{
			Method:  http.MethodGet,
			Path:    "admin/users/:id",
			Handler: userHandler.GetUserByID,
			Roles:   adminOnly,
		},
		{
			Method:  http.MethodDelete,
			Path:    "admin/users/:id",
			Handler: userHandler.DeleteUser,
			Roles:   adminOnly,
		},
		{
			Method:  http.MethodGet,
			Path:    "admin/vehicles",
			Handler: vehicleHandler.GetAll,
			Roles:   adminOnly,
		},
		{
			Method:  http.MethodGet,
			Path:    "admin/dashboard",
			Handler: dashboardHandler.GetTotalDashboardByAdmin,
			Roles:   adminOnly,
		},
		{
			Method:  http.MethodGet,
			Path:    "user/dashboard",
			Handler: dashboardHandler.GetTotalDashboard,
			Roles:   userOnly,
		},
	}
}
