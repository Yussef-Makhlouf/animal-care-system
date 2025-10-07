@echo off
echo ========================================
echo    بدء تشغيل نظام AHCP
echo ========================================
echo.

echo 1. تشغيل الباك إند...
start "Backend Server" cmd /k "cd ahcp-backend && npm run dev"

echo.
echo 2. انتظار 5 ثواني...
timeout /t 5 /nobreak > nul

echo.
echo 3. تشغيل الفرونت إند...
start "Frontend Server" cmd /k "cd ahcp-dashboard && npm run dev"

echo.
echo 4. انتظار 10 ثواني...
timeout /t 10 /nobreak > nul

echo.
echo 5. فتح المتصفح...
start http://localhost:3000

echo.
echo ========================================
echo    تم تشغيل النظام بنجاح!
echo ========================================
echo.
echo البيانات المطلوبة:
echo البريد: admin@ahcp.gov.sa
echo كلمة المرور: Admin@123456
echo.
echo اضغط أي مفتاح للخروج...
pause > nul