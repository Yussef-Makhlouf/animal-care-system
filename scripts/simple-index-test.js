const mongoose = require('mongoose');

async function testIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Simple connection
    await mongoose.connect('mongodb+srv://yussefmakhloufiti_db_user:Yussef12345@cluster0.pgy8qei.mongodb.net/ahcp_database?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected successfully!');
    
    // Get database
    const db = mongoose.connection.db;
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`);
    
    for (const col of collections) {
      console.log(`\n📋 Collection: ${col.name}`);
      
      try {
        // Get existing indexes
        const indexes = await db.collection(col.name).listIndexes().toArray();
        console.log(`   Current indexes: ${indexes.length}`);
        
        // Add a simple date index if collection has date field
        if (['parasitecontrols', 'vaccinations', 'mobileclinics', 'laboratories'].includes(col.name)) {
          try {
            await db.collection(col.name).createIndex({ date: -1 });
            console.log(`   ✅ Added date index to ${col.name}`);
          } catch (error) {
            if (error.code === 85) {
              console.log(`   ⚠️ Date index already exists in ${col.name}`);
            } else {
              console.log(`   ❌ Failed to add date index to ${col.name}: ${error.message}`);
            }
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error with ${col.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Index test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testIndexes();
