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
      cost: 1.5,
      stock: 100,
      category: 'Drinks',
      barcode: '4901234567890',
    },
    {
      name: 'Pepsi',
      sku: 'DRK-002',
      price: 2.5,
      cost: 1.5,
      stock: 80,
      category: 'Drinks',
      barcode: '4901234567891',
    },
    {
      name: 'Water Bottle',
      sku: 'DRK-003',
      price: 1.5,
      cost: 0.8,
      stock: 150,
      category: 'Drinks',
      barcode: '4901234567892',
    },
    {
      name: 'Snickers',
      sku: 'SNK-001',
      price: 3.0,
      cost: 1.8,
      stock: 50,
      category: 'Snacks',
      barcode: '4901234567893',
    },
    {
      name: 'Chips',
      sku: 'SNK-002',
      price: 2.0,
      cost: 1.2,
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

  // Create games
  const games = [
    {
      name: 'Snooker',
      description: 'Snooker tables',
      rateType: 'PER_MINUTE' as const,
      defaultRate: 8.0,
    },
    {
      name: 'Table Tennis',
      description: 'Table Tennis tables',
      rateType: 'PER_MINUTE' as const,
      defaultRate: 6.0,
    },
    {
      name: 'PlayStation',
      description: 'PlayStation gaming stations',
      rateType: 'PER_HOUR' as const,
      defaultRate: 200.0,
    },
    {
      name: 'Foosball',
      description: 'Foosball tables',
      rateType: 'PER_MINUTE' as const,
      defaultRate: 5.0,
    },
  ];

  const createdGames = [];
  for (const gameData of games) {
    const game = await prisma.game.upsert({
      where: { name: gameData.name },
      update: {},
      create: gameData,
    });
    createdGames.push(game);
    console.log(`Created game: ${game.name}`);
  }

  // Create table sessions (2 tables per game, all AVAILABLE)
  let tableNumber = 1;
  for (const game of createdGames) {
    for (let i = 1; i <= 2; i++) {
      const table = await prisma.tableSession.upsert({
        where: { tableNumber },
        update: {
          status: 'AVAILABLE',
          startedAt: null,
          endedAt: null,
          pausedAt: null,
          totalPausedMs: 0,
          lastResumedAt: null,
          currentCharge: 0,
          gameId: game.id,
          ratePerHour: game.defaultRate,
        },
        create: {
          tableNumber,
          gameId: game.id,
          status: 'AVAILABLE',
          ratePerHour: game.defaultRate,
        },
      });
      console.log(`Created table ${tableNumber} (${game.name}) - AVAILABLE`);
      tableNumber++;
    }
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

