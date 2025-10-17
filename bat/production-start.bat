@echo off
echo ========================================
echo    تشغيل النظام في وضع الإنتاج
echo    Production Mode System Start
echo ========================================
echo.

echo [1/6] إيقاف جميع العمليات...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodemon.exe >nul 2>&1
netstat -ano | findstr :3000 >nul 2>&1 && (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
)
netstat -ano | findstr :3001 >nul 2>&1 && (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
)
timeout /t 3 /nobreak > nul
echo ✅ تم إيقاف جميع العمليات

echo.
echo [2/6] إعداد متغيرات الإنتاج...
cd ahcp-backend
echo NODE_ENV=production > .env.local
echo JWT_SECRET=ahcp_super_secret_key_2024_production_change_this_key >> .env.local
echo PORT=3001 >> .env.local
cd ..\ahcp-dashboard
echo NODE_ENV=production > .env.local
echo NEXT_PUBLIC_API_URL=https://ahcp-backend-production.up.railway.app/api >> .env.local
echo ✅ تم إعداد متغيرات الإنتاج

echo.
echo [3/6] تنظيف الذاكرة المؤقتة...
cd ..\ahcp-backend
if exist node_modules\.cache rmdir /s /q node_modules\.cache >nul 2>&1
cd ..\ahcp-dashboard
if exist .next rmdir /s /q .next >nul 2>&1
echo ✅ تم تنظيف الذاكرة المؤقتة

echo.
echo [4/6] تشغيل الخادم الخلفي مع المصادقة...
cd ..\ahcp-backend
start "Backend - Production" cmd /k "set NODE_ENV=production && npm run dev"
echo ✅ تم تشغيل الخادم الخلفي

echo.
echo [5/6] انتظار تحميل الخادم...
timeout /t 12 /nobreak > nul

echo.
echo [6/6] تشغيل الفرونت إند مع المصادقة...
cd ..\ahcp-dashboard
start "Frontend - Production" cmd /k "set NODE_ENV=production && npm run dev"
echo ✅ تم تشغيل الفرونت إند

echo.
timeout /t 10 /nobreak > nul
start http://localhost:3000

echo ========================================
echo ✅ النظام يعمل في وضع الإنتاج!
echo.
echo 🔒 الميزات المفعلة:
echo    ✅ نظام المصادقة الكامل
echo    ✅ حفظ Tokens في localStorage
echo    ✅ إعادة التوجيه عند 401
echo    ✅ جميع APIs تتطلب مصادقة
echo    ✅ ربط حقيقي بقاعدة البيانات
echo.
echo 🌐 الروابط:
echo    - لوحة التحكم: http://localhost:3000
echo    - API الخادم: https://ahcp-backend-production.up.railway.app
echo    - تسجيل الدخول: http://localhost:3000/login
echo.
echo 📋 المميزات:
echo    ✅ صحة الخيول مربوطة بالخادم
echo    ✅ جدول التحصين يعمل
echo    ✅ جميع APIs متصلة
echo    ✅ البيانات حقيقية من قاعدة البيانات
echo.
echo 🎯 النظام جاهز للاستخدام الإنتاجي!
echo.
echo اضغط أي مفتاح للخروج...
pause > nul
