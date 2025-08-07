# Makefile for Cartrack Backend

# Variables
BINARY_NAME=cartrack-migrate
MAIN_PATH=./cmd/app
BUILD_DIR=./bin
ENV_FILE=.env

# Go related variables
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod

# Build the application
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@$(GOBUILD) -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "Built $(BINARY_NAME) in $(BUILD_DIR)/"

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@$(GOCLEAN)
	@rm -rf $(BUILD_DIR)

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	@$(GOMOD) download
	@$(GOMOD) tidy

# Create .env file from example
env:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "Creating $(ENV_FILE) from env.example..."; \
		cp env.example $(ENV_FILE); \
		echo "Please edit $(ENV_FILE) with your actual configuration"; \
	else \
		echo "$(ENV_FILE) already exists"; \
	fi

# Database migration commands
migrate-up: build
	@echo "Running database migrations (up)..."
	@$(BUILD_DIR)/$(BINARY_NAME) -env=$(ENV_FILE) -cmd=up

migrate-down: build
	@echo "Running database migrations (down)..."
	@$(BUILD_DIR)/$(BINARY_NAME) -env=$(ENV_FILE) -cmd=down

migrate-steps: build
	@echo "Running database migrations (steps)..."
	@$(BUILD_DIR)/$(BINARY_NAME) -env=$(ENV_FILE) -cmd=steps -steps=$(STEPS)

migrate-force: build
	@echo "Forcing migration to version $(VERSION)..."
	@$(BUILD_DIR)/$(BINARY_NAME) -env=$(ENV_FILE) -cmd=force -version=$(VERSION)

migrate-version: build
	@echo "Getting current migration version..."
	@$(BUILD_DIR)/$(BINARY_NAME) -env=$(ENV_FILE) -cmd=version

# Quick migration commands (with defaults)
up: migrate-up
down: migrate-down
version: migrate-version

# Development setup
setup: env deps
	@echo "Development setup complete!"
	@echo "Please edit $(ENV_FILE) with your database configuration"
	@echo "Then run 'make up' to apply migrations"

# Run migrations with environment variables (no .env file)
migrate-up-env:
	@echo "Running database migrations (up) with environment variables..."
	@$(GOBUILD) -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@$(BUILD_DIR)/$(BINARY_NAME) -cmd=up

migrate-down-env:
	@echo "Running database migrations (down) with environment variables..."
	@$(GOBUILD) -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@$(BUILD_DIR)/$(BINARY_NAME) -cmd=down

# Help
help:
	@echo "Available commands:"
	@echo "  setup          - Initial project setup (create .env, download deps)"
	@echo "  build          - Build the migration binary"
	@echo "  clean          - Clean build artifacts"
	@echo "  deps           - Download and tidy dependencies"
	@echo "  env            - Create .env file from example"
	@echo ""
	@echo "Migration commands:"
	@echo "  up             - Run all pending migrations"
	@echo "  down           - Revert the last migration"
	@echo "  version        - Show current migration version"
	@echo "  migrate-steps  - Run specific number of migrations (use STEPS=n)"
	@echo "  migrate-force  - Force migration to specific version (use VERSION=n)"
	@echo ""
	@echo "Environment variable commands (no .env file):"
	@echo "  migrate-up-env   - Run migrations using environment variables"
	@echo "  migrate-down-env - Revert migrations using environment variables"
	@echo ""
	@echo "Examples:"
	@echo "  make setup                    # Initial setup"
	@echo "  make up                       # Run migrations"
	@echo "  make migrate-steps STEPS=2    # Run 2 migrations"
	@echo "  make migrate-force VERSION=5  # Force to version 5"

.PHONY: build clean deps env migrate-up migrate-down migrate-steps migrate-force migrate-version up down version setup migrate-up-env migrate-down-env help