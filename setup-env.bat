@echo off
echo ========================================
echo Cartrack IMB - Environment Setup
echo ========================================
echo.

echo Setting up environment files...

if not exist "backend\.env" (
    echo Creating backend .env file...
    copy "backend\env.example" "backend\.env"
    echo ✓ Backend .env created
) else (
    echo Backend .env already exists
)

echo.
echo ========================================
echo Environment Setup Complete!
echo ========================================
echo.
echo Files created:
echo - backend\.env (from env.example)
echo.
echo Please update the .env files with your actual values:
echo - Database credentials
echo - JWT secret key
echo - API URLs
echo.
pause
