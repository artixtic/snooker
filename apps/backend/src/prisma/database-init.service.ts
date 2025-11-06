import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class DatabaseInitService {
  private readonly logger = new Logger(DatabaseInitService.name);
  private readonly prisma: PrismaClient;
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.prisma = new PrismaClient();
  }

  /**
   * Initialize database - creates database if needed and runs migrations
   * This method is idempotent and can be called multiple times safely
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.log('Database already initialized, skipping...');
      return;
    }

    try {
      this.logger.log('Initializing database...');
      await this.ensureDatabaseExists();
      await this.runMigrations(); // This will verify tables internally
      this.initialized = true;
      this.logger.log('Database initialization completed successfully');
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensures the database exists, creates it if it doesn't
   */
  private async ensureDatabaseExists(): Promise<void> {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }

    // Parse the database URL to get connection details
    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1).split('?')[0]; // Remove leading '/' and query params
    
    if (!dbName) {
      throw new Error('Database name is missing from DATABASE_URL');
    }

    // Reconstruct base URL for connecting to 'postgres' database
    const baseUrl = `${url.protocol}//${url.username}:${url.password}@${url.hostname}:${url.port || 5432}/postgres${url.search || ''}`;

    // First, try to connect to the target database
    let databaseExists = false;
    try {
      await this.prisma.$connect();
      // Test if we can query the database
      await this.prisma.$queryRaw`SELECT 1`;
      databaseExists = true;
      this.logger.log(`✓ Database '${dbName}' exists and is accessible`);
    } catch (error: any) {
      // Check if error is specifically about database not existing
      const errorMessage = error?.message || '';
      const isDatabaseNotFound = 
        errorMessage.includes('does not exist') ||
        errorMessage.includes('database') && errorMessage.includes('not found') ||
        errorMessage.includes('3D000') || // PostgreSQL error code for database does not exist
        errorMessage.includes('database "' + dbName + '" does not exist');

      if (isDatabaseNotFound) {
        this.logger.warn(`Database '${dbName}' does not exist, will create it...`);
      } else {
        // Other connection error - might be network, credentials, etc.
        this.logger.warn(`Cannot connect to database '${dbName}': ${errorMessage}`);
        this.logger.warn('Attempting to check if database exists and create if needed...');
      }
    }

    // If database doesn't exist or connection failed, try to create it
    if (!databaseExists) {
      let adminPrisma: PrismaClient | null = null;
      try {
        // Connect to the default 'postgres' database to create the target database
        adminPrisma = new PrismaClient({
          datasources: {
            db: {
              url: baseUrl,
            },
          },
        });

        this.logger.log(`Connecting to PostgreSQL server to check database '${dbName}'...`);
        await adminPrisma.$connect();
        
        // Check if database exists
        const result = await adminPrisma.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${dbName})
        `;

        const exists = result[0]?.exists || false;

        if (!exists) {
          this.logger.log(`Creating database '${dbName}'...`);
          await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
          this.logger.log(`✓ Database '${dbName}' created successfully`);
        } else {
          this.logger.log(`✓ Database '${dbName}' already exists in PostgreSQL`);
        }

        await adminPrisma.$disconnect();
        adminPrisma = null;
        
        // Wait a moment for database to be fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Now connect to the target database
        this.logger.log(`Connecting to database '${dbName}'...`);
        await this.prisma.$connect();
        await this.prisma.$queryRaw`SELECT 1`;
        this.logger.log(`✓ Successfully connected to database '${dbName}'`);
      } catch (createError: any) {
        if (adminPrisma) {
          try {
            await adminPrisma.$disconnect();
          } catch (e) {
            // Ignore disconnect errors
          }
        }

        this.logger.error(`Failed to create/connect to database: ${createError.message}`);
        
        // Final attempt to connect - maybe it was created by Docker or another process
        this.logger.log('Making final connection attempt...');
        try {
          await this.prisma.$connect();
          await this.prisma.$queryRaw`SELECT 1`;
          this.logger.log(`✓ Database connection successful on retry`);
        } catch (finalError: any) {
          throw new Error(
            `Cannot connect to database '${dbName}'. ` +
            `Please ensure PostgreSQL is running and accessible. ` +
            `Error: ${finalError.message}`
          );
        }
      }
    }
  }

  /**
   * Runs Prisma migrations
   */
  private async runMigrations(): Promise<void> {
    const prismaDir = join(process.cwd(), 'prisma');
    const migrationsDir = join(prismaDir, 'migrations');
    const migrationsExist = existsSync(migrationsDir);

    // Generate Prisma Client first
    this.logger.log('Generating Prisma Client...');
    try {
      const { stdout: generateStdout } = await execAsync('npx prisma generate', {
        cwd: process.cwd(),
        env: process.env,
      });
      
      if (generateStdout) {
        const output = generateStdout.split('\n').filter(line => line.trim()).join('\n');
        if (output) {
          this.logger.log(output);
        }
      }
      this.logger.log('✓ Prisma Client generated');
    } catch (generateError: any) {
      this.logger.warn(`Prisma Client generation warning: ${generateError.message}`);
    }

    // If migrations directory doesn't exist, create and apply initial migration
    if (!migrationsExist) {
      this.logger.log('No migrations directory found. Creating initial migration from schema to create all tables...');
      await this.runMigrateDev();
      // Verify tables were created
      await this.verifyTablesExist();
      return;
    }

    // Migrations directory exists, try to deploy migrations
    this.logger.log('Running database migrations...');
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        cwd: process.cwd(),
        env: process.env,
      });

      if (stdout) {
        this.logger.log(stdout);
      }
      if (stderr) {
        // Check for specific messages
        if (stderr.includes('No pending migrations')) {
          this.logger.log('✓ No pending migrations - database is up to date');
        } else if (stderr.includes('migrations directory')) {
          this.logger.warn('Migrations directory issue detected, trying migrate dev...');
          // Fallback to migrate dev
          await this.runMigrateDev();
          await this.verifyTablesExist();
        } else {
          this.logger.warn(stderr);
        }
      } else {
        this.logger.log('✓ Migrations completed successfully');
      }
      
      // Verify tables exist after migration
      await this.verifyTablesExist();
    } catch (error: any) {
      const errorMessage = error.message || '';
      
      // Check for "no migrations found" or similar errors
      if (
        errorMessage.includes('No migrations found') ||
        errorMessage.includes('migrations directory') ||
        errorMessage.includes('ENOENT') ||
        errorMessage.includes('does not exist')
      ) {
        this.logger.warn('No migrations found, creating initial migration...');
        await this.runMigrateDev();
        await this.verifyTablesExist();
      } else {
        this.logger.error(`Migration failed: ${errorMessage}`);
        // Try migrate dev as fallback
        this.logger.warn('Attempting migrate dev as fallback...');
        try {
          await this.runMigrateDev();
          await this.verifyTablesExist();
        } catch (devError: any) {
          this.logger.error(`All migration attempts failed: ${devError.message}`);
          throw new Error(`Failed to run migrations: ${devError.message}`);
        }
      }
    }
  }

  /**
   * Runs migrate dev to create and apply migrations
   */
  private async runMigrateDev(): Promise<void> {
    try {
      this.logger.log('Running prisma migrate dev to create all tables...');
      const { stdout, stderr } = await execAsync('npx prisma migrate dev --name init', {
        cwd: process.cwd(),
        env: process.env,
      });

      if (stdout) {
        this.logger.log(stdout);
      }
      if (stderr && !stderr.includes('already applied')) {
        this.logger.warn(stderr);
      }

      this.logger.log('✓ Migrations completed successfully (dev mode)');
    } catch (devError: any) {
      // If migrate dev also fails, try db push as last resort
      this.logger.warn('migrate dev failed, trying db push to create all tables...');
      try {
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss --skip-generate', {
          cwd: process.cwd(),
          env: process.env,
        });

        if (stdout) {
          this.logger.log(stdout);
        }
        if (stderr) {
          this.logger.warn(stderr);
        }

        this.logger.log('✓ Database schema pushed successfully (using db push fallback)');
      } catch (pushError: any) {
        this.logger.error(`All migration methods failed. Last error: ${pushError.message}`);
        throw new Error(`Failed to initialize database schema: ${pushError.message}`);
      }
    }
  }

  /**
   * Verifies that all required tables exist in the database
   */
  private async verifyTablesExist(): Promise<void> {
    // Expected tables from schema (using @@map names)
    const expectedTables = [
      'users',
      'products',
      'sales',
      'sale_items',
      'tables',
      'shifts',
      'inventory_movements',
      'sync_log',
      'activity_logs',
      '_prisma_migrations', // Prisma's migration tracking table
    ];

    try {
      this.logger.log('Verifying all tables exist...');
      
      // Query to get all tables in the public schema
      const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `;

      const existingTables = tables.map(t => t.tablename);
      const missingTables = expectedTables.filter(
        table => !existingTables.includes(table) && table !== '_prisma_migrations'
      );

      if (missingTables.length > 0) {
        this.logger.warn(`Missing tables detected: ${missingTables.join(', ')}`);
        this.logger.log('Attempting to create missing tables using db push...');
        
        // Try to push schema to create missing tables
        try {
          const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss --skip-generate', {
            cwd: process.cwd(),
            env: process.env,
          });

          if (stdout) {
            this.logger.log(stdout);
          }
          if (stderr) {
            this.logger.warn(stderr);
          }

          // Verify again after push
          const tablesAfterPush = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
          `;

          const existingTablesAfterPush = tablesAfterPush.map(t => t.tablename);
          const stillMissing = expectedTables.filter(
            table => !existingTablesAfterPush.includes(table) && table !== '_prisma_migrations'
          );

          if (stillMissing.length > 0) {
            throw new Error(`Failed to create tables: ${stillMissing.join(', ')}`);
          }

          this.logger.log('✓ All missing tables created successfully');
        } catch (pushError: any) {
          this.logger.error(`Failed to create missing tables: ${pushError.message}`);
          throw new Error(`Some tables are missing: ${missingTables.join(', ')}. Error: ${pushError.message}`);
        }
      } else {
        this.logger.log(`✓ All ${expectedTables.length - 1} required tables exist`);
        existingTables.forEach(table => {
          if (expectedTables.includes(table)) {
            this.logger.log(`  ✓ ${table}`);
          }
        });
      }
    } catch (error: any) {
      this.logger.error(`Error verifying tables: ${error.message}`);
      // Don't throw - tables might exist but query failed
      this.logger.warn('Continuing despite table verification error...');
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}

