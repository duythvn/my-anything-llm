// debug-prisma.js
console.log('Testing Prisma initialization...');

try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ PrismaClient imported successfully');

  // Try to create client with minimal config
  const prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'minimal'
  });

  console.log('✅ PrismaClient instantiated');

  // Test basic connection (this might fail but shouldn't core dump)
  prisma.$connect().then(() => {
    console.log('✅ Database connected');
    prisma.$disconnect();
  }).catch(err => {
    console.log('⚠️ Database connection failed (expected):', err.message);
    prisma.$disconnect();
  });

} catch (error) {
  console.log('❌ Prisma initialization failed:', error.message);
}