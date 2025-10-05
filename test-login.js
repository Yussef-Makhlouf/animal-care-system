const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Testing login with different credentials...');
    
    const credentials = [
      { email: 'admin@ahcp.gov.sa', password: 'Admin@123456' },
      { email: 'ibrahim@ahcp.gov.eg', password: 'admin123' },
      { email: 'supervisor@ahcp.gov.sa', password: 'Supervisor@123' },
      { email: 'worker@ahcp.gov.sa', password: 'Worker@123' }
    ];

    for (const cred of credentials) {
      try {
        console.log(`\n🔐 Testing: ${cred.email}`);
        
        const response = await axios.post('http://localhost:3001/api/auth/login', cred, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (response.data.success) {
          console.log(`✅ SUCCESS: ${cred.email}`);
          console.log(`   User: ${response.data.data.user.name}`);
          console.log(`   Role: ${response.data.data.user.role}`);
          console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
        } else {
          console.log(`❌ FAILED: ${cred.email} - ${response.data.message}`);
        }
      } catch (error) {
        if (error.response) {
          console.log(`❌ FAILED: ${cred.email} - ${error.response.data.message}`);
        } else {
          console.log(`❌ ERROR: ${cred.email} - ${error.message}`);
        }
      }
    }

    console.log('\n🎯 Recommended credentials for frontend:');
    console.log('Email: admin@ahcp.gov.sa');
    console.log('Password: Admin@123456');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogin();
