const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3001/api';
const TIMEOUT = 10000;

// إنشاء instance من axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ألوان للطباعة
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// قائمة نقاط النهاية للاختبار
const endpoints = [
  // Health Check
  { name: 'Health Check', method: 'GET', url: '/health', auth: false },
  
  // Authentication
  { name: 'Auth - Login', method: 'POST', url: '/auth/login', auth: false, 
    data: { email: 'admin@ahcp.gov.sa', password: 'Admin@123456' } },
  
  // Statistics endpoints
  { name: 'Parasite Control Statistics', method: 'GET', url: '/parasite-control/statistics', auth: true },
  { name: 'Vaccination Statistics', method: 'GET', url: '/vaccination/statistics', auth: true },
  { name: 'Mobile Clinics Statistics', method: 'GET', url: '/mobile-clinics/statistics', auth: true },
  { name: 'Laboratories Statistics', method: 'GET', url: '/laboratories/statistics', auth: true },
  { name: 'Clients Statistics', method: 'GET', url: '/clients/statistics', auth: true },
  
  // List endpoints
  { name: 'Parasite Control List', method: 'GET', url: '/parasite-control?limit=5', auth: true },
  { name: 'Vaccination List', method: 'GET', url: '/vaccination?limit=5', auth: true },
  { name: 'Mobile Clinics List', method: 'GET', url: '/mobile-clinics?limit=5', auth: true },
  { name: 'Laboratories List', method: 'GET', url: '/laboratories?limit=5', auth: true },
  { name: 'Clients List', method: 'GET', url: '/clients?limit=5', auth: true },
];

let authToken = null;

async function testEndpoint(endpoint) {
  try {
    const config = {
      method: endpoint.method.toLowerCase(),
      url: endpoint.url,
    };

    if (endpoint.data) {
      config.data = endpoint.data;
    }

    if (endpoint.auth && authToken) {
      config.headers = {
        'Authorization': `Bearer ${authToken}`
      };
    }

    const response = await api(config);
    
    // حفظ التوكين من تسجيل الدخول
    if (endpoint.name === 'Auth - Login' && response.data.success) {
      authToken = response.data.data.token;
      log(`✅ ${endpoint.name} - Token saved`, 'green');
      return true;
    }
    
    if (response.status >= 200 && response.status < 300) {
      log(`✅ ${endpoint.name} - Status: ${response.status}`, 'green');
      
      // طباعة بعض التفاصيل للإحصائيات
      if (endpoint.url.includes('statistics') && response.data.data) {
        const stats = response.data.data;
        const keys = Object.keys(stats).slice(0, 3); // أول 3 مفاتيح
        const preview = keys.map(key => `${key}: ${stats[key]}`).join(', ');
        log(`   📊 ${preview}`, 'blue');
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

async function runTests() {
  log('🧪 بدء اختبار جميع APIs...', 'bold');
  log('=' .repeat(50), 'yellow');
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // انتظار قصير بين الطلبات
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  log('=' .repeat(50), 'yellow');
  log(`📊 نتائج الاختبار:`, 'bold');
  log(`✅ نجح: ${passed}`, 'green');
  log(`❌ فشل: ${failed}`, 'red');
  log(`📈 معدل النجاح: ${Math.round((passed / (passed + failed)) * 100)}%`, 'blue');
  
  if (failed === 0) {
    log('🎉 جميع APIs تعمل بشكل صحيح!', 'green');
  } else {
    log('⚠️  بعض APIs تحتاج إلى إصلاح', 'yellow');
  }
  
  log('=' .repeat(50), 'yellow');
}

// تشغيل الاختبارات
runTests().catch(error => {
  log(`💥 خطأ في تشغيل الاختبارات: ${error.message}`, 'red');
  process.exit(1);
});
