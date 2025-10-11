#!/usr/bin/env node

/**
 * Script to check all status codes used in the API
 * Ensures all endpoints return appropriate status codes
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = 'ahcp-backend/src/routes';

// Status codes that should be used
const EXPECTED_STATUS_CODES = {
  200: 'OK - Successful GET, PUT requests',
  201: 'Created - Successful POST requests', 
  400: 'Bad Request - Validation errors',
  401: 'Unauthorized - Authentication required',
  403: 'Forbidden - Insufficient permissions',
  404: 'Not Found - Resource not found',
  500: 'Internal Server Error - Server errors'
};

// Status codes that should NOT be used
const UNWANTED_STATUS_CODES = {
  304: 'Not Modified - Should be 200 OK instead',
  302: 'Found - Redirects not needed',
  301: 'Moved Permanently - Redirects not needed'
};

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  const statusCodes = {};
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Find res.status() calls
    const statusMatch = line.match(/res\.status\((\d+)\)/g);
    if (statusMatch) {
      statusMatch.forEach(match => {
        const code = parseInt(match.match(/\d+/)[0]);
        statusCodes[code] = (statusCodes[code] || 0) + 1;
      });
    }
    
    // Find res.json() calls without explicit status (defaults to 200)
    if (line.includes('res.json(') && !line.includes('res.status(')) {
      statusCodes[200] = (statusCodes[200] || 0) + 1;
    }
  });
  
  return {
    fileName,
    statusCodes,
    totalResponses: Object.values(statusCodes).reduce((sum, count) => sum + count, 0)
  };
}

function checkAllRoutes() {
  console.log('🔍 Checking Status Codes in All API Routes');
  console.log('==========================================\n');
  
  const files = fs.readdirSync(ROUTES_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(ROUTES_DIR, file));
  
  const allStatusCodes = {};
  const fileResults = [];
  
  files.forEach(filePath => {
    const result = analyzeFile(filePath);
    fileResults.push(result);
    
    // Aggregate status codes
    Object.entries(result.statusCodes).forEach(([code, count]) => {
      allStatusCodes[code] = (allStatusCodes[code] || 0) + count;
    });
  });
  
  // Display results by file
  fileResults.forEach(result => {
    console.log(`📄 ${result.fileName}:`);
    console.log(`   Total responses: ${result.totalResponses}`);
    
    Object.entries(result.statusCodes)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([code, count]) => {
        const emoji = code === '200' ? '✅' : 
                     code === '201' ? '✅' : 
                     code === '400' ? '⚠️' : 
                     code === '401' ? '🔒' : 
                     code === '403' ? '🔒' : 
                     code === '404' ? '❌' : 
                     code === '500' ? '💥' : '❓';
        console.log(`   ${emoji} ${code}: ${count} responses`);
      });
    console.log('');
  });
  
  // Overall summary
  console.log('📊 OVERALL STATUS CODE SUMMARY');
  console.log('===============================');
  
  const totalResponses = Object.values(allStatusCodes).reduce((sum, count) => sum + count, 0);
  console.log(`Total API responses: ${totalResponses}\n`);
  
  // Expected status codes
  console.log('✅ EXPECTED STATUS CODES:');
  Object.entries(EXPECTED_STATUS_CODES).forEach(([code, description]) => {
    const count = allStatusCodes[code] || 0;
    const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
    console.log(`   ${code}: ${count} responses (${percentage}%) - ${description}`);
  });
  
  // Unwanted status codes
  console.log('\n❌ UNWANTED STATUS CODES:');
  let hasUnwanted = false;
  Object.entries(UNWANTED_STATUS_CODES).forEach(([code, description]) => {
    const count = allStatusCodes[code] || 0;
    if (count > 0) {
      hasUnwanted = true;
      console.log(`   ${code}: ${count} responses - ${description}`);
    }
  });
  
  if (!hasUnwanted) {
    console.log('   None found! ✅');
  }
  
  // Other status codes
  console.log('\n❓ OTHER STATUS CODES:');
  const otherCodes = Object.entries(allStatusCodes)
    .filter(([code]) => !EXPECTED_STATUS_CODES[code] && !UNWANTED_STATUS_CODES[code])
    .sort(([a], [b]) => parseInt(a) - parseInt(b));
  
  if (otherCodes.length > 0) {
    otherCodes.forEach(([code, count]) => {
      console.log(`   ${code}: ${count} responses`);
    });
  } else {
    console.log('   None found! ✅');
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('===================');
  
  const successCount = (allStatusCodes[200] || 0) + (allStatusCodes[201] || 0);
  const successRate = totalResponses > 0 ? Math.round((successCount / totalResponses) * 100) : 0;
  
  console.log(`✅ Success rate: ${successRate}% (${successCount}/${totalResponses} responses)`);
  
  if (allStatusCodes[304] > 0) {
    console.log('❌ Found 304 responses - these should be changed to 200 OK');
  }
  
  if (allStatusCodes[500] > 0) {
    console.log('⚠️ Found 500 responses - check error handling');
  }
  
  if (successRate >= 80) {
    console.log('🎉 Excellent! Most responses are successful');
  } else if (successRate >= 60) {
    console.log('⚠️ Good, but could be improved');
  } else {
    console.log('❌ Needs improvement - too many error responses');
  }
  
  return {
    totalResponses,
    successRate,
    hasUnwanted: hasUnwanted,
    unwantedCount: Object.entries(UNWANTED_STATUS_CODES)
      .reduce((sum, [code]) => sum + (allStatusCodes[code] || 0), 0)
  };
}

// Run the analysis
const results = checkAllRoutes();

console.log('\n🏁 Analysis completed!');
process.exit(results.hasUnwanted ? 1 : 0);
