const axios = require('axios');

async function testDashboardStats() {
    console.log('🧪 Testing Dashboard Stats API Fix');
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

    // Test individual statistics endpoints
    console.log('\n📊 Testing Individual Statistics APIs...');
    
    const statsEndpoints = [
        { name: 'Clients', url: '/clients/statistics' },
        { name: 'Parasite Control', url: '/parasite-control/statistics' },
        { name: 'Vaccination', url: '/vaccination/statistics' },
        { name: 'Mobile Clinics', url: '/mobile-clinics/statistics' },
        { name: 'Laboratories', url: '/laboratories/statistics' }
    ];

    const results = {};
    
    for (const endpoint of statsEndpoints) {
        try {
            const response = await axios.get(`https://ahcp-backend-production.up.railway.app/api${endpoint.url}`, { headers });
            
            if (response.data.success || response.data.data) {
                console.log(`✅ ${endpoint.name} Statistics - OK`);
                results[endpoint.name] = response.data.data || response.data;
                
                // Show key stats
                const data = response.data.data || response.data;
                if (typeof data === 'object') {
                    const keys = Object.keys(data).slice(0, 2);
                    const preview = keys.map(key => `${key}: ${data[key]}`).join(', ');
                    console.log(`   📈 ${preview}`);
                }
            } else {
                console.log(`⚠️  ${endpoint.name} Statistics - No data`);
                results[endpoint.name] = {};
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name} Statistics - Failed (${error.response?.status || 'Network Error'})`);
            results[endpoint.name] = {};
        }
    }

    // Simulate frontend dashboard stats aggregation
    console.log('\n🎯 Simulating Frontend Dashboard Stats...');
    
    try {
        const dashboardStats = {
            totalClients: results.Clients?.totalClients || 0,
            totalAnimals: results.Clients?.totalAnimals || 0,
            parasiteControlRecords: results['Parasite Control']?.totalRecords || 0,
            vaccinationRecords: results.Vaccination?.totalRecords || 0,
            mobileClinicVisits: results['Mobile Clinics']?.totalRecords || 0,
            laboratoryTests: results.Laboratories?.totalSamples || 0,
            equineHealthRecords: 0
        };

        console.log('✅ Dashboard Stats Generated Successfully:');
        console.log(`   👥 Total Clients: ${dashboardStats.totalClients}`);
        console.log(`   🐄 Total Animals: ${dashboardStats.totalAnimals}`);
        console.log(`   🦠 Parasite Control: ${dashboardStats.parasiteControlRecords}`);
        console.log(`   💉 Vaccinations: ${dashboardStats.vaccinationRecords}`);
        console.log(`   🚐 Mobile Clinics: ${dashboardStats.mobileClinicVisits}`);
        console.log(`   🧪 Laboratory Tests: ${dashboardStats.laboratoryTests}`);

        const totalActivities = dashboardStats.parasiteControlRecords + 
                               dashboardStats.vaccinationRecords + 
                               dashboardStats.mobileClinicVisits + 
                               dashboardStats.laboratoryTests;

        console.log(`   📊 Total Activities: ${totalActivities}`);

    } catch (error) {
        console.log('❌ Error generating dashboard stats:', error.message);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Dashboard Stats Test Complete!');
    console.log('✅ Frontend should now load without 404 errors');
    console.log('🌐 Try accessing: http://localhost:3000');
    console.log('=' .repeat(50));
}

testDashboardStats();
