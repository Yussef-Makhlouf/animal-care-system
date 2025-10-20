const axios = require('axios');

async function testConnection() {
    console.log('🧪 Testing Frontend-Backend Connection...\n');

    // Test 1: Health Check
    try {
        console.log('1️⃣ Testing Health Check...');
        const healthResponse = await axios.get('http://localhost:3001/health');
        console.log('✅ Health Check: OK');
        console.log(`   Status: ${healthResponse.data.status}`);
        console.log(`   Environment: ${healthResponse.data.environment}`);
    } catch (error) {
        console.log('❌ Health Check: FAILED');
        console.log(`   Error: ${error.message}`);
        return;
    }

    // Test 2: CORS Preflight
    try {
        console.log('\n2️⃣ Testing CORS Preflight...');
        const corsResponse = await axios.options('http://localhost:3001/api/auth/login', {
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        console.log('✅ CORS Preflight: OK');
    } catch (error) {
        console.log('❌ CORS Preflight: FAILED');
        console.log(`   Error: ${error.message}`);
    }

    // Test 3: Login API
    try {
        console.log('\n3️⃣ Testing Login API...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@ahcp.gov.sa',
            password: 'Admin@123456'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000'
            }
        });

        if (loginResponse.data.success) {
            console.log('✅ Login API: SUCCESS');
            console.log(`   User: ${loginResponse.data.data.user.name}`);
            console.log(`   Email: ${loginResponse.data.data.user.email}`);
            console.log(`   Role: ${loginResponse.data.data.user.role}`);
            console.log(`   Token: ${loginResponse.data.data.token.substring(0, 30)}...`);
        } else {
            console.log('❌ Login API: FAILED');
            console.log(`   Message: ${loginResponse.data.message}`);
        }
    } catch (error) {
        console.log('❌ Login API: FAILED');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${error.response.data.message}`);
            console.log(`   Error: ${error.response.data.error}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }

    // Test 4: Frontend API Base URL
    console.log('\n4️⃣ Checking Frontend API Configuration...');
    const frontendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    console.log(`   Frontend API URL: ${frontendApiUrl}`);
    
    if (frontendApiUrl.includes('localhost:3001')) {
        console.log('✅ Frontend API URL: Correct');
    } else {
        console.log('❌ Frontend API URL: Incorrect');
        console.log('   Expected: http://localhost:3001/api');
    }

    console.log('\n🎯 Troubleshooting Steps:');
    console.log('1. Make sure backend is running on port 3001');
    console.log('2. Make sure frontend is running on port 3000');
    console.log('3. Check browser console for CORS errors');
    console.log('4. Try opening: http://localhost:3001/health');
    console.log('5. Try the debug login page: debug-login.html');
    
    console.log('\n📋 Working Credentials:');
    console.log('Email: admin@ahcp.gov.sa');
    console.log('Password: Admin@123456');
}

testConnection();
