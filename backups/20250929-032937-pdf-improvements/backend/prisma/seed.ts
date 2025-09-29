import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'system.admin@suanhasaigon247.com' },
    update: {},
    create: {
      email: 'system.admin@suanhasaigon247.com',
      password: adminPassword,
      name: 'admin',
      role: 'ADMIN',
      isActive: true,
      fullName: '시스템 관리자',
      phone: '010-1234-5678',
      position: '시스템 관리자',
      department: 'IT팀',
      hireDate: new Date('2020-01-15'),
      address: '서울시 강남구'
    }
  });

  // Create employee user
  const employeePassword = await bcrypt.hash('emp123', 12);
  const employeeUser = await prisma.user.upsert({
    where: { email: 'demo.employee@suanhasaigon247.com' },
    update: {},
    create: {
      email: 'demo.employee@suanhasaigon247.com',
      password: employeePassword,
      name: 'employee1',
      role: 'EMPLOYEE',
      isActive: true,
      fullName: '데모 직원',
      phone: '010-9876-5432',
      position: '직원',
      department: '영업팀',
      hireDate: new Date('2023-05-01'),
      address: '서울시 서초구'
    }
  });

  // Create sample customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      customerName: '김철수',
      companyName: '김철수',
      phone: '010-1234-5678',
      email: 'kim@example.com',
      memo: '정기 고객, VIP 등급'
    }
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      customerName: '이영희',
      companyName: '이영희 상사',
      phone: '010-9876-5432',
      email: 'lee@example.com',
      memo: '신축 아파트, 정리정돈 깔끔함'
    }
  });

  const customer3 = await prisma.customer.upsert({
    where: { id: 'customer-3' },
    update: {},
    create: {
      id: 'customer-3',
      customerName: '박민수',
      companyName: '박민수 전기상사',
      phone: '010-5555-1234',
      email: 'park@example.com',
      memo: '상업용 건물, 24시간 운영'
    }
  });

  console.log('Seed data created:');
  console.log('Admin user:', adminUser);
  console.log('Employee user:', employeeUser);
  console.log('Customer 1:', customer1);
  console.log('Customer 2:', customer2);
  console.log('Customer 3:', customer3);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });