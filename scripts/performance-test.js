const axios = require('axios');
const { performance } = require('perf_hooks');

class PerformanceTest {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.results = [];
    this.authToken = null;
  }

  // دالة لتسجيل الدخول والحصول على التوكن
  async authenticate() {
    try {
      console.log('🔐 Authenticating...');
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: 'admin@example.com', // يجب تغييرها حسب بيانات النظام
        password: 'password123'
      });
      
      this.authToken = response.data.token;
      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.log('⚠️ Authentication failed, continuing without token');
      return false;
    }
  }

  // دالة لإجراء طلب HTTP مع قياس الأداء
  async makeRequest(endpoint, params = {}, description = '') {
    const startTime = performance.now();
    
    try {
      const config = {
        params,
        timeout: 30000 // 30 seconds timeout
      };
      
      if (this.authToken) {
        config.headers = {
          'Authorization': `Bearer ${this.authToken}`
        };
      }
      
      const response = await axios.get(`${this.baseURL}${endpoint}`, config);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result = {
        endpoint,
        description,
        duration: Math.round(duration),
        status: response.status,
        dataSize: JSON.stringify(response.data).length,
        recordCount: this.getRecordCount(response.data),
        success: true,
        timestamp: new Date().toISOString()
      };
      
      this.results.push(result);
      
      const emoji = this.getPerformanceEmoji(duration);
      console.log(`${emoji} ${description}: ${Math.round(duration)}ms (${result.recordCount} records)`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result = {
        endpoint,
        description,
        duration: Math.round(duration),
        status: error.response?.status || 0,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      };
      
      this.results.push(result);
      console.log(`❌ ${description}: FAILED (${Math.round(duration)}ms) - ${error.message}`);
      
      return result;
    }
  }

  // دالة لاستخراج عدد السجلات من الاستجابة
  getRecordCount(data) {
    if (data.data) {
      if (Array.isArray(data.data)) {
        return data.data.length;
      }
      if (data.data.records && Array.isArray(data.data.records)) {
        return data.data.records.length;
      }
      if (typeof data.data === 'object' && data.total) {
        return data.total;
      }
    }
    return 0;
  }

  // دالة لاختيار الرمز التعبيري حسب الأداء
  getPerformanceEmoji(duration) {
    if (duration < 100) return '🚀'; // Very fast
    if (duration < 300) return '⚡'; // Fast
    if (duration < 800) return '🔄'; // Normal
    if (duration < 2000) return '⏳'; // Slow
    return '🐌'; // Very slow
  }

  // اختبار مكافحة الطفيليات
  async testParasiteControl() {
    console.log('\n🦠 Testing Parasite Control Performance...');
    
    const tests = [
      {
        params: {},
        description: 'ParasiteControl - No filters'
      },
      {
        params: { page: 1, limit: 10 },
        description: 'ParasiteControl - Small page size'
      },
      {
        params: { page: 1, limit: 100 },
        description: 'ParasiteControl - Large page size'
      },
      {
        params: { herdHealthStatus: 'Healthy' },
        description: 'ParasiteControl - Health status filter'
      },
      {
        params: { 'insecticide.status': 'Sprayed' },
        description: 'ParasiteControl - Insecticide status filter'
      },
      {
        params: { 
          startDate: '2024-01-01', 
          endDate: '2024-12-31' 
        },
        description: 'ParasiteControl - Date range filter'
      },
      {
        params: { 
          herdHealthStatus: 'Healthy,Sick',
          'insecticide.status': 'Sprayed',
          startDate: '2024-01-01'
        },
        description: 'ParasiteControl - Multiple filters'
      },
      {
        params: { search: 'supervisor' },
        description: 'ParasiteControl - Text search'
      }
    ];

    for (const test of tests) {
      await this.makeRequest('/parasite-control', test.params, test.description);
      await this.sleep(100); // Small delay between requests
    }
  }

  // اختبار التطعيمات
  async testVaccination() {
    console.log('\n💉 Testing Vaccination Performance...');
    
    const tests = [
      {
        params: {},
        description: 'Vaccination - No filters'
      },
      {
        params: { 'vaccine.type': 'FMD' },
        description: 'Vaccination - Vaccine type filter'
      },
      {
        params: { herdHealthStatus: 'Healthy' },
        description: 'Vaccination - Health status filter'
      },
      {
        params: { 
          'vaccine.type': 'FMD,PPR',
          herdHealthStatus: 'Healthy'
        },
        description: 'Vaccination - Multiple filters'
      },
      {
        params: { 
          startDate: '2024-01-01', 
          endDate: '2024-12-31' 
        },
        description: 'Vaccination - Date range filter'
      }
    ];

    for (const test of tests) {
      await this.makeRequest('/vaccination', test.params, test.description);
      await this.sleep(100);
    }
  }

  // اختبار المختبرات
  async testLaboratory() {
    console.log('\n🧪 Testing Laboratory Performance...');
    
    const tests = [
      {
        params: {},
        description: 'Laboratory - No filters'
      },
      {
        params: { sampleType: 'Serum' },
        description: 'Laboratory - Sample type filter'
      },
      {
        params: { testResult: 'Normal' },
        description: 'Laboratory - Test result filter'
      },
      {
        params: { priority: 'High' },
        description: 'Laboratory - Priority filter'
      },
      {
        params: { 
          sampleType: 'Serum',
          testResult: 'Normal',
          priority: 'High'
        },
        description: 'Laboratory - Multiple filters'
      }
    ];

    for (const test of tests) {
      await this.makeRequest('/laboratories', test.params, test.description);
      await this.sleep(100);
    }
  }

  // اختبار العيادات المتنقلة
  async testMobileClinic() {
    console.log('\n🚐 Testing Mobile Clinic Performance...');
    
    const tests = [
      {
        params: {},
        description: 'MobileClinic - No filters'
      },
      {
        params: { interventionCategory: 'Emergency' },
        description: 'MobileClinic - Intervention category filter'
      },
      {
        params: { followUpRequired: 'true' },
        description: 'MobileClinic - Follow-up required filter'
      },
      {
        params: { diagnosis: 'Respiratory Infection' },
        description: 'MobileClinic - Diagnosis filter'
      },
      {
        params: { 
          interventionCategory: 'Emergency',
          followUpRequired: 'true'
        },
        description: 'MobileClinic - Multiple filters'
      }
    ];

    for (const test of tests) {
      await this.makeRequest('/mobile-clinics', test.params, test.description);
      await this.sleep(100);
    }
  }

  // اختبار الإحصائيات
  async testStatistics() {
    console.log('\n📊 Testing Statistics Performance...');
    
    const endpoints = [
      '/parasite-control/statistics',
      '/parasite-control/detailed-statistics',
      '/vaccination/statistics',
      '/laboratories/statistics'
    ];

    for (const endpoint of endpoints) {
      await this.makeRequest(endpoint, {}, `Statistics - ${endpoint}`);
      await this.sleep(100);
    }
  }

  // اختبار الضغط (Stress Test)
  async stressTest() {
    console.log('\n🔥 Running Stress Test (Concurrent Requests)...');
    
    const concurrentRequests = 10;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        this.makeRequest('/parasite-control', { page: i + 1 }, `Stress Test - Request ${i + 1}`)
      );
    }
    
    const startTime = performance.now();
    await Promise.all(promises);
    const endTime = performance.now();
    
    console.log(`🏁 Stress test completed: ${concurrentRequests} concurrent requests in ${Math.round(endTime - startTime)}ms`);
  }

  // دالة للانتظار
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // تحليل النتائج وإنشاء التقرير
  generateReport() {
    console.log('\n📈 Performance Test Report');
    console.log('=' .repeat(50));
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    if (successful.length === 0) {
      console.log('❌ No successful requests to analyze');
      return;
    }
    
    const durations = successful.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    console.log(`📊 Total Requests: ${this.results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⚡ Average Response Time: ${Math.round(avgDuration)}ms`);
    console.log(`🚀 Fastest Response: ${minDuration}ms`);
    console.log(`🐌 Slowest Response: ${maxDuration}ms`);
    
    // تصنيف الأداء
    console.log('\n🎯 Performance Categories:');
    const veryFast = successful.filter(r => r.duration < 100).length;
    const fast = successful.filter(r => r.duration >= 100 && r.duration < 300).length;
    const normal = successful.filter(r => r.duration >= 300 && r.duration < 800).length;
    const slow = successful.filter(r => r.duration >= 800 && r.duration < 2000).length;
    const verySlow = successful.filter(r => r.duration >= 2000).length;
    
    console.log(`🚀 Very Fast (<100ms): ${veryFast}`);
    console.log(`⚡ Fast (100-300ms): ${fast}`);
    console.log(`🔄 Normal (300-800ms): ${normal}`);
    console.log(`⏳ Slow (800-2000ms): ${slow}`);
    console.log(`🐌 Very Slow (>2000ms): ${verySlow}`);
    
    // أبطأ الطلبات
    if (successful.length > 0) {
      console.log('\n🐌 Slowest Requests:');
      const slowest = successful
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);
      
      slowest.forEach((result, index) => {
        console.log(`${index + 1}. ${result.description}: ${result.duration}ms`);
      });
    }
    
    // الطلبات الفاشلة
    if (failed.length > 0) {
      console.log('\n❌ Failed Requests:');
      failed.forEach(result => {
        console.log(`- ${result.description}: ${result.error}`);
      });
    }
    
    // توصيات التحسين
    console.log('\n💡 Performance Recommendations:');
    if (avgDuration > 1000) {
      console.log('⚠️ Average response time is high. Consider adding more database indexes.');
    }
    if (verySlow > 0) {
      console.log('⚠️ Some requests are very slow. Check for missing indexes or complex queries.');
    }
    if (failed.length > successful.length * 0.1) {
      console.log('⚠️ High failure rate detected. Check server stability and error handling.');
    }
    if (avgDuration < 200) {
      console.log('✅ Excellent performance! The system is well optimized.');
    }
  }

  // تشغيل جميع الاختبارات
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Performance Test Suite');
    console.log('=' .repeat(60));
    
    const overallStart = performance.now();
    
    // محاولة المصادقة
    await this.authenticate();
    
    // تشغيل جميع الاختبارات
    await this.testParasiteControl();
    await this.testVaccination();
    await this.testLaboratory();
    await this.testMobileClinic();
    await this.testStatistics();
    await this.stressTest();
    
    const overallEnd = performance.now();
    
    console.log(`\n⏱️ Total Test Duration: ${Math.round(overallEnd - overallStart)}ms`);
    
    // إنشاء التقرير
    this.generateReport();
    
    // حفظ النتائج في ملف
    this.saveResults();
  }

  // حفظ النتائج في ملف JSON
  saveResults() {
    const fs = require('fs');
    const path = require('path');
    
    const resultsFile = path.join(__dirname, `performance-results-${Date.now()}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        averageDuration: this.results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / this.results.filter(r => r.success).length || 0
      },
      results: this.results
    };
    
    fs.writeFileSync(resultsFile, JSON.stringify(report, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
  }
}

// تشغيل الاختبار
async function main() {
  const tester = new PerformanceTest();
  await tester.runAllTests();
}

// تشغيل الاختبار إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceTest;
