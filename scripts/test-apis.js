// اختبار سريع للـ APIs
const axios = require('axios');

const API_BASE = 'https://ahcp-backend-production.up.railway.app/api';

async function testAPIs() {
  console.log('🚀 بدء اختبار APIs...\n');

  const tests = [
    {
      name: 'Health Check',
      url: 'https://ahcp-backend-production.up.railway.app/health',
      method: 'GET'
    },
    {
      name: 'Clients API',
      url: `${API_BASE}/clients`,
      method: 'GET'
    },
    {
      name: 'Parasite Control API',
      url: `${API_BASE}/parasite-control`,
      method: 'GET'
    },
    {
      name: 'Vaccination API',
      url: `${API_BASE}/vaccination`,
      method: 'GET'
    },
    {
      name: 'Mobile Clinics API',
      url: `${API_BASE}/mobile-clinics`,
      method: 'GET'
    },
    {
      name: 'Laboratories API',
      url: `${API_BASE}/laboratories`,
      method: 'GET'
    },
    {
      name: 'Reports API',
      url: `${API_BASE}/reports/dashboard-stats`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔄 اختبار ${test.name}...`);
      
      const startTime = Date.now();
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000,
        headers: {
          'Authorization': 'Bearer dev-token-123'
        }
      });
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ ${test.name}: نجح (${response.status}) - ${responseTime}ms`);
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log(`   📊 عدد العناصر: ${response.data.length}`);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`   📊 عدد العناصر: ${response.data.data.length}`);
        } else if (typeof response.data === 'object') {
          console.log(`   📊 نوع البيانات: ${Object.keys(response.data).join(', ')}`);
        }
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${test.name}: فشل (${error.response.status}) - ${error.response.data?.message || error.message}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${test.name}: الخادم غير متاح - تأكد من تشغيل الخادم الخلفي`);
      } else {
        console.log(`❌ ${test.name}: خطأ - ${error.message}`);
      }
    }
    
    console.log(''); // سطر فارغ
  }

  console.log('🏁 انتهى الاختبار');
}

// تشغيل الاختبار
testAPIs().catch(console.error);
