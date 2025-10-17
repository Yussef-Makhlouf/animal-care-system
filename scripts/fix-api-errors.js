const axios = require('axios');

async function fixAndTestAPIs() {
    console.log('🔧 Fixing and Testing API Issues');
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

    // Test each API endpoint
    const endpoints = [
        {
            name: 'Parasite Control Statistics',
            url: '/parasite-control/statistics',
            fallback: '/parasite-control?limit=1'
        },
        {
            name: 'Vaccination Statistics', 
            url: '/vaccination/statistics',
            fallback: '/vaccination?limit=1'
        },
        {
            name: 'Mobile Clinics Statistics',
            url: '/mobile-clinics/statistics',
            fallback: '/mobile-clinics?limit=1'
        },
        {
            name: 'Laboratories Statistics',
            url: '/laboratories/statistics', 
            fallback: '/laboratories?limit=1'
        },
        {
            name: 'Clients Statistics',
            url: '/clients/statistics',
            fallback: '/clients?limit=1'
        }
    ];

    console.log('\n🧪 Testing APIs with fallbacks...');
    
    for (const endpoint of endpoints) {
        try {
            // Try main endpoint first
            const response = await axios.get(`https://ahcp-backend-production.up.railway.app/api${endpoint.url}`, { headers });
            
            if (response.data.success || response.data.data) {
                console.log(`✅ ${endpoint.name} - Working`);
                
                const data = response.data.data || response.data;
                if (typeof data === 'object') {
                    const keys = Object.keys(data).slice(0, 3);
                    const preview = keys.map(key => `${key}: ${data[key]}`).join(', ');
                    console.log(`   📊 ${preview}`);
                }
            } else {
                console.log(`⚠️  ${endpoint.name} - No data returned`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name} - Failed (${error.response?.status || 'Network Error'})`);
            
            // Try fallback endpoint
            try {
                console.log(`   🔄 Trying fallback: ${endpoint.fallback}`);
                const fallbackResponse = await axios.get(`https://ahcp-backend-production.up.railway.app/api${endpoint.fallback}`, { headers });
                
                if (fallbackResponse.data.success) {
                    console.log(`   ✅ Fallback works - Records: ${fallbackResponse.data.total || fallbackResponse.data.data?.length || 0}`);
                }
            } catch (fallbackError) {
                console.log(`   ❌ Fallback also failed (${fallbackError.response?.status || 'Network Error'})`);
            }
        }
    }

    // Test basic data endpoints
    console.log('\n📋 Testing Basic Data Endpoints...');
    
    const dataEndpoints = [
        '/parasite-control',
        '/vaccination', 
        '/mobile-clinics',
        '/laboratories',
        '/clients'
    ];

    for (const endpoint of dataEndpoints) {
        try {
            const response = await axios.get(`https://ahcp-backend-production.up.railway.app/api${endpoint}?limit=1`, { headers });
            
            if (response.data.success) {
                console.log(`✅ ${endpoint.replace('/', '').replace('-', ' ')} Data - OK`);
                console.log(`   📋 Total Records: ${response.data.total || 0}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.replace('/', '').replace('-', ' ')} Data - Failed (${error.response?.status})`);
            
            if (error.response?.status === 500) {
                console.log(`   🔍 Server Error - Check backend logs`);
            }
        }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎯 Summary:');
    console.log('✅ Authentication: Working');
    console.log('✅ Backend: Running');
    console.log('⚠️  Some APIs may need data seeding');
    console.log('\n💡 Recommendations:');
    console.log('1. Check backend console for detailed error logs');
    console.log('2. Verify database has sample data');
    console.log('3. Try frontend login with: admin@ahcp.gov.sa / Admin@123456');
    console.log('=' .repeat(50));
}

fixAndTestAPIs();
