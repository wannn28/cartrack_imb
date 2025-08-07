# Docker Setup for Cartrack IMB

This document provides instructions for running the Cartrack IMB application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Project Structure

```
cartrack_imb/
├── backend/                 # Go backend API
│   ├── Dockerfile          # Backend container configuration
│   └── ...
├── TrackingTruck/          # React frontend
│   ├── Dockerfile          # Production frontend container
│   ├── Dockerfile.dev      # Development frontend container
│   ├── nginx.conf          # Nginx configuration
│   └── ...
├── docker-compose.yml      # Production Docker Compose
├── docker-compose.dev.yml  # Development Docker Compose
├── .dockerignore           # Docker ignore file
└── README_Docker.md        # This file
```

## Quick Start

### Production Environment

1. **Build and start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:3004
   - Backend API: http://localhost:8003
   - Database: localhost:5432

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

### Development Environment

1. **Build and start development services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:3004 (with hot reload)
   - Backend API: http://localhost:8003
   - Database: localhost:5432

3. **Stop development services:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## Running Without Docker

If Docker Desktop is not running or you prefer to run locally:

### Backend (Go)
```bash
cd backend
go mod download
go run ./cmd/app
```

### Frontend (React)
```bash
cd TrackingTruck
npm install
npm run dev
```

### Database (PostgreSQL)
Install PostgreSQL locally or use a cloud database service.

## Services

### 1. PostgreSQL Database
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Database:** cartrack_db (production) / cartrack_db_dev (development)
- **User:** cartrack_user
- **Password:** cartrack_password

### 2. Go Backend API
- **Port:** 8003
- **Environment:** production/development
- **Features:**
  - RESTful API
  - JWT authentication
  - Database migrations
  - Health checks

### 3. React Frontend
- **Port:** 3004 (development) / 80 (production)
- **Features:**
  - Modern React application
  - Google Maps integration
  - Real-time tracking
  - Admin dashboard

### 4. Nginx (Production)
- **Port:** 80, 443
- **Features:**
  - Reverse proxy
  - SSL termination
  - Static file serving
  - Load balancing

## Environment Variables

### Backend Environment Variables
```bash
ENV=production/development
PORT=8003
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=cartrack_user
POSTGRES_PASSWORD=cartrack_password
POSTGRES_DATABASE=cartrack_db
JWT_SECRET_KEY=your-super-secret-jwt-key
MIGRATION_PATH=db/migrations
```

### Frontend Environment Variables
```bash
REACT_APP_API_URL=http://localhost:8003
```

## Database Migrations

The database migrations are automatically applied when the PostgreSQL container starts. Migration files are located in `backend/db/migrations/`.

## Health Checks

All services include health checks to ensure proper startup order:
- PostgreSQL: Checks database connectivity
- Backend: Checks API health endpoint
- Frontend: Checks web server availability

## Volumes

### Production Volumes
- `postgres_data`: PostgreSQL data persistence
- `nginx/ssl`: SSL certificates (optional)

### Development Volumes
- `postgres_data_dev`: PostgreSQL data persistence
- `redis_data_dev`: Redis data persistence
- Source code volumes for hot reloading

## Useful Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Development environment
docker-compose -f docker-compose.dev.yml logs -f
```

### Rebuild services
```bash
# Production
docker-compose build --no-cache

# Development
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Access containers
```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh

# Database container
docker-compose exec postgres psql -U cartrack_user -d cartrack_db
```

### Database operations
```bash
# Run migrations manually
docker-compose exec backend ./main migrate

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

## Troubleshooting

### Common Issues

1. **Docker Desktop not running:**
   - Start Docker Desktop from Start Menu
   - Wait for "Docker Desktop is running" status
   - Test with: `docker ps`

2. **Port conflicts:**
   - Ensure ports 3004, 8003, and 5432 are available
   - Change ports in docker-compose.yml if needed

3. **Database connection issues:**
   - Wait for PostgreSQL to be healthy before starting backend
   - Check database credentials in environment variables

4. **Frontend not loading:**
   - Check if backend API is accessible
   - Verify REACT_APP_API_URL environment variable

5. **Build failures:**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild without cache: `docker-compose build --no-cache`

6. **TypeScript errors:**
   - Fixed unused variable warnings
   - Updated NodeJS.Timeout to ReturnType<typeof setInterval>
   - Removed unused imports

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f

# Check service status
docker-compose ps
```

## Security Considerations

1. **Change default passwords** in production
2. **Use strong JWT secrets**
3. **Enable SSL/TLS** for production
4. **Restrict network access** to necessary ports only
5. **Regular security updates** for base images

## Production Deployment

For production deployment:

1. **Update environment variables** with production values
2. **Configure SSL certificates** for nginx
3. **Set up proper logging** and monitoring
4. **Configure backup strategies** for database
5. **Use secrets management** for sensitive data

## Development Workflow

1. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Make code changes** - they will be reflected automatically

3. **View logs** for debugging:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

4. **Stop development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## Recent Fixes

### TypeScript Errors Fixed:
- Removed unused imports (`MapPin`, `RouteOptions`)
- Fixed unused variable warnings in forEach loops
- Updated `NodeJS.Timeout` to `ReturnType<typeof setInterval>`
- Commented out unused `formatTime` function

### Docker Issues Fixed:
- Updated frontend Dockerfile to use Node.js 20 (compatible with React Router v7)
- Added `--legacy-peer-deps` flag to handle dependency conflicts
- Fixed backend build path (`./cmd/app/main.go`)
- Fixed port configurations (8003 for backend, 3004 for frontend)
- Added proper error handling for Docker Desktop not running
- Updated container naming convention (be-cartrack-imb, fe-cartrack-imb, db-cartrack-imb)
- Added persistent volumes for uploads and logs
- Improved environment variable management with .env files
