@echo off
echo ========================================
echo Cartrack IMB - Local Development Setup
echo ========================================
echo.

echo Starting Backend (Go)...
cd backend
start "Backend API" cmd /k "go mod download && go run ./cmd/app"
cd ..

echo.
echo Starting Frontend (React)...
cd TrackingTruck
start "Frontend React" cmd /k "npm install && npm run dev"
cd ..

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo Backend API: https://trackerapi
echo Frontend: http://localhost:3004
echo.
echo Note: Make sure PostgreSQL is running on localhost:5432
echo or update the database configuration in backend/env.example
echo.
pause
