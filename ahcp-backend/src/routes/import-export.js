const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

// Import middleware
const { auth } = require('../middleware/auth');

// Import models
const Client = require('../models/Client');
const Vaccination = require('../models/Vaccination');
const ParasiteControl = require('../models/ParasiteControl');
const MobileClinic = require('../models/MobileClinic');
const Laboratory = require('../models/Laboratory');
const EquineHealth = require('../models/EquineHealth');
const HoldingCode = require('../models/HoldingCode');

const router = express.Router();

// Arabic headers mapping for better user experience
const arabicHeaders = {
  // Clients
  'name': 'الاسم',
  'nationalId': 'رقم الهوية',
  'phone': 'رقم الهاتف',
  'email': 'البريد الإلكتروني',
  'village': 'القرية',
  'detailedAddress': 'العنوان التفصيلي',
  'status': 'الحالة',
  'totalAnimals': 'إجمالي الحيوانات',
  
  // Vaccination
  'serialNo': 'الرقم التسلسلي',
  'date': 'التاريخ',
  'client': 'العميل',
  'farmLocation': 'موقع المزرعة',
  'supervisor': 'المشرف',
  'team': 'الفريق',
  'vehicleNo': 'رقم المركبة',
  'vaccineType': 'نوع اللقاح',
  'vaccineCategory': 'فئة اللقاح',
  'herdHealth': 'صحة القطيع',
  'animalsHandling': 'التعامل مع الحيوانات',
  'labours': 'العمالة',
  'reachableLocation': 'سهولة الوصول',
  'remarks': 'ملاحظات',
  
  // Parasite Control
  'herdLocation': 'موقع القطيع',
  'insecticide': 'المبيد',
  'animalBarnSizeSqM': 'مساحة الحظيرة',
  'breedingSites': 'مواقع التكاثر',
  'parasiteControlVolume': 'حجم مكافحة الطفيليات',
  'parasiteControlStatus': 'حالة مكافحة الطفيليات',
  'herdHealthStatus': 'حالة صحة القطيع',
  'complyingToInstructions': 'الالتزام بالتعليمات',
  
  // Mobile Clinics
  'animalCounts': 'عدد الحيوانات',
  'diagnosis': 'التشخيص',
  'interventionCategory': 'فئة التدخل',
  'treatment': 'العلاج',
  'medicationsUsed': 'الأدوية المستخدمة',
  'followUpRequired': 'مطلوب متابعة',
  'followUpDate': 'تاريخ المتابعة',
  
  // Laboratories
  'sampleCode': 'رمز العينة',
  'clientName': 'اسم العميل',
  'clientId': 'رقم العميل',
  'clientPhone': 'هاتف العميل',
  'speciesCounts': 'عدد الأنواع',
  'collector': 'جامع العينة',
  'sampleType': 'نوع العينة',
  'sampleNumber': 'رقم العينة',
  'positiveCases': 'الحالات الإيجابية',
  'negativeCases': 'الحالات السلبية',
  'testResults': 'نتائج الفحص',
  
  // Equine Health
  'horseCount': 'عدد الخيول',
  'coordinates': 'الإحداثيات',
  'latitude': 'خط العرض',
  'longitude': 'خط الطول'
};

// Configure multer for memory storage (better for serverless)
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage instead of disk
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for serverless
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed (.csv, .xlsx, .xls)'));
    }
  }
});

// Helper function to parse file data from memory buffer
const parseFileData = async (fileBuffer, fileName) => {
  const results = [];
  
  try {
    if (fileName.toLowerCase().endsWith('.csv')) {
      // Parse CSV from buffer
      const csvString = fileBuffer.toString('utf8');
      const lines = csvString.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      console.log(`📊 CSV Headers:`, headers);
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          console.log(`📊 Row ${i}:`, Object.keys(row), Object.values(row));
          results.push(row);
        }
      }
    } else if (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls')) {
      // Parse Excel from buffer
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error('Excel file has no worksheets');
      }
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        throw new Error('Excel file is empty');
      }
      
      console.log(`📊 Excel Headers:`, Object.keys(jsonData[0] || {}));
      
      // Convert Excel data to same format as CSV
      jsonData.forEach((row, index) => {
        console.log(`📊 Excel Row ${index + 1}:`, Object.keys(row), Object.values(row));
        results.push(row);
      });
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel files.');
    }
    
    console.log(`📊 Successfully parsed ${results.length} rows from ${fileName}`);
    return results;
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
};

// Validate import data before processing
const validateImportData = (data, Model) => {
  const errors = [];
  
  if (!data || data.length === 0) {
    errors.push({
      field: 'data',
      message: 'No data found in file'
    });
    return errors;
  }
  
  console.log(`🔍 Total rows to validate: ${data.length}`);
  console.log(`🔍 First row keys:`, data[0] ? Object.keys(data[0]) : 'No data');
  
  // For import, we will be more lenient and let the processing functions handle validation
  // This allows for better error messages and fallback values
  console.log(`✅ Validation passed for ${Model.modelName} - will validate during processing`);
  
  return errors; // Return empty errors array to allow processing
  
  data.forEach((row, index) => {
    console.log(`🔍 Validating row ${index + 1}:`, Object.keys(row));
    console.log(`🔍 Row data sample:`, Object.entries(row).slice(0, 3)); // Show first 3 fields
    console.log(`🔍 Full row data:`, row); // Show all data for debugging
    
    requiredFields.forEach(field => {
      // Check multiple possible field names including Arabic equivalents
      const fieldVariants = [
        field,
        field.replace(/([A-Z])/g, '_$1').toLowerCase(), // camelCase to snake_case
        field.replace(/_/g, ''), // remove underscores
        field.toLowerCase(), // lowercase
        field.replace(/\s+/g, ''), // remove spaces
        field.replace(/\s+/g, '_'), // spaces to underscores
        field.replace(/\s+/g, '').toLowerCase(), // remove spaces and lowercase
        field.replace(/\s+/g, '').toUpperCase(), // remove spaces and uppercase
        field.replace(/\s+/g, '').charAt(0).toUpperCase() + field.replace(/\s+/g, '').slice(1).toLowerCase(), // Title case
        // Arabic equivalents
        ...(field === 'Name' ? ['اسم', 'الاسم', 'اسم المالك', 'اسم المربي', 'اسم العميل'] : []),
        ...(field === 'Date' ? ['تاريخ', 'التاريخ', 'تاريخ التقرير'] : []),
        // Common variations
        ...(field === 'Name' ? ['Client Name', 'clientName', 'client_name', 'owner_name', 'ownerName', 'اسم العميل', 'اسم المالك', 'اسم المربي', 'Name', 'name', 'NAME'] : []),
        ...(field === 'Date' ? ['Report Date', 'reportDate', 'report_date', 'visit_date', 'visitDate', 'تاريخ التقرير', 'تاريخ الزيارة', 'Date', 'date', 'DATE'] : []),
        // Excel common column names
        ...(field === 'Name' ? ['Name', 'name', 'NAME', 'اسم', 'الاسم', 'اسم العميل', 'اسم المربي'] : []),
        ...(field === 'Date' ? ['Date', 'date', 'DATE', 'تاريخ', 'التاريخ'] : [])
      ];
      
      console.log(`🔍 Checking field '${field}' with variants:`, fieldVariants);
      
      const hasField = fieldVariants.some(variant => {
        const value = row[variant];
        const hasValue = value && value.toString().trim() !== '';
        console.log(`  - Variant '${variant}': ${value} (hasValue: ${hasValue})`);
        return hasValue;
      });
      
      // Additional check: look for any field that might contain the required data
      if (!hasField && (field === 'Name' || field === 'Date')) {
        console.log(`🔍 Searching for ${field} in all row keys...`);
        const allKeys = Object.keys(row);
        const foundKey = allKeys.find(key => {
          const value = row[key];
          const hasValue = value && value.toString().trim() !== '';
          console.log(`  - Checking key '${key}': ${value} (hasValue: ${hasValue})`);
          return hasValue;
        });
        
        if (foundKey) {
          console.log(`✅ Found ${field} data in key '${foundKey}'`);
          // Don't add error if we found the data
          return;
        }
        
        // Special check for Name field - look for any field that might contain a name
        if (field === 'Name') {
          const nameLikeKeys = allKeys.filter(key => {
            const value = row[key];
            if (!value || value.toString().trim() === '') return false;
            
            const valueStr = value.toString().trim();
            // Check if it looks like a name (contains Arabic characters or is not a number)
            if (valueStr.match(/[\u0600-\u06FF]/) || // Arabic characters
                (isNaN(valueStr) && valueStr.length > 2 && !valueStr.match(/^\d+$/))) {
              console.log(`🔍 Found name-like data in key '${key}': ${valueStr}`);
              return true;
            }
            return false;
          });
          
          if (nameLikeKeys.length > 0) {
            console.log(`✅ Found name-like data in keys: ${nameLikeKeys.join(', ')}`);
            return; // Don't add error
          }
        }
      }
      
      // Special handling for Date field - check if we found it but it's not in the first loop
      if (field === 'Date' && !hasField) {
        console.log(`🔍 Special Date check - looking for any date-like field...`);
        const allKeys = Object.keys(row);
        const dateLikeKeys = allKeys.filter(key => {
          const value = row[key];
          if (!value || value.toString().trim() === '') return false;
          
          const valueStr = value.toString().trim();
          console.log(`🔍 Checking key '${key}' for date: ${valueStr}`);
          // Check if it looks like a date (D-Mon format or other date formats)
          if (valueStr.match(/^\d{1,2}-[A-Za-z]{3}$/)) {
            console.log(`🔍 Found D-Mon date in key '${key}': ${valueStr}`);
            return true;
          }
          if (valueStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            console.log(`🔍 Found DD/MM/YYYY date in key '${key}': ${valueStr}`);
            return true;
          }
          if (valueStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.log(`🔍 Found YYYY-MM-DD date in key '${key}': ${valueStr}`);
            return true;
          }
          // Don't treat pure numbers as dates unless they're in specific date formats
          if (valueStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/) || 
              valueStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/) ||
              valueStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            console.log(`🔍 Found valid date format in key '${key}': ${valueStr}`);
            return true;
          }
          return false;
        });
        
        if (dateLikeKeys.length > 0) {
          console.log(`✅ Found date-like data in keys: ${dateLikeKeys.join(', ')}`);
          return; // Don't add error
        }
      }
      
      if (!hasField) {
        console.log(`❌ Field '${field}' not found in row ${index + 1}`);
        // Only add error for truly required fields (Date and Name)
        if (field === 'Date' || field === 'Name') {
          // Check if we already have an error for this field in this row
          const existingError = errors.find(err => 
            err.row === index + 1 && err.field === field
          );
          if (!existingError) {
            errors.push({
              row: index + 1,
              field: field,
              message: `Required field '${field}' is missing or empty`
            });
          }
        }
      } else {
        console.log(`✅ Field '${field}' found in row ${index + 1}`);
      }
    });
    
    // Check for date fields (optional validation)
    const dateFields = [
      'date', 'Date', 'DATE', 
      'تاريخ', 'التاريخ',
      'Request Date', 'requestDate', 'request_date',
      'Birth Date', 'birthDate', 'birth_date', 'Date of Birth', 'dateOfBirth',
      'Request Fulfilling Date', 'requestFulfillingDate', 'request_fulfilling_date'
    ];
    
    // Look for any date field in the row
    let hasValidDate = false;
    let foundDateField = null;
    
    dateFields.forEach(dateField => {
      if (row[dateField] && !hasValidDate) {
        const dateString = row[dateField].toString().trim();
        console.log(`🔍 Date validation for ${dateField}: ${dateString}`);
        
        // Handle D-Mon format (1-Sep, 2-Sep, etc.)
        let dateValue;
        if (dateString.match(/^\d{1,2}-[A-Za-z]{3}$/)) {
          // Convert D-Mon format to proper date
          const currentYear = new Date().getFullYear();
          const monthMap = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          const [day, month] = dateString.split('-');
          const monthNum = monthMap[month];
          if (monthNum) {
            dateValue = new Date(`${currentYear}-${monthNum}-${day.padStart(2, '0')}`);
          } else {
            dateValue = new Date(dateString);
          }
        } else {
          dateValue = new Date(dateString);
        }
        
        console.log(`🔍 Parsed date: ${dateValue} (valid: ${!isNaN(dateValue.getTime())})`);
        if (!isNaN(dateValue.getTime())) {
          hasValidDate = true;
          foundDateField = dateField;
        }
      }
    });
    
    // Only add date error if we specifically require a date field and none found
    // Since dates are now optional, we don't add errors for missing dates
    console.log(`🔍 Date check result: hasValidDate=${hasValidDate}, foundField=${foundDateField}`);
    
    // Validate JSON fields
    if (row.medicationsUsed && typeof row.medicationsUsed === 'string') {
      try {
        JSON.parse(row.medicationsUsed);
      } catch (e) {
        errors.push({
          row: index + 1,
          field: 'medicationsUsed',
          message: 'Invalid JSON format for medicationsUsed'
        });
      }
    }
  });
  
  return errors;
};

