@echo off
echo ========================================
echo   تشغيل سريع - نظام إدارة الصحة الحيوانية
echo ========================================
echo.

:: إنشاء ملف .env.local إذا لم يكن موجوداً
if not exist "ahcp-dashboard\.env.local" (
    echo 📝 إنشاء ملف .env.local...
    echo NODE_ENV=development > "ahcp-dashboard\.env.local"
    echo NEXT_PUBLIC_API_URL=http://localhost:3001/api >> "ahcp-dashboard\.env.local"
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> "ahcp-dashboard\.env.local"
    echo NEXT_PUBLIC_DEV_MODE=true >> "ahcp-dashboard\.env.local"
)

echo 🚀 بدء تشغيل النظام...
echo.

:: تشغيل الخادم الخلفي
echo 🔧 تشغيل الخادم الخلفي...
start "Backend" cmd /k "cd /d %cd%\ahcp-backend && set NODE_ENV=development && npm run dev"

:: انتظار 3 ثواني
timeout /t 3 /nobreak >nul

:: تشغيل الواجهة الأمامية
echo 🎨 تشغيل الواجهة الأمامية...
start "Frontend" cmd /k "cd /d %cd%\ahcp-dashboard && set NODE_ENV=development && npm run dev"

echo.
echo ✅ تم تشغيل النظام!
echo.
echo 🌐 لوحة التحكم: http://localhost:3000
echo 🔧 API الخادم: http://localhost:3001
echo.
echo اضغط أي مفتاح للخروج...
pause >nul
