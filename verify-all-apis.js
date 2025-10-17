#!/usr/bin/env node

/**
 * Comprehensive API verification script
 * This script tests all API endpoints to ensure they return 200 OK responses
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.API_URL || 'https://ahcp-backend-production.up.railway.app';

// All API endpoints to test
const API_ENDPOINTS = {
  // Auth endpoints
  auth: [
    '/api/auth/me',
    '/api/auth/profile', 
    '/api/auth/supervisors',
    '/api/auth/supervisors/by-section/all',
    '/api/auth/users'
  ],
  
  // Sections endpoints
  sections: [
    '/api/sections',
    '/api/sections/active',
    '/api/sections/statistics'
  ],
  
  // Users endpoints
  users: [
    '/api/users',
    '/api/users/statistics'
  ],
  
  // Clients endpoints
  clients: [
    '/api/clients',
    '/api/clients/statistics'
  ],
  
  // Vaccination endpoints
  vaccination: [
    '/api/vaccination',
    '/api/vaccination/statistics',
    '/api/vaccination/vaccine-types'
  ],
  
  // Parasite Control endpoints
  parasiteControl: [
    '/api/parasite-control',
    '/api/parasite-control/statistics'
  ],
  
  // Mobile Clinics endpoints
  mobileClinics: [
    '/api/mobile-clinics',
    '/api/mobile-clinics/statistics'
  ],
  
  // Equine Health endpoints
  equineHealth: [
    '/api/equine-health',
    '/api/equine-health/statistics'
  ],
  
  // Laboratories endpoints
  laboratories: [
    '/api/laboratories',
    '/api/laboratories/statistics'
  ],
  
  // Reports endpoints
  reports: [
    '/api/reports/dashboard',
    '/api/reports/statistics'
  ],
  
  // Villages endpoints
  villages: [
    '/api/villages',
    '/api/villages/statistics'
  ]
};

async function testEndpoint(endpoint, category) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'AHCP-API-Verifier/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      const statusCode = res.statusCode;
      const headers = res.headers;
      
      let result = {
        endpoint,
        category,
        statusCode,
        cacheControl: headers['cache-control'],
        etag: headers['etag'],
        lastModified: headers['last-modified'],
        contentType: headers['content-type'],
        success: false,
        message: ''
      };
      
      if (statusCode === 200) {
        result.success = true;
        result.message = '✅ 200 OK - Perfect!';
      } else if (statusCode === 401) {
        result.success = true; // Auth required is expected
        result.message = '🔒 401 Unauthorized - Expected for protected endpoints';
      } else if (statusCode === 304) {
        result.success = false;
        result.message = '❌ 304 Not Modified - This should be 200 OK!';
      } else if (statusCode === 404) {
        result.success = false;
        result.message = '❌ 404 Not Found - Endpoint not found';
      } else if (statusCode >= 500) {
        result.success = false;
        result.message = `❌ ${statusCode} Server Error`;
      } else {
        result.success = false;
        result.message = `⚠️ ${statusCode} - Unexpected status`;
      }
      
      resolve(result);
    });

    req.on('error', (error) => {
      resolve({
        endpoint,
        category,
        success: false,
        message: `❌ Connection Error: ${error.message}`,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        endpoint,
        category,
        success: false,
        message: '⏰ Timeout - Request took too long',
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function runComprehensiveTest() {
  console.log('🔍 Comprehensive API Verification');
  console.log('==================================');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📊 Testing all API endpoints for 200 OK responses\n`);

  const allResults = [];
  const categoryResults = {};
  
  // Test all endpoints by category
  for (const [category, endpoints] of Object.entries(API_ENDPOINTS)) {
    console.log(`\n📂 Testing ${category.toUpperCase()} endpoints:`);
    console.log('─'.repeat(50));
    
    const categoryResults = [];
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint, category);
      categoryResults.push(result);
      allResults.push(result);
      
      console.log(`${result.message} ${endpoint}`);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Category summary
    const successCount = categoryResults.filter(r => r.success).length;
    const totalCount = categoryResults.length;
    console.log(`\n📊 ${category}: ${successCount}/${totalCount} endpoints working correctly`);
  }

  // Overall summary
  console.log('\n\n📊 OVERALL SUMMARY');
  console.log('==================');
  
  const successCount = allResults.filter(r => r.success).length;
  const totalCount = allResults.length;
  const successRate = Math.round((successCount / totalCount) * 100);
  
  console.log(`✅ Successful endpoints: ${successCount}/${totalCount} (${successRate}%)`);
  
  // Status code breakdown
  const statusCodes = {};
  allResults.forEach(r => {
    statusCodes[r.statusCode] = (statusCodes[r.statusCode] || 0) + 1;
  });
  
  console.log('\n📈 Status Code Breakdown:');
  Object.entries(statusCodes).forEach(([code, count]) => {
    const emoji = code === '200' ? '✅' : code === '401' ? '🔒' : code === '304' ? '❌' : '⚠️';
    console.log(`   ${emoji} ${code}: ${count} endpoints`);
  });
  
  // Issues found
  const issues = allResults.filter(r => !r.success);
  if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    console.log('================');
    issues.forEach(issue => {
      console.log(`   ${issue.endpoint}: ${issue.message}`);
    });
  } else {
    console.log('\n🎉 PERFECT! All endpoints are working correctly!');
  }
  
  // Cache-related issues
  const cacheIssues = allResults.filter(r => 
    r.statusCode === 304 || 
    (r.cacheControl && r.cacheControl.includes('max-age'))
  );
  
  if (cacheIssues.length > 0) {
    console.log('\n⚠️ CACHE-RELATED ISSUES:');
    console.log('========================');
    cacheIssues.forEach(issue => {
      console.log(`   ${issue.endpoint}: Cache-Control: ${issue.cacheControl || 'Not set'}`);
    });
  } else {
    console.log('\n✅ No cache-related issues found!');
  }
  
  return {
    total: totalCount,
    successful: successCount,
    successRate,
    issues: issues.length,
    cacheIssues: cacheIssues.length
  };
}

// Run the comprehensive test
runComprehensiveTest()
  .then(results => {
    console.log('\n🏁 Test completed!');
    process.exit(results.issues > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
