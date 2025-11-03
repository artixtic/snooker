# Windows Setup Guide - Snooker POS

Complete step-by-step guide to run the Snooker POS system on Windows.

## 📋 Prerequisites

### 1. Install Node.js
- Download Node.js 18.x or higher from: https://nodejs.org/
- Run the installer and follow the setup wizard
- Verify installation:
  ```powershell
  node --version
  npm --version
  ```

### 2. Install pnpm (Recommended) or use npm
**Option A: Install pnpm (Recommended)**
```powershell
npm install -g pnpm
```

**Option B: Use npm (comes with Node.js)**
- npm is already included with Node.js

### 3. Install Docker Desktop (Optional but Recommended)
- Download Docker Desktop for Windows: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop
- Verify installation:
  ```powershell
  docker --version
  docker-compose --version
  ```

**Alternative: Install PostgreSQL Manually**
If you don't want to use Docker:
1. Download PostgreSQL 15+ from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the postgres user password you set during installation
4. Update `DATABASE_URL` in `.env` accordingly

### 4. Install Git (Optional)
- Download from: https://git-scm.com/download/win
- Needed if cloning from repository

## 🚀 Setup Steps

### Step 1: Navigate to Project Directory

Open PowerShell or Command Prompt and navigate to the project:

```powershell
cd "C:\Users\HP PROBOOK 450 G10\Desktop\MahboobAhmed\Snooker"
```

### Step 2: Install Dependencies

**With pnpm:**
```powershell
pnpm install
```

**Or with npm:**
```powershell
npm install
```

This will install all dependencies for the root workspace and all apps/packages.

### Step 3: Install Cookie Parser Types (Backend)

```powershell
cd apps\backend
pnpm add -D @types/cookie-parser
# or with npm:
# npm install -D @types/cookie-parser
cd ..\..
```

### Step 4: Setup Environment Variables

**Backend Environment:**

Create `apps\backend\.env` file:
```powershell
cd apps\backend
Copy-Item .env.example .env
# Or manually create .env file
```

Edit `apps\backend\.env` with your settings:
```env
# Database (if using Docker)
DATABASE_URL="postgresql://snooker_user:snooker_pass@localhost:5432/snooker_pos?schema=public"

# Database (if using local PostgreSQL)
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/snooker_pos?schema=public"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS (Frontend URL)
CORS_ORIGIN="http://localhost:3000"
```

**Frontend Environment:**

Create `apps\frontend\.env.local` file:
```powershell
cd ..\frontend
# Create .env.local file manually or:
New-Item .env.local
```

Add to `apps\frontend\.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### Step 5: Start PostgreSQL Database

**Option A: Using Docker (Recommended)**
```powershell
# From project root
docker-compose up -d
```

Verify it's running:
```powershell
docker ps
```

**Option B: Using Local PostgreSQL**
1. Open pgAdmin or psql
2. Create a database named `snooker_pos`
3. Make sure PostgreSQL service is running
4. Update `DATABASE_URL` in `.env` with correct credentials

### Step 6: Setup Database Schema

```powershell
cd apps\backend

# Generate Prisma Client
pnpm prisma generate
# or: npm run prisma:generate

# Run migrations
pnpm prisma migrate dev
# or: npm run prisma:migrate

# Seed database with sample data
pnpm prisma db seed
# or: npm run prisma:seed
```

**Expected output:**
- ✅ Prisma Client generated
- ✅ Database migrations applied
- ✅ Sample data created (admin/admin123, employee/employee123, products, tables)

### Step 7: Build Shared Packages

```powershell
# From project root
cd packages\shared
pnpm build
# or: npm run build

cd ..\ui
pnpm build
# or: npm run build

