const axios = require('axios');

// Test the vaccination detailed statistics endpoint
async function testVaccinationStats() {
  try {
    console.log('🧪 Testing Vaccination Detailed Statistics API...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // Test detailed statistics endpoint
    const response = await axios.get(`${baseURL}/vaccination/detailed-statistics`, {
      headers: {
        'Authorization': 'Bearer test-token' // You may need to adjust this
      }
    });
    
    console.log('✅ Detailed Statistics Response:', JSON.stringify(response.data, null, 2));
    
    // Test basic statistics endpoint
    const basicResponse = await axios.get(`${baseURL}/vaccination/statistics`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Basic Statistics Response:', JSON.stringify(basicResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing vaccination stats:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testVaccinationStats();
