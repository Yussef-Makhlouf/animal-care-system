const mongoose = require('mongoose');
require('dotenv').config({ path: '../ahcp-backend/.env' });

async function testConnection() {
  try {
    console.log('🔗 Testing MongoDB connection...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/animal-care-system', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Test a simple query
    const ParasiteControl = require('../ahcp-backend/src/models/ParasiteControl');
    const count = await ParasiteControl.countDocuments();
    console.log(`📋 ParasiteControl records: ${count}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection();
