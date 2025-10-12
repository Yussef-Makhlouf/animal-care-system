# دليل نظام الترجمة العربية للرسائل

## نظرة عامة

تم تطوير نظام شامل للترجمة العربية لجميع رسائل النظام، مما يوفر تجربة مستخدم محسنة باللغة العربية.

## الميزات الرئيسية

### 🌐 **ترجمة شاملة**
- جميع الرسائل باللغة العربية
- رسائل واضحة ومفهومة للمستخدم
- دعم رسائل النجاح والخطأ والتحذير والمعلومات

### 🎯 **معالجة ذكية للأخطاء**
- تحويل أخطاء الخادم إلى رسائل مفهومة
- معالجة أخطاء الشبكة والاتصال
- رسائل مخصصة لكل نوع خطأ

### 🔧 **سهولة الاستخدام**
- API بسيط وسهل الاستخدام
- دعم جميع أنواع العمليات
- تكامل مع نظام المصادقة

## الملفات المحدثة

### 1. نظام الترجمة (`ahcp-dashboard/lib/utils/toast-utils.ts`)

#### الرسائل المترجمة:
```typescript
// رسائل النجاح
success: {
  login: "تم تسجيل الدخول بنجاح",
  logout: "تم تسجيل الخروج بنجاح",
  passwordReset: "تم إرسال رابط إعادة تعيين كلمة المرور",
  passwordChanged: "تم تغيير كلمة المرور بنجاح",
  create: (entity) => `تم إنشاء ${entity} بنجاح`,
  update: (entity) => `تم تحديث ${entity} بنجاح`,
  delete: (entity) => `تم حذف ${entity} بنجاح`,
}

// رسائل الخطأ
error: {
  network: "فشل في الاتصال. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى",
  server: "حدث خطأ في الخادم. يرجى المحاولة لاحقاً",
  unauthorized: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى",
  forbidden: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
  invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  accountDeactivated: "الحساب غير مفعل أو محظور",
  userNotFound: "لا يوجد مستخدم بهذا البريد الإلكتروني",
  invalidToken: "الرمز غير صحيح أو منتهي الصلاحية",
  emailSendFailed: "فشل في إرسال البريد الإلكتروني",
}
```

#### معالجة الأخطاء الذكية:
```typescript
handleApiError: (error, action) => {
  // معالجة أخطاء الشبكة
  if (!error.response) {
    if (error.code === 'ECONNREFUSED') return toastUtils.error.network();
    if (error.code === 'ECONNABORTED') return toastUtils.error.timeout();
    return toastUtils.error.server();
  }

  // معالجة أخطاء الخادم
  switch (error.response.status) {
    case 400: // Bad Request
    case 401: // Unauthorized  
    case 403: // Forbidden
    case 404: // Not Found
    case 500: // Server Error
    // ... معالجة مخصصة لكل حالة
  }
}
```

### 2. تحديث صفحات المصادقة

#### صفحة تسجيل الدخول (`ahcp-dashboard/app/login/page.tsx`):
```typescript
// استخدام النظام الجديد
import { entityToasts } from '@/lib/utils/toast-utils';

// في دالة تسجيل الدخول
try {
  await login({ email, password });
  entityToasts.auth.login(); // رسالة نجاح
} catch (error) {
  entityToasts.auth.error(error); // معالجة الخطأ
}
```

#### صفحة نسيان كلمة المرور (`ahcp-dashboard/app/forgot-password/page.tsx`):
```typescript
try {
  const response = await authApi.forgotPassword(values.email);
  entityToasts.auth.passwordReset(); // رسالة نجاح
} catch (error) {
  entityToasts.auth.error(error); // معالجة الخطأ
}
```

#### صفحة إعادة تعيين كلمة المرور (`ahcp-dashboard/app/reset-password/[token]/page.tsx`):
```typescript
try {
  await authApi.resetPassword(token, values.password);
  entityToasts.auth.passwordChanged(); // رسالة نجاح
} catch (error) {
  entityToasts.auth.error(error); // معالجة الخطأ
}
```

## كيفية الاستخدام

### للمطورين

#### 1. استخدام رسائل النجاح:
```typescript
import { entityToasts } from '@/lib/utils/toast-utils';

// رسائل المصادقة
entityToasts.auth.login();
entityToasts.auth.logout();
entityToasts.auth.passwordReset();
entityToasts.auth.passwordChanged();

// رسائل العمليات العامة
entityToasts.client.create();
entityToasts.vaccination.update();
entityToasts.mobileClinic.delete();
```

#### 2. معالجة الأخطاء:
```typescript
try {
  await someApiCall();
  entityToasts.auth.login();
} catch (error) {
  entityToasts.auth.error(error); // معالجة تلقائية للخطأ
}
```

