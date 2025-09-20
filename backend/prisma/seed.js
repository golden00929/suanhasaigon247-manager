import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@suanha.com' },
        update: {},
        create: {
            email: 'admin@suanha.com',
            password: adminPassword,
            name: 'admin',
            role: 'ADMIN',
            isActive: true,
            fullName: '관리자',
            phone: '010-1234-5678',
            position: '시스템 관리자',
            department: 'IT팀',
            hireDate: new Date('2020-01-15'),
            address: '서울시 강남구'
        }
    });
    // Create employee user
    const employeePassword = await bcrypt.hash('employee123', 12);
    const employeeUser = await prisma.user.upsert({
        where: { email: 'employee@suanha.com' },
        update: {},
        create: {
            email: 'employee@suanha.com',
            password: employeePassword,
            name: 'employee1',
            role: 'EMPLOYEE',
            isActive: true,
            fullName: 'Nhân viên 1',
            phone: '010-9876-5432',
            position: '직원',
            department: '영업팀',
            hireDate: new Date('2023-05-01'),
            address: '서울시 서초구'
        }
    });
    console.log('Seed data created:');
    console.log('Admin user:', adminUser);
    console.log('Employee user:', employeeUser);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map