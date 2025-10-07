@echo off
echo Starting AHCP Development System...

echo.
echo [1/4] Starting MongoDB...
net start MongoDB
if %errorlevel% neq 0 (
    echo MongoDB is already running or not installed
)

echo.
echo [2/4] Starting Backend Server...
cd ahcp-backend
start "AHCP Backend Dev" cmd /k "set NODE_ENV=development && set PORT=3001 && set MONGODB_URI=mongodb://localhost:27017/ahcp_database && set JWT_SECRET=ahcp_super_secret_key_2024_development_only && set JWT_EXPIRES_IN=7d && node src/server.js"

echo.
echo [3/4] Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo [4/4] Starting Frontend...
cd ..\ahcp-dashboard
start "AHCP Frontend Dev" cmd /k "set NEXT_PUBLIC_API_URL=http://localhost:3001/api && npm run dev"

echo.
echo ✅ AHCP Development System Started!
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Login credentials:
echo Admin: admin@ahcp.gov.sa / Admin@123456
echo.
pause
