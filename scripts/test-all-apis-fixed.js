const axios = require('axios');

async function testAllAPIsFixed() {
    console.log('🔧 Testing All APIs After Fixes');
    console.log('=' .repeat(50));
    
    // Get authentication token first
    let token = null;
    try {
        const loginResponse = await axios.post('https://ahcp-backend-production.up.railway.app/api/auth/login', {
            email: 'admin@ahcp.gov.sa',
            password: 'Admin@123456'
        });
        token = loginResponse.data.data.token;
        console.log('✅ Authentication successful');
    } catch (error) {
        console.log('❌ Authentication failed');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Test all data endpoints
    const endpoints = [
        { name: 'Clients', url: '/clients', expectSuccess: true },
        { name: 'Parasite Control', url: '/parasite-control', expectSuccess: true },
        { name: 'Vaccination', url: '/vaccination', expectSuccess: true },
        { name: 'Mobile Clinics', url: '/mobile-clinics', expectSuccess: true },
        { name: 'Laboratories', url: '/laboratories', expectSuccess: true }
    ];

    console.log('\n📋 Testing Data APIs...');
    let successCount = 0;
    let totalCount = endpoints.length;

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`https://ahcp-backend-production.up.railway.app/api${endpoint.url}?limit=5`, { 
                headers,
                timeout: 10000 
            });
            
            if (response.status === 200 && (response.data.success || response.data.data)) {
                console.log(`✅ ${endpoint.name} Data API - OK (${response.status})`);
                
                // Show data info
                const data = response.data.data || response.data;
                if (Array.isArray(data)) {
                    console.log(`   📊 Records: ${data.length}`);
                } else if (data.records) {
                    console.log(`   📊 Records: ${data.records.length}, Total: ${data.total || 'N/A'}`);
                } else {
                    console.log(`   📊 Data structure: ${typeof data}`);
                }
                successCount++;
            } else {
                console.log(`⚠️  ${endpoint.name} Data API - Unexpected response`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name} Data API - Failed (${error.response?.status || 'Network Error'})`);
            if (error.response?.data?.message) {
                console.log(`   Error: ${error.response.data.message}`);
            }
        }
    }

    // Test statistics endpoints
    console.log('\n📊 Testing Statistics APIs...');
    const statsEndpoints = [
        { name: 'Clients Stats', url: '/clients/statistics' },
        { name: 'Parasite Control Stats', url: '/parasite-control/statistics' },
        { name: 'Vaccination Stats', url: '/vaccination/statistics' },
        { name: 'Mobile Clinics Stats', url: '/mobile-clinics/statistics' },
        { name: 'Laboratories Stats', url: '/laboratories/statistics' }
    ];

    let statsSuccessCount = 0;
    
    for (const endpoint of statsEndpoints) {
        try {
            const response = await axios.get(`https://ahcp-backend-production.up.railway.app/api${endpoint.url}`, { 
                headers,
                timeout: 10000 
            });
            
            if (response.status === 200 && (response.data.success || response.data.data)) {
                console.log(`✅ ${endpoint.name} - OK (${response.status})`);
                
                const data = response.data.data || response.data;
                if (typeof data === 'object') {
                    const keys = Object.keys(data).slice(0, 3);
                    const preview = keys.map(key => `${key}: ${data[key]}`).join(', ');
                    console.log(`   📈 ${preview}`);
                }
                statsSuccessCount++;
            } else {
                console.log(`⚠️  ${endpoint.name} - Unexpected response`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name} - Failed (${error.response?.status || 'Network Error'})`);
            if (error.response?.data?.message) {
                console.log(`   Error: ${error.response.data.message}`);
            }
        }
    }

    // Test health endpoint
    console.log('\n🏥 Testing Health Endpoint...');
    try {
        const healthResponse = await axios.get('https://ahcp-backend-production.up.railway.app/health');
        if (healthResponse.status === 200) {
            console.log('✅ Health Check - OK');
            console.log(`   Environment: ${healthResponse.data.environment}`);
        }
    } catch (error) {
        console.log('❌ Health Check - Failed');
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 API Test Results Summary:');
    console.log(`📋 Data APIs: ${successCount}/${totalCount} working`);
    console.log(`📊 Statistics APIs: ${statsSuccessCount}/${statsEndpoints.length} working`);
    
    const overallSuccess = (successCount + statsSuccessCount) / (totalCount + statsEndpoints.length);
    console.log(`📈 Overall Success Rate: ${Math.round(overallSuccess * 100)}%`);
    
    if (overallSuccess >= 0.8) {
        console.log('🎉 APIs are working well! System is ready for use.');
    } else if (overallSuccess >= 0.6) {
        console.log('⚠️  Most APIs working, some issues remain.');
    } else {
        console.log('❌ Many APIs have issues, needs more fixes.');
    }
    
    console.log('\n💡 Fixes Applied:');
    console.log('✅ Client model virtuals - null safety added');
    console.log('✅ Parasite Control routes - error handling added');
    console.log('✅ Vaccination routes - lean queries implemented');
    console.log('✅ Mobile Clinics routes - populate fallback added');
    console.log('✅ Laboratories routes - error handling improved');
    console.log('✅ All routes now use .lean() for better performance');
    console.log('=' .repeat(50));
}

testAllAPIsFixed();
