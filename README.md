# نظام إدارة الصحة الحيوانية - AHCP

نظام شامل لإدارة خدمات الصحة الحيوانية يشمل إدارة العملاء، مكافحة الطفيليات، التحصينات، العيادات المتنقلة، المختبرات، وصحة الخيول.

## المميزات الرئيسية

- 🔐 نظام مصادقة آمن مع JWT
- 👥 إدارة المستخدمين والأدوار
- 🐄 إدارة العملاء والحيوانات
- 🦠 مكافحة الطفيليات
- 💉 إدارة التحصينات
- 🚑 العيادات المتنقلة
- 🔬 إدارة المختبرات
- 🐎 صحة الخيول
- 📊 تقارير شاملة
- 📱 واجهة مستخدم حديثة

## التقنيات المستخدمة

### الخادم الخلفي (Backend)
- Node.js + Express
- MongoDB + Mongoose
- JWT للمصادقة
- CORS للاتصال
- Swagger للتوثيق

### الواجهة الأمامية (Frontend)
- Next.js 15
- TypeScript
- Tailwind CSS
- Zustand للـ State Management
- Axios للـ API Calls

## التثبيت والتشغيل

### 1. تثبيت المتطلبات
```bash
# تثبيت جميع التبعيات
npm run install-all
```

### 2. إعداد قاعدة البيانات
```bash
# إنشاء بيانات تجريبية
npm run seed
```

### 3. التشغيل

#### للتطوير:
```bash
npm run start-dev
```

#### للإنتاج:
```bash
npm run start-prod
```

## بيانات تسجيل الدخول

| المستخدم | البريد الإلكتروني | كلمة المرور | الدور |
|---------|------------------|------------|-------|
| مدير النظام | admin@ahcp.gov.sa | Admin@123456 | مدير عام |
| مشرف مكافحة الطفيليات | parasite@ahcp.gov.sa | parasite123 | مشرف قسم |
| مشرف التحصينات | vaccination@ahcp.gov.sa | vaccination123 | مشرف قسم |
| مشرف العيادة المتنقلة | clinic@ahcp.gov.sa | clinic123 | مشرف قسم |
| مشرف المختبرات | laboratory@ahcp.gov.sa | lab123 | مشرف قسم |
| مشرف صحة الخيول | equine@ahcp.gov.sa | equine123 | مشرف قسم |
| عامل ميداني | field@ahcp.gov.sa | field123 | عامل ميداني |

## الروابط

- **الواجهة الأمامية**: http://localhost:3000
- **الخادم الخلفي**: http://localhost:3001
- **توثيق API**: http://localhost:3001/api-docs
- **فحص الصحة**: http://localhost:3001/health

## هيكل المشروع

```
ahcp-system/
├── ahcp-backend/          # الخادم الخلفي
│   ├── src/
│   │   ├── models/        # نماذج قاعدة البيانات
│   │   ├── routes/        # مسارات API
│   │   ├── middleware/    # middleware
│   │   └── scripts/       # سكريبتات مساعدة
│   └── package.json
├── ahcp-dashboard/        # الواجهة الأمامية
│   ├── app/              # صفحات التطبيق
│   ├── components/       # مكونات UI
│   ├── lib/             # مكتبات مساعدة
│   └── package.json
├── start-development.bat # تشغيل التطوير
├── start-production.bat  # تشغيل الإنتاج
└── README.md
```

## الأمان

- ✅ مصادقة JWT آمنة
- ✅ تشفير كلمات المرور
- ✅ حماية من CORS
- ✅ Rate Limiting
- ✅ التحقق من صحة البيانات

## الدعم

للحصول على الدعم أو الإبلاغ عن مشاكل، يرجى التواصل مع فريق التطوير.

## الترخيص

MIT License - انظر ملف LICENSE للتفاصيل.