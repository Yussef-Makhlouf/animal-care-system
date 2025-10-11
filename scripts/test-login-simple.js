const mongoose = require('mongoose');
const User = require('../ahcp-backend/src/models/User');

async function testUserLogin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/ahcp_database');
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 Finding admin user...');
    const adminUser = await User.findOne({ email: 'admin@ahcp.gov.sa' }).select('+password');
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('👤 Admin user found:', {
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      isActive: adminUser.isActive,
      hasPassword: !!adminUser.password
    });
    
    console.log('🔐 Testing password comparison...');
    const isPasswordValid = await adminUser.comparePassword('Admin@123456');
    console.log('✅ Password comparison result:', isPasswordValid);
    
    if (isPasswordValid) {
      console.log('🎉 Login should work! The issue might be with the server or API configuration.');
    } else {
      console.log('❌ Password comparison failed. Check the password in the seed script.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

testUserLogin();
