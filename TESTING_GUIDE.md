# دليل اختبار نظام إدارة الصحة الحيوانية (AHCP)

## نظرة عامة
هذا الدليل يوضح كيفية اختبار جميع مكونات نظام إدارة الصحة الحيوانية بشكل شامل وفعال.

## متطلبات الاختبار

### البيئة المطلوبة
- **Backend**: Node.js v18+, MongoDB
- **Frontend**: Next.js 14+, React 18+
- **أدوات الاختبار**: Postman أو Thunder Client
- **المتصفحات**: Chrome, Firefox, Safari, Edge

### بيانات الاختبار
```json
{
  "admin": {
    "email": "admin@ahcp.com",
    "password": "admin123",
    "role": "super_admin"
  },
  "supervisor": {
    "email": "supervisor@ahcp.com", 
    "password": "supervisor123",
    "role": "section_supervisor",
    "section": "VET"
  },
  "worker": {
    "email": "worker@ahcp.com",
    "password": "worker123", 
    "role": "field_worker",
    "section": "VET"
  }
}
```

## اختبار Backend APIs

### 1. اختبار المصادقة (Authentication)

#### تسجيل الدخول
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@ahcp.com",
  "password": "admin123"
}
```

**النتيجة المتوقعة:**
- Status: 200
- Response يحتوي على token و user data
- Token صالح لمدة محددة

#### الحصول على المعلومات الشخصية
```bash
GET http://localhost:3001/api/auth/me
Authorization: Bearer YOUR_TOKEN
```

### 2. اختبار إدارة المستخدمين

#### إنشاء مدير نظام جديد
```bash
POST http://localhost:3001/api/users/admins
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "name": "مدير جديد",
  "email": "newadmin@ahcp.com",
  "password": "password123"
}
```

#### إنشاء مشرف قسم
```bash
POST http://localhost:3001/api/users/supervisors
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "name": "مشرف قسم جديد",
  "email": "newsupervisor@ahcp.com", 
  "password": "password123",
  "section": "VET"
}
```

#### إنشاء عامل ميداني
```bash
POST http://localhost:3001/api/users/workers
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "name": "عامل ميداني جديد",
  "email": "newworker@ahcp.com",
  "password": "password123", 
  "section": "VET"
}
```

### 3. اختبار إدارة الأقسام

#### إنشاء قسم جديد
```bash
POST http://localhost:3001/api/sections
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "name": "قسم الطب البيطري",
  "nameEn": "Veterinary Department",
  "code": "VET",
  "description": "قسم مختص بالطب البيطري والعلاج"
}
```

#### الحصول على جميع الأقسام
```bash
GET http://localhost:3001/api/sections
Authorization: Bearer TOKEN
```

#### الحصول على الأقسام النشطة
```bash
GET http://localhost:3001/api/sections/active
Authorization: Bearer TOKEN
```

### 4. اختبار البيانات الأساسية

#### العملاء (Clients)
```bash
# إنشاء عميل جديد
POST http://localhost:3001/api/clients
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "01234567890",
  "address": "القاهرة، مصر",
  "birthDate": "1980-01-01"
}
```

#### مكافحة الطفيليات (Parasite Control)
```bash
# إنشاء سجل مكافحة طفيليات
POST http://localhost:3001/api/parasite-control
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "serialNumber": "PC001",
  "date": "2024-01-15",
  "client": "CLIENT_ID",
  "location": "مزرعة الأمل",
  "herdCounts": {
    "sheep": { "total": 100, "young": 20, "female": 60, "treated": 95 },
    "goats": { "total": 50, "young": 10, "female": 30, "treated": 48 }
  },
  "insecticide": {
    "type": "Cypermethrin",
    "method": "رش",
    "volume": 10,
    "status": "مكتمل"
  }
}
```

## اختبار Frontend

### 1. اختبار صفحة تسجيل الدخول

#### خطوات الاختبار:
1. افتح `http://localhost:3000/login`
2. أدخل بيانات صحيحة
3. تحقق من إعادة التوجيه للصفحة الرئيسية
4. تحقق من حفظ الـ token

#### اختبار حالات الخطأ:
- بيانات خاطئة
- حقول فارغة
- كلمة مرور قصيرة

### 2. اختبار صفحة الإعدادات

#### إدارة المستخدمين:
1. انتقل إلى `/settings`
2. اختر تبويب "المستخدمين"
3. اختبر إضافة مدير جديد
4. اختبر إضافة مشرف جديد
5. اختبر إضافة عامل جديد
6. تحقق من عرض القائمة بشكل صحيح

#### إدارة الأقسام:
1. اختر تبويب "الأقسام"
2. اختبر إضافة قسم جديد
3. اختبر تعديل قسم موجود
4. اختبر تفعيل/إلغاء تفعيل قسم
5. تحقق من عدد المستخدمين في كل قسم

### 3. اختبار الجداول والبيانات

#### جدول العملاء:
1. انتقل إلى `/clients`
2. تحقق من تحميل البيانات
3. اختبر البحث والتصفية
4. اختبر إضافة عميل جديد
5. اختبر تعديل عميل موجود
6. اختبر عرض التفاصيل (العين الزرقاء)

