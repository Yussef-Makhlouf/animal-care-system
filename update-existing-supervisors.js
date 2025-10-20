const mongoose = require('mongoose');
const User = require('./ahcp-backend/src/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ahcp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateExistingSupervisors() {
  try {
    console.log('🔄 Starting to update existing supervisors...');

    // Get all section supervisors without supervisorCode
    const supervisors = await User.find({
      role: 'section_supervisor',
      isActive: true,
      $or: [
        { supervisorCode: { $exists: false } },
        { supervisorCode: null },
        { supervisorCode: '' }
      ]
    });

    console.log(`📋 Found ${supervisors.length} supervisors to update`);

    for (const supervisor of supervisors) {
      console.log(`\n🔄 Updating supervisor: ${supervisor.name}`);
      console.log(`   Section: ${supervisor.section}`);

      // Generate supervisor code
      const supervisorCode = await User.generateSupervisorCode(supervisor.section);
      console.log(`   Generated code: ${supervisorCode}`);

      // Generate default vehicle number if not exists
      let vehicleNo = supervisor.vehicleNo;
      if (!vehicleNo) {
        // Create vehicle number based on name and code
        const firstName = supervisor.name.split(' ')[0];
        vehicleNo = `${firstName}-${supervisorCode}`;
      }
      console.log(`   Vehicle number: ${vehicleNo}`);

      // Update supervisor
      await User.findByIdAndUpdate(supervisor._id, {
        supervisorCode,
        vehicleNo
      });

      console.log(`✅ Updated supervisor: ${supervisor.name}`);
    }

    console.log('\n🎉 All supervisors updated successfully!');

    // Display updated supervisors
    const updatedSupervisors = await User.find({
      role: 'section_supervisor',
      isActive: true
    }).select('name section supervisorCode vehicleNo');

    console.log('\n📊 Updated supervisors:');
    console.log('==========================================');
    updatedSupervisors.forEach(sup => {
      console.log(`${sup.name}`);
      console.log(`  Section: ${sup.section}`);
      console.log(`  Code: ${sup.supervisorCode}`);
      console.log(`  Vehicle: ${sup.vehicleNo}`);
      console.log('------------------------------------------');
    });

  } catch (error) {
    console.error('❌ Error updating supervisors:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

updateExistingSupervisors();
