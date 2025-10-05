# إعداد بيئة التطوير - نظام إدارة الصحة الحيوانية

## 🚀 التشغيل السريع

### الطريقة الأولى: استخدام الملف التلقائي
```bash
# تشغيل النظام كاملاً
start-complete-system.bat

# أو التشغيل السريع
quick-start.bat
```

### الطريقة الثانية: التشغيل اليدوي
```bash
# 1. تشغيل الخادم الخلفي
cd ahcp-backend
set NODE_ENV=development
npm run dev

# 2. تشغيل الواجهة الأمامية (في terminal جديد)
cd ahcp-dashboard  
set NODE_ENV=development
npm run dev
```

## 🔧 إعدادات البيئة

### الخادم الخلفي (.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://yussefmakhloufiti_db_user:Yussef12345@cluster0.pgy8qei.mongodb.net/ahcp_database?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=ahcp_super_secret_key_2024_development_only_change_in_production_123456789
```

### الواجهة الأمامية (.env.local)
```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEV_MODE=true
```

**ملاحظة**: ملف `.env.local` يتم إنشاؤه تلقائياً عند تشغيل `quick-start.bat`

## 🛡️ نظام المصادقة في التطوير

في بيئة التطوير، تم تعطيل نظام المصادقة للتسهيل:

- ✅ **Middleware**: يسمح بالوصول لجميع الصفحات
- ✅ **AuthGuard**: معطل في بيئة التطوير  
- ✅ **AuthProvider**: يقوم بتسجيل دخول تلقائي
- ✅ **Backend Auth**: يستخدم مستخدم وهمي

## 🌐 الروابط المهمة

| الخدمة | الرابط | الوصف |
|---------|--------|--------|
| لوحة التحكم | http://localhost:3000 | الواجهة الرئيسية |
| API الخادم | http://localhost:3001 | الخادم الخلفي |
| توثيق API | http://localhost:3001/api-docs | Swagger Documentation |
| فحص الصحة | http://localhost:3001/health | Health Check |

## 👤 بيانات تسجيل الدخول

```
البريد الإلكتروني: admin@ahcp.gov.sa
كلمة المرور: Admin@123456
```

## 📊 الصفحات المتاحة

### ✅ مكتملة وتعمل
- **الرئيسية**: `/` - لوحة التحكم الرئيسية
- **مكافحة الطفيليات**: `/parasite-control` - إدارة سجلات مكافحة الطفيليات
- **التطعيمات**: `/vaccination` - إدارة سجلات التطعيمات  
- **العملاء**: `/clients` - إدارة بيانات العملاء
- **العيادات المتنقلة**: `/mobile-clinics` - إدارة سجلات العيادات المتنقلة
- **المختبرات**: `/laboratories` - إدارة سجلات المختبرات
- **البروفايل**: `/profile` - إدارة الملف الشخصي

### 🔄 قيد التطوير
- **التقارير**: `/reports` - تقارير شاملة
- **الجدولة**: `/scheduling` - جدولة المواعيد

## 🔧 APIs المتاحة

### إحصائيات
- `GET /api/parasite-control/statistics`
- `GET /api/vaccination/statistics`
- `GET /api/mobile-clinics/statistics`
- `GET /api/laboratories/statistics`
- `GET /api/clients/statistics`

### البيانات
- `GET /api/parasite-control` - قائمة سجلات مكافحة الطفيليات
- `GET /api/vaccination` - قائمة سجلات التطعيمات
- `GET /api/mobile-clinics` - قائمة سجلات العيادات المتنقلة
- `GET /api/laboratories` - قائمة سجلات المختبرات
- `GET /api/clients` - قائمة العملاء

## 🧪 اختبار النظام

```bash
# تشغيل اختبار شامل للـ APIs
node test-all-apis.js
```

## 🚨 حل المشاكل الشائعة

### المشكلة: إعادة توجيه لصفحة تسجيل الدخول
**الحل**: تأكد من أن `NODE_ENV=development` في كلا المشروعين

### المشكلة: خطأ CORS
**الحل**: تم إصلاح CORS نهائياً في الإعدادات الجديدة

### المشكلة: خطأ في الاتصال بقاعدة البيانات
**الحل**: تحقق من اتصال الإنترنت وصحة رابط MongoDB

## 📝 ملاحظات التطوير

1. **الأمان**: في بيئة التطوير، الأمان مبسط للتسهيل
2. **البيانات**: قاعدة البيانات مشتركة بين جميع المطورين
3. **التحديثات**: يتم حفظ التغييرات تلقائياً مع hot reload
4. **الأخطاء**: راجع console المتصفح و terminal للأخطاء

## 🎯 الخطوات التالية

1. اختبار جميع الصفحات والوظائف
2. إضافة المزيد من التقارير
3. تحسين واجهة المستخدم
4. إضافة المزيد من الفلاتر والبحث
5. تحسين الأداء والتحميل

---

**آخر تحديث**: 2025-01-05 05:24 AM  
**الحالة**: ✅ جاهز للاستخدام والتطوير
