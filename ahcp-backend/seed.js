#!/usr/bin/env node

// سكريبت مبسط لتشغيل جميع عمليات البذر
const { execSync } = require('child_process');
const path = require('path');

console.log('🌱 بدء عملية إعداد قاعدة البيانات...\n');

try {
  // تشغيل سكريبت إنشاء الأقسام
  console.log('📋 إنشاء الأقسام الأساسية...');
  execSync('node src/scripts/seed-sections.js', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  console.log('\n✅ تم إنجاز جميع عمليات الإعداد بنجاح!');
  console.log('\n📊 ملخص العمليات:');
  console.log('- ✅ إنشاء الأقسام الأساسية');
  console.log('- ✅ ربط المستخدمين بالأقسام');
  console.log('\n🎉 قاعدة البيانات جاهزة للاستخدام!');
  
} catch (error) {
  console.error('\n❌ حدث خطأ أثناء الإعداد:', error.message);
  process.exit(1);
}
