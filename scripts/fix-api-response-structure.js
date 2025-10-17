const axios = require('axios');

async function fixAPIResponseStructure() {
    console.log('🔧 Testing API Response Structures');
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

    // Test each API endpoint to understand the response structure
    const endpoints = [
        { name: 'Parasite Control', url: '/parasite-control?limit=2' },
        { name: 'Vaccination', url: '/vaccination?limit=2' },
        { name: 'Mobile Clinics', url: '/mobile-clinics?limit=2' },
        { name: 'Laboratories', url: '/laboratories?limit=2' },
        { name: 'Clients', url: '/clients?limit=2' }
    ];

    console.log('\n📋 Analyzing API Response Structures...');
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`https://ahcp-backend-production.up.railway.app/api${endpoint.url}`, { 
                headers,
                timeout: 10000 
            });
            
            console.log(`\n🔍 ${endpoint.name} Response Structure:`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Success: ${response.data.success}`);
            
            // Analyze the data structure
            if (response.data.data) {
                const data = response.data.data;
                console.log(`   Data Type: ${Array.isArray(data) ? 'Array' : 'Object'}`);
                
                if (Array.isArray(data)) {
                    console.log(`   Records Count: ${data.length}`);
                    console.log(`   Structure: Direct array in response.data.data`);
                } else if (data.records) {
                    console.log(`   Records Count: ${data.records.length}`);
                    console.log(`   Structure: Nested - response.data.data.records`);
                    if (data.pagination) {
                        console.log(`   Pagination: response.data.data.pagination`);
                        console.log(`     Total: ${data.pagination.total}`);
                        console.log(`     Page: ${data.pagination.page}`);
                        console.log(`     Pages: ${data.pagination.pages}`);
                    }
                } else {
                    console.log(`   Structure: Unknown - ${JSON.stringify(Object.keys(data))}`);
                }
            } else {
                console.log(`   Data: Not found in response.data.data`);
                console.log(`   Available keys: ${JSON.stringify(Object.keys(response.data))}`);
            }
            
        } catch (error) {
            console.log(`\n❌ ${endpoint.name} - Failed (${error.response?.status || 'Network Error'})`);
            if (error.response?.data?.message) {
                console.log(`   Error: ${error.response.data.message}`);
            }
        }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('💡 Frontend API Client Fix Recommendations:');
    console.log('');
    console.log('For APIs that return { success: true, data: { records: [...], pagination: {...} } }:');
    console.log('  const records = response.data?.records || [];');
    console.log('  const pagination = response.data?.pagination || {};');
    console.log('');
    console.log('For APIs that return { success: true, data: [...] }:');
    console.log('  const records = Array.isArray(response.data) ? response.data : [];');
    console.log('');
    console.log('Universal solution:');
    console.log('  const records = response.data?.records || response.data || [];');
    console.log('  const pagination = response.data?.pagination || {};');
    console.log('=' .repeat(50));
}

fixAPIResponseStructure();
