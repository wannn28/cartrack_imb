@echo off
echo ========================================
echo Cartrack IMB - Docker Setup
echo ========================================
echo.

echo Checking Docker status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)

echo Testing Docker connection...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop is not running
    echo Please start Docker Desktop and try again
    echo.
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start...
    timeout /t 30 /nobreak >nul
    echo.
)

echo Building and starting services...
docker-compose up -d --build

echo.
echo ========================================
echo Services Status
echo ========================================
docker-compose ps

echo.
echo ========================================
echo Access URLs
echo ========================================
echo Frontend: http://localhost:3004
echo Backend API: https://trackerapi
echo Database: localhost:5432
echo.
echo To view logs: docker-compose logs -f
echo To stop services: docker-compose down
echo.
pause