#### جدول مكافحة الطفيليات:
1. انتقل إلى `/parasite-control`
2. تحقق من عرض جميع الحقول بشكل صحيح
3. اختبر إضافة سجل جديد مع جميع البيانات
4. تحقق من حساب الإحصائيات
5. اختبر التصفية حسب التاريخ والحالة

## اختبار الأداء

### 1. اختبار سرعة التحميل
- الصفحة الرئيسية: < 2 ثانية
- الجداول مع البيانات: < 3 ثواني
- تحميل النماذج: < 1 ثانية

### 2. اختبار الاستجابة
- اختبر على شاشات مختلفة (موبايل، تابلت، ديسكتوب)
- تحقق من عمل القوائم والأزرار
- اختبر التمرير والتنقل

## اختبار الأمان

### 1. اختبار الصلاحيات
```bash
# محاولة الوصول بدون token
GET http://localhost:3001/api/users
# يجب أن يعطي 401 Unauthorized

# محاولة إنشاء مدير بصلاحيات مشرف
POST http://localhost:3001/api/users/admins
Authorization: Bearer SUPERVISOR_TOKEN
# يجب أن يعطي 403 Forbidden
```

### 2. اختبار حماية البيانات
- تحقق من عدم ظهور كلمات المرور في الاستجابات
- اختبر انتهاء صلاحية الـ tokens
- تحقق من تشفير البيانات الحساسة

## اختبار التكامل

### 1. سيناريو كامل - إضافة مستخدم جديد
1. تسجيل دخول كمدير
2. إنشاء قسم جديد
3. إضافة مشرف للقسم
4. إضافة عامل للقسم
5. تحقق من ظهور المستخدمين في القسم
6. اختبار تسجيل دخول المستخدمين الجدد

### 2. سيناريو كامل - إدارة البيانات
1. تسجيل دخول كعامل
2. إضافة عميل جديد
3. إنشاء سجل مكافحة طفيليات للعميل
4. تحديث بيانات السجل
5. تحقق من الإحصائيات
6. عرض التقارير

## اختبار المتصفحات

### المتصفحات المدعومة:
- ✅ Chrome (آخر إصدار)
- ✅ Firefox (آخر إصدار)
- ✅ Safari (آخر إصدار)
- ✅ Edge (آخر إصدار)

### الميزات المطلوب اختبارها:
- تسجيل الدخول/الخروج
- التنقل بين الصفحات
- النماذج والمدخلات
- الجداول والتصفية
- الإشعارات والرسائل

## اختبار قاعدة البيانات

### 1. اختبار الاتصال
```javascript
// اختبار الاتصال بـ MongoDB
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ahcp_database')
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection failed:', err));
```

### 2. اختبار العمليات
- إنشاء سجلات جديدة
- قراءة البيانات مع التصفية
- تحديث السجلات الموجودة
- حذف السجلات (soft delete)

## قائمة التحقق النهائية

### Backend ✅
- [ ] جميع APIs تعمل بشكل صحيح
- [ ] المصادقة والصلاحيات تعمل
- [ ] قاعدة البيانات متصلة ومستقرة
- [ ] معالجة الأخطاء تعمل بشكل صحيح
- [ ] التوثيق (Swagger) محدث

### Frontend ✅
- [ ] جميع الصفحات تحمل بشكل صحيح
- [ ] النماذج تعمل وتحفظ البيانات
- [ ] الجداول تعرض البيانات بشكل صحيح
- [ ] البحث والتصفية يعملان
- [ ] الإشعارات تظهر بشكل صحيح

### الأمان ✅
- [ ] الصلاحيات محمية بشكل صحيح
- [ ] البيانات الحساسة مشفرة
- [ ] الـ tokens تنتهي صلاحيتها
- [ ] لا توجد ثغرات أمنية واضحة

### الأداء ✅
- [ ] أوقات التحميل مقبولة
- [ ] الاستجابة سريعة
- [ ] لا توجد تسريبات في الذاكرة
- [ ] قاعدة البيانات محسنة

## تشغيل الاختبارات

### تشغيل النظام للاختبار:

```bash
# تشغيل Backend
cd ahcp-backend
npm run dev

# تشغيل Frontend (في terminal آخر)
cd ahcp-dashboard  
npm run dev
```

### URLs للاختبار:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## الإبلاغ عن المشاكل

عند العثور على مشكلة، يرجى تسجيل:
1. **الخطوات**: كيفية إعادة إنتاج المشكلة
2. **النتيجة المتوقعة**: ما كان يجب أن يحدث
3. **النتيجة الفعلية**: ما حدث بالفعل
4. **البيئة**: المتصفح، نظام التشغيل، إلخ
5. **لقطات الشاشة**: إذا كانت مفيدة

## خاتمة

هذا الدليل يغطي الجوانب الأساسية لاختبار النظام. يُنصح بإجراء هذه الاختبارات بانتظام، خاصة بعد إضافة ميزات جديدة أو تحديث النظام.
