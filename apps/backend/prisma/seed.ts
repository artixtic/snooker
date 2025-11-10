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
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    const table = await prisma.tableSession.upsert({
      where: { tableNumber: i },
      update: {},
      create: {
        tableNumber: i,
        status: 'AVAILABLE',
        ratePerHour: 10.0,
      },
    });
    tables.push(table);
  }

  // Create sample members
  const members = [];
  for (let i = 1; i <= 5; i++) {
    const member = await prisma.member.upsert({
      where: { memberNumber: `MEM-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        memberNumber: `MEM-${String(i).padStart(3, '0')}`,
        name: `Member ${i}`,
        phone: `0300${i}000000`,
        email: `member${i}@example.com`,
        memberType: i <= 2 ? 'VIP' : 'REGULAR',
        creditLimit: 1000.0,
        balance: 0,
      },
    });
    members.push(member);
  }

  // Create sample matches
  if (tables.length >= 2 && members.length >= 2) {
    // Create a finished match
    const finishedMatch = await prisma.match.create({
      data: {
        tableId: tables[0].id,
        status: 'FINISHED',
        gameType: 'snooker',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        score: {
          [members[0].id]: 45,
          [members[1].id]: 32,
        },
        isPaid: true,
        players: {
          create: [
            {
              memberId: members[0].id,
              seatNumber: 1,
              score: 45,
              result: 'win',
            },
            {
              memberId: members[1].id,
              seatNumber: 2,
              score: 32,
              result: 'loss',
            },
          ],
        },
      },
    });

    // Update member stats
    await prisma.member.update({
      where: { id: members[0].id },
      data: {
        totalMatches: 1,
        wins: 1,
        losses: 0,
      },
    });
    await prisma.member.update({
      where: { id: members[1].id },
      data: {
        totalMatches: 1,
        wins: 0,
        losses: 1,
      },
    });

    // Create an active match
    const activeMatch = await prisma.match.create({
      data: {
        tableId: tables[1].id,
        status: 'ACTIVE',
        gameType: 'pool',
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        score: {
          [members[2].id]: 5,
          [members[3].id]: 3,
        },
        isPaid: false,
        players: {
          create: [
            {
              memberId: members[2].id,
              seatNumber: 1,
              score: 5,
            },
            {
              memberId: members[3].id,
              seatNumber: 2,
              score: 3,
            },
          ],
        },
      },
    });

    // Update table status for active match
    await prisma.tableSession.update({
      where: { id: tables[1].id },
      data: { status: 'OCCUPIED' },
    });

    // Create a tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Spring Championship 2025',
        format: 'SINGLE_ELIMINATION',
        status: 'REGISTRATION',
        maxPlayers: 8,
        entryFee: 100.0,
        prizePool: 500.0,
        description: 'Annual spring snooker championship',
        createdById: admin.id,
        bracket: {
          format: 'SINGLE_ELIMINATION',
          rounds: [],
          participants: 0,
        },
        participants: {
          create: [
            {
              memberId: members[0].id,
              seed: 1,
              status: 'registered',
            },
            {
              memberId: members[1].id,
              seed: 2,
              status: 'registered',
            },
            {
              memberId: members[2].id,
              seed: 3,
              status: 'registered',
            },
            {
              memberId: members[3].id,
              seed: 4,
              status: 'registered',
            },
          ],
        },
      },
    });

    console.log(`Created ${finishedMatch.id} (finished match)`);
    console.log(`Created ${activeMatch.id} (active match)`);
    console.log(`Created tournament: ${tournament.name}`);
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

