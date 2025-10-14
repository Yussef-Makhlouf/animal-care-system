const fs = require('fs');
const crypto = require('crypto');

console.log('🔧 إصلاح مشكلة JWT Secret...\n');

// 1. إنشاء .env file مع JWT_SECRET
const createEnvFile = () => {
  const envContent = `# AHCP Backend Environment Variables
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/ahcp_database

# JWT Configuration
JWT_SECRET=ahcp_development_secret_key_2024_secure_random_string_123456789
JWT_EXPIRES_IN=7d

# API Configuration
API_DOCS_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Email Configuration (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@ahcp.gov.sa

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# Bcrypt Rounds
BCRYPT_ROUNDS=12
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ تم إنشاء ملف .env');
};

// 2. تحديث production.env
const updateProductionEnv = () => {
  const productionEnvPath = 'production.env';
  let content = fs.readFileSync(productionEnvPath, 'utf8');
  
  // استخدام نفس JWT_SECRET من .env
  content = content.replace(
    /JWT_SECRET=.*/,
    'JWT_SECRET=ahcp_development_secret_key_2024_secure_random_string_123456789'
  );
  
  fs.writeFileSync(productionEnvPath, content);
  console.log('✅ تم تحديث production.env');
};

// 3. إنشاء test script جديد
const createTestScript = () => {
  const testScript = `const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001/api';
const TEST_CREDENTIALS = {
  email: 'admin@ahcp.gov.sa',
  password: 'admin123!'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(\`\${BASE_URL}/auth/login\`, TEST_CREDENTIALS);
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('🔑 Token received:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testBulkDelete() {
  console.log('\\n🧪 Testing bulk delete with fixed JWT...');
  
  const testIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
  
  try {
    const response = await axios.delete(\`\${BASE_URL}/clients/bulk-delete\`, {
      headers: { 
        'Authorization': \`Bearer \${authToken}\`,
        'Content-Type': 'application/json'
      },
      data: { ids: testIds },
      timeout: 10000
    });
    
    console.log('✅ Bulk delete successful:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Bulk delete failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

async function runTest() {
  console.log('🚀 Testing bulk delete with fixed JWT...\\n');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  const success = await testBulkDelete();
  if (success) {
    console.log('\\n🎉 Bulk delete is working correctly!');
  } else {
    console.log('\\n⚠️  Bulk delete still has issues');
  }
}

runTest().catch(console.error);
`;

  fs.writeFileSync('test-bulk-delete-fixed.js', testScript);
  console.log('✅ تم إنشاء test-bulk-delete-fixed.js');
};

// تشغيل الإصلاحات
try {
  console.log('🔧 بدء إصلاح مشكلة JWT Secret...\\n');
  
  createEnvFile();
  updateProductionEnv();
  createTestScript();
  
  console.log('\\n🎉 تم إكمال الإصلاحات!');
  console.log('\\n📋 الخطوات التالية:');
  console.log('1. أعد تشغيل الـ backend server');
  console.log('2. شغل: node test-bulk-delete-fixed.js');
  console.log('3. تحقق من أن الحذف المتعدد يعمل');
  
} catch (error) {
  console.error('❌ خطأ في الإصلاح:', error.message);
}
