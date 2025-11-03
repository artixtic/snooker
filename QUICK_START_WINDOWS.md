# ⚡ Quick Start - Windows

## 🚨 IMPORTANT: Database Setup Required

The project is starting, but **you need to set up PostgreSQL first** for the backend to work.

## Option 1: Install Docker Desktop (Easiest - 5 minutes)

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download Docker Desktop for Windows
   - Install it (requires Windows restart)

2. **After restart, start Docker Desktop:**
   - Wait for Docker to fully start (whale icon in system tray)

3. **Start the database:**
   ```powershell
   cd "C:\Users\HP PROBOOK 450 G10\Desktop\MahboobAhmed\Snooker"
   docker compose up -d
   ```

4. **Setup database:**
   ```powershell
   cd apps\backend
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Restart servers:**
   - The dev servers should auto-restart, or run: `npm run dev` from project root

## Option 2: Use Local PostgreSQL (10 minutes)

1. **Install PostgreSQL:**
   - Download from: https://www.postgresql.org/download/windows/
   - Install with default settings
   - **Remember the postgres user password!**

2. **Create database:**
   - Open pgAdmin (installed with PostgreSQL)
   - Right-click "Databases" → Create → Database
   - Name: `snooker_pos`
   - Click Save

3. **Update environment file:**
   - Edit: `apps\backend\.env`
   - Change DATABASE_URL to:
     ```
     DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/snooker_pos?schema=public"
     ```
   - Replace `YOUR_PASSWORD` with your PostgreSQL password

4. **Setup database:**
   ```powershell
   cd apps\backend
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Restart servers:**
   - Run: `npm run dev` from project root

## ✅ Once Database is Ready

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Login:** `admin` / `admin123`

## 🎯 Current Status

✅ Dependencies installed  
✅ Shared packages built  
✅ Environment files created  
✅ Development servers starting  
⏳ **Database connection required** - Follow steps above  

## 📝 Check Server Status

Open new PowerShell windows to check:

**Backend logs:**
```powershell
cd apps\backend
npm run dev
```

**Frontend logs:**
```powershell
cd apps\frontend
npm run dev
```

You'll see database connection errors until PostgreSQL is set up - this is normal!

