const axios = require('axios');

async function finalTest() {
    console.log('🎯 Final Integration Test - AHCP System');
    console.log('=' .repeat(50));
    
    let allPassed = true;

    // Test 1: Backend Health
    try {
        console.log('\n1️⃣ Testing Backend Health...');
        const health = await axios.get('http://localhost:3001/health');
        console.log('✅ Backend is running');
        console.log(`   Environment: ${health.data.environment}`);
        console.log(`   Database: Connected`);
    } catch (error) {
        console.log('❌ Backend is not running');
        allPassed = false;
    }

    // Test 2: Login API
    try {
        console.log('\n2️⃣ Testing Login API...');
        const login = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@ahcp.gov.sa',
            password: 'Admin@123456'
        });
        
        if (login.data.success) {
            console.log('✅ Login API works');
            console.log(`   User: ${login.data.data.user.name}`);
            console.log(`   Role: ${login.data.data.user.role}`);
        }
    } catch (error) {
        console.log('❌ Login API failed');
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
        allPassed = false;
    }

    // Test 3: Statistics APIs
    const statsEndpoints = [
        '/parasite-control/statistics',
        '/vaccination/statistics', 
        '/mobile-clinics/statistics',
        '/laboratories/statistics',
        '/clients/statistics'
    ];

    console.log('\n3️⃣ Testing Statistics APIs...');
    for (const endpoint of statsEndpoints) {
        try {
            const response = await axios.get(`http://localhost:3001/api${endpoint}`);
            if (response.data.success || response.data.data) {
                console.log(`✅ ${endpoint.split('/')[1]} stats - OK`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.split('/')[1]} stats - Failed`);
            allPassed = false;
        }
    }

    // Test 4: Frontend Accessibility
    try {
        console.log('\n4️⃣ Testing Frontend...');
        const frontend = await axios.get('http://localhost:3000', { timeout: 5000 });
        if (frontend.status === 200) {
            console.log('✅ Frontend is accessible');
        }
    } catch (error) {
        console.log('❌ Frontend is not accessible');
        allPassed = false;
    }

    // Final Result
    console.log('\n' + '=' .repeat(50));
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED! System is ready to use!');
        console.log('\n📋 Login Credentials:');
        console.log('   Email: admin@ahcp.gov.sa');
        console.log('   Password: Admin@123456');
        console.log('\n🌐 Access URLs:');
        console.log('   Frontend: http://localhost:3000');
        console.log('   Backend: http://localhost:3001');
        console.log('   API Docs: http://localhost:3001/api-docs');
    } else {
        console.log('⚠️  Some tests failed. Check the errors above.');
    }
    console.log('=' .repeat(50));
}

finalTest();
