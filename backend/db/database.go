package db

import (
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type MigrationManager struct {
	migrator *migrate.Migrate
}

// NewMigrationManager creates a new migration manager
func NewMigrationManager(databaseURL, migrationPath string) (*MigrationManager, error) {
	// Convert path to proper file URL format
	migrationsURL := fmt.Sprintf("file://%s", migrationPath)

	m, err := migrate.New(migrationsURL, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize migration: %w", err)
	}

	return &MigrationManager{migrator: m}, nil
}

// Up runs all pending migrations
func (mm *MigrationManager) Up() error {
	if err := mm.migrator.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration up failed: %w", err)
	}
	log.Println("Migration up completed successfully")
	return nil
}

// Down reverts the last migration
func (mm *MigrationManager) Down() error {
	if err := mm.migrator.Down(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration down failed: %w", err)
	}
	log.Println("Migration down completed successfully")
	return nil
}

// Steps runs n number of migrations
func (mm *MigrationManager) Steps(n int) error {
	if err := mm.migrator.Steps(n); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration steps failed: %w", err)
	}
	log.Printf("Migration steps (%d) completed successfully", n)
	return nil
}

// Version returns the current migration version
func (mm *MigrationManager) Version() (uint, bool, error) {
	version, dirty, err := mm.migrator.Version()
	if err != nil {
		return 0, false, fmt.Errorf("failed to get migration version: %w", err)
	}
	return version, dirty, nil
}

// Close closes the migration manager
func (mm *MigrationManager) Close() error {
	sourceErr, dbErr := mm.migrator.Close()
	if sourceErr != nil {
		return fmt.Errorf("source error: %w", sourceErr)
	}
	if dbErr != nil {
		return fmt.Errorf("database error: %w", dbErr)
	}
	return nil
}

// Force sets the migration version and dirty state
func (mm *MigrationManager) Force(version int) error {
	if err := mm.migrator.Force(version); err != nil {
		return fmt.Errorf("force migration failed: %w", err)
	}
	log.Printf("Migration forced to version %d", version)
	return nil
}

// RunMigrations is a helper function to run migrations with configuration
func RunMigrations(databaseURL, migrationPath string, command string, steps int, version int) error {
	mm, err := NewMigrationManager(databaseURL, migrationPath)
	if err != nil {
		return err
	}
	defer mm.Close()

	switch command {
	case "up":
		return mm.Up()
	case "down":
		return mm.Down()
	case "steps":
		return mm.Steps(steps)
	case "force":
		return mm.Force(version)
	case "version":
		version, dirty, err := mm.Version()
		if err != nil {
			return err
		}
		log.Printf("Current migration version: %d, dirty: %t", version, dirty)
		return nil
	default:
		return fmt.Errorf("unknown migration command: %s", command)
	}
}
