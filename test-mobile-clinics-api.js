const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testMobileClinicsAPI() {
    try {
        console.log('🧪 Testing Mobile Clinics API...\n');

        // First, login to get a token
        console.log('1. Logging in to get auth token...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@ahcp.com',
            password: 'admin123'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.data.token;
        console.log('✅ Login successful, token obtained');

        // Test the mobile clinics endpoint
        console.log('\n2. Testing GET /mobile-clinics endpoint...');
        const mobileClinicsResponse = await axios.get(`${API_BASE_URL}/mobile-clinics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Mobile clinics endpoint response:');
        console.log('Status:', mobileClinicsResponse.status);
        console.log('Data structure:', {
            success: mobileClinicsResponse.data.success,
            dataLength: mobileClinicsResponse.data.data?.length || 0,
            total: mobileClinicsResponse.data.total,
            page: mobileClinicsResponse.data.page,
            totalPages: mobileClinicsResponse.data.totalPages
        });

        // If no data exists, create a test record
        if (mobileClinicsResponse.data.data.length === 0) {
            console.log('\n3. No data found, creating test mobile clinic record...');
            
            const testRecord = {
                serialNo: `MC-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                owner: {
                    name: 'أحمد محمد الأحمد',
                    id: '1234567890',
                    phone: '+966501234567'
                },
                supervisor: 'د. محمد علي',
                vehicleNo: 'ABC-123',
                farmLocation: 'الرياض - حي النخيل',
                sheep: 50,
                goats: 30,
                camel: 5,
                horse: 2,
                cattle: 10,
                diagnosis: 'فحص روتيني للقطيع',
                interventionCategory: 'Routine',
                treatment: 'تحصينات وقائية وعلاج طفيليات',
                remarks: 'حالة القطيع جيدة بشكل عام'
            };

            const createResponse = await axios.post(`${API_BASE_URL}/mobile-clinics`, testRecord, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Test record created:', createResponse.data.success);
            
            // Fetch data again
            const updatedResponse = await axios.get(`${API_BASE_URL}/mobile-clinics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('✅ Updated data count:', updatedResponse.data.data.length);
        }

        // Test statistics endpoint
        console.log('\n4. Testing statistics endpoint...');
        const statsResponse = await axios.get(`${API_BASE_URL}/mobile-clinics/statistics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Statistics response:');
        console.log('Data:', JSON.stringify(statsResponse.data.data, null, 2));

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

testMobileClinicsAPI();