cd ..\..
```

### Step 8: Start Development Servers

**Option A: Start All Services Together (Recommended)**

From project root:
```powershell
pnpm dev
# or: npm run dev
```

This will start:
- Backend on http://localhost:3001
- Frontend on http://localhost:3000
- Electron app (opens automatically)

**Option B: Start Services Separately**

Open **3 separate terminal windows**:

**Terminal 1 - Backend:**
```powershell
cd apps\backend
pnpm dev
# or: npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd apps\frontend
pnpm dev
# or: npm run dev
```

**Terminal 3 - Electron (after backend & frontend are running):**
```powershell
cd apps\electron
pnpm dev
# or: npm run dev
```

## 🌐 Access the Application

1. **Web Version:**
   - Open browser: http://localhost:3000
   - Login with: `admin` / `admin123`

2. **Electron Desktop App:**
   - Should open automatically after starting
   - If not, it will be available in `apps\electron\dist\`

## 🔧 Troubleshooting

### Issue: Port Already in Use

**Error:** `Port 3000 or 3001 is already in use`

**Solution:**
```powershell
# Find process using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

Or change ports in:
- Backend: `apps\backend\.env` (PORT=3001)
- Frontend: `apps\frontend\next.config.js`

### Issue: Docker Not Starting

**Error:** `Cannot connect to Docker daemon`

**Solutions:**
1. Make sure Docker Desktop is running
2. Restart Docker Desktop
3. Check Windows WSL 2 is enabled (Docker Desktop requirement)
4. Use local PostgreSQL instead (see Option B in Step 5)

### Issue: Prisma Migration Fails

**Error:** `Database connection failed`

**Solutions:**
1. Verify PostgreSQL is running:
   ```powershell
   docker ps  # If using Docker
   ```
2. Check `DATABASE_URL` in `apps\backend\.env`
3. Test connection:
   ```powershell
   cd apps\backend
   pnpm prisma db pull
   ```

### Issue: Module Not Found Errors

**Error:** `Cannot find module '@snooker-pos/shared'`

**Solution:**
```powershell
# Rebuild shared packages
cd packages\shared
pnpm build

cd ..\ui
pnpm build

cd ..\..
# Reinstall dependencies
pnpm install
```

### Issue: Cookie Parser Errors

**Error:** `Cannot find module 'cookie-parser'`

**Solution:**
```powershell
cd apps\backend
pnpm install cookie-parser
pnpm add -D @types/cookie-parser
```

### Issue: Next.js Build Errors

**Error:** `Module not found` or TypeScript errors

**Solution:**
```powershell
cd apps\frontend
# Clear Next.js cache
Remove-Item -Recurse -Force .next
# Reinstall
pnpm install
# Try again
pnpm dev
```

### Issue: Electron Not Starting

**Error:** `Cannot find module` or build errors

**Solution:**
```powershell
cd apps\electron
# Build first
pnpm build
# Then run
pnpm dev
```

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend starts on http://localhost:3001
- [ ] Frontend starts on http://localhost:3000
- [ ] Can access http://localhost:3000 in browser
- [ ] Login page appears
- [ ] Can login with `admin` / `admin123`
- [ ] POS page loads with products
- [ ] Can add items to cart
- [ ] Database connection works (check backend console)

## 📝 Quick Start Commands (Summary)

```powershell
# 1. Install dependencies
pnpm install

# 2. Start database
docker-compose up -d

# 3. Setup database
cd apps\backend
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
cd ..\..

# 4. Build shared packages
cd packages\shared && pnpm build && cd ..\ui && pnpm build && cd ..\..

# 5. Start everything
pnpm dev
```

## 🎯 Production Build (Windows)

To build for production:

```powershell
# Build frontend
cd apps\frontend
pnpm build

# Build backend
cd ..\backend
pnpm build

# Build Electron app (creates Windows installer)
cd ..\electron
pnpm build:electron
```

Output will be in `apps\electron\out\` directory.

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify all prerequisites are installed
3. Check environment variables are set correctly
4. Make sure all services are running
5. Review the troubleshooting section above

## 🎉 Success!

Once everything is running, you should see:
- ✅ Backend server running on port 3001
- ✅ Frontend server running on port 3000
- ✅ Electron app window opens
- ✅ Can login and use POS system

Enjoy your Snooker POS system! 🎱

