@echo off
echo ========================================
echo Cartrack IMB - NPM Cache Fix
echo ========================================
echo.

echo Clearing npm cache...
npm cache clean --force
if %errorlevel% neq 0 (
    echo WARNING: Could not clear npm cache
) else (
    echo ✓ NPM cache cleared
)

echo.
echo Clearing Docker cache...
docker system prune -f
echo ✓ Docker cache cleared

echo.
echo Rebuilding frontend with clean cache...
cd TrackingTruck
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo Installing dependencies with clean cache...
npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    echo.
    echo Trying alternative approach...
    npm install --legacy-peer-deps --no-audit --no-fund
)

echo.
echo Testing build...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo ✓ Frontend build successful
cd ..

echo.
echo ========================================
echo NPM Cache Fix Complete! ✓
echo ========================================
echo.
echo Now try building Docker again:
echo docker-compose build frontend
echo.
pause
