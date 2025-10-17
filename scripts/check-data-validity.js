const axios = require('axios');

async function checkDataValidity() {
    console.log('🔍 Checking Data Validity for Date Issues');
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

    // Check clients data for invalid dates
    console.log('\n📋 Checking Clients Data...');
    try {
        const clientsResponse = await axios.get('https://ahcp-backend-production.up.railway.app/api/clients?limit=10', { headers });
        
        if (clientsResponse.data.success && clientsResponse.data.data) {
            const clients = clientsResponse.data.data;
            console.log(`✅ Found ${clients.length} clients`);
            
            clients.forEach((client, index) => {
                console.log(`\n👤 Client ${index + 1}: ${client.name}`);
                console.log(`   📧 Email: ${client.email || 'N/A'}`);
                console.log(`   📱 Phone: ${client.phone || 'N/A'}`);
                console.log(`   📅 Created: ${client.createdAt || 'N/A'}`);
                console.log(`   📅 Updated: ${client.updatedAt || 'N/A'}`);
                console.log(`   🎂 Birth Date: ${client.birth_date || 'N/A'}`);
                
                // Check for invalid dates
                const dates = [
                    { name: 'createdAt', value: client.createdAt },
                    { name: 'updatedAt', value: client.updatedAt },
                    { name: 'birth_date', value: client.birth_date }
                ];
                
                dates.forEach(dateField => {
                    if (dateField.value) {
                        const d = new Date(dateField.value);
                        if (isNaN(d.getTime())) {
                            console.log(`   ❌ Invalid ${dateField.name}: ${dateField.value}`);
                        }
                    }
                });
                
                // Check animals array
                if (client.animals && Array.isArray(client.animals)) {
                    console.log(`   🐄 Animals: ${client.animals.length}`);
                    client.animals.forEach((animal, animalIndex) => {
                        if (animal.birth_date) {
                            const animalBirthDate = new Date(animal.birth_date);
                            if (isNaN(animalBirthDate.getTime())) {
                                console.log(`   ❌ Invalid animal birth_date: ${animal.birth_date}`);
                            }
                        }
                    });
                }
            });
        }
    } catch (error) {
        console.log('❌ Error checking clients:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Check other data types for date issues
    const dataTypes = [
        { name: 'Parasite Control', endpoint: '/parasite-control' },
        { name: 'Vaccination', endpoint: '/vaccination' },
        { name: 'Mobile Clinics', endpoint: '/mobile-clinics' },
        { name: 'Laboratories', endpoint: '/laboratories' }
    ];

    for (const dataType of dataTypes) {
        console.log(`\n📊 Checking ${dataType.name} Data...`);
        try {
            const response = await axios.get(`https://ahcp-backend-production.up.railway.app/api${dataType.endpoint}?limit=3`, { headers });
            
            if (response.data.success && response.data.data) {
                const records = response.data.data;
                console.log(`✅ Found ${records.length} ${dataType.name.toLowerCase()} records`);
                
                records.forEach((record, index) => {
                    console.log(`\n📄 Record ${index + 1}:`);
                    console.log(`   📅 Date: ${record.date || 'N/A'}`);
                    console.log(`   📅 Created: ${record.createdAt || 'N/A'}`);
                    console.log(`   📅 Updated: ${record.updatedAt || 'N/A'}`);
                    
                    // Check for invalid dates
                    const dates = [
                        { name: 'date', value: record.date },
                        { name: 'createdAt', value: record.createdAt },
                        { name: 'updatedAt', value: record.updatedAt }
                    ];
                    
                    dates.forEach(dateField => {
                        if (dateField.value) {
                            const d = new Date(dateField.value);
                            if (isNaN(d.getTime())) {
                                console.log(`   ❌ Invalid ${dateField.name}: ${dateField.value}`);
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.log(`❌ Error checking ${dataType.name}:`, error.response?.status || 'Network Error');
        }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎯 Data Validity Check Complete');
    console.log('✅ formatDate function has been updated to handle invalid dates');
    console.log('💡 Any invalid dates will now show "تاريخ غير صالح" instead of crashing');
    console.log('=' .repeat(50));
}

checkDataValidity();
