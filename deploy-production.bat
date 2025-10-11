@echo off
REM ========================================
REM   AHCP Production Deployment Script
REM   Windows Deployment Automation
REM ========================================

echo.
echo ========================================
echo   AHCP Production Deployment
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: Not running as administrator!
    echo Some operations may fail.
    echo.
    pause
)

echo [1/10] Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✓ Stopped existing processes

echo.
echo [2/10] Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorLevel% neq 0 (
    echo Starting MongoDB service...
    net start MongoDB
    if %errorLevel% neq 0 (
        echo ERROR: Failed to start MongoDB!
        echo Please start MongoDB manually and run this script again.
        pause
        exit /b 1
    )
)
echo ✓ MongoDB is running

echo.
echo [3/10] Installing/Updating Backend dependencies...
cd ahcp-backend
call npm install --production
if %errorLevel% neq 0 (
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed

echo.
echo [4/10] Checking environment configuration...
if not exist .env (
    if exist production.env (
        echo Copying production.env to .env...
        copy production.env .env >nul
    ) else (
        echo ERROR: No environment configuration found!
        echo Please create .env file with production settings.
        pause
        exit /b 1
    )
)
echo ✓ Environment configuration ready

echo.
echo [5/10] Running database seeds (if needed)...
node seed.js
echo ✓ Database initialization complete

cd ..

echo.
echo [6/10] Building Frontend...
cd ahcp-dashboard
call npm install --production
if %errorLevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed

echo Building Next.js application...
call npm run build
if %errorLevel% neq 0 (
    echo ERROR: Failed to build frontend!
    pause
    exit /b 1
)
echo ✓ Frontend built successfully

cd ..

echo.
echo [7/10] Creating logs directory...
if not exist logs mkdir logs
echo ✓ Logs directory ready

echo.
echo [8/10] Checking PM2 installation...
where pm2 >nul 2>&1
if %errorLevel% neq 0 (
    echo PM2 not found. Installing PM2 globally...
    call npm install -g pm2
    if %errorLevel% neq 0 (
        echo ERROR: Failed to install PM2!
        echo Please install PM2 manually: npm install -g pm2
        pause
        exit /b 1
    )
)
echo ✓ PM2 is available

echo.
echo [9/10] Starting applications with PM2...
call pm2 delete all >nul 2>&1
call pm2 start ecosystem.config.js --env production
if %errorLevel% neq 0 (
    echo ERROR: Failed to start applications with PM2!
    pause
    exit /b 1
)
echo ✓ Applications started with PM2

echo.
echo [10/10] Configuring PM2 startup...
call pm2 save
call pm2 startup
echo ✓ PM2 startup configured

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Useful PM2 commands:
echo   pm2 list          - List all processes
echo   pm2 monit         - Monitor processes
echo   pm2 logs          - View logs
echo   pm2 restart all   - Restart all processes
echo   pm2 stop all      - Stop all processes
echo.
echo ⚠️  IMPORTANT POST-DEPLOYMENT STEPS:
echo 1. Change default admin password
echo 2. Update JWT_SECRET in .env
echo 3. Configure proper CORS_ORIGIN
echo 4. Set up SSL/HTTPS
echo 5. Configure firewall rules
echo.
pause

