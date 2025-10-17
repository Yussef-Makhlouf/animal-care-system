const axios = require('axios');

const API_BASE_URL = 'https://ahcp-backend-production.up.railway.app/api';

async function testProfileEndpoint() {
    try {
        console.log('🧪 Testing Profile Endpoint...\n');

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

        // Test the /profile endpoint
        console.log('\n2. Testing GET /auth/profile endpoint...');
        const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Profile endpoint response:');
        console.log('Status:', profileResponse.status);
        console.log('Data:', JSON.stringify(profileResponse.data, null, 2));

        // Test the /me endpoint for comparison
        console.log('\n3. Testing GET /auth/me endpoint for comparison...');
        const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Me endpoint response:');
        console.log('Status:', meResponse.status);
        console.log('Data:', JSON.stringify(meResponse.data, null, 2));

        console.log('\n🎉 All tests passed! Profile endpoint is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

testProfileEndpoint();
