@echo off
echo Installing TeachMe.ai Backend Dependencies...
echo.

REM Check if Bun is installed
bun --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Bun is not installed or not in PATH
    echo Please install Bun from https://bun.sh/
    pause
    exit /b 1
)

echo Bun is installed. Installing dependencies...
bun install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo Starting the backend server...
echo Server will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

bun run dev
