const mongoose = require('mongoose');
require('dotenv').config({ path: '../ahcp-backend/.env' });

// Import models
const ParasiteControl = require('../ahcp-backend/src/models/ParasiteControl');
const Vaccination = require('../ahcp-backend/src/models/Vaccination');
const Laboratory = require('../ahcp-backend/src/models/Laboratory');
const MobileClinic = require('../ahcp-backend/src/models/MobileClinic');

async function extractFilterValues() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/animal-care-system');
    console.log('🔗 Connected to MongoDB');

    const filterValues = {};

    // ✅ 1. Parasite Control Filters
    console.log('\n🦠 Extracting Parasite Control Filter Values...');
    
    // Extract insecticide methods
    const insecticideMethods = await ParasiteControl.distinct('insecticide.method');
    console.log('📋 Insecticide Methods:', insecticideMethods);
    
    // Extract insecticide categories
    const insecticideCategories = await ParasiteControl.distinct('insecticide.category');
    console.log('📋 Insecticide Categories:', insecticideCategories);
    
    // Extract insecticide types
    const insecticideTypes = await ParasiteControl.distinct('insecticide.type');
    console.log('📋 Insecticide Types:', insecticideTypes);
    
    // Extract insecticide status (from schema: ['Sprayed', 'Not Sprayed'])
    const insecticideStatus = ['Sprayed', 'Not Sprayed'];
    console.log('📋 Insecticide Status:', insecticideStatus);
    
    // Extract herd health status (from schema: ['Healthy', 'Sick', 'Sporadic cases'])
    const parasiteHerdHealth = ['Healthy', 'Sick', 'Sporadic cases'];
    console.log('📋 Parasite Herd Health:', parasiteHerdHealth);
    
    // Extract compliance status (from schema: ['Comply', 'Not Comply', 'Partially Comply'])
    const complianceStatus = ['Comply', 'Not Comply', 'Partially Comply'];
    console.log('📋 Compliance Status:', complianceStatus);
    
    // Extract request situations (from schema: ['Ongoing', 'Closed'])
    const parasiteRequestSituation = ['Ongoing', 'Closed'];
    console.log('📋 Parasite Request Situation:', parasiteRequestSituation);

    filterValues.parasiteControl = {
      'insecticide.method': insecticideMethods.filter(Boolean),
      'insecticide.category': insecticideCategories.filter(Boolean),
      'insecticide.type': insecticideTypes.filter(Boolean),
      'insecticide.status': insecticideStatus,
      herdHealthStatus: parasiteHerdHealth,
      complyingToInstructions: complianceStatus,
      'request.situation': parasiteRequestSituation
    };

    // ✅ 2. Vaccination Filters
    console.log('\n💉 Extracting Vaccination Filter Values...');
    
    // Extract vaccine types
    const vaccineTypes = await Vaccination.distinct('vaccineType');
    console.log('📋 Vaccine Types:', vaccineTypes);
    
    // Extract herd health status (from schema: ['Healthy', 'Sick', 'Sporadic Cases'])
    const vaccinationHerdHealth = ['Healthy', 'Sick', 'Sporadic Cases'];
    console.log('📋 Vaccination Herd Health:', vaccinationHerdHealth);
    
    // Extract animals handling (from schema: ['Easy', 'Difficult'])
    const animalsHandling = ['Easy', 'Difficult'];
    console.log('📋 Animals Handling:', animalsHandling);
    
    // Extract labour availability (from schema: ['Available', 'Not Available', 'Not Helpful'])
    const labours = ['Available', 'Not Available', 'Not Helpful'];
    console.log('📋 Labours:', labours);
    
    // Extract location reachability (from schema: ['Easy', 'Hard to reach', 'Moderate'])
    const reachableLocation = ['Easy', 'Hard to reach', 'Moderate'];
    console.log('📋 Reachable Location:', reachableLocation);
    
    // Extract request situations (from schema: ['Ongoing', 'Closed'])
    const vaccinationRequestSituation = ['Ongoing', 'Closed'];
    console.log('📋 Vaccination Request Situation:', vaccinationRequestSituation);

    filterValues.vaccination = {
      'vaccine.type': vaccineTypes.filter(Boolean),
      'vaccine.category': ['Preventive', 'Emergency'], // Common vaccine categories
      herdHealthStatus: vaccinationHerdHealth,
      animalsHandling: animalsHandling,
      labours: labours,
      reachableLocation: reachableLocation,
      'request.situation': vaccinationRequestSituation
    };

    // ✅ 3. Laboratory Filters
    console.log('\n🧪 Extracting Laboratory Filter Values...');
    
    // Extract sample types
    const sampleTypes = await Laboratory.distinct('sampleType');
    console.log('📋 Sample Types:', sampleTypes);
    
    // Extract collectors
    const collectors = await Laboratory.distinct('collector');
    console.log('📋 Collectors:', collectors.slice(0, 10)); // Show first 10
    
    // Extract test status (from schema: ['Pending', 'In Progress', 'Completed', 'Failed'])
    const testStatus = ['Pending', 'In Progress', 'Completed', 'Failed'];
    console.log('📋 Test Status:', testStatus);
    
    // Extract test result status (from schema: ['Normal', 'Abnormal', 'Positive', 'Negative', 'Inconclusive'])
    const testResultStatus = ['Normal', 'Abnormal', 'Positive', 'Negative', 'Inconclusive'];
    console.log('📋 Test Result Status:', testResultStatus);

    filterValues.laboratory = {
      sampleType: sampleTypes.filter(Boolean),
      collector: collectors.filter(Boolean).slice(0, 20), // Limit to 20 most common
      testStatus: testStatus,
      testResult: testResultStatus
    };

    // ✅ 4. Mobile Clinic Filters
    console.log('\n🚐 Extracting Mobile Clinic Filter Values...');
    
    // Extract diagnoses
    const diagnoses = await MobileClinic.distinct('diagnosis');
    console.log('📋 Diagnoses:', diagnoses.slice(0, 10)); // Show first 10
    
    // Extract intervention categories (from schema)
    const interventionCategories = [
      'Emergency', 'Routine', 'Preventive', 'Follow-up', 
      'Clinical Examination', 'Ultrasonography', 'Lab Analysis', 
      'Surgical Operation', 'Farriery'
    ];
    console.log('📋 Intervention Categories:', interventionCategories);
    
    // Extract follow-up required (boolean)
    const followUpRequired = ['true', 'false'];
    console.log('📋 Follow Up Required:', followUpRequired);
    
    // Extract request situations (from schema: ['Ongoing', 'Closed'])
    const mobileClinicRequestSituation = ['Ongoing', 'Closed'];
    console.log('📋 Mobile Clinic Request Situation:', mobileClinicRequestSituation);

    filterValues.mobileClinic = {
      diagnosis: diagnoses.filter(Boolean).slice(0, 20), // Limit to 20 most common
      interventionCategory: interventionCategories,
      followUpRequired: followUpRequired,
      'request.situation': mobileClinicRequestSituation
    };

    // ✅ 5. Generate Filter Configuration File
    console.log('\n📝 Generating Filter Configuration...');
    
    const filterConfig = `// Auto-generated filter values from database
// Generated on: ${new Date().toISOString()}

export const FILTER_VALUES = ${JSON.stringify(filterValues, null, 2)};

// Helper function to get filter options for a specific table and field
export function getFilterOptions(table: string, field: string): Array<{value: string, label: string}> {
  const values = FILTER_VALUES[table]?.[field] || [];
  return values.map(value => ({
    value: value,
    label: value
  }));
}

// Predefined filter configurations for each table
export const TABLE_FILTER_CONFIGS = {
  parasiteControl: [
    {
      key: 'insecticide.method',
      label: 'طريقة الرش',
      type: 'select' as const,
      options: getFilterOptions('parasiteControl', 'insecticide.method')
    },
    {
      key: 'insecticide.category',
      label: 'فئة المبيد',
      type: 'select' as const,
      options: getFilterOptions('parasiteControl', 'insecticide.category')
    },
    {
      key: 'insecticide.status',
      label: 'حالة الرش',
      type: 'select' as const,
      options: getFilterOptions('parasiteControl', 'insecticide.status')
    },
    {
      key: 'insecticide.type',
      label: 'نوع المبيد',
      type: 'select' as const,
      options: getFilterOptions('parasiteControl', 'insecticide.type')
    },
    {
      key: 'herdHealthStatus',
      label: 'الحالة الصحية للقطيع',
      type: 'select' as const,
      options: getFilterOptions('parasiteControl', 'herdHealthStatus')
    },
    {
      key: 'complyingToInstructions',
      label: 'الامتثال للتعليمات',
      type: 'select' as const,
      options: getFilterOptions('parasiteControl', 'complyingToInstructions')
    }
  ],
  
  vaccination: [
    {
      key: 'vaccine.type',
      label: 'نوع اللقاح',
      type: 'select' as const,
      options: getFilterOptions('vaccination', 'vaccine.type')
    },
    {
      key: 'vaccine.category',
      label: 'فئة اللقاح',
      type: 'select' as const,
      options: getFilterOptions('vaccination', 'vaccine.category')
    },
    {
      key: 'herdHealthStatus',
      label: 'الحالة الصحية للقطيع',
      type: 'select' as const,
      options: getFilterOptions('vaccination', 'herdHealthStatus')
    },
    {
      key: 'animalsHandling',
      label: 'سهولة التعامل مع الحيوانات',
      type: 'select' as const,
      options: getFilterOptions('vaccination', 'animalsHandling')
    },
    {
      key: 'reachableLocation',
      label: 'إمكانية الوصول للموقع',
      type: 'select' as const,
      options: getFilterOptions('vaccination', 'reachableLocation')
    }
  ],
  
  laboratory: [
    {
      key: 'sampleType',
      label: 'نوع العينة',
      type: 'select' as const,
      options: getFilterOptions('laboratory', 'sampleType')
    },
    {
      key: 'testStatus',
      label: 'حالة الفحص',
      type: 'select' as const,
      options: getFilterOptions('laboratory', 'testStatus')
    },
    {
      key: 'testResult',
      label: 'نتيجة الفحص',
      type: 'select' as const,
      options: getFilterOptions('laboratory', 'testResult')
    }
  ],
  
  mobileClinic: [
    {
      key: 'interventionCategory',
      label: 'فئة التدخل',
      type: 'select' as const,
      options: getFilterOptions('mobileClinic', 'interventionCategory')
    },
    {
      key: 'followUpRequired',
      label: 'يتطلب متابعة',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'نعم' },
        { value: 'false', label: 'لا' }
      ]
    }
  ]
};`;

    // Write to file
    const fs = require('fs');
    const path = require('path');
    
    const outputPath = path.join(__dirname, '../ahcp-dashboard/lib/generated-filter-values.ts');
    fs.writeFileSync(outputPath, filterConfig);
    
    console.log('✅ Filter configuration written to:', outputPath);
    console.log('\n📊 Summary:');
    console.log('- Parasite Control Filters:', Object.keys(filterValues.parasiteControl).length);
    console.log('- Vaccination Filters:', Object.keys(filterValues.vaccination).length);
    console.log('- Laboratory Filters:', Object.keys(filterValues.laboratory).length);
    console.log('- Mobile Clinic Filters:', Object.keys(filterValues.mobileClinic).length);

  } catch (error) {
    console.error('❌ Error extracting filter values:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the extraction
extractFilterValues();
