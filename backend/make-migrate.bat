@echo off
REM Database Migration Script for Cartrack Backend
REM Usage: make-migrate [command] [options]
REM Commands: up, down, version, steps, force

set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=up

echo Running database migration: %COMMAND%

REM Handle force command with version parameter
if "%COMMAND%"=="force" (
    if "%2"=="" (
        echo Error: Force command requires version number
        echo Usage: make-migrate force [version]
        pause
        exit /b 1
    )
    go run cmd/app/main.go -cmd=force -version=%2
) else (
    go run cmd/app/main.go -cmd=%COMMAND% %2 %3 %4 %5
)

if %ERRORLEVEL% EQU 0 (
    echo Migration completed successfully!
) else (
    echo Migration failed!
)

pause