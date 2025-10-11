const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function checkSections() {
  try {
    console.log('🔍 فحص جميع المشرفين والأقسام المتاحة...\n');
    
    // جلب جميع المشرفين
    const allSupervisorsResponse = await axios.get(`${BASE_URL}/auth/supervisors`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📊 جميع المشرفين:');
    console.log('العدد الإجمالي:', allSupervisorsResponse.data?.data?.length || 0);
    
    if (allSupervisorsResponse.data?.data) {
      const supervisors = allSupervisorsResponse.data.data;
      
      // تجميع الأقسام
      const sections = {};
      supervisors.forEach(supervisor => {
        const section = supervisor.section || 'بدون قسم';
        if (!sections[section]) {
          sections[section] = [];
        }
        sections[section].push({
          name: supervisor.name,
          role: supervisor.role,
          email: supervisor.email
        });
      });
      
      console.log('\n📋 الأقسام المتاحة:');
      Object.keys(sections).forEach(section => {
        console.log(`\n🏢 ${section}:`);
        sections[section].forEach(supervisor => {
          console.log(`  - ${supervisor.name} (${supervisor.role})`);
        });
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    // اختبار أقسام مختلفة
    const sectionsToTest = [
      'mobile-clinics',
      'عيادة متنقلة', 
      'العيادة المتنقلة',
      'mobile_clinics',
      'clinic',
      'clinics'
    ];
    
    for (const section of sectionsToTest) {
      try {
        console.log(`\n🧪 اختبار قسم: "${section}"`);
        const response = await axios.get(`${BASE_URL}/auth/supervisors/by-section/${encodeURIComponent(section)}`, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        console.log(`✅ النتيجة: ${response.data?.count || 0} مشرف`);
        if (response.data?.data && response.data.data.length > 0) {
          response.data.data.forEach(supervisor => {
            console.log(`  - ${supervisor.name} (${supervisor.section})`);
          });
        }
      } catch (error) {
        console.log(`❌ خطأ: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في جلب البيانات:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // إذا كان الخطأ في الاتصال، جرب مرة أخرى
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
      console.log('\n🔄 محاولة الاتصال مرة أخرى...');
      setTimeout(() => {
        checkSections();
      }, 2000);
    }
  }
}

checkSections();
