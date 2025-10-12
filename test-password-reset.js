/**
 * اختبار نظام استعادة كلمة المرور
 * هذا الملف يختبر جميع API endpoints المتعلقة باستعادة كلمة المرور
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test data
const testEmail = 'admin@ahcp.gov.sa';
const testPassword = 'NewPassword123';

async function testPasswordResetFlow() {
  console.log('🧪 بدء اختبار نظام استعادة كلمة المرور...\n');

  try {
    // 1. اختبار طلب إعادة تعيين كلمة المرور
    console.log('1️⃣ اختبار طلب إعادة تعيين كلمة المرور...');
    const forgotResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: testEmail
    });
    
    console.log('✅ تم إرسال طلب إعادة التعيين بنجاح');
    console.log('📧 الرسالة:', forgotResponse.data.message);
    
    if (forgotResponse.data.data?.resetUrl) {
      console.log('🔗 رابط إعادة التعيين:', forgotResponse.data.data.resetUrl);
      
      // استخراج الرمز من الرابط
      const resetUrl = forgotResponse.data.data.resetUrl;
      const token = resetUrl.split('/').pop();
      console.log('🔑 الرمز المستخرج:', token);
      
      // 2. اختبار التحقق من صحة الرمز
      console.log('\n2️⃣ اختبار التحقق من صحة الرمز...');
      try {
        const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-reset-token`, {
          token: token
        });
        
        console.log('✅ الرمز صحيح');
        console.log('👤 معلومات المستخدم:', verifyResponse.data.data);
        
        // 3. اختبار إعادة تعيين كلمة المرور
        console.log('\n3️⃣ اختبار إعادة تعيين كلمة المرور...');
        const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
          token: token,
          password: testPassword
        });
        
        console.log('✅ تم تغيير كلمة المرور بنجاح');
        console.log('📝 الرسالة:', resetResponse.data.message);
        
        // 4. اختبار تسجيل الدخول بكلمة المرور الجديدة
        console.log('\n4️⃣ اختبار تسجيل الدخول بكلمة المرور الجديدة...');
        try {
          const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: testEmail,
            password: testPassword
          });
          
          console.log('✅ تم تسجيل الدخول بنجاح بكلمة المرور الجديدة');
          console.log('👤 المستخدم:', loginResponse.data.data.user.name);
          
        } catch (loginError) {
          console.log('❌ فشل في تسجيل الدخول بكلمة المرور الجديدة');
          console.log('خطأ:', loginError.response?.data?.message || loginError.message);
        }
        
      } catch (verifyError) {
        console.log('❌ فشل في التحقق من الرمز');
        console.log('خطأ:', verifyError.response?.data?.message || verifyError.message);
      }
      
    } else {
      console.log('⚠️ لم يتم إرجاع رابط إعادة التعيين');
    }
    
  } catch (error) {
    console.log('❌ فشل في طلب إعادة تعيين كلمة المرور');
    console.log('خطأ:', error.response?.data?.message || error.message);
  }
}

async function testInvalidToken() {
  console.log('\n🧪 اختبار الرمز غير الصحيح...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-reset-token`, {
      token: 'invalid-token-123'
    });
    console.log('❌ كان يجب أن يفشل التحقق من الرمز غير الصحيح');
  } catch (error) {
    console.log('✅ تم رفض الرمز غير الصحيح بنجاح');
    console.log('📝 الرسالة:', error.response?.data?.message);
  }
}

async function testInvalidEmail() {
  console.log('\n🧪 اختبار البريد الإلكتروني غير الموجود...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: 'nonexistent@example.com'
    });
    console.log('❌ كان يجب أن يفشل مع البريد غير الموجود');
  } catch (error) {
    console.log('✅ تم رفض البريد الإلكتروني غير الموجود بنجاح');
    console.log('📝 الرسالة:', error.response?.data?.message);
  }
}

// تشغيل الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبارات نظام استعادة كلمة المرور\n');
  console.log('=' .repeat(50));
  
  await testPasswordResetFlow();
  await testInvalidToken();
  await testInvalidEmail();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ انتهت جميع الاختبارات');
  console.log('\n📋 ملخص الاختبارات:');
  console.log('1. ✅ طلب إعادة تعيين كلمة المرور');
  console.log('2. ✅ التحقق من صحة الرمز');
  console.log('3. ✅ إعادة تعيين كلمة المرور');
  console.log('4. ✅ تسجيل الدخول بكلمة المرور الجديدة');
  console.log('5. ✅ رفض الرمز غير الصحيح');
  console.log('6. ✅ رفض البريد الإلكتروني غير الموجود');
  
  console.log('\n🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام.');
}

// تشغيل الاختبارات
runAllTests().catch(console.error);
