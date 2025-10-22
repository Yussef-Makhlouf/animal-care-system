const mongoose = require('mongoose');

// Test data that simulates the problematic import data
const testImportData = [
  {
    "serialNo": "1",
    "date": "45901",
    "name": "محمد أحمد علي الشمري",
    "id": "1004458947",
    "birthDate": "22623",
    "phone": "543599283",
    "holdingCode": "VAE234",
    "location": "قرية الشمري",
    "e": "37974167",
    "n": "26263183",
    "supervisor": "M.Tahir",
    "vehicleNo": "V1",
    "sheep": "67",
    "fSheep": "49",
    "vaccinatedSheep": "57",
    "goats": "33",
    "fGoats": "29",
    "vaccinatedGoats": "33",
    "camel": "0",
    "fCamel": "0",
    "vaccinatedCamels": "0",
    "cattel": "0",
    "fCattle": "0",
    "vaccinatedCattle": "0",
    "herdNumber": "100",
    "herdFemales": "78",
    "totalVaccinated": "90",
    "herdHealth": "Healthy",
    "animalsHandling": "Easy handling",
    "labours": "Available",
    "reachableLocation": "Easy",
    "requestDate": "45900",
    "situation": "Closed",
    "requestFulfillingDate": "45901",
    "vaccine": "PPR",
    "category": "Vaccination",
    "remarks": ""
  },
  {
    "serialNo": "2",
    "date": "45901",
    "name": "سالم محمد الزهراني",
    "id": "1082325273",
    "birthDate": "239493",
    "phone": "546091607",
    "holdingCode": "X9K7PQ",
    "location": "قرية الزهراني",
    "e": "37.983002",
    "n": "26.269842",
    "supervisor": "M.Tahir",
    "vehicleNo": "V1",
    "sheep": "9",
    "fSheep": "5",
    "vaccinatedSheep": "8",
    "goats": "79",
    "fGoats": "70",
    "vaccinatedGoats": "79",
    "camel": "0",
    "fCamel": "0",
    "vaccinatedCamels": "0",
    "cattel": "0",
    "fCattle": "0",
    "vaccinatedCattle": "0",
    "herdNumber": "88",
    "herdFemales": "75",
    "totalVaccinated": "87",
    "herdHealth": "Healthy",
    "animalsHandling": "Easy handling",
    "labours": "Available",
    "reachableLocation": "Easy",
    "requestDate": "45900",
    "situation": "Closed",
    "requestFulfillingDate": "45901",
    "vaccine": "PPR",
    "category": "Vaccination",
    "remarks": ""
  }
];

/**
 * Test script to verify the holding code import fix
 * This simulates the import process with the new smart holding code handling
 */
