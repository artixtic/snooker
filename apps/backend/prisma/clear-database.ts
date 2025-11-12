import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Read .env file to get backup database URL
const envPath = path.join(__dirname, '..', '.env');
let backupDatabaseUrl: string | undefined;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('BACKUP_DATABASE_URL=')) {
      const match = trimmedLine.match(/BACKUP_DATABASE_URL=(?:"([^"]+)"|([^\s]+))/);
      if (match) {
        backupDatabaseUrl = match[1] || match[2];
        break;
      }
    }
  }
}

async function clearDatabase(client: PrismaClient, databaseName: string) {
  console.log(`\n🗑️  Clearing ${databaseName}...\n`);

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting tournament matches...');
    await client.tournamentMatch.deleteMany();

    console.log('Deleting tournament players...');
    await client.tournamentPlayer.deleteMany();

    console.log('Deleting tournaments...');
    await client.tournament.deleteMany();

    console.log('Deleting match players...');
    await client.matchPlayer.deleteMany();

    console.log('Deleting matches...');
    await client.match.deleteMany();

    console.log('Deleting kitchen orders...');
    await client.kitchenOrder.deleteMany();

    console.log('Deleting table rate rules...');
    await client.tableRateRule.deleteMany();

    console.log('Deleting table maintenance records...');
    await client.tableMaintenance.deleteMany();

    console.log('Deleting bookings...');
    await client.booking.deleteMany();

    console.log('Deleting expenses...');
    await client.expense.deleteMany();

    console.log('Deleting sale items...');
    await client.saleItem.deleteMany();

    console.log('Deleting sales...');
    await client.sale.deleteMany();

    console.log('Deleting inventory movements...');
    await client.inventoryMovement.deleteMany();

    console.log('Deleting activity logs...');
    await client.activityLog.deleteMany();

    console.log('Deleting sync logs...');
    await client.syncLog.deleteMany();

    console.log('Deleting shifts...');
    await client.shift.deleteMany();

    console.log('Deleting table sessions...');
    await client.tableSession.deleteMany();

    console.log('Deleting games...');
    await client.game.deleteMany();

    console.log('Deleting products...');
    await client.product.deleteMany();

    // Note: We keep users by default, but you can uncomment to delete them too
    // console.log('Deleting users...');
    // await client.user.deleteMany();

    console.log(`\n✅ ${databaseName} cleared successfully!`);
  } catch (error) {
    console.error(`❌ Error clearing ${databaseName}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🗑️  Starting database cleanup...\n');

  try {
    // Clear main database
    await clearDatabase(prisma, 'Main database');

    // Clear backup database if configured
    if (backupDatabaseUrl) {
      console.log('\n📦 Backup database URL found, clearing backup database...');
      const backupPrisma = new PrismaClient({
        datasources: {
          db: {
            url: backupDatabaseUrl,
          },
        },
      });

      try {
        await backupPrisma.$connect();
        await clearDatabase(backupPrisma, 'Backup database');
        await backupPrisma.$disconnect();
      } catch (error) {
        console.error('⚠️  Warning: Could not clear backup database:', error);
        console.error('   This might be because the backup database does not exist or is not accessible.');
        await backupPrisma.$disconnect().catch(() => {});
      }
    } else {
      console.log('\n⚠️  No BACKUP_DATABASE_URL found in .env, skipping backup database cleanup.');
    }

    console.log('\n✅ All databases cleared successfully!');
    console.log('⚠️  Note: Users were NOT deleted. Uncomment the user deletion code if needed.');
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

