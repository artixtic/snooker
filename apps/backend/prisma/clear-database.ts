import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...\n');

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting tournament matches...');
    await prisma.tournamentMatch.deleteMany();

    console.log('Deleting tournament players...');
    await prisma.tournamentPlayer.deleteMany();

    console.log('Deleting tournaments...');
    await prisma.tournament.deleteMany();

    console.log('Deleting match players...');
    await prisma.matchPlayer.deleteMany();

    console.log('Deleting matches...');
    await prisma.match.deleteMany();

    console.log('Deleting kitchen orders...');
    await prisma.kitchenOrder.deleteMany();

    console.log('Deleting table rate rules...');
    await prisma.tableRateRule.deleteMany();

    console.log('Deleting table maintenance records...');
    await prisma.tableMaintenance.deleteMany();

    console.log('Deleting bookings...');
    await prisma.booking.deleteMany();

    console.log('Deleting expenses...');
    await prisma.expense.deleteMany();

    console.log('Deleting sale items...');
    await prisma.saleItem.deleteMany();

    console.log('Deleting sales...');
    await prisma.sale.deleteMany();

    console.log('Deleting inventory movements...');
    await prisma.inventoryMovement.deleteMany();

    console.log('Deleting activity logs...');
    await prisma.activityLog.deleteMany();

    console.log('Deleting sync logs...');
    await prisma.syncLog.deleteMany();

    console.log('Deleting shifts...');
    await prisma.shift.deleteMany();

    console.log('Deleting table sessions...');
    await prisma.tableSession.deleteMany();

    console.log('Deleting games...');
    await prisma.game.deleteMany();

    console.log('Deleting products...');
    await prisma.product.deleteMany();

    // Note: We keep users by default, but you can uncomment to delete them too
    // console.log('Deleting users...');
    // await prisma.user.deleteMany();

    console.log('\n✅ Database cleared successfully!');
    console.log('⚠️  Note: Users were NOT deleted. Uncomment the user deletion code if needed.');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

