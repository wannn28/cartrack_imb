# Cartrack Backend

Backend service for Cartrack fleet management system with database migration support.

## Features

- Database migration management using golang-migrate
- Environment-based configuration
- PostgreSQL database support
- Command-line migration tools

## Quick Start

### 1. Setup Environment

```bash
# Create environment configuration
make setup

# Edit .env file with your database credentials
# Example configuration is provided in env.example
```

### 2. Configure Database

Edit the `.env` file with your PostgreSQL credentials:

```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DATABASE=cartrack_db
```

### 3. Run Migrations

```bash
# Run all pending migrations
make up

# Check current migration version
make version

# Revert last migration
make down
```

## Environment Configuration

The application supports configuration through environment variables or `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `ENV` | `development` | Application environment |
| `PORT` | `8081` | Server port |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DATABASE` | `cartrack_db` | Database name |
| `JWT_SECRET_KEY` | `secret` | JWT secret key |
| `MIGRATION_PATH` | `db/migrations` | Path to migration files |

## Migration Commands

### Using Makefile (Recommended)

```bash
# Basic commands
make up           # Run all pending migrations
make down         # Revert last migration
make version      # Show current migration version

# Advanced commands
make migrate-steps STEPS=3        # Run 3 migrations
make migrate-force VERSION=5      # Force migration to version 5

# Using environment variables only (no .env file)
make migrate-up-env    # Run migrations using env vars
make migrate-down-env  # Revert migrations using env vars
```

### Using Binary Directly

```bash
# Build the migration binary
make build

# Run migrations with custom options
./bin/cartrack-migrate -env=.env -cmd=up
./bin/cartrack-migrate -env=.env -cmd=down
./bin/cartrack-migrate -env=.env -cmd=version
./bin/cartrack-migrate -env=.env -cmd=steps -steps=2
./bin/cartrack-migrate -env=.env -cmd=force -version=3
```

### Command-line Flags

| Flag | Default | Description |
|------|---------|-------------|
| `-env` | `.env` | Path to environment file |
| `-cmd` | `up` | Migration command (up, down, steps, force, version) |
| `-steps` | `1` | Number of steps for migration |
| `-version` | `0` | Version for force migration |

## Database Schema

The migration files create the following tables:

1. **users** - User management
2. **vehicles** - Vehicle information
3. **location_logs** - GPS tracking data
4. **fuel_logs** - Fuel consumption records
5. **camera_feeds** - Camera feed management
6. **system_logs** - System logging

## Development

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 12 or higher
- Make (optional, for using Makefile commands)

### Dependencies

```bash
# Download dependencies
make deps
```

### Project Structure

```
backend/
├── cmd/app/           # Application entry point
├── configs/           # Configuration management
├── db/
│   ├── migrations/    # Database migration files
│   └── database.go    # Migration management
├── .env              # Environment configuration (create from env.example)
├── env.example       # Environment configuration template
├── go.mod            # Go module dependencies
├── Makefile          # Build and migration commands
└── README.md         # This file
```

## Migration File Naming

Migration files follow the pattern:
```
YYYYMMDDHHMMSS_description.up.sql
YYYYMMDDHHMMSS_description.down.sql
```

Example:
```
20250806060706_create_users_table.up.sql
20250806060706_create_users_table.down.sql
```

## Troubleshooting

### Migration Fails

1. Check database connection:
   ```bash
   # Test with psql
   psql -h localhost -p 5432 -U postgres -d cartrack_db
   ```

2. Check migration version:
   ```bash
   make version
   ```

3. Force migration if needed:
   ```bash
   make migrate-force VERSION=<target_version>
   ```

### Environment Issues

1. Ensure `.env` file exists and is properly configured
2. Check environment variables are set correctly
3. Verify database credentials and connectivity

### Permission Issues

1. Ensure database user has necessary permissions
2. Check if database exists and user can access it
3. Verify migration files are readable

## License

[Your License Here]