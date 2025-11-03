# Database Setup Instructions

## ⚠️ Database Connection Required

The application requires a PostgreSQL database to run. You have two options:

## Option 1: Docker (Recommended - Easiest)

1. **Install Docker Desktop for Windows:**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop
   - Wait for it to fully start (whale icon in system tray)

2. **Start the database:**
   ```powershell
   cd "C:\Users\HP PROBOOK 450 G10\Desktop\MahboobAhmed\Snooker"
   docker compose up -d
   ```

3. **Verify it's running:**
   ```powershell
   docker ps
   ```
   You should see a container named `snooker_pos_db` running.

4. **Run migrations:**
   ```powershell
   cd apps\backend
   npm run prisma:migrate
   npm run prisma:seed
   ```

## Option 2: Local PostgreSQL

1. **Install PostgreSQL 15+:**
   - Download from: https://www.postgresql.org/download/windows/
   - Install with default settings
   - Remember the postgres user password

2. **Create the database:**
   - Open pgAdmin or psql
   - Create a new database named `snooker_pos`
   - Or run: `CREATE DATABASE snooker_pos;`

3. **Update .env file:**
   Edit `apps\backend\.env` and update DATABASE_URL:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/snooker_pos?schema=public"
   ```
   Replace `YOUR_PASSWORD` with your PostgreSQL password.

4. **Run migrations:**
   ```powershell
   cd apps\backend
   npm run prisma:migrate
   npm run prisma:seed
   ```

## After Database is Running

Once the database is set up, you can continue with:
```powershell
# Start the development servers
cd "C:\Users\HP PROBOOK 450 G10\Desktop\MahboobAhmed\Snooker"
npm run dev
```

