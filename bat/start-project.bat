@echo off
echo ========================================
echo    نظام إدارة صحة الحيوان - AHCP
echo    Animal Health Care Program
echo ========================================
echo.

echo [1/5] بدء تشغيل الخادم الخلفي (Backend)...
cd ahcp-backend
start "AHCP Backend" cmd /k "npm run dev"
echo ✅ تم تشغيل الخادم الخلفي على http://localhost:3001
echo.

echo [2/5] انتظار تحميل الخادم الخلفي...
timeout /t 8 /nobreak > nul
echo.

echo [3/5] اختبار APIs...
cd ..
node test-apis.js
echo.

echo [4/5] بدء تشغيل لوحة التحكم (Frontend)...
cd ahcp-dashboard
start "AHCP Dashboard" cmd /k "npm run dev"
echo ✅ تم تشغيل لوحة التحكم على http://localhost:3000
echo.

echo [5/5] فتح المتصفح...
timeout /t 5 /nobreak > nul
start http://localhost:3000
echo.

echo ========================================
echo ✅ تم تشغيل النظام بنجاح!
echo.
echo 🌐 لوحة التحكم: http://localhost:3000
echo 🔧 API الخادم: http://localhost:3001
echo 📚 توثيق API: http://localhost:3001/api-docs
echo 🏥 فحص الصحة: http://localhost:3001/health
echo.
echo 📋 معلومات المصادقة:
echo    - تم تفعيل نظام المصادقة المبسط للتطوير
echo    - سيتم تسجيل الدخول تلقائياً
echo    - المستخدم: مدير النظام (admin@ahcp.gov.sa)
echo.
echo اضغط أي مفتاح للخروج...
pause > nul
