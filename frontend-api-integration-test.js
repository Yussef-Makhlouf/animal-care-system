const axios = require('axios');

// إعدادات الاختبار
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001/api';
const TIMEOUT = 15000;

// ألوان للطباعة
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// إنشاء instance من axios للباك إند
const backendApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// إنشاء instance من axios للفرونت إند
const frontendApi = axios.create({
  baseURL: FRONTEND_URL,
  timeout: TIMEOUT,
});

let authToken = null;

// اختبار تسجيل الدخول والحصول على التوكين
async function testLogin() {
  try {
    log('🔐 اختبار تسجيل الدخول...', 'blue');
    
    const response = await backendApi.post('/auth/login', {
      email: 'admin@ahcp.gov.sa',
      password: 'Admin@123456'
    });

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      log('✅ تم تسجيل الدخول بنجاح', 'green');
      return true;
    } else {
      log('❌ فشل في تسجيل الدخول', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ خطأ في تسجيل الدخول: ${error.message}`, 'red');
    return false;
  }
}

// اختبار نقاط النهاية للإحصائيات
const statisticsEndpoints = [
  { name: 'Parasite Control Statistics', url: '/parasite-control/statistics' },
  { name: 'Vaccination Statistics', url: '/vaccination/statistics' },
  { name: 'Mobile Clinics Statistics', url: '/mobile-clinics/statistics' },
  { name: 'Laboratories Statistics', url: '/laboratories/statistics' },
  { name: 'Clients Statistics', url: '/clients/statistics' },
];

// اختبار نقاط النهاية للبيانات
const dataEndpoints = [
  { name: 'Parasite Control List', url: '/parasite-control?limit=5' },
  { name: 'Vaccination List', url: '/vaccination?limit=5' },
  { name: 'Mobile Clinics List', url: '/mobile-clinics?limit=5' },
  { name: 'Laboratories List', url: '/laboratories?limit=5' },
  { name: 'Clients List', url: '/clients?limit=5' },
];

// اختبار صفحات الفرونت إند
const frontendPages = [
  { name: 'Home Page', url: '/' },
  { name: 'Login Page', url: '/login' },
  { name: 'Parasite Control Page', url: '/parasite-control' },
  { name: 'Vaccination Page', url: '/vaccination' },
  { name: 'Mobile Clinics Page', url: '/mobile-clinics' },
  { name: 'Laboratories Page', url: '/laboratories' },
  { name: 'Clients Page', url: '/clients' },
  { name: 'Profile Page', url: '/profile' },
];

async function testBackendEndpoint(endpoint) {
  try {
    const config = {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    };

    const response = await backendApi.get(endpoint.url, config);
    
    if (response.status >= 200 && response.status < 300) {
      log(`✅ ${endpoint.name} - Status: ${response.status}`, 'green');
      
      // طباعة معاينة للبيانات
      if (response.data.data) {
        const data = response.data.data;
        if (Array.isArray(data)) {
          log(`   📊 عدد السجلات: ${data.length}`, 'cyan');
        } else if (typeof data === 'object') {
          const keys = Object.keys(data).slice(0, 3);
          const preview = keys.map(key => `${key}: ${data[key]}`).join(', ');
          log(`   📊 ${preview}`, 'cyan');
        }
      }
      
      return true;
    } else {
      log(`❌ ${endpoint.name} - Status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`❌ ${endpoint.name} - Server not running`, 'red');
    } else if (error.response) {
      log(`❌ ${endpoint.name} - Status: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`, 'red');
    } else {
      log(`❌ ${endpoint.name} - ${error.message}`, 'red');
    }
    return false;
  }
}

async function testFrontendPage(page) {
  try {
    const response = await frontendApi.get(page.url);
    
    if (response.status >= 200 && response.status < 300) {
      log(`✅ ${page.name} - Status: ${response.status}`, 'green');
      
      // التحقق من وجود محتوى HTML
      if (response.data && response.data.includes('<!DOCTYPE html>')) {
        log(`   📄 صفحة HTML صحيحة`, 'cyan');
      }
      
      return true;
    } else {
      log(`❌ ${page.name} - Status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`❌ ${page.name} - Frontend server not running`, 'red');
    } else if (error.response) {
      log(`❌ ${page.name} - Status: ${error.response.status}`, 'red');
    } else {
      log(`❌ ${page.name} - ${error.message}`, 'red');
    }
    return false;
  }
}

async function testCORSConfiguration() {
  try {
    log('🌐 اختبار إعدادات CORS...', 'blue');
    
    const response = await axios.options(BACKEND_URL + '/health', {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    if (response.status === 200) {
      log('✅ CORS مُعد بشكل صحيح', 'green');
      return true;
    } else {
      log('❌ مشكلة في إعدادات CORS', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ خطأ في اختبار CORS: ${error.message}`, 'red');
    return false;
  }
}

async function runFullIntegrationTest() {
  log('🧪 بدء اختبار التكامل الشامل للفرونت إند والباك إند...', 'bold');
  log('=' .repeat(70), 'yellow');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // اختبار تسجيل الدخول
  totalTests++;
  const loginSuccess = await testLogin();
  if (loginSuccess) passedTests++; else failedTests++;
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  // اختبار CORS
  totalTests++;
  const corsSuccess = await testCORSConfiguration();
  if (corsSuccess) passedTests++; else failedTests++;
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  // اختبار الإحصائيات
  log('\n📊 اختبار APIs الإحصائيات...', 'blue');
  for (const endpoint of statisticsEndpoints) {
    totalTests++;
    const result = await testBackendEndpoint(endpoint);
    if (result) passedTests++; else failedTests++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // اختبار البيانات
  log('\n📋 اختبار APIs البيانات...', 'blue');
  for (const endpoint of dataEndpoints) {
    totalTests++;
    const result = await testBackendEndpoint(endpoint);
    if (result) passedTests++; else failedTests++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // اختبار صفحات الفرونت إند
  log('\n🎨 اختبار صفحات الفرونت إند...', 'blue');
  for (const page of frontendPages) {
    totalTests++;
    const result = await testFrontendPage(page);
    if (result) passedTests++; else failedTests++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // النتائج النهائية
  log('\n' + '=' .repeat(70), 'yellow');
  log('📊 نتائج اختبار التكامل:', 'bold');
  log(`✅ نجح: ${passedTests}`, 'green');
  log(`❌ فشل: ${failedTests}`, 'red');
  log(`📈 معدل النجاح: ${Math.round((passedTests / totalTests) * 100)}%`, 'blue');
  
  if (failedTests === 0) {
    log('\n🎉 جميع الاختبارات نجحت! النظام متكامل بالكامل!', 'green');
  } else if (failedTests <= 2) {
    log('\n⚠️  النظام يعمل مع بعض المشاكل الطفيفة', 'yellow');
  } else {
    log('\n🚨 النظام يحتاج إلى إصلاحات مهمة', 'red');
  }
  
  log('\n💡 نصائح للاختبار:', 'cyan');
  log('- تأكد من تشغيل الخادم الخلفي على المنفذ 3001', 'cyan');
  log('- تأكد من تشغيل الواجهة الأمامية على المنفذ 3000', 'cyan');
  log('- تحقق من اتصال قاعدة البيانات', 'cyan');
  log('- راجع console المتصفح للأخطاء التفصيلية', 'cyan');
  
  log('=' .repeat(70), 'yellow');
}

// تشغيل الاختبار
runFullIntegrationTest().catch(error => {
  log(`💥 خطأ في تشغيل الاختبار: ${error.message}`, 'red');
  process.exit(1);
});