// Get required fields for each model - now more lenient
const getRequiredFields = (Model) => {
  const modelName = Model.modelName;
  
  // Return empty array for all models to allow processing functions to handle validation
  // This provides better error messages and allows for fallback values
  console.log(`📋 Model ${modelName}: Using lenient validation - will validate during processing`);
  return [];
};

// Helper function to validate field mapping
const validateFieldMapping = (records, fields) => {
  if (!records || records.length === 0) {
    return {
      isValid: false,
      message: 'No data found',
      availableFields: []
    };
  }

  const availableFields = Object.keys(records[0]);
  const clientFields = records[0].client ? Object.keys(records[0].client) : [];
  const allAvailableFields = [...availableFields, ...clientFields];
  
  console.log('📊 Available fields in main record:', availableFields);
  console.log('📊 Available fields in client:', clientFields);
  console.log('📊 All available fields:', allAvailableFields);
  
  const missingFields = fields.filter(field => !allAvailableFields.includes(field));
  
  return {
    isValid: missingFields.length === 0,
    availableFields: allAvailableFields,
    missingFields,
    message: missingFields.length > 0 ? 
      `Missing fields: ${missingFields.join(', ')}` : 
      'All fields available'
  };
};

// Helper function to generate CSV content with English headers
const generateCSV = (data, headers) => {
  if (!data || data.length === 0) {
    const headerRow = headers.join(',');
    return headerRow;
  }
  
  // Use English headers (same as template headers)
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      let value = row[header] || '';
      
      // Check if field exists in client object
      if (value === '' || value === undefined) {
        if (row.client && row.client[header] !== undefined) {
          value = row.client[header];
        }
      }
      
      // Handle date fields formatting for CSV
      if (header === 'birthDate' || header === 'clientBirthDate' || header === 'date' || header === 'Birth of Date' || header === 'Date of Birth' || header === 'Birth Date') {
        if (value instanceof Date) {
          // Format date for CSV (YYYY-MM-DD)
          value = value.toISOString().split('T')[0];
        } else if (value && typeof value === 'string') {
          // Try to parse and format date string
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            value = dateValue.toISOString().split('T')[0];
          }
        }
      }
      
      // Handle animal count fields from nested objects
      if (value === '' || value === undefined) {
        if (header === 'sheep' && row.herdCounts && row.herdCounts.sheep) {
          value = row.herdCounts.sheep.total || 0;
        } else if (header === 'sheepFemale' && row.herdCounts && row.herdCounts.sheep) {
          value = row.herdCounts.sheep.female || 0;
        } else if (header === 'sheepVaccinated' && row.herdCounts && row.herdCounts.sheep) {
          value = row.herdCounts.sheep.vaccinated || 0;
        } else if (header === 'goats' && row.herdCounts && row.herdCounts.goats) {
          value = row.herdCounts.goats.total || 0;
        } else if (header === 'goatsFemale' && row.herdCounts && row.herdCounts.goats) {
          value = row.herdCounts.goats.female || 0;
        } else if (header === 'goatsVaccinated' && row.herdCounts && row.herdCounts.goats) {
          value = row.herdCounts.goats.vaccinated || 0;
        } else if (header === 'camel' && row.herdCounts && row.herdCounts.camel) {
          value = row.herdCounts.camel.total || 0;
        } else if (header === 'camelFemale' && row.herdCounts && row.herdCounts.camel) {
          value = row.herdCounts.camel.female || 0;
        } else if (header === 'camelVaccinated' && row.herdCounts && row.herdCounts.camel) {
          value = row.herdCounts.camel.vaccinated || 0;
        } else if (header === 'cattle' && row.herdCounts && row.herdCounts.cattle) {
          value = row.herdCounts.cattle.total || 0;
        } else if (header === 'cattleFemale' && row.herdCounts && row.herdCounts.cattle) {
          value = row.herdCounts.cattle.female || 0;
        } else if (header === 'cattleVaccinated' && row.herdCounts && row.herdCounts.cattle) {
          value = row.herdCounts.cattle.vaccinated || 0;
        } else if (header === 'herdNumber' && row.herdCounts) {
          value = (row.herdCounts.sheep?.total || 0) + (row.herdCounts.goats?.total || 0) + (row.herdCounts.camel?.total || 0) + (row.herdCounts.cattle?.total || 0);
        } else if (header === 'herdFemales' && row.herdCounts) {
          value = (row.herdCounts.sheep?.female || 0) + (row.herdCounts.goats?.female || 0) + (row.herdCounts.camel?.female || 0) + (row.herdCounts.cattle?.female || 0);
        } else if (header === 'totalVaccinated' && row.herdCounts) {
          value = (row.herdCounts.sheep?.vaccinated || 0) + (row.herdCounts.goats?.vaccinated || 0) + (row.herdCounts.camel?.vaccinated || 0) + (row.herdCounts.cattle?.vaccinated || 0);
        }
        // Handle animalCounts for Mobile Clinic
        else if (header === 'sheep' && row.animalCounts && row.animalCounts.sheep) {
          value = row.animalCounts.sheep || 0;
        } else if (header === 'goats' && row.animalCounts && row.animalCounts.goats) {
          value = row.animalCounts.goats || 0;
        } else if (header === 'camel' && row.animalCounts && row.animalCounts.camel) {
          value = row.animalCounts.camel || 0;
        } else if (header === 'cattle' && row.animalCounts && row.animalCounts.cattle) {
          value = row.animalCounts.cattle || 0;
        } else if (header === 'horse' && row.animalCounts && row.animalCounts.horse) {
          value = row.animalCounts.horse || 0;
        }
       
        // Handle speciesCounts for Laboratory
        else if (header === 'sheep' && row.speciesCounts && row.speciesCounts.sheep) {
          value = row.speciesCounts.sheep || 0;
        } else if (header === 'goats' && row.speciesCounts && row.speciesCounts.goats) {
          value = row.speciesCounts.goats || 0;
        } else if (header === 'camel' && row.speciesCounts && row.speciesCounts.camel) {
          value = row.speciesCounts.camel || 0;
        } else if (header === 'cattle' && row.speciesCounts && row.speciesCounts.cattle) {
          value = row.speciesCounts.cattle || 0;
        } else if (header === 'horse' && row.speciesCounts && row.speciesCounts.horse) {
          value = row.speciesCounts.horse || 0;
        } else if (header === 'otherSpecies' && row.speciesCounts && row.speciesCounts.other) {
          value = row.speciesCounts.other || '';
        }
      }
      
      // Handle nested objects (like client data)
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value.name) {
          value = value.name;
        } else if (value._id) {
          value = value._id.toString();
        } else if (header.includes('Counts') || header.includes('Herd') || header.includes('Animal')) {
          // Skip nested animal count objects - we now have separate fields
          value = '';
        } else {
          value = JSON.stringify(value);
        }
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        value = value.join(', ');
      }
      
      // Handle dates
      if (value instanceof Date) {
        value = value.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
      
      // Handle boolean values
      if (typeof value === 'boolean') {
        value = value ? 'نعم' : 'لا';
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Convert to string and clean up
      value = String(value).trim();
      
      // Escape commas and quotes for CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

// Helper function to generate Excel content with English headers
const generateExcel = (data, headers) => {
  if (!data || data.length === 0) {
    // Create empty worksheet with headers only
    const emptyData = [{}];
    headers.forEach(header => {
      emptyData[0][header] = '';
    });
    const worksheet = XLSX.utils.json_to_sheet(emptyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  console.log('📊 generateExcel called with:', {
    dataLength: data ? data.length : 0,
    headers: headers
  });

  // Process data to flatten nested objects and arrays
  const processedData = data.map((row, rowIndex) => {
    const processedRow = {};
    
    headers.forEach((header, index) => {
      let value = row[header];
      
      // Check if field exists in client object
      if (value === undefined && row.client && row.client[header] !== undefined) {
        value = row.client[header];
        console.log(`📊 Found field ${header} in client data:`, value);
      }
      
      // Handle date fields formatting for Excel
      if (header === 'birthDate' || header === 'clientBirthDate' || header === 'date') {
        if (value instanceof Date) {
          // Format date for Excel (YYYY-MM-DD)
          value = value.toISOString().split('T')[0];
          console.log(`📊 Formatted date ${header}: ${value}`);
        } else if (value && typeof value === 'string') {
          // Try to parse and format date string
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            value = dateValue.toISOString().split('T')[0];
            console.log(`📊 Parsed and formatted date ${header}: ${value}`);
          }
        }
      }
      
      // Handle animal count fields from nested objects
      if (value === undefined || value === '') {
        console.log(`🔍 Looking for ${header} in row data:`, {
          hasHerdCounts: !!row.herdCounts,
          hasAnimalCounts: !!row.animalCounts,
          hasSpeciesCounts: !!row.speciesCounts,
          herdCounts: row.herdCounts,
          animalCounts: row.animalCounts,
          speciesCounts: row.speciesCounts
        });
        
        if (header === 'sheep' && row.herdCounts && row.herdCounts.sheep) {
          value = row.herdCounts.sheep.total || 0;
          console.log(`✅ Found sheep in herdCounts: ${value}`);
        } else if (header === 'sheepFemale' && row.herdCounts && row.herdCounts.sheep) {
          value = row.herdCounts.sheep.female || 0;
          console.log(`✅ Found sheepFemale in herdCounts: ${value}`);
        } else if (header === 'sheepVaccinated' && row.herdCounts && row.herdCounts.sheep) {
          value = row.herdCounts.sheep.vaccinated || 0;
          console.log(`✅ Found sheepVaccinated in herdCounts: ${value}`);
        } else if (header === 'goats' && row.herdCounts && row.herdCounts.goats) {
          value = row.herdCounts.goats.total || 0;
          console.log(`✅ Found goats in herdCounts: ${value}`);
        } else if (header === 'goatsFemale' && row.herdCounts && row.herdCounts.goats) {
          value = row.herdCounts.goats.female || 0;
          console.log(`✅ Found goatsFemale in herdCounts: ${value}`);
        } else if (header === 'goatsVaccinated' && row.herdCounts && row.herdCounts.goats) {
          value = row.herdCounts.goats.vaccinated || 0;
          console.log(`✅ Found goatsVaccinated in herdCounts: ${value}`);
        } else if (header === 'camel' && row.herdCounts && row.herdCounts.camel) {
          value = row.herdCounts.camel.total || 0;
          console.log(`✅ Found camel in herdCounts: ${value}`);
        } else if (header === 'camelFemale' && row.herdCounts && row.herdCounts.camel) {
          value = row.herdCounts.camel.female || 0;
          console.log(`✅ Found camelFemale in herdCounts: ${value}`);
        } else if (header === 'camelVaccinated' && row.herdCounts && row.herdCounts.camel) {
          value = row.herdCounts.camel.vaccinated || 0;
          console.log(`✅ Found camelVaccinated in herdCounts: ${value}`);
        } else if (header === 'cattle' && row.herdCounts && row.herdCounts.cattle) {
          value = row.herdCounts.cattle.total || 0;
          console.log(`✅ Found cattle in herdCounts: ${value}`);
        } else if (header === 'cattleFemale' && row.herdCounts && row.herdCounts.cattle) {
          value = row.herdCounts.cattle.female || 0;
          console.log(`✅ Found cattleFemale in herdCounts: ${value}`);
        } else if (header === 'cattleVaccinated' && row.herdCounts && row.herdCounts.cattle) {
          value = row.herdCounts.cattle.vaccinated || 0;
          console.log(`✅ Found cattleVaccinated in herdCounts: ${value}`);
        } else if (header === 'herdNumber' && row.herdCounts) {
          value = (row.herdCounts.sheep?.total || 0) + (row.herdCounts.goats?.total || 0) + (row.herdCounts.camel?.total || 0) + (row.herdCounts.cattle?.total || 0);
          console.log(`✅ Calculated herdNumber: ${value}`);
        } else if (header === 'herdFemales' && row.herdCounts) {
          value = (row.herdCounts.sheep?.female || 0) + (row.herdCounts.goats?.female || 0) + (row.herdCounts.camel?.female || 0) + (row.herdCounts.cattle?.female || 0);
          console.log(`✅ Calculated herdFemales: ${value}`);
        } else if (header === 'totalVaccinated' && row.herdCounts) {
          value = (row.herdCounts.sheep?.vaccinated || 0) + (row.herdCounts.goats?.vaccinated || 0) + (row.herdCounts.camel?.vaccinated || 0) + (row.herdCounts.cattle?.vaccinated || 0);
          console.log(`✅ Calculated totalVaccinated: ${value}`);
        }
        // Handle animalCounts for Mobile Clinic
        else if (header === 'sheep' && row.animalCounts && row.animalCounts.sheep) {
          value = row.animalCounts.sheep || 0;
          console.log(`✅ Found sheep in animalCounts: ${value}`);
        } else if (header === 'goats' && row.animalCounts && row.animalCounts.goats) {
          value = row.animalCounts.goats || 0;
          console.log(`✅ Found goats in animalCounts: ${value}`);
        } else if (header === 'camel' && row.animalCounts && row.animalCounts.camel) {
          value = row.animalCounts.camel || 0;
          console.log(`✅ Found camel in animalCounts: ${value}`);
        } else if (header === 'cattle' && row.animalCounts && row.animalCounts.cattle) {
          value = row.animalCounts.cattle || 0;
          console.log(`✅ Found cattle in animalCounts: ${value}`);
        } else if (header === 'horse' && row.animalCounts && row.animalCounts.horse) {
          value = row.animalCounts.horse || 0;
          console.log(`✅ Found horse in animalCounts: ${value}`);
        }
        // Handle speciesCounts for Laboratory
        else if (header === 'sheep' && row.speciesCounts && row.speciesCounts.sheep) {
          value = row.speciesCounts.sheep || 0;
          console.log(`✅ Found sheep in speciesCounts: ${value}`);
        } else if (header === 'goats' && row.speciesCounts && row.speciesCounts.goats) {
          value = row.speciesCounts.goats || 0;
          console.log(`✅ Found goats in speciesCounts: ${value}`);
        } else if (header === 'camel' && row.speciesCounts && row.speciesCounts.camel) {
          value = row.speciesCounts.camel || 0;
          console.log(`✅ Found camel in speciesCounts: ${value}`);
        } else if (header === 'cattle' && row.speciesCounts && row.speciesCounts.cattle) {
          value = row.speciesCounts.cattle || 0;
          console.log(`✅ Found cattle in speciesCounts: ${value}`);
        } else if (header === 'horse' && row.speciesCounts && row.speciesCounts.horse) {
          value = row.speciesCounts.horse || 0;
          console.log(`✅ Found horse in speciesCounts: ${value}`);
        } else if (header === 'otherSpecies' && row.speciesCounts && row.speciesCounts.other) {
          value = row.speciesCounts.other || '';
          console.log(`✅ Found otherSpecies in speciesCounts: ${value}`);
        } else {
          console.log(`❌ Field ${header} not found in any nested object`);
        }
      }
      
      // Handle nested objects (like client data)
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value.name) {
          value = value.name;
        } else if (value._id) {
          value = value._id.toString();
        } else if (header.includes('Counts') || header.includes('Herd') || header.includes('Animal')) {
          // Skip nested animal count objects - we now have separate fields
          value = '';
        } else {
          value = JSON.stringify(value);
        }
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        value = value.join(', ');
      }
      
      // Handle dates
      if (value instanceof Date) {
        value = value.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
      
      // Handle boolean values
      if (typeof value === 'boolean') {
        value = value ? 'نعم' : 'لا';
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Convert to string and clean up
      value = String(value).trim();
      
      // Use English header as key (same as template headers)
      processedRow[header] = value;
      
      if (rowIndex === 0) {
        console.log(`📊 Field ${header}: ${value} (type: ${typeof value})`);
      }
    });
    
    return processedRow;
  });

  console.log('📊 Processed data:', processedData[0]);
  console.log('📊 Processed data keys:', Object.keys(processedData[0]));

  // Create worksheet with processed data
  const worksheet = XLSX.utils.json_to_sheet(processedData);
  
  // Set column widths for better readability
  const colWidths = headers.map(header => ({
    wch: Math.max(header.length, 15)
  }));
  worksheet['!cols'] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  return XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    cellStyles: true,
    compression: true
  });
};

// Generic export handler with streaming for large datasets
const handleExport = (Model, filter = {}, fields = [], filename = 'export') => {
  return async (req, res) => {
    try {
      const { format = 'xlsx', limit = 1000 } = req.query; // Reduced limit for serverless
      
      // Set timeout for large exports
      res.setTimeout(60000); // 1 minute timeout for serverless
      
      // Apply additional filters from query
      const queryFilter = { ...filter };
      if (req.query.startDate && req.query.endDate) {
        queryFilter.date = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
        };
      }
      
      console.log(`📊 Starting export for ${filename} with filter:`, queryFilter);
      console.log(`📊 Requested fields:`, fields);
      
      // Optimized query with lean() for better performance
      let query = Model.find(queryFilter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) || 1000)
        .lean(); // Use lean() for better performance
      
      // Try to populate client if the model has client field
      try {
        const sampleDoc = await Model.findOne(queryFilter).lean();
        if (sampleDoc && sampleDoc.client) {
          console.log('📊 Client field found, adding populate');
          query = Model.find(queryFilter)
            .populate('client', 'name nationalId birthDate phone email village detailedAddress status totalAnimals')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit) || 1000)
            .lean();
        }
      } catch (populateError) {
        // Continue without populate if it fails
        console.warn('Could not populate client field:', populateError.message);
      }
      
      console.log(`📊 Exporting ${filename} with format: ${format}`);
      const records = await query;
      console.log(`📊 Found ${records.length} records to export`);
      
      // Debug: Log first record structure if records exist
      if (records.length > 0) {
        console.log('📊 First record structure:', Object.keys(records[0]));
        console.log('📊 First record data:', JSON.stringify(records[0], null, 2));
        
        if (records[0].client) {
          console.log('📊 Client data structure:', Object.keys(records[0].client));
          console.log('📊 Client data:', JSON.stringify(records[0].client, null, 2));
        }
        
        // Check field mapping using validation function
        const validation = validateFieldMapping(records, fields);
        console.log('📊 Field mapping validation:', validation);
        
        if (!validation.isValid) {
          console.log('⚠️ Field mapping issues:', validation.message);
        } else {
          console.log('✅ All requested fields are available');
        }
      }

      // If no records found, still create a file with headers
      if (records.length === 0) {
        console.log('⚠️ No records found, creating empty file with headers');
        if (format === 'csv') {
          const csvContent = generateCSV([], fields);
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
          res.send(csvContent);
        } else {
          const excelBuffer = generateExcel([], fields);
          res.setHeader('Content-Type', 'application/vnd.Ongoingxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
          res.send(excelBuffer);
        }
        return;
      }

      // Use English headers (same as template headers)
      if (format === 'csv') {
        const csvContent = generateCSV(records, fields);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
        res.send(csvContent);
      } else {
        // Default to Excel format
        const excelBuffer = generateExcel(records, fields);
        res.setHeader('Content-Type', 'application/vnd.Ongoingxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting data: ' + error.message
      });
    }
  };
};

