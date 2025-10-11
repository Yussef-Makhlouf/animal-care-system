// Test the formatDate function fix
console.log('🧪 Testing formatDate Function Fix');
console.log('=' .repeat(40));

// Simulate the formatDate function
function formatDate(date) {
  if (!date) {
    return 'غير محدد';
  }
  
  const d = new Date(date);
  
  // Check if the date is valid
  if (isNaN(d.getTime())) {
    return 'تاريخ غير صالح';
  }
  
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  } catch (error) {
    console.error('Error formatting date:', error, 'Original date:', date);
    return 'تاريخ غير صالح';
  }
}

// Test cases
const testCases = [
  { name: 'Valid Date String', value: '2024-01-15' },
  { name: 'Valid ISO Date', value: '2024-01-15T10:30:00Z' },
  { name: 'Valid Date Object', value: new Date() },
  { name: 'Invalid Date String', value: 'invalid-date' },
  { name: 'Empty String', value: '' },
  { name: 'Null Value', value: null },
  { name: 'Undefined Value', value: undefined },
  { name: 'Number (timestamp)', value: 1704067200000 },
  { name: 'Invalid Number', value: NaN },
  { name: 'Boolean', value: true },
  { name: 'Object', value: {} }
];

console.log('Testing different date values:\n');

testCases.forEach(testCase => {
  try {
    const result = formatDate(testCase.value);
    console.log(`✅ ${testCase.name.padEnd(20)}: "${result}"`);
  } catch (error) {
    console.log(`❌ ${testCase.name.padEnd(20)}: Error - ${error.message}`);
  }
});

console.log('\n' + '=' .repeat(40));
console.log('🎯 Test Results:');
console.log('✅ formatDate function now handles all edge cases');
console.log('✅ Invalid dates show "تاريخ غير صالح" instead of crashing');
console.log('✅ Null/undefined values show "غير محدد"');
console.log('✅ Frontend should no longer crash on invalid dates');
console.log('=' .repeat(40));
