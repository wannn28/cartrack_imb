package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"time"

	"github.com/cartrack/backend/configs"
	"github.com/cartrack/backend/db"
	"github.com/cartrack/backend/internal/builder"
	"github.com/cartrack/backend/pkg/database"
	"github.com/cartrack/backend/pkg/server"
	"github.com/cartrack/backend/pkg/timezone"
)

func main() {
	cfg, err := configs.NewConfig(".env")
	// initMigration()

	db, err := database.InitDatabase(cfg.PostgresConfig)
	err = timezone.InitTimezone()
	checkError(err)
	publicRoutes := builder.BuildPublicRoutes(cfg, db)
	privateRoutes := builder.BuildPrivateRoutes(cfg, db)

	srv := server.NewServer(cfg, publicRoutes, privateRoutes)
	runServer(srv, cfg.PORT)
	waitForShutdown(srv)
}

// hidePassword masks the password in the database URL for logging
func hidePassword(dbURL string) string {
	// Simple password masking for logging purposes
	// This is a basic implementation, you might want to use a more robust URL parser
	return "postgres://user:***@host:port/database?sslmode=disable"
}

func checkError(err error) {
	if err != nil {
		panic(err)
	}
}

func initMigration() {
	// Define command line flags
	var (
		envFile = flag.String("env", ".env", "Path to environment file")
		command = flag.String("cmd", "up", "Migration command: up, down, steps, force, version")
		steps   = flag.Int("steps", 1, "Number of steps for migration")
		version = flag.Int("version", 0, "Version for force migration")
	)
	flag.Parse()

	// Load configuration from environment
	config, err := configs.NewConfig(*envFile)
	if err != nil {
		// If .env file doesn't exist, try to load from environment variables only
		log.Printf("Warning: Could not load .env file: %v", err)
		log.Println("Trying to load configuration from environment variables...")

		config = &configs.Config{}
		// Set default values if environment variables are not set
		if os.Getenv("ENV") == "" {
			config.ENV = "development"
		}
		if os.Getenv("POSTGRES_HOST") == "" {
			config.PostgresConfig.Host = "localhost"
		}
		if os.Getenv("POSTGRES_PORT") == "" {
			config.PostgresConfig.Port = "5432"
		}
		if os.Getenv("POSTGRES_USER") == "" {
			config.PostgresConfig.User = "postgres"
		}
		if os.Getenv("POSTGRES_PASSWORD") == "" {
			config.PostgresConfig.Password = "postgres"
		}
		if os.Getenv("POSTGRES_DATABASE") == "" {
			config.PostgresConfig.Database = "cartrack_db"
		}
		if os.Getenv("MIGRATION_PATH") == "" {
			config.MigrationPath = "db/migrations"
		}

		// Override with environment variables if they exist
		if env := os.Getenv("ENV"); env != "" {
			config.ENV = env
		}
		if host := os.Getenv("POSTGRES_HOST"); host != "" {
			config.PostgresConfig.Host = host
		}
		if port := os.Getenv("POSTGRES_PORT"); port != "" {
			config.PostgresConfig.Port = port
		}
		if user := os.Getenv("POSTGRES_USER"); user != "" {
			config.PostgresConfig.User = user
		}
		if password := os.Getenv("POSTGRES_PASSWORD"); password != "" {
			config.PostgresConfig.Password = password
		}
		if database := os.Getenv("POSTGRES_DATABASE"); database != "" {
			config.PostgresConfig.Database = database
		}
		if migrationPath := os.Getenv("MIGRATION_PATH"); migrationPath != "" {
			config.MigrationPath = migrationPath
		}
	}

	// Get database URL from config
	dbURL := config.PostgresConfig.GetDatabaseURL()

	// Get migration path (keep as relative for golang-migrate compatibility)
	migrationPath := config.MigrationPath
	// For golang-migrate on Windows, we should not convert to absolute path
	// if the path is already relative, as it handles relative paths better

	log.Printf("Running migration command: %s", *command)
	log.Printf("Database URL: %s", hidePassword(dbURL))
	log.Printf("Migration path: %s", migrationPath)

	// Run migration based on command
	err = db.RunMigrations(dbURL, migrationPath, *command, *steps, *version)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Printf("Migration command '%s' completed successfully", *command)
}

func runServer(srv *server.Server, port string) {
	go func() {
		err := srv.Start(fmt.Sprintf(":%s", port))
		log.Fatal(err)
	}()
}

func waitForShutdown(srv *server.Server) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)

	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	go func() {
		if err := srv.Shutdown(ctx); err != nil {
			srv.Logger.Fatal(err)
		}
	}()
}