#### 3. رسائل مخصصة:
```typescript
import { toastUtils } from '@/lib/utils/toast-utils';

// رسائل مخصصة
toastUtils.success.custom("تم تنفيذ العملية بنجاح");
toastUtils.error.custom("حدث خطأ مخصص");
toastUtils.warning.custom("تحذير مهم");
toastUtils.info.custom("معلومة مفيدة");
```

### للمستخدمين

#### رسائل النجاح:
- ✅ "تم تسجيل الدخول بنجاح"
- ✅ "تم إرسال رابط إعادة تعيين كلمة المرور"
- ✅ "تم تغيير كلمة المرور بنجاح"
- ✅ "تم إنشاء العميل بنجاح"

#### رسائل الخطأ:
- ❌ "البريد الإلكتروني أو كلمة المرور غير صحيحة"
- ❌ "الحساب غير مفعل أو محظور"
- ❌ "فشل في الاتصال. يرجى التحقق من اتصال الإنترنت"
- ❌ "الرمز غير صحيح أو منتهي الصلاحية"

#### رسائل التحذير:
- ⚠️ "لديك تغييرات غير محفوظة. هل أنت متأكد من المغادرة؟"
- ⚠️ "هذا الإجراء قد يؤدي إلى فقدان البيانات. يرجى التأكيد"

#### رسائل المعلومات:
- ℹ️ "جاري تحميل البيانات..."
- ℹ️ "جاري معالجة الطلب..."

## أنواع الأخطاء المدعومة

### 1. أخطاء الشبكة
- `ECONNREFUSED` - رفض الاتصال
- `ERR_NETWORK` - خطأ في الشبكة
- `ECONNABORTED` - انتهت مهلة الطلب

### 2. أخطاء الخادم
- `400` - طلب غير صحيح
- `401` - غير مصرح
- `403` - محظور
- `404` - غير موجود
- `409` - تعارض
- `422` - خطأ في التحقق
- `500` - خطأ في الخادم

### 3. أخطاء المصادقة
- بيانات دخول خاطئة
- حساب غير مفعل
- رمز منتهي الصلاحية
- فشل في إرسال البريد الإلكتروني

## الاختبار

### تشغيل اختبارات الترجمة:
```bash
node test-arabic-toast-system.js
```

### اختبارات شاملة:
1. ✅ رسائل خطأ البريد الإلكتروني
2. ✅ رسائل خطأ البيانات المطلوبة
3. ✅ رسائل خطأ الرموز
4. ✅ رسائل خطأ كلمة المرور
5. ✅ رسائل خطأ تسجيل الدخول
6. ✅ رسائل نجاح العمليات
7. ✅ معالجة أخطاء الخادم
8. ✅ معالجة أخطاء الشبكة

## التخصيص

### إضافة رسائل جديدة:
```typescript
// في ملف toast-utils.ts
const translations = {
  success: {
    customAction: "تم تنفيذ العملية المخصصة بنجاح",
  },
  error: {
    customError: "حدث خطأ مخصص",
  }
};
```

### تخصيص معالجة الأخطاء:
```typescript
// إضافة معالجة مخصصة
handleApiError: (error, action) => {
  // معالجة مخصصة للأخطاء
  if (error.response?.data?.customError) {
    return toastUtils.error.custom(error.response.data.customError);
  }
  // ... باقي المعالجة
}
```

## أفضل الممارسات

### 1. استخدام الرسائل المناسبة:
```typescript
// ✅ جيد - استخدام الرسائل المخصصة
entityToasts.auth.login();

// ❌ تجنب - رسائل عامة
toastUtils.success.custom("تم تسجيل الدخول");
```

### 2. معالجة الأخطاء:
```typescript
// ✅ جيد - معالجة شاملة
try {
  await apiCall();
  entityToasts.auth.login();
} catch (error) {
  entityToasts.auth.error(error);
}

// ❌ تجنب - تجاهل الأخطاء
try {
  await apiCall();
} catch (error) {
  // لا شيء
}
```

### 3. رسائل واضحة:
```typescript
// ✅ جيد - رسائل واضحة
"تم إرسال رابط إعادة تعيين كلمة المرور"

// ❌ تجنب - رسائل غامضة
"تم الإرسال"
```

## الدعم

للحصول على الدعم أو الإبلاغ عن مشاكل:
- تحقق من ملف `test-arabic-toast-system.js`
- راجع سجلات المتصفح للأخطاء
- تأكد من صحة إعدادات API

---

**ملاحظة**: جميع الرسائل مدعومة باللغة العربية وتوفر تجربة مستخدم محسنة.
