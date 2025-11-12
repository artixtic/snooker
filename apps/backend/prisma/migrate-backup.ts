import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
let backupDatabaseUrl: string | undefined;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('BACKUP_DATABASE_URL=')) {
      // Extract the value, handling quoted and unquoted strings
      const match = trimmedLine.match(/BACKUP_DATABASE_URL=(?:"([^"]+)"|([^\s]+))/);
      if (match) {
        backupDatabaseUrl = match[1] || match[2];
        break;
      }
    }
  }
}

if (!backupDatabaseUrl) {
  console.error('❌ BACKUP_DATABASE_URL not found in .env file');
  console.error('Please add BACKUP_DATABASE_URL to your .env file');
  process.exit(1);
}

console.log('🔄 Running migrations on backup database...');
console.log(`📦 Database: ${backupDatabaseUrl.replace(/:[^:@]+@/, ':****@')}`);

try {
  // Set DATABASE_URL to backup database URL and run migrations
  process.env.DATABASE_URL = backupDatabaseUrl;
  
  // Use migrate deploy for production-like migrations (applies all pending migrations)
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: backupDatabaseUrl,
    },
  });
  
  console.log('✅ Backup database migrations completed successfully!');
} catch (error) {
  console.error('❌ Failed to run migrations on backup database:', error);
  process.exit(1);
}

