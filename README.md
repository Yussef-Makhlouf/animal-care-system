# Animal Health Care Program (AHCP) - نظام إدارة صحة الحيوان

## نظرة عامة
نظام متكامل لإدارة صحة الحيوان يتكون من:
- **Backend API** - خادم Express.js مع MongoDB
- **Frontend Dashboard** - لوحة تحكم Next.js

## البدء السريع

### 1. تشغيل الخادم الخلفي (Backend)
```bash
cd ahcp-backend
npm install
npm run dev
```
الخادم سيعمل على: `http://localhost:3001`

### 2. تشغيل لوحة التحكم (Frontend)
```bash
cd ahcp-dashboard
npm install
npm run dev
```
لوحة التحكم ستعمل على: `http://localhost:3000`

## الميزات المتاحة

### الخادم الخلفي (Backend)
- ✅ **المصادقة والتفويض** - JWT tokens
- ✅ **إدارة العملاء** - `/api/clients`
- ✅ **مكافحة الطفيليات** - `/api/parasite-control`
- ✅ **التحصينات** - `/api/vaccination`
- ✅ **العيادات المتنقلة** - `/api/mobile-clinics`
- ✅ **صحة الخيول** - `/api/equine-health`
- ✅ **المختبرات** - `/api/laboratories`
- ✅ **التقارير** - `/api/reports`
- ✅ **رفع الملفات** - `/api/upload`

### لوحة التحكم (Frontend)
- ✅ **لوحة تحكم رئيسية** مع إحصائيات شاملة
- ✅ **إدارة العملاء** مع البحث والتصفية
- ✅ **تسجيل مكافحة الطفيليات**
- ✅ **إدارة التحصينات**
- ✅ **العيادات المتنقلة**
- ✅ **صحة الخيول**
- ✅ **إدارة المختبرات**
- ✅ **التقارير والإحصائيات**

## التكامل المكتمل

### API Services
تم إنشاء خدمات API شاملة في المجلد `lib/api/`:
- `auth.ts` - خدمات المصادقة
- `clients.ts` - إدارة العملاء
- `parasite-control.ts` - مكافحة الطفيليات
- `vaccination.ts` - التحصينات
- `mobile-clinics.ts` - العيادات المتنقلة
- `equine-health.ts` - صحة الخيول
- `laboratories.ts` - المختبرات
- `reports.ts` - التقارير

### إدارة الحالة
- **Zustand** لإدارة حالة المصادقة
- **React Query** لإدارة البيانات والتخزين المؤقت
- **LocalStorage** للاستمرارية

### الأمان
- **CORS** مُكوّن بشكل صحيح
- **JWT Tokens** للمصادقة
- **Rate Limiting** لحماية API
- **Helmet** للأمان الإضافي

## متغيرات البيئة

### Backend (.env)
```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Frontend
يمكنك إنشاء ملف `.env.local` في مجلد `ahcp-dashboard`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## الاستخدام

### 1. تسجيل الدخول
- البريد الإلكتروني: `ibrahim@ahcp.gov.eg`
- كلمة المرور: `admin123`

### 2. استكشاف الميزات
- **لوحة التحكم**: إحصائيات شاملة ورسوم بيانية
- **إدارة العملاء**: إضافة وتعديل بيانات المربيين
- **الخدمات**: تسجيل جميع الأنشطة البيطرية
- **التقارير**: تصدير البيانات بصيغ مختلفة

## التطوير

### إضافة ميزات جديدة
1. أضف endpoint جديد في Backend
2. أنشئ API service في Frontend
3. أضف المكونات المطلوبة
4. اربط البيانات مع React Query

### اختبار API
استخدم Swagger UI المتاح على: `http://localhost:3001/api-docs`

## الدعم الفني
للمساعدة أو الإبلاغ عن مشاكل، يرجى التواصل مع فريق التطوير.

---
**تم تطوير النظام بواسطة فريق AHCP Development Team**
