package builder

import (
	"github.com/cartrack/backend/configs"
	"github.com/cartrack/backend/internal/http/handler"
	"github.com/cartrack/backend/internal/http/router"
	"github.com/cartrack/backend/internal/repository"
	"github.com/cartrack/backend/internal/service"
	"github.com/cartrack/backend/pkg/route"
	"github.com/cartrack/backend/pkg/token"
	"gorm.io/gorm"
)

// BuildPublicRoutes creates public routes that don't require authentication
func BuildPublicRoutes(cfg *configs.Config, db *gorm.DB) []route.Route {
	// Initialize token manager
	tokenManager := token.NewTokenManager(cfg.JWT.SecretKey)

	// Initialize repository layer
	userRepo := repository.NewUserRepository(db)
	vehicleRepo := repository.NewVehicleRepository(db)
	locationLogRepo := repository.NewLocationLogRepository(db)
	apiKeyRepo := repository.NewAPIKeyRepository(db)

	// Initialize service layer
	userService := service.NewUserService(userRepo, tokenManager)
	locationLogService := service.NewLocationLogService(locationLogRepo, vehicleRepo)
	apiKeyService := service.NewAPIKeyService(apiKeyRepo, vehicleRepo)
	vehicleService := service.NewVehicleService(vehicleRepo)

	// Initialize handler layer
	userHandler := handler.NewUserHandler(userService, tokenManager)
	locationLogHandler := handler.NewLocationLogHandler(locationLogService)
	esp32Handler := handler.NewESP32Handler(apiKeyService, locationLogService, vehicleService)

	// Get routes from router
	return router.PublicRoutes(userHandler, locationLogHandler, esp32Handler)
}

// BuildPrivateRoutes creates private routes that require authentication
func BuildPrivateRoutes(cfg *configs.Config, db *gorm.DB) []route.Route {
	// Initialize token manager
	tokenManager := token.NewTokenManager(cfg.JWT.SecretKey)

	// Initialize repository layer
	userRepo := repository.NewUserRepository(db)
	vehicleRepo := repository.NewVehicleRepository(db)
	locationLogRepo := repository.NewLocationLogRepository(db)
	fuelLogRepo := repository.NewFuelLogRepository(db)
	apiKeyRepo := repository.NewAPIKeyRepository(db)
	dashboardRepo := repository.NewDashboardRepository(db)

	// Initialize service layer
	userService := service.NewUserService(userRepo, tokenManager)
	vehicleService := service.NewVehicleService(vehicleRepo)
	locationLogService := service.NewLocationLogService(locationLogRepo, vehicleRepo)
	fuelLogService := service.NewFuelLogService(fuelLogRepo, vehicleRepo)
	apiKeyService := service.NewAPIKeyService(apiKeyRepo, vehicleRepo)
	dashboardService := service.NewDashboardService(dashboardRepo)

	// Initialize handler layer
	userHandler := handler.NewUserHandler(userService, tokenManager)
	vehicleHandler := handler.NewVehicleHandler(vehicleService)
	locationLogHandler := handler.NewLocationLogHandler(locationLogService)
	fuelLogHandler := handler.NewFuelLogHandler(fuelLogService)
	apiKeyHandler := handler.NewAPIKeyHandler(apiKeyService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)

	// Get routes from router
	return router.PrivateRoutes(userHandler, vehicleHandler, locationLogHandler, fuelLogHandler, apiKeyHandler, dashboardHandler)
}
