# Cartrack IMB - Vehicle Tracking System

A comprehensive vehicle tracking system with real-time location monitoring, route visualization, and admin dashboard.

## 🚀 Quick Start

### Option 1: Using Scripts (Recommended)

#### For Local Development (without Docker):
```bash
# Double-click or run:
start-local.bat
```

#### For Docker Development:
```bash
# Double-click or run:
start-docker.bat
```

### Option 2: Manual Setup

#### Prerequisites
- **Backend:** Go 1.23+
- **Frontend:** Node.js 18+
- **Database:** PostgreSQL 15+
- **Docker:** Docker Desktop (optional)

#### Backend Setup
```bash
cd backend
go mod download
go run ./cmd/app
```

#### Frontend Setup
```bash
cd TrackingTruck
npm install
npm run dev
```

## 📁 Project Structure

```
cartrack_imb/
├── backend/                 # Go REST API
│   ├── cmd/app/            # Main application entry
│   ├── internal/           # Business logic
│   ├── pkg/               # Shared packages
│   ├── db/migrations/     # Database migrations
│   └── Dockerfile         # Backend container
├── TrackingTruck/         # React frontend
│   ├── src/components/    # React components
│   ├── src/services/      # API services
│   ├── src/types/         # TypeScript types
│   └── Dockerfile         # Frontend container
├── docker-compose.yml     # Production setup
├── docker-compose.dev.yml # Development setup
├── start-local.bat        # Local development script
├── start-docker.bat       # Docker development script
└── README_Docker.md       # Docker documentation
```

## 🌐 Access URLs

### Development
- **Frontend:** http://localhost:3004
- **Backend API:** http://localhost:8003
- **Database:** localhost:5432

### Production (Docker)
- **Frontend:** http://localhost:3004
- **Backend API:** http://localhost:8003
- **Database:** localhost:5432

## 🔧 Features

### Backend (Go)
- ✅ RESTful API with Echo framework
- ✅ JWT authentication
- ✅ PostgreSQL database with GORM
- ✅ Database migrations
- ✅ Vehicle management
- ✅ Location tracking
- ✅ Fuel logging
- ✅ Camera feeds
- ✅ System logs
- ✅ API key management

### Frontend (React)
- ✅ Modern React with TypeScript
- ✅ Google Maps integration
- ✅ Real-time vehicle tracking
- ✅ Route visualization
- ✅ Live tracking replay
- ✅ Admin dashboard
- ✅ Vehicle management
- ✅ Fuel log management
- ✅ User authentication
- ✅ Responsive design

### Maps & Tracking
- ✅ Google Maps integration
- ✅ Real-time location updates
- ✅ Route visualization
- ✅ Vehicle markers with rotation
- ✅ Speed and direction display
- ✅ Historical route replay
- ✅ Multi-vehicle tracking
- ✅ Checkpoint system

## 🛠️ Development

### Environment Variables

#### Backend (.env)
```bash
ENV=development
PORT=8003
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=cartrack_db
JWT_SECRET_KEY=your-secret-key
MIGRATION_PATH=db/migrations
```

#### Frontend
```bash
REACT_APP_API_URL=http://localhost:8003
```

### Database Setup
```bash
# Create database
createdb cartrack_db

# Run migrations (if using Go)
cd backend
go run ./cmd/app migrate
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

#### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

#### Location Tracking
- `GET /api/location-logs` - Get location logs
- `POST /api/location-logs` - Create location log
- `GET /api/location-logs/vehicle/:id` - Get vehicle location logs

#### Fuel Logs
- `GET /api/fuel-logs` - Get fuel logs
- `POST /api/fuel-logs` - Create fuel log

## 🐳 Docker Setup

For detailed Docker instructions, see [README_Docker.md](README_Docker.md)

### Quick Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose build --no-cache
```

## 🔍 Troubleshooting

### Common Issues

1. **Docker Desktop not running**
   - Start Docker Desktop from Start Menu
   - Wait for "Docker Desktop is running" status

2. **Port conflicts**
   - Ensure ports 3004, 8003, 5432 are available
   - Change ports in docker-compose.yml if needed

3. **Database connection**
   - Check PostgreSQL is running
   - Verify database credentials
   - Run migrations if needed

4. **Frontend not loading**
   - Check backend API is accessible
   - Verify REACT_APP_API_URL environment variable

5. **Build errors**
   - Clear cache: `docker system prune -a`
   - Rebuild: `docker-compose build --no-cache`

### Logs
```bash
# Docker logs
docker-compose logs -f

# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend
```

## 📚 Documentation

- [Docker Setup](README_Docker.md) - Detailed Docker instructions
- [API Documentation](backend/postman/API_Documentation.md) - API endpoints
- [Postman Collection](backend/postman/Cartrack_API_Collection.json) - API testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the documentation
- Open an issue on GitHub

---

**Cartrack IMB** - Vehicle Tracking System v1.0
