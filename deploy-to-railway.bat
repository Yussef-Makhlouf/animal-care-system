@echo off
REM Railway Deployment Script for AHCP System
REM This script helps you deploy your Animal Health Care Program to Railway

echo 🚂 Railway Deployment Script for AHCP System
echo ==============================================
echo.

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI is not installed
    echo Please install it first:
    echo npm install -g @railway/cli
    echo or visit: https://docs.railway.app/develop/cli
    pause
    exit /b 1
)

echo ✅ Railway CLI is installed
echo.

REM Check if user is logged in
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Please login to Railway first:
    echo railway login
    pause
    exit /b 1
)

echo ✅ Logged in to Railway
echo.

REM Create new project
echo 🏗️  Creating new Railway project...
railway new

echo.
echo 📋 Next steps:
echo 1. Go to your Railway dashboard
echo 2. Add MongoDB database to your project
echo 3. Deploy backend service from ahcp-backend folder
echo 4. Deploy frontend service from ahcp-dashboard folder
echo 5. Configure environment variables
echo 6. Run database setup script
echo.
echo 📖 For detailed instructions, see: RAILWAY_DEPLOYMENT_GUIDE.md
echo.
echo 🎉 Happy deploying!
pause
