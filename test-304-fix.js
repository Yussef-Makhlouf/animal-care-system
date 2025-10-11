#!/usr/bin/env node

/**
 * Test script to verify that 304 responses are fixed to 200 OK
 * This script tests the API endpoints to ensure they return 200 OK instead of 304
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_ENDPOINTS = [
  '/api/auth/supervisors',
  '/api/auth/me',
  '/api/sections',
  '/api/clients/statistics',
  '/api/vaccination/statistics',
  '/api/parasite-control/statistics',
  '/api/mobile-clinics/statistics',
  '/api/equine-health/statistics',
  '/api/laboratories/statistics',
  '/api/reports/dashboard'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'AHCP-Test-Script/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      const statusCode = res.statusCode;
      const headers = res.headers;
      
      console.log(`\n🔍 Testing: ${endpoint}`);
      console.log(`   Status: ${statusCode}`);
      console.log(`   Cache-Control: ${headers['cache-control'] || 'Not set'}`);
      console.log(`   ETag: ${headers['etag'] || 'Not set'}`);
      console.log(`   Last-Modified: ${headers['last-modified'] || 'Not set'}`);
      
      if (statusCode === 200) {
        console.log(`   ✅ SUCCESS: 200 OK response`);
      } else if (statusCode === 304) {
        console.log(`   ❌ FAILED: 304 Not Modified (this should be 200 OK)`);
      } else if (statusCode === 401) {
        console.log(`   ⚠️  AUTH REQUIRED: 401 Unauthorized (expected for protected endpoints)`);
      } else {
        console.log(`   ⚠️  OTHER: ${statusCode} response`);
      }
      
      resolve({
        endpoint,
        statusCode,
        cacheControl: headers['cache-control'],
        etag: headers['etag'],
        lastModified: headers['last-modified']
      });
    });

    req.on('error', (error) => {
      console.log(`\n❌ Error testing ${endpoint}: ${error.message}`);
      resolve({
        endpoint,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      console.log(`\n⏰ Timeout testing ${endpoint}`);
      req.destroy();
      resolve({
        endpoint,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing API endpoints for 304 response fixes...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📊 Testing ${TEST_ENDPOINTS.length} endpoints\n`);

  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log('================');
  
  const successCount = results.filter(r => r.statusCode === 200).length;
  const authRequiredCount = results.filter(r => r.statusCode === 401).length;
  const failedCount = results.filter(r => r.statusCode === 304).length;
  const errorCount = results.filter(r => r.error).length;
  
  console.log(`✅ 200 OK responses: ${successCount}`);
  console.log(`🔒 401 Auth required: ${authRequiredCount}`);
  console.log(`❌ 304 Not Modified: ${failedCount}`);
  console.log(`💥 Errors: ${errorCount}`);
  
  if (failedCount === 0) {
    console.log('\n🎉 SUCCESS: No 304 responses found! All endpoints return 200 OK.');
  } else {
    console.log('\n⚠️  WARNING: Some endpoints still return 304 responses.');
  }
  
  if (errorCount > 0) {
    console.log('\n❌ ERRORS:');
    results.filter(r => r.error).forEach(r => {
      console.log(`   ${r.endpoint}: ${r.error}`);
    });
  }
}

// Run the tests
runTests().catch(console.error);