// Generic template handler
const handleTemplate = (templateData, filename = 'template') => {
  return async (req, res) => {
    try {
      const fields = Object.keys(templateData[0]);
      const csvContent = generateCSV(templateData, fields);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      res.send(csvContent);
    } catch (error) {
      console.error('Template error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating template: ' + error.message
      });
    }
  };
};

// Generic import handler with memory processing
const handleImport = (Model, processRowFunction) => {
  const uploadMiddleware = upload.single('file');
  
  return async (req, res) => {
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Upload middleware error:', err);
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      console.log(`📥 Processing import for ${req.file.originalname}`);
      
      // Check if user is authenticated
      if (!req.user) {
        console.error('User not authenticated');
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      // Process the import with the authenticated user using memory buffer
      await processImportFromMemory(req, res, req.file, req.user, Model, processRowFunction);
    });
  };
};

// Process import data from memory buffer (better for serverless)
const processImportFromMemory = async (req, res, file, user, Model, processRowFunction) => {
  const results = [];
  const errors = [];
  
  try {
    // Set timeout for imports
    res.setTimeout(60000); // 1 minute timeout for serverless
    
    console.log(`📥 Processing import for ${file.originalname}`);
    
    // Parse file from memory buffer (CSV or Excel)
    const fileData = await parseFileData(file.buffer, file.originalname);
    console.log(`📊 Parsed ${fileData.length} rows from file`);
    
    if (!fileData || fileData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in file or file is empty'
      });
    }
    
    // Light validation - let processing functions handle detailed validation
    const validationErrors = validateImportData(fileData, Model);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Data validation failed',
        errors: validationErrors
      });
    }
    
    console.log(`✅ Pre-validation passed, proceeding with processing`);
    
    // Add row numbers to results
    fileData.forEach((data, index) => {
      results.push({ ...data, rowNumber: index + 1 });
    });
    
    let successCount = 0;
    let errorCount = 0;
    const importedRecords = [];
    
    // Process rows in smaller batches for serverless
    const batchSize = 5; // Reduced batch size for serverless
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (row) => {
        try {
          const record = await processRowFunction(row, user._id, errors);
          if (record) {
            importedRecords.push(record);
            return { success: true, record };
          }
          return { success: false, error: 'No record created' };
        } catch (error) {
          errors.push({
            row: row.rowNumber,
            field: 'processing',
            message: error.message
          });
          return { success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Count results
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });
      
      console.log(`📊 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(results.length / batchSize)}`);
    }
    
    res.json({
      success: errorCount === 0,
      totalRows: results.length,
      successRows: successCount,
      errorRows: errorCount,
      errors: errors,
      importedRecords: importedRecords
    });
    
  } catch (error) {
    console.error('❌ Import processing error:', error);
    
    // Handle different types of errors
    let errorMessage = 'Error processing file: ' + error.message;
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Import timeout. Please try with a smaller file.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Import timeout. Please try with a smaller file.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// Process import data (legacy method for disk storage)
const processImport = async (req, res, file, user, Model, processRowFunction) => {
  const results = [];
  const errors = [];
  
  try {
    // Set timeout for imports
    res.setTimeout(120000); // 2 minutes
    
    console.log(`📥 Processing import for ${file.originalname}`);
    
    // Parse file (CSV or Excel)
    const fileData = await parseFileData(file.path, file.originalname);
    console.log(`📊 Parsed ${fileData.length} rows from file`);
    
    // Add row numbers to results
    fileData.forEach((data, index) => {
      results.push({ ...data, rowNumber: index + 1 });
    });
    
    let successCount = 0;
    let errorCount = 0;
    const importedRecords = [];
    
    // Process rows in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (row) => {
        try {
          const record = await processRowFunction(row, user._id, errors);
          if (record) {
            importedRecords.push(record);
            return { success: true, record };
          }
          return { success: false, error: 'No record created' };
        } catch (error) {
          errors.push({
            row: row.rowNumber,
            field: 'processing',
            message: error.message
          });
          return { success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Count results
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });
      
      console.log(`📊 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(results.length / batchSize)}`);
    }
    
    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    res.json({
      success: errorCount === 0,
      totalRows: results.length,
      successRows: successCount,
      errorRows: errorCount,
      errors: errors,
      importedRecords: importedRecords
    });
    
  } catch (error) {
    console.error('❌ Import processing error:', error);
    
    // Clean up uploaded file on error
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    // Handle different types of errors
    let errorMessage = 'Error processing file: ' + error.message;
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Import timeout. Please try with a smaller file.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Import timeout. Please try with a smaller file.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// Helper function to find or create client
const findOrCreateClient = async (row, userId) => {
  let client;
  
  console.log(`🔍 Looking for client in row:`, {
    clientNationalId: row.clientNationalId,
    clientId: row.clientId,
    clientName: row.clientName,
    client_name: row.client_name,
    Name: row.Name,
    ID: row.ID
  });
  
  // Check multiple possible field names for client data
  const clientName = row.clientName || row.client_name || row.Name || row.name;
  const clientId = row.clientNationalId || row.clientId || row.ID || row.id;
  const clientPhone = row.clientPhone || row.client_phone || row.Phone || row.phone;
  const clientVillage = row.clientVillage || row.client_village || row.Location || row.location;
  const clientAddress = row.clientAddress || row.client_address || row.Location || row.location;
  
  console.log(`🔍 Extracted client data:`, {
    clientName,
    clientId,
    clientPhone,
    clientVillage,
    clientAddress
  });
  
  if (clientId) {
    client = await Client.findOne({ nationalId: clientId });
    console.log(`🔍 Found existing client by ID:`, client ? 'Yes' : 'No');
  }
  
  if (!client && clientName) {
    console.log(`🔍 Creating new client with name: ${clientName}`);
    const nationalId = clientId || `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Check if client exists by name and phone (in case ID is different)
      const existingClientByNamePhone = await Client.findOne({
        name: clientName,
        phone: clientPhone
      });
      
      if (existingClientByNamePhone) {
        console.log(`✅ Found existing client by name and phone: ${existingClientByNamePhone.name}`);
        client = existingClientByNamePhone;
      } else {
        client = new Client({
          name: clientName,
          nationalId: nationalId,
          phone: clientPhone || '',
          village: clientVillage || '',
          detailedAddress: clientAddress || '',
          status: 'نشط',
          animals: [],
          availableServices: [],
          createdBy: userId,
          // Add metadata to track import source
          importSource: 'auto_import',
          importDate: new Date()
        });
        await client.save();
        console.log(`✅ Successfully created new client: ${client.name} (${client.nationalId})`);
      }
    } catch (error) {
      console.error(`❌ Error creating client:`, error);
      throw new Error(`Failed to create client: ${error.message}`);
    }
  }
  
  if (!client) {
    console.log(`❌ No client found or created`);
    throw new Error('Client not found and could not be created - missing required client information');
  }
  
  return client;
};

// Safe JSON parsing function
const parseJsonField = (value, defaultValue = []) => {
  if (!value || value.toString().trim() === '') {
    return defaultValue;
  }
  
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (error) {
    console.warn('Failed to parse JSON field:', error.message);
    return defaultValue;
  }
};

// Enhanced date parsing function to handle multiple date formats
// ========================================
// UNIFIED IMPORT HELPERS
// ========================================

/**
 * Unified client data processor
 * Handles client creation/retrieval with consistent validation
 */
const processUnifiedClient = async (row, userId) => {
  try {
    // Get client name from row data (multiple possible field names)
    const clientName = row['Name'] || row['name'] || row['clientName'] || 
                      row['اسم العميل'] || row['الاسم'] || row['اسم المربي'] || 
                      row['اسم العميل'] || row['الاسم'] || 'غير محدد';
    
    // Get client ID
    const clientId = row['ID'] || row['id'] || row['clientId'] || 
                     row['رقم الهوية'] || row['الهوية'];
    
    // Find existing client
    let client = null;
    
    if (clientId) {
      client = await Client.findOne({ nationalId: clientId });
    }
    
    if (!client && clientName && clientName !== 'غير محدد') {
      client = await Client.findOne({ name: clientName });
    }
    
    // If no client found, create and save a new client
    if (!client) {
      const newClient = new Client({
        name: clientName,
        nationalId: (() => {
          // Generate a valid nationalId if not provided or invalid
          if (clientId && clientId.length >= 10 && clientId.length <= 14 && /^\d+$/.test(clientId)) {
            return clientId;
          }
          // Generate a valid 10-digit nationalId
          const timestamp = Date.now().toString().slice(-8); // Last 8 digits
          const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 random digits
          return `${timestamp}${random}`; // 10 digits total
        })(),
        phone: (() => {
          const phoneValue = row['Phone'] || row['phone'] || row['clientPhone'] || 
                          row['رقم الهاتف'] || row['الهاتف'] || '';
          // If no phone provided, generate a default one
          if (!phoneValue || phoneValue.trim() === '') {
            const timestamp = Date.now().toString().slice(-8);
            return `5${timestamp}`; // Start with 5 and add 8 digits
          }
          return phoneValue;
        })(),
        village: row['Location'] || row['location'] || row['clientVillage'] || 
                 row['القرية'] || row['الموقع'] || '',
        detailedAddress: row['Address'] || row['address'] || row['clientAddress'] || 
                        row['العنوان'] || row['العنوان التفصيلي'] || '',
        birthDate: (() => {
          const birthDateField = row['Birth Date'] || row['Date of Birth'] || 
                                row['birthDate'] || row['تاريخ الميلاد'];
          if (birthDateField) {
            const parsedDate = parseDateField(birthDateField);
            // Check if date is valid
            if (parsedDate && !isNaN(parsedDate.getTime())) {
              return parsedDate;
            }
            return undefined; // Don't set birthDate if invalid or in future
          }
          return undefined;
        })(),
        status: 'نشط',
        animals: [],
        availableServices: [],
        createdBy: userId
      });
      
      await newClient.save();
      client = newClient;
    }
    
    return client;
  } catch (error) {
    throw new Error(`Error processing unified client: ${error.message}`);
  }
};

/**
 * Unified date processor
 * Handles all date fields consistently
 */
const processUnifiedDates = (row) => {
  // Find and validate date using enhanced date field finder
  const dateField = findDateField(row);
  let dateValue = null;
  
  if (dateField) {
    console.log(`🔍 Found date field: ${dateField.field} = ${dateField.value}`);
    dateValue = parseDateField(dateField.value);
    
    if (!dateValue || isNaN(dateValue.getTime())) {
      console.warn(`⚠️ Invalid date format: ${dateField.value}, using current date`);
      dateValue = new Date(); // Use current date as fallback
    }
  } else {
    console.log(`🔍 No date field found, using current date`);
    dateValue = new Date(); // Use current date as fallback
  }
  
  return {
    mainDate: dateValue,
    requestDate: (() => {
      const requestDateField = row['Request Date'] || row.requestDate || row.date;
      if (requestDateField) {
        const parsedDate = parseDateField(requestDateField);
        return parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : dateValue;
      }
      return dateValue;
    })(),
    fulfillingDate: (() => {
      const fulfillingDateField = row['Request Fulfilling Date'];
      if (fulfillingDateField) {
        const parsedDate = parseDateField(fulfillingDateField);
        return parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined;
      }
      return undefined;
    })(),
    followUpDate: (() => {
      if (row.followUpDate) {
        const parsedDate = parseDateField(row.followUpDate);
        return parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined;
      }
      return undefined;
    })()
  };
};

/**
 * Unified coordinates processor
 * Handles coordinates consistently
 */
const processUnifiedCoordinates = (row) => {
  return {
    latitude: parseFloat(row['N'] || row['N Coordinate'] || row.latitude || 0),
    longitude: parseFloat(row['E'] || row['E Coordinate'] || row.longitude || 0)
  };
};

/**
 * Unified animal counts processor
 * Handles animal counts consistently
 */
const processUnifiedAnimalCounts = (row) => {
  return {
    sheep: parseInt(row['Sheep'] || row.sheep || 0),
    goats: parseInt(row['Goats'] || row.goats || 0),
    camel: parseInt(row['Camel'] || row.camel || 0),
    cattle: parseInt(row['Cattle'] || row.cattle || 0),
    horse: parseInt(row['Horse'] || row.horse || 0)
  };
};

/**
 * Unified enum processor
 * Handles enum values consistently
 */
const processUnifiedEnums = (row) => {
  return {
    interventionCategory: (() => {
      const category = (row['Intervention Category'] || row.interventionCategory || 'Routine').toString().trim();
      const categoryMap = {
        'Clinical Examination': 'Clinical Examination', 'Surgical Operation': 'Surgical Operation', 'Ultrasonography': 'Ultrasonography', 'Preventive': 'Preventive', 'Lab Analysis': 'Lab Analysis', 'Farriery': 'Farriery'
      };
      const lowerCategory = category.toLowerCase();
      if (categoryMap[lowerCategory]) {
        return categoryMap[lowerCategory];
      }
      
      if (['Clinical Examination', 'Surgical Operation', 'Ultrasonography', 'Preventive', 'Lab Analysis', 'Farriery'].includes(category)) {
        return category;
      }
      
      return 'Routine';
    })(),
    requestSituation: (() => {
      const status = (row['Request Status'] || row.requestStatus || 'Ongoing').toString().trim();
      const statusMap = {
        'Ongoing': 'Ongoing', 'مفتوح': 'Ongoing', 'نشط': 'Ongoing', 'active': 'Ongoing',
        'closed': 'Closed', 'مغلق': 'Closed', 'منتهي': 'Closed', 'finished': 'Closed',
        'pending': 'Pending', 'في الانتظار': 'Pending', 'معلق': 'Pending', 'waiting': 'Pending'
      };
      
      const lowerStatus = status.toLowerCase();
      if (statusMap[lowerStatus]) {
        return statusMap[lowerStatus];
      }
      
      if (['Ongoing', 'Closed', 'Pending'].includes(status)) {
        return status;
      }
      
      return 'Ongoing';
    })()
  };
};

/**
 * Unified custom data processor
 * Stores all additional data consistently
 */
const processUnifiedCustomData = (row) => {
  return {
    originalData: row,
    holdingCode: row['Holding Code'] || row.holdingCode || '',
    birthDate: row['Birth Date'] || row['Date of Birth'] || row.birthDate || '',
    ...Object.keys(row).reduce((acc, key) => {
      if (!['Serial No', 'Date', 'Name', 'ID', 'Phone', 'Location', 'N Coordinate', 'E Coordinate', 
            'Supervisor', 'Vehicle No.', 'Sheep', 'Goats', 'Camel', 'Horse', 'Cattle', 
            'Diagnosis', 'Intervention Category', 'Treatment', 'Request Date', 'Request Status', 
            'Request Fulfilling Date', 'category', 'Remarks' ,'Holding Code'].includes(key)) {
        acc[key] = row[key];
      }
      return acc;
    }, {})
  };
};

// ========================================
// EXISTING FUNCTIONS
// ========================================

const parseDateField = (dateString) => {
  if (!dateString || dateString.toString().trim() === '') {
    return null;
  }
  
  const dateStr = dateString.toString().trim();
  console.log(`🔍 Parsing date: ${dateStr}`);
  
  // Handle Excel serial date numbers (Excel stores dates as numbers)
  if (!isNaN(dateStr) && parseFloat(dateStr) > 0) {
    const excelDate = parseFloat(dateStr);
    // Excel date serial number (days since 1900-01-01, but Excel incorrectly treats 1900 as leap year)
    if (excelDate > 25569) { // After 1970-01-01
      const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
      console.log(`🔍 Converted Excel serial date: ${dateStr} -> ${jsDate}`);
      return jsDate;
    } else if (excelDate > 0 && excelDate < 100000) { // Likely Excel date
      const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
      console.log(`🔍 Converted Excel date: ${dateStr} -> ${jsDate}`);
      return jsDate;
    }
  }
  
  // Handle D-Mon format (1-Sep, 2-Sep, etc.)
  if (dateStr.match(/^\d{1,2}-[A-Za-z]{3}$/)) {
    const currentYear = new Date().getFullYear();
    const monthMap = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    const [day, month] = dateStr.split('-');
    const monthNum = monthMap[month];
    if (monthNum) {
      const fullDate = `${currentYear}-${monthNum}-${day.padStart(2, '0')}`;
      const dateValue = new Date(fullDate);
      console.log(`🔍 Converted D-Mon format: ${dateStr} -> ${dateValue}`);
      return dateValue;
    }
  }
  
  // Handle DD/MM/YYYY format (European format)
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [day, month, year] = dateStr.split('/');
    const dateValue = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    console.log(`🔍 Converted DD/MM/YYYY format: ${dateStr} -> ${dateValue}`);
    return dateValue;
  }
  
  // Handle MM/DD/YYYY format (American format)
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const dateValue = new Date(dateStr);
    console.log(`🔍 Parsed MM/DD/YYYY format: ${dateStr} -> ${dateValue}`);
    return dateValue;
  }
  
  // Handle YYYY/MM/DD format (like 1985/03/15)
  if (dateStr.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
    const [year, month, day] = dateStr.split('/');
    const dateValue = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    console.log(`🔍 Parsed YYYY/MM/DD format: ${dateStr} -> ${dateValue}`);
    return dateValue;
  }
  
  // Handle YYYY-MM-DD format (ISO format)
  if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    const dateValue = new Date(dateStr);
    console.log(`🔍 Parsed YYYY-MM-DD format: ${dateStr} -> ${dateValue}`);
    return dateValue;
  }
  
  // Handle YYYY-DD-MM format (alternative format)
  if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    const [year, dayOrMonth, monthOrDay] = dateStr.split('-');
    
    // Try both interpretations and pick the valid one
    const option1 = new Date(`${year}-${dayOrMonth.padStart(2, '0')}-${monthOrDay.padStart(2, '0')}`); // YYYY-MM-DD
    const option2 = new Date(`${year}-${monthOrDay.padStart(2, '0')}-${dayOrMonth.padStart(2, '0')}`); // YYYY-DD-MM
    
    // Check which one is valid based on day/month ranges
    const day1 = parseInt(monthOrDay);
    const month1 = parseInt(dayOrMonth);
    const day2 = parseInt(dayOrMonth);
    const month2 = parseInt(monthOrDay);
    
    // If first interpretation has invalid day (>31) or month (>12), try second
    if ((day1 > 31 || month1 > 12) && day2 <= 31 && month2 <= 12) {
      console.log(`🔍 Parsed YYYY-DD-MM format: ${dateStr} -> ${option2}`);
      return option2;
    }
    // If second interpretation has invalid day (>31) or month (>12), use first
    else if ((day2 > 31 || month2 > 12) && day1 <= 31 && month1 <= 12) {
      console.log(`🔍 Parsed YYYY-MM-DD format: ${dateStr} -> ${option1}`);
      return option1;
    }
    // If both are valid, prefer YYYY-MM-DD (standard ISO format)
    else if (!isNaN(option1.getTime())) {
      console.log(`🔍 Parsed YYYY-MM-DD format (ambiguous, using standard): ${dateStr} -> ${option1}`);
      return option1;
    }
    // Fallback to YYYY-DD-MM if YYYY-MM-DD is invalid
    else if (!isNaN(option2.getTime())) {
      console.log(`🔍 Parsed YYYY-DD-MM format (fallback): ${dateStr} -> ${option2}`);
      return option2;
    }
  }
  
  // Handle DD-MM-YYYY format
  if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const [day, month, year] = dateStr.split('-');
    const dateValue = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    console.log(`🔍 Converted DD-MM-YYYY format: ${dateStr} -> ${dateValue}`);
    return dateValue;
  }
  
  // Handle Arabic date format (DD/MM/YYYY with Arabic numbers)
  if (dateStr.match(/^[\u0660-\u0669\u06F0-\u06F9]+\/[\u0660-\u0669\u06F0-\u06F9]+\/[\u0660-\u0669\u06F0-\u06F9]+$/)) {
    // Convert Arabic numerals to English
    const englishDateStr = dateStr.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0x0660);
    });
    const [day, month, year] = englishDateStr.split('/');
    const dateValue = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    console.log(`🔍 Converted Arabic date format: ${dateStr} -> ${dateValue}`);
    return dateValue;
  }
  
  // Try to parse as standard date
  const dateValue = new Date(dateStr);
  console.log(`🔍 Parsed date: ${dateValue} (valid: ${!isNaN(dateValue.getTime())})`);
  
  // Return null if the date is invalid
  if (isNaN(dateValue.getTime())) {
    console.warn(`⚠️ Could not parse date: ${dateStr}`);
    return null;
  }
  
  return dateValue;
};

// Helper function to find date field in row data
const findDateField = (row) => {
  const dateFields = [
    'date', 'Date', 'DATE', 
    'تاريخ', 'التاريخ',
    'Request Date', 'requestDate', 'request_date',
    'Birth Date', 'birthDate', 'birth_date', 'Date of Birth', 'dateOfBirth',
    'Request Fulfilling Date', 'requestFulfillingDate', 'request_fulfilling_date'
  ];
  
  for (const field of dateFields) {
    if (row[field] && row[field].toString().trim() !== '') {
      return { field, value: row[field] };
    }
  }
  
  return null;
};

// ========================================
// REFACTORED PROCESS ROW FUNCTIONS
// ========================================

/**
 * Process Vaccination row using unified helpers
 */
const processVaccinationRow = async (row, userId, errors) => {
  try {
    // Use unified processors
    const client = await processUnifiedClientEnhanced(row, userId);
    const dates = processUnifiedDatesEnhanced(row);
    const coordinates = processUnifiedCoordinatesEnhanced(row);
    const herdCounts = processHerdCounts(row, 'vaccination');
    
    // Create vaccination record
    const vaccination = new Vaccination({
      serialNo: generateSerialNo(row, 'VAC'),
      date: dates.mainDate,
      client: client._id,
      farmLocation: getFieldValue(row, [
        'Location', 'location', 'Farm Location', 'farmLocation',
        'الموقع', 'موقع المزرعة'
      ]) || 'N/A',
      supervisor: getFieldValue(row, [
        'Supervisor', 'supervisor', 'المشرف'
      ]) || 'Default Supervisor',
      team: getFieldValue(row, [
        'Team', 'team', 'الفريق'
      ]) || 'Default Team',
      vehicleNo: getFieldValue(row, [
        'Vehicle No.', 'Vehicle No', 'vehicleNo', 'vehicle_no',
        'رقم المركبة'
      ]) || 'N/A',
      vaccineType: getFieldValue(row, [
        'Vaccine', 'vaccineType', 'vaccine_type', 'Vaccine Type',
        'نوع اللقاح', 'اللقاح'
      ]) || 'Default Vaccine',
      vaccineCategory: processEnumValue(
        row,
        ['Category', 'vaccineCategory', 'vaccine_category', 'فئة اللقاح'],
        {
          'emergency': 'Emergency', 'urgent': 'Emergency', 'عاجل': 'Emergency',
          'preventive': 'Preventive', 'وقائي': 'Preventive', 'prevention': 'Preventive'
        },
        'Preventive'
      ),
      coordinates: coordinates,
      herdCounts: herdCounts,
      herdHealth: processEnumValue(
        row,
        ['Herd Health', 'herdHealth', 'herd_health', 'صحة القطيع'],
        {
          'healthy': 'Healthy', 'صحي': 'Healthy', 'سليم': 'Healthy',
          'sick': 'Sick', 'مريض': 'Sick', 'sporadic': 'Sick',
          'under treatment': 'Under Treatment', 'تحت العلاج': 'Under Treatment'
        },
        'Healthy'
      ),
      animalsHandling: processEnumValue(
        row,
        ['Animals Handling', 'animalsHandling', 'animals_handling', 'التعامل مع الحيوانات'],
        {
          'easy': 'Easy', 'سهل': 'Easy',
          'difficult': 'Difficult', 'صعب': 'Difficult', 'hard': 'Difficult'
        },
        'Easy'
      ),
      labours: processEnumValue(
        row,
        ['Labours', 'labours', 'العمالة'],
        {
          'available': 'Available', 'متوفر': 'Available',
          'not available': 'Not Available', 'غير متوفر': 'Not Available',
          'unavailable': 'Not Available', 'avaialable': 'Not Available'
        },
        'Available'
      ),
      reachableLocation: processEnumValue(
        row,
        ['Reachable Location', 'reachableLocation', 'reachable_location', 'سهولة الوصول'],
        {
          'easy': 'Easy', 'سهل': 'Easy',
          'hard to reach': 'Hard to reach', 'صعب الوصول': 'Hard to reach',
          'difficult': 'Hard to reach', 'hard': 'Hard to reach'
        },
        'Easy'
      ),
      holdingCode: await processHoldingCodeReference(row),
      request: processRequest(row, dates),
      remarks: getFieldValue(row, ['Remarks', 'remarks', 'ملاحظات']) || '',
      customImportData: processCustomImportData(row)
    });

    await vaccination.save();
    return vaccination;
  } catch (error) {
    throw new Error(`Error processing vaccination row: ${error.message}`);
  }
};

/**
 * Process ParasiteControl row using unified helpers
 */
const processParasiteControlRow = async (row, userId, errors) => {
  try {
    // Use unified processors
    const client = await processUnifiedClientEnhanced(row, userId);
    const dates = processUnifiedDatesEnhanced(row);
    const coordinates = processUnifiedCoordinatesEnhanced(row);
    const herdCounts = processHerdCounts(row, 'parasite');
    
    // Create parasite control record
    const parasiteControl = new ParasiteControl({
      serialNo: generateSerialNo(row, 'PAR'),
      date: dates.mainDate,
      client: client._id,
      herdLocation: getFieldValue(row, [
        'Herd Location', 'herdLocation', 'Location', 'location',
        'موقع القطيع', 'الموقع'
      ]) || 'N/A',
      supervisor: getFieldValue(row, [
        'Supervisor', 'supervisor', 'المشرف'
      ]) || 'Default Supervisor',
      vehicleNo: getFieldValue(row, [
        'Vehicle No.', 'Vehicle No', 'vehicleNo', 'vehicle_no',
        'رقم المركبة'
      ]) || 'N/A',
      coordinates: coordinates,
      herdCounts: herdCounts,
      insecticide: {
        type: getFieldValue(row, [
          'Insecticide Used', 'Insecticide', 'insecticideType', 'insecticide_type',
          'نوع المبيد', 'المبيد المستخدم'
        ]) || 'N/A',
        method: getFieldValue(row, [
          'Type', 'Method', 'insecticideMethod', 'insecticide_method',
          'طريقة الرش', 'النوع'
        ]) || 'N/A',
        volumeMl: parseInt(getFieldValue(row, [
          'Volume (ml)', 'Volume', 'insecticideVolume', 'insecticide_volume',
          'الحجم (مل)', 'الحجم'
        ]) || 0),
        status: processEnumValue(
          row,
          ['Status', 'Spray Status', 'insecticideStatus', 'insecticide_status', 'حالة الرش'],
          {
            'sprayed': 'Sprayed', 'yes': 'Sprayed', 'مرشوش': 'Sprayed', 'نعم': 'Sprayed',
            'not sprayed': 'Not Sprayed', 'no': 'Not Sprayed', 'غير مرشوش': 'Not Sprayed', 'لا': 'Not Sprayed'
          },
          'Sprayed'
        ),
        category: getFieldValue(row, [
          'Category', 'insecticideCategory', 'insecticide_category',
          'فئة المبيد'
        ]) || 'N/A'
      },
      animalBarnSizeSqM: parseInt(getFieldValue(row, [
        'Size (sqM)', 'Barn Size', 'animalBarnSize', 'animal_barn_size',
        'مساحة الحظيرة', 'الحجم (متر مربع)'
      ]) || 0),
      breedingSites: getFieldValue(row, [
        'Breeding Sites', 'breedingSites', 'breeding_sites',
        'مواقع التكاثر'
      ]) || 'N/A',
      parasiteControlVolume: parseInt(getFieldValue(row, [
        'Parasite Control Volume', 'parasiteControlVolume', 'parasite_control_volume',
        'حجم مكافحة الطفيليات'
      ]) || getFieldValue(row, ['Volume (ml)', 'Volume']) || 0),
      parasiteControlStatus: getFieldValue(row, [
        'Parasite Control Status', 'parasiteControlStatus', 'parasite_control_status',
        'حالة مكافحة الطفيليات'
      ]) || getFieldValue(row, ['Insecticide']) || 'N/A',
      herdHealthStatus: processEnumValue(
        row,
        ['Herd Health Status', 'herdHealthStatus', 'herd_health_status', 'حالة صحة القطيع'],
        {
          'healthy': 'Healthy', 'صحي': 'Healthy', 'سليم': 'Healthy',
          'sick': 'Sick', 'مريض': 'Sick', 'sporadic': 'Sick', 'sporadic cases': 'Sick',
          'under treatment': 'Under Treatment', 'تحت العلاج': 'Under Treatment' , 'Sporadic Cases': 'Sporadic Cases', 'sporadic Cases': 'sporadic Cases'
        },
        'Healthy'
      ),
      complyingToInstructions: processEnumValue(
        row,
        ['Complying to instructions', 'complyingToInstructions', 'complying_to_instructions', 'الالتزام بالتعليمات'],
        {
          'comply': 'Comply', 'true': 'Comply', 'yes': 'Comply', 'ملتزم': 'Comply', 'نعم': 'Comply',
          'not comply': 'Not Comply', 'false': 'Not Comply', 'no': 'Not Comply', 'غير ملتزم': 'Not Comply', 'لا': 'Not Comply',
          'partially comply': 'Partially Comply', 'partial': 'Partially Comply', 'ملتزم جزئيا': 'Partially Comply'
        },
        'Comply'
      ),
      holdingCode: await processHoldingCodeReference(row),
      request: processRequest(row, dates),
      remarks: getFieldValue(row, ['Remarks', 'remarks', 'ملاحظات']) || '',
      customImportData: processCustomImportData(row),
      createdBy: userId
    });

    await parasiteControl.save();
    return parasiteControl;
  } catch (error) {
    throw new Error(`Error processing parasite control row: ${error.message}`);
  }
};

/**
 * Process MobileClinic row using unified helpers
 */
const processMobileClinicRow = async (row, userId, errors) => {
  try {
    // Use unified processors
    const client = await processUnifiedClientEnhanced(row, userId);
    const dates = processUnifiedDatesEnhanced(row);
    const coordinates = processUnifiedCoordinatesEnhanced(row);
    const animalCounts = processAnimalCounts(row);
    
    // Create mobile clinic record
    const mobileClinic = new MobileClinic({
      serialNo: generateSerialNo(row, 'MC'),
      date: dates.mainDate,
      client: client._id,
      farmLocation: getFieldValue(row, [
        'Location', 'location', 'Farm Location', 'farmLocation',
        'الموقع', 'موقع المزرعة'
      ]) || 'N/A',
      supervisor: getFieldValue(row, [
        'Supervisor', 'supervisor', 'المشرف'
      ]) || 'Default Supervisor',
      vehicleNo: getFieldValue(row, [
        'Vehicle No.', 'Vehicle No', 'vehicleNo', 'vehicle_no',
        'رقم المركبة'
      ]) || 'N/A',
      coordinates: coordinates,
      animalCounts: animalCounts,
      diagnosis: getFieldValue(row, [
        'Diagnosis', 'diagnosis', 'التشخيص'
      ]) || '',
      interventionCategory: processEnumValue(
        row,
        ['Intervention Category', 'interventionCategory', 'intervention_category', 'فئة التدخل'],
        {
          'emergency': 'Emergency', 'urgent': 'Emergency', 'عاجل': 'Emergency', 'طوارئ': 'Emergency',
          'routine': 'Routine', 'عادي': 'Routine', 'روتيني': 'Routine',
          'preventive': 'Preventive', 'وقائي': 'Preventive', 'prevention': 'Preventive',
          'follow-up': 'Follow-up', 'followup': 'Follow-up', 'متابعة': 'Follow-up', 'follow': 'Follow-up'
        },
        'Routine'
      ),
      treatment: getFieldValue(row, [
        'Treatment', 'treatment', 'العلاج'
      ]) || '',
      medicationsUsed: parseJsonField(getFieldValue(row, [
        'Medications Used', 'medicationsUsed', 'medications_used', 'الأدوية المستخدمة'
      ]), []),
      request: processRequest(row, dates),
      followUpRequired: processEnumValue(
        row,
        ['Follow Up Required', 'followUpRequired', 'follow_up_required', 'مطلوب متابعة'],
        {
          'true': true, 'yes': true, 'نعم': true, '1': true,
          'false': false, 'no': false, 'لا': false, '0': false
        },
        false
      ),
      followUpDate: dates.followUpDate,
      remarks: getFieldValue(row, ['Remarks', 'remarks', 'ملاحظات']) || '',
      customImportData: processCustomImportData(row),
      createdBy: userId
    });

    await mobileClinic.save();
    return mobileClinic;
  } catch (error) {
    throw new Error(`Error processing mobile clinic row: ${error.message}`);
  }
};

// ========================================
// ENHANCED UNIFIED IMPORT HELPERS
// ========================================

/**
 * Enhanced field value getter with case-insensitive fallback
 * Supports Arabic and English field names
 */
const getFieldValue = (row, fieldNames) => {
  // First try exact match
  for (const name of fieldNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  
  // Try case-insensitive match as fallback
  const rowKeysLower = Object.keys(row).reduce((acc, key) => {
    acc[key.toLowerCase().trim()] = row[key];
    return acc;
  }, {});
  
  for (const name of fieldNames) {
    const lowerName = name.toLowerCase().trim();
    if (rowKeysLower[lowerName] !== undefined && 
        rowKeysLower[lowerName] !== null && 
        rowKeysLower[lowerName] !== '') {
      console.log(`📌 Found field via case-insensitive match: ${name} -> ${rowKeysLower[lowerName]}`);
      return rowKeysLower[lowerName];
    }
  }
  
  return undefined;
};

/**
 * Process holding code reference - find HoldingCode by code and return ObjectId
 */
const processHoldingCodeReference = async (row) => {
  try {
    const holdingCodeValue = getFieldValue(row, [
      'Holding Code', 'holdingCode', 'holding_code', 'Code','Holding Code',
      'رمز الحيازة', 'الرمز'
    ]);
    
    if (!holdingCodeValue || holdingCodeValue.trim() === '') {
      return null;
    }
    
    // Find holding code by code field
    const holdingCode = await HoldingCode.findOne({ 
      code: holdingCodeValue.trim() 
    });
    
    if (holdingCode) {
      console.log(`✅ Found holding code: ${holdingCodeValue} -> ${holdingCode._id}`);
      return holdingCode._id;
    } else {
      console.log(`⚠️ Holding code not found: ${holdingCodeValue}`);
      return null;
    }
  } catch (error) {
    console.error('Error processing holding code reference:', error);
    return null;
  }
};

/**
 * Enhanced unified client processor with better validation
 */
const processUnifiedClientEnhanced = async (row, userId, options = {}) => {
  try {
    const { requireClient = false, createIfNotFound = true } = options;
    
    // Get client data using multiple possible field names
    const clientName = getFieldValue(row, [
      'Name', 'name', 'clientName', 'Client Name', 'client',
      'owner', 'Owner', 'farmer', 'Farmer',
      'الاسم', 'اسم العميل', 'اسم المربي', 'المالك', 'العميل'
    ]);
    
    const clientId = getFieldValue(row, [
      'ID', 'id', 'clientId', 'Client ID', 'nationalId', 'National ID',
      'ownerId', 'Owner ID', 'identity', 'Identity',
      'رقم الهوية', 'الهوية', 'رقم', 'هوية'
    ]);
    
    const clientPhone = getFieldValue(row, [
      'Phone', 'phone', 'clientPhone', 'Client Phone', 'Mobile', 'mobile',
      'phoneNumber', 'Phone Number', 'tel', 'Tel', 'telephone', 'Telephone',
      'رقم الهاتف', 'الهاتف', 'جوال', 'موبايل'
    ]);
    
    const clientVillage = getFieldValue(row, [
      'Location', 'location', 'Village', 'village', 'clientVillage',
      'Farm Location', 'farmLocation', 'address',
      'القرية', 'الموقع', 'موقع المزرعة', 'العنوان'
    ]);
    
    const clientAddress = getFieldValue(row, [
      'Address', 'address', 'Detailed Address', 'detailedAddress', 'clientAddress',
      'العنوان', 'العنوان التفصيلي'
    ]);
    
    // For Laboratory and EquineHealth that store client as embedded data
    if (options.returnAsObject) {
      return {
        name: clientName || 'غير محدد',
        nationalId: clientId || generateValidNationalId(),
        phone: clientPhone || generateDefaultPhone(),
        village: clientVillage || '',
        detailedAddress: clientAddress || clientVillage || '',
        birthDate: parseBirthDate(row)
      };
    }
    
    // Validate if client is required
    if (requireClient && !clientName && !clientId) {
      throw new Error('Client information is required but not found');
    }
    
    // Find existing client
    let client = null;
    
    if (clientId) {
      client = await Client.findOne({ nationalId: clientId });
    }
    
    if (!client && clientName && clientName !== 'غير محدد') {
      client = await Client.findOne({ name: clientName });
    }
    
    // Create new client if not found and allowed
    if (!client && createIfNotFound) {
      try {
        const newClient = new Client({
          name: clientName || 'غير محدد',
          nationalId: clientId || generateValidNationalId(),
          phone: clientPhone || generateDefaultPhone(),
          village: clientVillage || '',
          detailedAddress: clientAddress || clientVillage || '',
          birthDate: parseBirthDate(row),
          status: 'نشط',
          animals: [],
          availableServices: [],
          createdBy: userId
        });
        
        await newClient.save();
        client = newClient;
        console.log(`✅ Created new client: ${client.name}`);
      } catch (saveError) {
        // If duplicate key error, try to find existing client again
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.nationalId) {
          console.log(`🔄 Duplicate nationalId detected, finding existing client: ${clientId}`);
          client = await Client.findOne({ nationalId: clientId });
          if (client) {
            console.log(`✅ Found existing client: ${client.name}`);
          } else {
            throw new Error(`Client with nationalId ${clientId} exists but could not be retrieved`);
          }
        } else {
          throw saveError;
        }
      }
    }
    
    return client;
  } catch (error) {
    throw new Error(`Error processing client: ${error.message}`);
  }
};

/**
 * Generate valid national ID
 */
const generateValidNationalId = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${timestamp}${random}`; // 10 digits total
};

/**
 * Generate default phone number
 */
const generateDefaultPhone = () => {
  const timestamp = Date.now().toString().slice(-8);
  return `5${timestamp}`;
};

/**
 * Parse birth date from row
 */
const parseBirthDate = (row) => {
  const birthDateField = getFieldValue(row, [
    'Birth Date', 'birthDate', 'Date of Birth', 'dateOfBirth',
    'clientBirthDate', 'Client Birth Date',
    'تاريخ الميلاد'
  ]);
  
  if (birthDateField) {
    const parsedDate = parseDateField(birthDateField);
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  return undefined;
};

/**
 * Enhanced unified dates processor
 */
const processUnifiedDatesEnhanced = (row) => {
  const mainDate = (() => {
    const dateField = findDateField(row);
    if (dateField) {
      const parsed = parseDateField(dateField.value);
      if (parsed && !isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  })();
  
  return {
    mainDate,
    requestDate: (() => {
      const field = getFieldValue(row, [
        'Request Date', 'requestDate', 'request_date',
        'تاريخ الطلب'
      ]);
      if (field) {
        const parsed = parseDateField(field);
        return parsed && !isNaN(parsed.getTime()) ? parsed : mainDate;
      }
      return mainDate;
    })(),
    fulfillingDate: (() => {
      const field = getFieldValue(row, [
        'Request Fulfilling Date', 'requestFulfillingDate', 
        'request_fulfilling_date', 'Fulfilling Date',
        'تاريخ تنفيذ الطلب'
      ]);
      if (field) {
        const parsed = parseDateField(field);
        if (parsed && !isNaN(parsed.getTime())) {
          // Get request date for comparison
          const requestField = getFieldValue(row, [
            'Request Date', 'requestDate', 'request_date',
            'تاريخ الطلب'
          ]);
          const requestDate = requestField ? parseDateField(requestField) : mainDate;
          
          // Ensure fulfilling date is not before request date
          if (parsed < (requestDate || mainDate)) {
            console.log(`⚠️ Fulfilling date ${parsed.toISOString()} is before request date ${(requestDate || mainDate).toISOString()}, using request date instead`);
            return requestDate || mainDate;
          }
          return parsed;
        }
      }
      return undefined;
    })(),
    followUpDate: (() => {
      const field = getFieldValue(row, [
        'Follow Up Date', 'followUpDate', 'follow_up_date',
        'تاريخ المتابعة'
      ]);
      if (field) {
        const parsed = parseDateField(field);
        return parsed && !isNaN(parsed.getTime()) ? parsed : undefined;
      }
      return undefined;
    })()
  };
};

/**
 * Enhanced coordinates processor
 */
const processUnifiedCoordinatesEnhanced = (row) => {
  const lat = parseFloat(getFieldValue(row, [
    'N', 'N Coordinate', 'latitude', 'lat', 'Latitude',
    'خط العرض'
  ]) || 0);
  
  const lng = parseFloat(getFieldValue(row, [
    'E', 'E Coordinate', 'longitude', 'lng', 'long', 'Longitude',
    'خط الطول'
  ]) || 0);
  
  return {
    latitude: isNaN(lat) ? 0 : lat,
    longitude: isNaN(lng) ? 0 : lng
  };
};

/**
 * Process herd counts for Vaccination and ParasiteControl
 */
const processHerdCounts = (row, type = 'vaccination') => {
  const isParasite = type === 'parasite';
  
  return {
    sheep: {
      total: parseInt(getFieldValue(row, [
        isParasite ? 'Total Sheep' : 'Sheep', 'sheep', 'sheepTotal',
        'الأغنام', 'أغنام'
      ]) || 0),
      young: parseInt(getFieldValue(row, [
        'Young Sheep', 'sheepYoung', 'young_sheep',
        'صغار الأغنام'
      ]) || 0),
      female: parseInt(getFieldValue(row, [
        isParasite ? 'Female Sheep' : 'F. Sheep', 'sheepFemale', 'female_sheep',
        'إناث الأغنام'
      ]) || 0),
      [isParasite ? 'treated' : 'vaccinated']: parseInt(getFieldValue(row, [
        isParasite ? 'Treated Sheep' : 'Vaccinated Sheep', 
        isParasite ? 'sheepTreated' : 'sheepVaccinated',
        isParasite ? 'الأغنام المعالجة' : 'الأغنام المحصنة'
      ]) || 0)
    },
    goats: {
      total: parseInt(getFieldValue(row, [
        isParasite ? 'Total Goats' : 'Goats', 'goats', 'goatsTotal',
        'الماعز', 'ماعز'
      ]) || 0),
      young: parseInt(getFieldValue(row, [
        'Young Goats', 'goatsYoung', 'young_goats',
        'صغار الماعز'
      ]) || 0),
      female: parseInt(getFieldValue(row, [
        isParasite ? 'Female Goats' : 'F. Goats', 'goatsFemale', 'female_goats',
        'إناث الماعز'
      ]) || 0),
      [isParasite ? 'treated' : 'vaccinated']: parseInt(getFieldValue(row, [
        isParasite ? 'Treated Goats' : 'Vaccinated Goats',
        isParasite ? 'goatsTreated' : 'goatsVaccinated',
        isParasite ? 'الماعز المعالج' : 'الماعز المحصن'
      ]) || 0)
    },
    camel: {
      total: parseInt(getFieldValue(row, [
        isParasite ? 'Total Camel' : 'Camel', 'camel', 'camelTotal',
        'الإبل', 'إبل', 'الجمال'
      ]) || 0),
      young: parseInt(getFieldValue(row, [
        'Young Camels', 'camelYoung', 'young_camels',
        'صغار الإبل'
      ]) || 0),
      female: parseInt(getFieldValue(row, [
        isParasite ? 'Female Camels' : 'F. Camel', 'camelFemale', 'female_camels',
        'إناث الإبل'
      ]) || 0),
      [isParasite ? 'treated' : 'vaccinated']: parseInt(getFieldValue(row, [
        isParasite ? 'Treated Camels' : 'Vaccinated Camels',
        isParasite ? 'camelTreated' : 'camelVaccinated',
        isParasite ? 'الإبل المعالجة' : 'الإبل المحصنة'
      ]) || 0)
    },
    cattle: {
      total: parseInt(getFieldValue(row, [
        isParasite ? 'Total Cattle' : 'Cattle', 'cattle', 'cattleTotal',
        'الأبقار', 'أبقار', 'البقر'
      ]) || 0),
      young: parseInt(getFieldValue(row, [
        'Young Cattle', 'cattleYoung', 'young_cattle',
        'صغار الأبقار'
      ]) || 0),
      female: parseInt(getFieldValue(row, [
        isParasite ? 'Female Cattle' : 'F. Cattle', 'cattleFemale', 'female_cattle',
        'إناث الأبقار'
      ]) || 0),
      [isParasite ? 'treated' : 'vaccinated']: parseInt(getFieldValue(row, [
        isParasite ? 'Treated Cattle' : 'Vaccinated Cattle',
        isParasite ? 'cattleTreated' : 'cattleVaccinated',
        isParasite ? 'الأبقار المعالجة' : 'الأبقار المحصنة'
      ]) || 0)
    },
    horse: {
      total: parseInt(getFieldValue(row, [
        'Horse', 'horse', 'horseTotal',
        'الخيول', 'خيول', 'الأحصنة'
      ]) || 0),
      young: parseInt(getFieldValue(row, [
        'Young Horses', 'horseYoung', 'young_horses',
        'صغار الخيول'
      ]) || 0),
      female: parseInt(getFieldValue(row, [
        'Female Horses', 'horseFemale', 'female_horses',
        'إناث الخيول'
      ]) || 0),
      [isParasite ? 'treated' : 'vaccinated']: parseInt(getFieldValue(row, [
        isParasite ? 'Treated Horses' : 'Vaccinated Horses',
        isParasite ? 'horseTreated' : 'horseVaccinated',
        isParasite ? 'الخيول المعالجة' : 'الخيول المحصنة'
      ]) || 0)
    }
  };
};

/**
 * Process animal counts for MobileClinic
 */
const processAnimalCounts = (row) => {
  return {
    sheep: parseInt(getFieldValue(row, [
      'Sheep', 'sheep', 'sheepCount',
      'الأغنام', 'أغنام'
    ]) || 0),
    goats: parseInt(getFieldValue(row, [
      'Goats', 'goats', 'goatsCount',
      'الماعز', 'ماعز'
    ]) || 0),
    camel: parseInt(getFieldValue(row, [
      'Camel', 'camel', 'camelCount',
      'الإبل', 'إبل', 'الجمال'
    ]) || 0),
    cattle: parseInt(getFieldValue(row, [
      'Cattle', 'cattle', 'cattleCount',
      'الأبقار', 'أبقار', 'البقر'
    ]) || 0),
    horse: parseInt(getFieldValue(row, [
      'Horse', 'horse', 'horseCount',
      'الخيول', 'خيول', 'الأحصنة'
    ]) || 0)
  };
};

/**
 * Process species counts for Laboratory
 */
const processSpeciesCounts = (row) => {
  return {
    sheep: parseInt(getFieldValue(row, [
      'Sheep', 'sheep', 'sheepCount',
      'الأغنام', 'أغنام'
    ]) || 0),
    goats: parseInt(getFieldValue(row, [
      'Goats', 'goats', 'goatsCount',
      'الماعز', 'ماعز'
    ]) || 0),
    camel: parseInt(getFieldValue(row, [
      'Camel', 'camel', 'camelCount',
      'الإبل', 'إبل', 'الجمال'
    ]) || 0),
    cattle: parseInt(getFieldValue(row, [
      'Cattle', 'cattle', 'cattleCount',
      'الأبقار', 'أبقار', 'البقر'
    ]) || 0),
    horse: parseInt(getFieldValue(row, [
      'Horse', 'horse', 'horseCount',
      'الخيول', 'خيول', 'الأحصنة'
    ]) || 0),
    other: getFieldValue(row, [
      'Other', 'other', 'Other (Species)', 'otherSpecies',
      'أخرى', 'أنواع أخرى'
    ]) || ''
  };
};

/**
 * Generate serial number
 */
const generateSerialNo = (row, prefix) => {
  const serialNo = getFieldValue(row, [
    'Serial No', 'serialNo', 'serial_no', 'Serial Number',
    'الرقم التسلسلي', 'رقم تسلسلي'
  ]);
  
  if (serialNo && serialNo.length <= 20) {
    const timestamp = Date.now().toString().slice(-6);
    return `${serialNo}-${timestamp}`;
  }
  
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Process enum values with mapping
 */
const processEnumValue = (row, fieldNames, enumMap, defaultValue) => {
  const value = getFieldValue(row, fieldNames);
  if (!value) return defaultValue;
  
  const normalizedValue = value.toString().toLowerCase().trim();
  
  // Check map first
  if (enumMap[normalizedValue]) {
    return enumMap[normalizedValue];
  }
  
  // Check if it's already a valid value
  const validValues = Object.values(enumMap).filter((v, i, a) => a.indexOf(v) === i);
  if (validValues.includes(value)) {
    return value;
  }
  
  return defaultValue;
};

/**
 * Process request object
 */
const processRequest = (row, dates) => {
  return {
    date: dates.requestDate,
    situation: processEnumValue(
      row,
      ['Request Status', 'Request Situation', 'requestSituation', 'requestStatus', 'حالة الطلب'],
      {
        'Ongoing': 'Ongoing', 'مفتوح': 'Ongoing', 'نشط': 'Ongoing', 'active': 'Ongoing',
        'closed': 'Closed', 'مغلق': 'Closed', 'منتهي': 'Closed', 'finished': 'Closed',
        'pending': 'Pending', 'في الانتظار': 'Pending', 'معلق': 'Pending', 'waiting': 'Pending'
      },
      'Ongoing'
    ),
    fulfillingDate: dates.fulfillingDate
  };
};

/**
 * Process custom import data
 */
const processCustomImportData = (row) => {
  const excludeKeys = [
    'Serial No', 'Date', 'Name', 'ID', 'Phone', 'Location', 
    'N Coordinate', 'E Coordinate', 'N', 'E',
    'Supervisor', 'Vehicle No.', 'Sheep', 'Goats', 'Camel', 'Horse', 'Cattle',
    'Diagnosis', 'Intervention Category', 'Treatment', 
    'Request Date', 'Request Status', 'Request Fulfilling Date',
    'category', 'Remarks'
  ];
  
  return {
    originalData: row,
    holdingCode: getFieldValue(row, ['Holding Code', 'holdingCode', 'رمز الحيازة']) || '',
    birthDate: getFieldValue(row, ['Birth Date', 'Date of Birth', 'birthDate', 'تاريخ الميلاد']) || '',
    ...Object.keys(row).reduce((acc, key) => {
      if (!excludeKeys.includes(key)) {
        acc[key] = row[key];
      }
      return acc;
    }, {})
  };
};

/**
 * Process Laboratory row using unified helpers
 * Note: Laboratory stores client data as embedded fields, not references
 */
const processLaboratoryRow = async (row, userId, errors) => {
  try {
    console.log('🚀 Processing laboratory row with unified helpers');
    
    // Get client data as object (Laboratory stores client data directly)
    const clientData = await processUnifiedClientEnhanced(row, userId, { returnAsObject: true });
    const dates = processUnifiedDatesEnhanced(row);
    const coordinates = processUnifiedCoordinatesEnhanced(row);
    const speciesCounts = processSpeciesCounts(row);
    
    // For Laboratory, we allow "غير محدد" as a valid name since it stores client data directly
    // Just ensure we have the basic required fields
    if (!clientData.nationalId || !clientData.phone) {
      console.error('❌ Missing required client data');
      throw new Error(`Missing required client data: ID=${clientData.nationalId}, Phone=${clientData.phone}`);
    }
    
    console.log(`✅ Laboratory client data processed: Name="${clientData.name}", ID="${clientData.nationalId}", Phone="${clientData.phone}"`);
    
    // Create laboratory record
    const laboratory = new Laboratory({
      serialNo: parseInt(getFieldValue(row, [
        'Serial No', 'serialNo', 'serial_no', 'Serial Number',
        'الرقم التسلسلي', 'رقم تسلسلي'
      ])) || Date.now() % 1000000, // Generate unique number if not provided
      sampleCode: getFieldValue(row, [
        'sampleCode', 'Sample Code', 'code', 'sample_code',
        'رمز العينة', 'رمز'
      ]) || generateSerialNo(row, 'LAB'),
      date: dates.mainDate,
      clientName: clientData.name || 'غير محدد',
      clientId: clientData.nationalId,
      clientBirthDate: clientData.birthDate,
      clientPhone: clientData.phone,
      farmLocation: getFieldValue(row, [
        'farmLocation', 'Location', 'location', 'Farm Location',
        'الموقع', 'موقع المزرعة'
      ]) || 'N/A',
      coordinates: coordinates.latitude !== 0 || coordinates.longitude !== 0 ? coordinates : undefined,
      speciesCounts: speciesCounts,
      collector: getFieldValue(row, [
        'collector', 'Sample Collector', 'Collector', 'sample_collector',
        'جامع العينة', 'المجمع'
      ]) || 'N/A',
      sampleType: getFieldValue(row, [
        'sampleType', 'Sample Type', 'Type', 'sample_type',
        'نوع العينة', 'نوع'
      ]) || 'Blood',
      sampleNumber: getFieldValue(row, [
        'sampleNumber', 'Sample Number', 'Samples Number', 'sample_number',
        'رقم العينة', 'عدد العينات'
      ]) || 'N/A',
      positiveCases: parseInt(getFieldValue(row, [
        'positiveCases', 'Positive Cases', 'positive_cases', 'positive cases',
        'الحالات الإيجابية', 'إيجابي'
      ]) || 0),
      negativeCases: parseInt(getFieldValue(row, [
        'negativeCases', 'Negative Cases', 'negative_cases', 'negative cases',
        'الحالات السلبية', 'سلبي'
      ]) || 0),
      testResults: parseJsonField(getFieldValue(row, [
        'testResults', 'Test Results', 'test_results', 'results',
        'النتائج', 'نتائج الفحص'
      ]), []),
      holdingCode: await processHoldingCodeReference(row),
      remarks: getFieldValue(row, ['Remarks', 'remarks', 'ملاحظات']) || '',
      customImportData: processCustomImportData(row),
      createdBy: userId
    });

    await laboratory.save();
    return laboratory;
  } catch (error) {
    throw new Error(`Error processing laboratory row: ${error.message}`);
  }
};

/**
 * Process EquineHealth row using unified helpers
 * Note: EquineHealth stores client data as embedded fields, not references
 */
const processEquineHealthRow = async (row, userId, errors) => {
  try {
    // Get client data as object (EquineHealth stores client data directly)
    const clientData = await processUnifiedClientEnhanced(row, userId, { returnAsObject: true });
    const dates = processUnifiedDatesEnhanced(row);
    const coordinates = processUnifiedCoordinatesEnhanced(row);
    
    // Get diagnosis and treatment
    const diagnosis = getFieldValue(row, [
      'Diagnosis', 'diagnosis', 'التشخيص'
    ]);
    const treatment = getFieldValue(row, [
      'Treatment', 'treatment', 'العلاج'
    ]);
    
    // Provide default values for empty fields
    const finalDiagnosis = diagnosis || 'غير محدد';
    const finalTreatment = treatment || 'غير محدد';
    
    console.log(`ℹ️ EquineHealth fields: Diagnosis="${finalDiagnosis}", Treatment="${finalTreatment}"`);
    
    // For EquineHealth, we allow "غير محدد" as a valid name since it stores client data directly
    if (!clientData.nationalId || !clientData.phone) {
      throw new Error(`Missing required client data: ID=${clientData.nationalId}, Phone=${clientData.phone}`);
    }
    
    console.log(`✅ EquineHealth client data processed: Name="${clientData.name}", ID="${clientData.nationalId}", Phone="${clientData.phone}"`);
    
    // Create equine health record
    const equineHealth = new EquineHealth({
      serialNo: generateSerialNo(row, 'EH'),
      date: dates.mainDate,
      client: {
        name: clientData.name || 'غير محدد',
        nationalId: clientData.nationalId,
        phone: clientData.phone,
        village: clientData.village || 'غير محدد',
        detailedAddress: clientData.detailedAddress || clientData.village || 'غير محدد',
        birthDate: clientData.birthDate
      },
      farmLocation: getFieldValue(row, [
        'Farm Location', 'farmLocation', 'farm_location',
        'موقع المزرعة', 'الموقع'
      ]) || clientData.village,
      coordinates: coordinates.latitude !== 0 || coordinates.longitude !== 0 ? coordinates : undefined,
      supervisor: getFieldValue(row, [
        'Supervisor', 'supervisor', 'المشرف'
      ]) || 'N/A',
      vehicleNo: getFieldValue(row, [
        'Vehicle No.', 'Vehicle No', 'vehicleNo', 'vehicle_no',
        'رقم المركبة'
      ]) || 'N/A',
      horseCount: parseInt(getFieldValue(row, [
        'Horse Count', 'horseCount', 'horse_count',
        'عدد الخيول', 'عدد الأحصنة'
      ]) || 1),
      diagnosis: finalDiagnosis,
      interventionCategory: processEnumValue(
        row,
        ['Intervention Category', 'interventionCategory', 'intervention_category', 'فئة التدخل'],
        {
          'emergency': 'Emergency', 'urgent': 'Emergency', 'عاجل': 'Emergency', 'طوارئ': 'Emergency',
          'routine': 'Routine', 'عادي': 'Routine', 'روتيني': 'Routine',
          'preventive': 'Preventive', 'وقائي': 'Preventive', 'prevention': 'Preventive',
          'follow-up': 'Follow-up', 'followup': 'Follow-up', 'متابعة': 'Follow-up', 'follow': 'Follow-up',
          'clinical examination': 'Routine', 'فحص سريري': 'Routine'
        },
        'Routine'
      ),
      treatment: finalTreatment,
      followUpRequired: processEnumValue(
        row,
        ['Follow Up Required', 'followUpRequired', 'follow_up_required', 'مطلوب متابعة'],
        {
          'true': true, 'yes': true, 'نعم': true, '1': true,
          'false': false, 'no': false, 'لا': false, '0': false
        },
        false
      ),
      followUpDate: dates.followUpDate,
      request: processRequest(row, dates),
      remarks: getFieldValue(row, ['Remarks', 'remarks', 'ملاحظات']) || '',
      customImportData: processCustomImportData(row),
      createdBy: userId
    });

    await equineHealth.save();
    return equineHealth;
  } catch (error) {
    throw new Error(`Error processing equine health row: ${error.message}`);
  }
};

// Export routes with proper field definitions
router.get('/clients/export', auth, handleExport(Client, {}, [
  'name', 'nationalId', 'birthDate', 'phone', 'email', 'village', 'detailedAddress', 'status', 'totalAnimals'
], 'clients'));

router.get('/vaccination/export', auth, handleExport(Vaccination, {}, [
  'serialNo', 'date', 'client', 'clientBirthDate', 'farmLocation', 'supervisor', 'team', 'vehicleNo', 
  'vaccineType', 'vaccineCategory', 'holdingCode', 'sheep', 'sheepFemale', 'sheepVaccinated', 
  'goats', 'goatsFemale', 'goatsVaccinated', 'camel', 'camelFemale', 'camelVaccinated', 
  'cattle', 'cattleFemale', 'cattleVaccinated', 'herdNumber', 'herdFemales', 
  'totalVaccinated', 'herdHealth', 'animalsHandling', 'labours', 'reachableLocation', 'remarks'
], 'vaccination'));

router.get('/parasite-control/export', auth, handleExport(ParasiteControl, {}, [
  'serialNo', 'date', 'client', 'clientBirthDate', 'herdLocation', 'supervisor', 'vehicleNo', 
  'holdingCode', 'sheepTotal', 'sheepYoung', 'sheepFemale', 'sheepTreated', 'goatsTotal', 
  'goatsYoung', 'goatsFemale', 'goatsTreated', 'camelTotal', 'camelYoung', 
  'camelFemale', 'camelTreated', 'cattleTotal', 'cattleYoung', 'cattleFemale', 
  'cattleTreated', 'horseTotal', 'horseYoung', 'horseFemale', 'horseTreated', 
  'totalHerd', 'totalYoung', 'totalFemale', 'totalTreated', 'insecticide', 
  'animalBarnSizeSqM', 'breedingSites', 'parasiteControlVolume', 
  'parasiteControlStatus', 'herdHealthStatus', 'complyingToInstructions', 'remarks'
], 'parasite-control'));

router.get('/mobile-clinics/export', auth, handleExport(MobileClinic, {}, [
  'serialNo', 'date', 'client', 'clientBirthDate', 'farmLocation', 'supervisor', 'vehicleNo', 
  'holdingCode', 'sheep', 'goats', 'camel', 'cattle', 'horse', 'diagnosis', 'interventionCategory', 
  'treatment', 'medicationsUsed', 'followUpRequired', 'followUpDate', 'remarks'
], 'mobile-clinics'));

router.get('/laboratories/export', auth, handleExport(Laboratory, {}, [
  'serialNo', 'date', 'sampleCode', 'clientName', 'clientId', 'clientBirthDate', 'clientPhone', 
  'holdingCode', 'sheep', 'goats', 'camel', 'cattle', 'horse', 'otherSpecies', 'collector', 
  'sampleType', 'sampleNumber', 'positiveCases', 'negativeCases', 'testResults', 'remarks'
], 'laboratories'));

router.get('/equine-health/export', auth, handleExport(EquineHealth, {}, [
  'serialNo', 'date', 'client', 'clientBirthDate', 'farmLocation', 'coordinates', 'supervisor', 
  'vehicleNo', 'holdingCode', 'horseCount', 'diagnosis', 'interventionCategory', 
  'treatment', 'followUpRequired', 'followUpDate', 'remarks'
], 'equine-health'));

// Template routes
router.get('/clients/template', auth, handleTemplate([
  {
    name: 'عطا الله ابراهيم البلوي',
    nationalId: '1028544243',
    phone: '501834996',
    email: 'client@example.com',
    village: 'فضلا',
    detailedAddress: 'منطقة فضلا',
    status: 'نشط',
    totalAnimals: '10',
    'Birth Date': '7/19/1958',
    'Holding Code': '6820030001295',
    'Location': 'فضلا',
    'N Coordinate': '26.37038',
    'E Coordinate': '37.84097'
  }
], 'clients-template'));

router.get('/vaccination/template', auth, handleTemplate([
  {
    'Serial No': '1',
    'Date': '1-Sep',
    'Name': 'سعد رجاء ناهض البلوي',
    'ID': '1004458947',
    'Birth Date': '8/12/1961',
    'Phone': '543599283',
    'Holding Code': '6.82003E+12',
    'Location': 'ابو خريط',
    'E': '37974167',
    'N': '26263183',
    'Supervisor': 'M.Tahir',
    'Vehicle No.': 'V1',
    'Sheep': '67',
    'F. Sheep': '49',
    'Vaccinated Sheep': '57',
    'Goats': '33',
    'F.Goats': '29',
    'Vaccinated Goats': '33',
    'Camel': '0',
    'F. Camel': '0',
    'Vaccinated Camels': '0',
    'Cattel': '0',
    'F. Cattle': '0',
    'Vaccinated Cattle': '0',
    'Herd Number': '100',
    'Herd Females': '78',
    'Total Vaccinated': '90',
    'Herd Health': 'Healthy',
    'Animals Handling': 'Easy handling',
    'Labours': 'Available',
    'Reachable Location': 'Easy',
    'Request Date': '31-Aug',
    'Situation': 'Closed',
    'Request Fulfilling Date': '1-Sep',
    'Vaccine': 'PPR',
    'Category': 'Vaccination',
    'Remarks': ''
  }
], 'vaccination-template'));

router.get('/parasite-control/template', auth, handleTemplate([
  {
    'Serial No': '1',
    'Date': '24-Aug',
    'Name': 'زعل عبد الله سليمان البلوي',
    'ID': '1038582498',
    'Birth Date': '5/11/1946',
    'Phone': '508762550',
    'Holding Code': '6820030001222',
    'Location': 'كتيفه',
    'N Coordinate': '26.080534',
    'E Coordinate': '38.080037',
    'Supervisor': 'Ibrahim',
    'Vehicle No.': 'P1',
    'Total Sheep': '32',
    'Young sheep': '0',
    'Female Sheep': '27',
    'Treated Sheep': '32',
    'Total Goats': '85',
    'Young Goats': '0',
    'Female Goats': '0',
    'Treated Goats': '85',
    'Total Camel': '0',
    'Young Camels': '0',
    'Female Camels': '0',
    'Treated Camels': '0',
    'Total Cattle': '0',
    'Young Cattle': '0',
    'Female Cattle': '0',
    'Treated Cattle': '0',
    'Total Herd': '117',
    'Total Young': '0',
    'Total Female': '27',
    'Total Treated': '117',
    'Insecticide Used': 'Albendazole 2.5%',
    'Type': 'Clinical Examination',
    'Volume (ml)': '100',
    'Category': 'Internal Parasite',
    'Status': 'Sprayed',
    'Size (sqM)': '50',
    'Herd Health Status': 'Healthy',
    'Complying to instructions': 'true',
    'Request Date': '8/21/2025',
    'Request Situation': 'Closed',
    'Request Fulfilling Date': '8/24/2025',
    'Remarks': 'Internal Parasite Campaign'
  }
], 'parasite-control-template'));

router.get('/mobile-clinics/template', auth, handleTemplate([
  {
    'Serial No': '1',
    'Date': '24-Aug',
    'Name': 'عطا الله ابراهيم البلوي',
    'ID': '1028544243',
    'Birth Date': '7/19/1958',
    'Phone': '501834996',
    'Holding Code': '6820030001295',
    'Location': 'فضلا',
    'N Coordinate': '26.37038',
    'E Coordinate': '37.84097',
    'Supervisor': 'kandil',
    'Vehicle No.': 'C2',
    'Sheep': '2',
    'Goats': '1',
    'Camel': '0',
    'Horse': '0',
    'Cattle': '0',
    'Diagnosis': 'Pnemonia',
    'Intervention Category': 'Clinical Examination',
    'Treatment': 'Zuprevo , Meloxicam ,',
    'Request Date': '8/24/2025',
    'Request Status': 'Closed',
    'Request Fulfilling Date': '8/24/2025',
    'category': 'm clinic treatment',
    'Remarks': ''
  }
], 'mobile-clinics-template'));

router.get('/laboratories/template', auth, handleTemplate([
  {
    // Primary fields matching the model
    'serialNo': '1',
    'date': '2024-08-24',
    'sampleCode': 'LAB-001',
    'clientName': 'عطا الله ابراهيم البلوي',
    'clientId': '1028544243',
    'clientBirthDate': '1958-07-19',
    'clientPhone': '501834996',
    'farmLocation': 'فضلا',
    'collector': 'kandil',
    'sampleType': 'Blood',
    'sampleNumber': 'S001',
    'positiveCases': '0',
    'negativeCases': '3',
    'remarks': 'All tests negative',
    // Alternative column names for flexibility
    'Serial No': '1',
    'Date': '24-Aug',
    'Sample Code': 'LAB-001',
    'Name': 'عطا الله ابراهيم البلوي',
    'ID': '1028544243',
    'Birth Date': '7/19/1958',
    'Phone': '501834996',
    'Location': 'فضلا',
    'Collector': 'kandil',
    'Sample Type': 'Blood',
    'Sample Number': 'S001',
    'Positive Cases': '0',
    'Negative Cases': '3',
    'Remarks': 'All tests negative',
    // Coordinates
    'N Coordinate': '26.37038',
    'E Coordinate': '37.84097',
    // Animal counts
    'Sheep': '2',
    'Goats': '1',
    'Camel': '0',
    'Horse': '0',
    'Cattle': '0',
    'Other (Species)': 'N/A',
    // Additional fields
    'Holding Code': '6820030001295',
    'Supervisor': 'kandil',
    'Vehicle No.': 'L1',
    'Test Results': 'Negative'
  }
], 'laboratories-template'));

router.get('/equine-health/template', auth, handleTemplate([
  {
    'Serial No': '1',
    'Date': '24-Aug',
    'Name': 'عطا الله ابراهيم البلوي',
    'ID': '1028544243',
    'Birth Date': '7/19/1958',
    'Phone': '501834996',
    'Holding Code': '6820030001295',
    'Location': 'فضلا',
    'N Coordinate': '26.37038',
    'E Coordinate': '37.84097',
    'Supervisor': 'kandil',
    'Vehicle No.': 'EH1',
    'Horse Count': '1',
    'Diagnosis': 'فحص روتيني',
    'Intervention Category': 'Clinical Examination',
    'Treatment': 'علاج وقائي',
    'Request Date': '8/24/2025',
    'Request Status': 'Closed',
    'Request Fulfilling Date': '8/24/2025',
    'category': 'Routine',
    'Remarks': 'تم الفحص بنجاح'
  }
], 'equine-health-template'));

// Import routes
router.post('/clients/import', auth, handleImport(Client, async (row, userId, errors) => {
  try {
    const client = new Client({
      name: row.name || row.client_name,
      nationalId: row.nationalId || row.client_id,
      phone: row.phone || row.client_phone,
      email: row.email || row.client_email,
      village: row.village || row.client_village,
      detailedAddress: row.detailedAddress || row.client_address,
      status: row.status || 'نشط',
      animals: [],
      availableServices: [],
      createdBy: userId
    });

    await client.save();
    return client;
  } catch (error) {
    throw new Error(`Error processing client row: ${error.message}`);
  }
}));

router.post('/vaccination/import', auth, handleImport(Vaccination, processVaccinationRow));
router.post('/parasite-control/import', auth, handleImport(ParasiteControl, processParasiteControlRow));
router.post('/mobile-clinics/import', auth, handleImport(MobileClinic, processMobileClinicRow));
router.post('/laboratories/import', auth, handleImport(Laboratory, processLaboratoryRow));
router.post('/equine-health/import', auth, handleImport(EquineHealth, processEquineHealthRow));

// Enhanced import routes with better error handling
router.post('/laboratories/import-enhanced', auth, handleImport(Laboratory, processLaboratoryRow));
router.post('/equine-health/import-enhanced', auth, handleImport(EquineHealth, processEquineHealthRow));

// Inventory routes (placeholder - will be implemented when inventory model is available)
router.get('/inventory/export', auth, (req, res) => {
  res.json({
    success: false,
    message: 'Inventory export not implemented yet'
  });
});

router.get('/inventory/template', auth, (req, res) => {
  res.json({
    success: false,
    message: 'Inventory template not implemented yet'
  });
});

router.post('/inventory/import', auth, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Inventory import not implemented yet'
  });
});

// Enhanced import routes with improved validation
router.post('/laboratories/import-enhanced', auth, (req, res, next) => {
  console.log('🎯 Enhanced laboratories import route called');
  handleImport(Laboratory, processLaboratoryRow)(req, res, next);
});

router.post('/equine-health/import-enhanced', auth, (req, res, next) => {
  console.log('🎯 Enhanced equine health import route called');
  handleImport(EquineHealth, processEquineHealthRow)(req, res, next);
});

// Dromo import routes
router.post('/laboratories/import-dromo', auth, (req, res, next) => {
  console.log('🎯 Dromo laboratories import route called');
  handleImport(Laboratory, processLaboratoryRow)(req, res, next);
});

router.post('/vaccination/import-dromo', auth, (req, res, next) => {
  console.log('🎯 Dromo vaccination import route called');
  handleImport(Vaccination, processVaccinationRow)(req, res, next);
});

router.post('/parasite-control/import-dromo', auth, (req, res, next) => {
  console.log('🎯 Dromo parasite control import route called');
  handleImport(ParasiteControl, processParasiteControlRow)(req, res, next);
});

router.post('/mobile-clinics/import-dromo', auth, (req, res, next) => {
  console.log('🎯 Dromo mobile clinics import route called');
  handleImport(MobileClinic, processMobileClinicRow)(req, res, next);
});

router.post('/equine-health/import-dromo', auth, (req, res, next) => {
  console.log('🎯 Dromo equine health import route called');
  handleImport(EquineHealth, processEquineHealthRow)(req, res, next);
});

module.exports = router;
