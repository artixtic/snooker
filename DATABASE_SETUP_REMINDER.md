# Database Setup Required

## ⚠️ Current Status

The backend is running successfully, but it **cannot connect to the database** because PostgreSQL is not running.

Error: `Can't reach database server at localhost:5432`

## ✅ Quick Fix Options

### Option 1: Use Docker (Recommended)

1. **Install Docker Desktop** (if not already installed):
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop

2. **Start PostgreSQL with Docker**:
   ```powershell
   docker-compose up -d
   ```

3. **Run database migrations**:
   ```powershell
   cd apps\backend
   npm run prisma:migrate
   ```

4. **Seed the database** (optional):
   ```powershell
   npm run prisma:seed
   ```

### Option 2: Use Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   - Download from: https://www.postgresql.org/download/windows/
   - Install PostgreSQL (remember the password you set)

2. **Create database**:
   ```sql
   CREATE DATABASE snooker_pos;
   ```

3. **Update connection string** in `apps/backend/.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/snooker_pos"
   ```

4. **Run migrations**:
   ```powershell
   cd apps\backend
   npm run prisma:migrate
   npm run prisma:seed
   ```

## 📝 Environment Variables

Make sure `apps/backend/.env` has:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/snooker_pos"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

## 🔄 After Database Setup

The backend will automatically connect once PostgreSQL is running. No need to restart - NestJS will retry the connection.

## ✅ Current Working Status

- ✅ **Frontend**: Running on http://localhost:3003
- ✅ **Backend**: Running on http://localhost:3001 (but needs database)
- ✅ **Electron**: Running (but needs database for full functionality)
- ⚠️ **Database**: Not connected - needs setup

Once the database is set up, the entire system will be fully operational!

