@echo off
echo ========================================
echo   نظام إدارة الصحة الحيوانية - AHCP
echo   Animal Health Care Program
echo ========================================
echo.

:: تحديد الألوان
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%🚀 بدء تشغيل النظام المتكامل...%NC%
echo.

:: التحقق من وجود Node.js
echo %YELLOW%📋 فحص المتطلبات...%NC%
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ خطأ: Node.js غير مثبت. يرجى تثبيت Node.js أولاً.%NC%
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ خطأ: npm غير متوفر. يرجى تثبيت npm أولاً.%NC%
    pause
    exit /b 1
)

echo %GREEN%✅ Node.js و npm متوفران%NC%
echo.

:: التحقق من وجود المجلدات
if not exist "ahcp-backend" (
    echo %RED%❌ خطأ: مجلد ahcp-backend غير موجود%NC%
    pause
    exit /b 1
)

if not exist "ahcp-dashboard" (
    echo %RED%❌ خطأ: مجلد ahcp-dashboard غير موجود%NC%
    pause
    exit /b 1
)

echo %GREEN%✅ جميع المجلدات موجودة%NC%
echo.

:: تثبيت التبعيات للخادم الخلفي
echo %BLUE%📦 تثبيت تبعيات الخادم الخلفي...%NC%
cd ahcp-backend
if not exist "node_modules" (
    echo %YELLOW%🔄 تثبيت npm packages للخادم الخلفي...%NC%
    call npm install
    if errorlevel 1 (
        echo %RED%❌ فشل في تثبيت تبعيات الخادم الخلفي%NC%
        pause
        exit /b 1
    )
) else (
    echo %GREEN%✅ تبعيات الخادم الخلفي مثبتة مسبقاً%NC%
)

:: تثبيت التبعيات للواجهة الأمامية
echo %BLUE%📦 تثبيت تبعيات الواجهة الأمامية...%NC%
cd ..\ahcp-dashboard
if not exist "node_modules" (
    echo %YELLOW%🔄 تثبيت npm packages للواجهة الأمامية...%NC%
    call npm install
    if errorlevel 1 (
        echo %RED%❌ فشل في تثبيت تبعيات الواجهة الأمامية%NC%
        pause
        exit /b 1
    )
) else (
    echo %GREEN%✅ تبعيات الواجهة الأمامية مثبتة مسبقاً%NC%
)

cd ..

echo.
echo %GREEN%✅ جميع التبعيات جاهزة%NC%
echo.

:: إنشاء ملفات الإعداد إذا لم تكن موجودة
echo %BLUE%⚙️ فحص ملفات الإعداد...%NC%

if not exist "ahcp-backend\.env" (
    echo %YELLOW%📝 إنشاء ملف .env للخادم الخلفي...%NC%
    copy "ahcp-backend\.env.example" "ahcp-backend\.env" >nul 2>&1
)

if not exist "ahcp-dashboard\.env.local" (
    echo %YELLOW%📝 إنشاء ملف .env.local للواجهة الأمامية...%NC%
    echo NODE_ENV=development > "ahcp-dashboard\.env.local"
    echo NEXT_PUBLIC_API_URL=https://ahcp-backend-production.up.railway.app/api >> "ahcp-dashboard\.env.local"
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> "ahcp-dashboard\.env.local"
    echo NEXT_PUBLIC_DEV_MODE=true >> "ahcp-dashboard\.env.local"
)

echo %GREEN%✅ ملفات الإعداد جاهزة%NC%
echo.

:: بدء تشغيل الخوادم
echo %BLUE%🚀 بدء تشغيل الخوادم...%NC%
echo.

:: تشغيل الخادم الخلفي في نافذة منفصلة
echo %YELLOW%🔧 تشغيل الخادم الخلفي (Backend) على المنفذ 3001...%NC%
start "AHCP Backend Server" cmd /k "cd /d %cd%\ahcp-backend && npm run dev"

:: انتظار قليل للتأكد من بدء الخادم الخلفي
timeout /t 5 /nobreak >nul

:: تشغيل الواجهة الأمامية في نافذة منفصلة
echo %YELLOW%🎨 تشغيل الواجهة الأمامية (Frontend) على المنفذ 3000...%NC%
start "AHCP Frontend Dashboard" cmd /k "cd /d %cd%\ahcp-dashboard && npm run dev"

:: انتظار قليل للتأكد من بدء الواجهة الأمامية
timeout /t 3 /nobreak >nul

echo.
echo %GREEN%========================================%NC%
echo %GREEN%✅ تم تشغيل النظام بنجاح!%NC%
echo %GREEN%========================================%NC%
echo.
echo %BLUE%🌐 الروابط المهمة:%NC%
echo.
echo %YELLOW%📊 لوحة التحكم:%NC%        http://localhost:3000
echo %YELLOW%🔧 API الخادم:%NC%         https://ahcp-backend-production.up.railway.app
echo %YELLOW%📚 توثيق API:%NC%         https://ahcp-backend-production.up.railway.app/api-docs
echo %YELLOW%💚 فحص الصحة:%NC%         https://ahcp-backend-production.up.railway.app/health
echo.
echo %BLUE%👤 بيانات تسجيل الدخول:%NC%
echo %YELLOW%📧 البريد الإلكتروني:%NC%  admin@ahcp.gov.sa
echo %YELLOW%🔑 كلمة المرور:%NC%       Admin@123456
echo.
echo %GREEN%🎉 النظام جاهز للاستخدام!%NC%
echo.
echo %YELLOW%💡 نصائح:%NC%
echo - تأكد من اتصالك بالإنترنت لقاعدة البيانات
echo - استخدم المتصفحات الحديثة للحصول على أفضل تجربة
echo - راجع الوثائق في /api-docs للمطورين
echo.
echo %BLUE%🔄 لإعادة تشغيل النظام، شغل هذا الملف مرة أخرى%NC%
echo.
echo اضغط أي مفتاح للخروج...
pause >nul
