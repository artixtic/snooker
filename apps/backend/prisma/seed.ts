import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
    },
  });

  // Create employee user
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employee = await prisma.user.upsert({
    where: { username: 'employee' },
    update: {},
    create: {
      username: 'employee',
      password: employeePassword,
      name: 'Employee User',
      role: 'EMPLOYEE',
    },
  });

  // Create sample products
  const products = [
    {
      name: 'Coca Cola',
      sku: 'DRK-001',
      price: 2.5,
      stock: 100,
      category: 'Drinks',
      barcode: '4901234567890',
    },
    {
      name: 'Pepsi',
      sku: 'DRK-002',
      price: 2.5,
      stock: 80,
      category: 'Drinks',
      barcode: '4901234567891',
    },
    {
      name: 'Water Bottle',
      sku: 'DRK-003',
      price: 1.5,
      stock: 150,
      category: 'Drinks',
      barcode: '4901234567892',
    },
    {
      name: 'Snickers',
      sku: 'SNK-001',
      price: 3.0,
      stock: 50,
      category: 'Snacks',
      barcode: '4901234567893',
    },
    {
      name: 'Chips',
      sku: 'SNK-002',
      price: 2.0,
      stock: 60,
      category: 'Snacks',
      barcode: '4901234567894',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  // Create table sessions
  for (let i = 1; i <= 10; i++) {
    await prisma.tableSession.upsert({
      where: { tableNumber: i },
      update: {},
      create: {
        tableNumber: i,
        status: 'AVAILABLE',
        ratePerHour: 10.0,
      },
    });
  }

  console.log('Seeding completed!');
  console.log('Admin credentials: admin / admin123');
  console.log('Employee credentials: employee / employee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

