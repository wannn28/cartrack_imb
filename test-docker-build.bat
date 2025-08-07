@echo off
echo ========================================
echo Cartrack IMB - Docker Build Test
echo ========================================
echo.

echo Checking Docker status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    pause
    exit /b 1
)

echo Testing Docker connection...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo.
echo Cleaning up previous builds...
docker system prune -f

echo.
echo ========================================
echo Testing Backend Build
echo ========================================
docker-compose build backend
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    echo.
    echo Troubleshooting:
    echo 1. Check if Go is properly configured
    echo 2. Verify go.mod and go.sum files
    echo 3. Check network connection for dependencies
    pause
    exit /b 1
)
echo ✓ Backend build successful

echo.
echo ========================================
echo Testing Frontend Build
echo ========================================
docker-compose build frontend
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    echo.
    echo Troubleshooting:
    echo 1. Check if Node.js dependencies are correct
    echo 2. Verify package.json and package-lock.json
    echo 3. Try clearing npm cache: npm cache clean --force
    echo 4. Check network connection for npm registry
    pause
    exit /b 1
)
echo ✓ Frontend build successful

echo.
echo ========================================
echo All Docker Builds Successful! ✓
echo ========================================
echo.
echo To start the application:
echo docker-compose up -d
echo.
echo To view logs:
echo docker-compose logs -f
echo.
pause
