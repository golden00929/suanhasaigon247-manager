// Test script to add a new customer and verify API integration
const { PrismaClient } = require('@prisma/client');

async function testCustomerIntegration() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Adding new test customer...');

    // Add a new customer directly to the database
    const newCustomer = await prisma.customer.create({
      data: {
        customerName: `Test Customer ${Date.now()}`,
        phone: '0123456789',
        email: `test${Date.now()}@example.com`,
        addresses: {
          create: [
            {
              name: 'Main Office',
              address: '123 Test Street, Test City',
              isMain: true
            }
          ]
        }
      },
      include: {
        addresses: true
      }
    });

    console.log('✅ New customer added:', newCustomer);

    // Verify customer appears in API response format
    const allCustomers = await prisma.customer.findMany({
      include: {
        addresses: true
      }
    });

    console.log(`📊 Total customers in database: ${allCustomers.length}`);
    console.log('📋 All customers:', allCustomers.map(c => ({ id: c.id, name: c.customerName, phone: c.phone })));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomerIntegration();