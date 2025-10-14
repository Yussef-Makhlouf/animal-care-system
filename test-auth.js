const axios = require('axios');

async function testAuth() {
  try {
    console.log('🔐 Testing authentication...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@ahcp.gov.sa',
      password: 'admin123!'
    });
    
    console.log('✅ Login successful:', response.data.success);
    console.log('📝 Token received:', response.data.data?.token ? 'Yes' : 'No');
    
    if (response.data.data?.token) {
      console.log('🎉 Authentication is working correctly!');
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
}

testAuth();
