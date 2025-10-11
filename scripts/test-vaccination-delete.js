const axios = require('axios');

async function testVaccinationAPI() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🔍 Testing Vaccination API...\n');
    
    // Get list of vaccination records
    console.log('📋 Getting vaccination records...');
    const listResponse = await axios.get(`${baseURL}/vaccination`, {
      params: { page: 1, limit: 5 }
    });
    
    console.log('Response structure:', JSON.stringify(listResponse.data, null, 2));
    
    if (listResponse.data && listResponse.data.data && listResponse.data.data.records) {
      const records = listResponse.data.data.records;
      console.log(`\n✅ Found ${records.length} records`);
      
      if (records.length > 0) {
        const firstRecord = records[0];
        console.log('\n📄 First record structure:');
        console.log('- _id:', firstRecord._id);
        console.log('- serialNo:', firstRecord.serialNo);
        console.log('- date:', firstRecord.date);
        console.log('- client:', firstRecord.client ? firstRecord.client.name : 'No client');
        
        // Test getting single record by ID
        if (firstRecord._id) {
          console.log(`\n🔍 Testing get by ID: ${firstRecord._id}`);
          try {
            const singleResponse = await axios.get(`${baseURL}/vaccination/${firstRecord._id}`);
            console.log('✅ Get by ID successful');
            console.log('Single record _id:', singleResponse.data._id);
          } catch (error) {
            console.log('❌ Get by ID failed:', error.response?.data || error.message);
          }
        }
      }
    } else {
      console.log('❌ Unexpected response structure');
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

testVaccinationAPI();
