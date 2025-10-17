const axios = require('axios');

const API_BASE_URL = 'https://ahcp-backend-production.up.railway.app/api';

async function testMobileClinicsAPI() {
    try {
        console.log('🧪 Testing Mobile Clinics API...\n');

        // First, login to get a token
        console.log('1. Logging in to get auth token...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@ahcp.gov.sa',
            password: 'Admin@123456'
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
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // أمس لتجنب مشاكل التوقيت
                // إرسال بيانات العميل للإنشاء (بدلاً من ObjectId)
                client: {
                    name: 'أحمد محمد الأحمد',
                    nationalId: '1234567890',
                    phone: '+966501234567',
                    village: 'الرياض',
                    detailedAddress: 'حي النخيل، شارع الملك فهد'
                },
                farmLocation: 'مزرعة الأحمد',
                coordinates: {
                    latitude: 24.7136,
                    longitude: 46.6753
                },
                supervisor: 'د. محمد علي',
                vehicleNo: 'MC1',
                animalCounts: {
                    sheep: 50,
                    goats: 30,
                    camel: 5,
                    cattle: 10,
                    horse: 2
                },
                diagnosis: 'التهاب رئوي',
                interventionCategory: 'Emergency',
                treatment: 'مضادات حيوية وأدوية مضادة للالتهاب',
                medicationsUsed: [
                    {
                        name: 'أموكسيسيلين',
                        dosage: '500mg',
                        quantity: 10,
                        route: 'Injection'
                    }
                ],
                request: {
                    date: new Date().toISOString().split('T')[0],
                    situation: 'Open',
                    fulfillingDate: null
                },
                followUpRequired: true,
                followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                remarks: 'تحسن ملحوظ في حالة الحيوانات'
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
