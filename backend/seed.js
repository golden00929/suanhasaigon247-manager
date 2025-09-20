import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@suanha.com' },
    update: {},
    create: {
      email: 'admin@suanha.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true
    }
  });

  // Create employee user
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employee = await prisma.user.upsert({
    where: { email: 'employee@suanha.com' },
    update: {},
    create: {
      email: 'employee@suanha.com',
      password: employeePassword,
      name: 'Employee User',
      role: 'EMPLOYEE',
      isActive: true
    }
  });

  // Create sample customer
  const customer = await prisma.customer.create({
    data: {
      customerName: 'Nguyen Van A',
      companyName: 'ABC Company Ltd',
      phone: '0901234567',
      email: 'customer@abc.com',
      memo: 'Sample customer for testing',
      addresses: {
        create: [
          {
            name: 'Main Office',
            address: '123 Nguyen Hue Street, District 1, Ho Chi Minh City',
            isMain: true
          },
          {
            name: 'Factory 1',
            address: '456 Le Van Viet Street, Thu Duc City, Ho Chi Minh City',
            isMain: false
          }
        ]
      }
    }
  });

  // Create sample price categories
  const electricCategory = await prisma.priceCategory.create({
    data: {
      name: 'Electrical Work',
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Install electrical outlet',
            unit: 'piece',
            unitPrice: 50000,
            laborHours: 1.5
          },
          {
            itemName: 'Replace light fixture',
            unit: 'piece',
            unitPrice: 80000,
            laborHours: 2.0
          },
          {
            itemName: 'Electrical panel inspection',
            unit: 'hour',
            unitPrice: 100000,
            laborHours: 1.0
          }
        ]
      }
    }
  });

  const plumbingCategory = await prisma.priceCategory.create({
    data: {
      name: 'Plumbing Work',
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Pipe repair',
            unit: 'meter',
            unitPrice: 75000,
            laborHours: 2.0
          },
          {
            itemName: 'Faucet replacement',
            unit: 'piece',
            unitPrice: 120000,
            laborHours: 1.5
          },
          {
            itemName: 'Drain cleaning',
            unit: 'piece',
            unitPrice: 60000,
            laborHours: 1.0
          }
        ]
      }
    }
  });

  console.log('Database seeded successfully!');
  console.log('Admin credentials: admin@suanha.com / admin123');
  console.log('Employee credentials: employee@suanha.com / employee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });