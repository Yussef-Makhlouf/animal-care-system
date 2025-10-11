const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testMobileClinicsExport() {
  try {
    console.log('🧪 Testing Mobile Clinics Export...');
    
    // Test export endpoint
    const response = await axios.get(`${BASE_URL}/mobile-clinics/export`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Export Response:', {
      status: response.status,
      success: response.data?.success,
      dataCount: Array.isArray(response.data?.data) ? response.data.data.length : 'Not an array',
      data: response.data
    });
    
  } catch (error) {
    console.error('❌ Export Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

async function testSupervisorsBySection() {
  try {
    console.log('🧪 Testing Supervisors by Section...');
    
    // Test supervisors by section
    const response = await axios.get(`${BASE_URL}/auth/supervisors/by-section/عيادة متنقلة`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Supervisors Response:', {
      status: response.status,
      success: response.data?.success,
      count: response.data?.count,
      supervisors: response.data?.data?.map(s => ({ name: s.name, section: s.section, role: s.role }))
    });
    
  } catch (error) {
    console.error('❌ Supervisors Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

async function runTests() {
  await testMobileClinicsExport();
  console.log('\n' + '='.repeat(50) + '\n');
  await testSupervisorsBySection();
}

runTests();
