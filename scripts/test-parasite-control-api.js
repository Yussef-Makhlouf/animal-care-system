const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Test data matching the required structure
const testData = {
  serialNo: `PC-TEST-${Date.now()}`,
  date: '2024-10-06',
  client: {
    name: 'محمد أحمد الشمري',
    nationalId: '1234567890',
    phone: '+966501234567',
    village: 'الرياض',
    detailedAddress: 'مزرعة الأحمد، طريق الخرج'
  },
  herdLocation: 'مزرعة الأحمد، طريق الخرج',
  coordinates: {
    latitude: 24.7136,
    longitude: 46.6753
  },
  supervisor: 'د. محمد علي الأحمد',
  vehicleNo: 'P1',
  herdCounts: {
    sheep: {
      total: 150,
      young: 45,
      female: 90,
      treated: 150
    },
    goats: {
      total: 80,
      young: 20,
      female: 50,
      treated: 80
    },
    camel: {
      total: 0,
      young: 0,
      female: 0,
      treated: 0
    },
    cattle: {
      total: 0,
      young: 0,
      female: 0,
      treated: 0
    },
    horse: {
      total: 0,
      young: 0,
      female: 0,
      treated: 0
    }
  },
  insecticide: {
    type: 'Cyperdip 10%',
    method: 'Pour on',
    volumeMl: 2300,
    status: 'Sprayed',
    category: 'Pour-on'
  },
  animalBarnSizeSqM: 200,
  breedingSites: 'Not Available',
  parasiteControlVolume: 2300,
  parasiteControlStatus: 'Completed',
  herdHealthStatus: 'Healthy',
  complyingToInstructions: true,
  request: {
    date: '2024-09-05',
    situation: 'Closed',
    fulfillingDate: '2024-09-07'
  },
  remarks: 'Parasite Control Activity - تم الرش بنجاح'
};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
async function testCreateRecord() {
  console.log('\n🧪 Testing POST /parasite-control (Create Record)');
  console.log('Expected response structure:');
  console.log(JSON.stringify({
    success: true,
    data: {
      records: [{ /* record data */ }],
      pagination: {
        page: 1,
        limit: 1,
        total: 1,
        pages: 1
      }
    }
  }, null, 2));
  
  try {
    const response = await makeRequest('POST', '/parasite-control', testData);
    console.log('✅ POST Response:', JSON.stringify(response, null, 2));
    
    // Validate response structure
    if (response.success && response.data && response.data.records && response.data.pagination) {
      console.log('✅ Response structure is correct!');
      return response.data.records[0]._id;
    } else {
      console.log('❌ Response structure is incorrect!');
      return null;
    }
  } catch (error) {
    console.log('❌ POST test failed');
    return null;
  }
}

async function testUpdateRecord(recordId) {
  if (!recordId) {
    console.log('⏭️ Skipping PUT test - no record ID');
    return;
  }
  
  console.log('\n🧪 Testing PUT /parasite-control/:id (Update Record)');
  
  const updateData = {
    ...testData,
    remarks: 'Updated: Parasite Control Activity - تم التحديث بنجاح',
    herdHealthStatus: 'Under Treatment'
  };
  
  try {
    const response = await makeRequest('PUT', `/parasite-control/${recordId}`, updateData);
    console.log('✅ PUT Response:', JSON.stringify(response, null, 2));
    
    // Validate response structure
    if (response.success && response.data && response.data.records && response.data.pagination) {
      console.log('✅ PUT Response structure is correct!');
    } else {
      console.log('❌ PUT Response structure is incorrect!');
    }
  } catch (error) {
    console.log('❌ PUT test failed');
  }
}

async function testGetRecord(recordId) {
  if (!recordId) {
    console.log('⏭️ Skipping GET test - no record ID');
    return;
  }
  
  console.log('\n🧪 Testing GET /parasite-control/:id (Get Single Record)');
  
  try {
    const response = await makeRequest('GET', `/parasite-control/${recordId}`);
    console.log('✅ GET Response:', JSON.stringify(response, null, 2));
    
    // Validate response structure
    if (response.success && response.data && response.data.records && response.data.pagination) {
      console.log('✅ GET Response structure is correct!');
    } else {
      console.log('❌ GET Response structure is incorrect!');
    }
  } catch (error) {
    console.log('❌ GET test failed');
  }
}

async function testGetList() {
  console.log('\n🧪 Testing GET /parasite-control (Get List)');
  
  try {
    const response = await makeRequest('GET', '/parasite-control?page=1&limit=5');
    console.log('✅ GET List Response:', JSON.stringify(response, null, 2));
    
    // Validate response structure
    if (response.success && response.data && response.data.records && response.data.pagination) {
      console.log('✅ GET List Response structure is correct!');
    } else {
      console.log('❌ GET List Response structure is incorrect!');
    }
  } catch (error) {
    console.log('❌ GET List test failed');
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Parasite Control API Tests');
  console.log('=====================================');
  
  // Test the list endpoint first
  await testGetList();
  
  // Test create
  const recordId = await testCreateRecord();
  
  // Test get single record
  await testGetRecord(recordId);
  
  // Test update
  await testUpdateRecord(recordId);
  
  console.log('\n🏁 Tests completed!');
  console.log('=====================================');
  console.log('📋 Summary:');
  console.log('- All endpoints should return the new structure');
  console.log('- { success: true, data: { records: [...], pagination: {...} } }');
  console.log('- Frontend should now work correctly with this structure');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testData };
