const http = require('http');

// Test the test route
const testOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/import-export/test',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🧪 Testing Dromo test route...');

const req = http.request(testOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Test route response:');
    console.log(data);
    
    // Now test the import route
    testImportRoute();
  });
});

req.on('error', (error) => {
  console.error('❌ Test route error:', error.message);
});

req.end();

function testImportRoute() {
  const sampleData = [{
    serialNo: "1",
    date: "1-Sep",
    farmLocation: "ابو خريط",
    team: "37974167",
    supervisor: "M.Tahir",
    vaccineType: "PPR",
    vaccineCategory: "Vaccination",
    sheepTotal: "78",
    sheepFemale: "67",
    cattleTotal: "100",
    cattleVaccinated: "90",
    animalsHandling: "Easy handling",
    herdHealth: "Healthy",
    labours: "Available",
    reachableLocation: "Easy",
    requestSituation: "Closed",
    Name: "Test Client",
    ID: "1234567890",
    Phone: "0501234567"
  }];

  const postData = JSON.stringify({
    data: sampleData,
    validData: sampleData,
    source: 'test',
    tableType: 'vaccination'
  });

  const importOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/import-export/vaccination/import-dromo',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Source': 'test',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🧪 Testing vaccination import route...');

  const importReq = http.request(importOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Import route response:');
      console.log(data);
    });
  });

  importReq.on('error', (error) => {
    console.error('❌ Import route error:', error.message);
  });

  importReq.write(postData);
  importReq.end();
}