async function testHoldingCodeImport() {
  try {
    console.log('🧪 Starting Holding Code Import Test');
    console.log('=====================================');
    
    // Connect to MongoDB (adjust connection string as needed)
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/animal-care-test';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');
    
    // Import the models and functions we need to test
    const User = require('./ahcp-backend/src/models/User');
    const Client = require('./ahcp-backend/src/models/Client');
    const HoldingCode = require('./ahcp-backend/src/models/HoldingCode');
    const Vaccination = require('./ahcp-backend/src/models/Vaccination');
    
    // Find or create a test admin user
    let adminUser = await User.findOne({ role: 'super_admin' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Test Admin',
        email: 'test@admin.com',
        password: 'testpassword',
        role: 'super_admin',
        isActive: true
      });
      await adminUser.save();
      console.log('✅ Created test admin user');
    }
    
    // Test the findOrCreateHoldingCode function
    console.log('\n🔍 Testing findOrCreateHoldingCode function...');
    
    // Test case 1: Create new holding code
    console.log('\n📝 Test Case 1: Creating new holding code VAE234 for قرية الشمري');
    const holdingCodeId1 = await testFindOrCreateHoldingCode('VAE234', 'قرية الشمري', adminUser._id);
    console.log(`Result: ${holdingCodeId1 ? 'SUCCESS' : 'FAILED'}`);
    
    // Test case 2: Find existing holding code
    console.log('\n📝 Test Case 2: Finding existing holding code VAE234');
    const holdingCodeId2 = await testFindOrCreateHoldingCode('VAE234', 'قرية الشمري', adminUser._id);
    console.log(`Result: ${holdingCodeId1 && holdingCodeId2 && holdingCodeId1.toString() === holdingCodeId2.toString() ? 'SUCCESS' : 'FAILED'}`);
    
    // Test case 3: Create different holding code for different village
    console.log('\n📝 Test Case 3: Creating new holding code X9K7PQ for قرية الزهراني');
    const holdingCodeId3 = await testFindOrCreateHoldingCode('X9K7PQ', 'قرية الزهراني', adminUser._id);
    console.log(`Result: ${holdingCodeId3 ? 'SUCCESS' : 'FAILED'}`);
    
    // Test the complete import process
    console.log('\n🔄 Testing complete import process...');
    
    for (let i = 0; i < testImportData.length; i++) {
      const row = testImportData[i];
      console.log(`\n📋 Processing row ${i + 1}: ${row.name}`);
      
      try {
        const client = await testCreateSimpleClient({
          name: row.name,
          nationalId: row.id,
          phone: row.phone,
          village: row.location,
          holdingCode: row.holdingCode
        }, adminUser._id);
        
        console.log(`✅ Client created/found: ${client.name} with holding code: ${client.holdingCode || 'none'}`);
        
        // Verify the holding code is properly linked
        if (client.holdingCode) {
          const populatedClient = await Client.findById(client._id).populate('holdingCode');
          if (populatedClient.holdingCode) {
            console.log(`✅ Holding code populated: ${populatedClient.holdingCode.code} for village: ${populatedClient.holdingCode.village}`);
          } else {
            console.log('❌ Failed to populate holding code');
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing row ${i + 1}:`, error.message);
      }
    }
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const totalHoldingCodes = await HoldingCode.countDocuments();
    const totalClients = await Client.countDocuments();
    
    console.log(`Total Holding Codes: ${totalHoldingCodes}`);
    console.log(`Total Clients: ${totalClients}`);
    
    const holdingCodes = await HoldingCode.find().select('code village');
    console.log('Holding Codes created:');
    holdingCodes.forEach(hc => {
      console.log(`  - ${hc.code} (${hc.village})`);
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Helper functions to test the import logic
async function testFindOrCreateHoldingCode(holdingCodeValue, village, userId) {
  const HoldingCode = require('./ahcp-backend/src/models/HoldingCode');
  
  try {
    if (!holdingCodeValue || !village) {
      console.log('⚠️ No holding code or village provided, skipping holding code creation');
      return null;
    }

    // First, try to find existing holding code by code
    let holdingCode = await HoldingCode.findOne({ 
      code: holdingCodeValue.toString().trim(),
      isActive: true 
    });

    if (holdingCode) {
      console.log(`✅ Found existing holding code: ${holdingCode.code} for village: ${holdingCode.village}`);
      return holdingCode._id;
    }

    // If not found by code, try to find by village (since village should be unique)
    holdingCode = await HoldingCode.findOne({ 
      village: village.toString().trim(),
      isActive: true 
    });

    if (holdingCode) {
      console.log(`✅ Found existing holding code by village: ${holdingCode.code} for village: ${holdingCode.village}`);
      return holdingCode._id;
    }

    // If no holding code exists, create a new one
    console.log(`🔄 Creating new holding code: ${holdingCodeValue} for village: ${village}`);
    
    const newHoldingCode = new HoldingCode({
      code: holdingCodeValue.toString().trim(),
      village: village.toString().trim(),
      description: `Auto-created during import for village ${village}`,
      isActive: true,
      createdBy: userId
    });

    await newHoldingCode.save();
    console.log(`✅ Created new holding code: ${newHoldingCode.code} (ID: ${newHoldingCode._id})`);
    return newHoldingCode._id;

  } catch (error) {
    console.error('❌ Error in testFindOrCreateHoldingCode:', error);
    
    // If it's a duplicate error, try to find the existing one
    if (error.code === 'DUPLICATE_HOLDING_CODE' || error.code === 'DUPLICATE_VILLAGE_HOLDING_CODE') {
      console.log('🔄 Duplicate detected, trying to find existing holding code...');
      
      // Try to find by code first
      let existingCode = await HoldingCode.findOne({ 
        code: holdingCodeValue.toString().trim(),
        isActive: true 
      });
      
      if (existingCode) {
        console.log(`✅ Found existing holding code after duplicate error: ${existingCode.code}`);
        return existingCode._id;
      }
      
      // Try to find by village
      existingCode = await HoldingCode.findOne({ 
        village: village.toString().trim(),
        isActive: true 
      });
      
      if (existingCode) {
        console.log(`✅ Found existing holding code by village after duplicate error: ${existingCode.code}`);
        return existingCode._id;
      }
    }
    
    // If all fails, return null and continue without holding code
    console.warn(`⚠️ Could not create or find holding code ${holdingCodeValue} for village ${village}, continuing without it`);
    return null;
  }
}

async function testCreateSimpleClient(clientData, userId) {
  const Client = require('./ahcp-backend/src/models/Client');
  
  try {
    // Handle both old format (row object) and new format (clientData object)
    const name = clientData.name || `مربي ${clientData.farmLocation || clientData.serialNo || 'غير محدد'}`;
    const nationalId = clientData.nationalId || `${Date.now()}`.substring(0, 10).padStart(10, '1');
    const phone = clientData.phone || `5${Math.floor(Math.random() * 100000000)}`.substring(0, 9);
    const village = clientData.village || clientData.farmLocation || 'غير محدد';
    const detailedAddress = clientData.detailedAddress || clientData.farmLocation || 'غير محدد';
    
    // Handle holding code intelligently
    let holdingCodeId = null;
    if (clientData.holdingCode && clientData.holdingCode.trim() !== '') {
      console.log(`🔄 Processing holding code: ${clientData.holdingCode} for village: ${village}`);
      holdingCodeId = await testFindOrCreateHoldingCode(clientData.holdingCode, village, userId);
    }
    
    // Try to find existing client first
    let client = await Client.findOne({ 
      $or: [
        { name: name },
        { nationalId: nationalId },
        { phone: phone },
        { village: village }
      ]
    });
    
    if (!client) {
      client = new Client({
        name: name,
        nationalId: nationalId,
        phone: phone,
        birthDate: clientData.birthDate || null,
        village: village,
        detailedAddress: detailedAddress,
        holdingCode: holdingCodeId, // Use ObjectId or null
        status: 'نشط',
        createdBy: userId
      });
      
      await client.save();
      console.log(`✅ Created new client: ${client.name} (ID: ${client.nationalId}) with holding code: ${holdingCodeId || 'none'}`);
    } else {
      // Update existing client with holding code if provided and not already set
      if (holdingCodeId && !client.holdingCode) {
        client.holdingCode = holdingCodeId;
        await client.save();
        console.log(`✅ Updated existing client ${client.name} with holding code: ${holdingCodeId}`);
      } else {
        console.log(`✅ Found existing client: ${client.name} (ID: ${client.nationalId}) with existing holding code: ${client.holdingCode || 'none'}`);
      }
    }
    
    return client;
  } catch (error) {
    console.error('❌ Error creating client:', error);
    throw new Error(`Error creating client: ${error.message}`);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testHoldingCodeImport().catch(console.error);
}

module.exports = {
  testHoldingCodeImport,
  testFindOrCreateHoldingCode,
  testCreateSimpleClient
};
