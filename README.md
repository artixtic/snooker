# Snooker Club POS System

A complete, production-ready offline-first Point of Sale (POS) system for Snooker Clubs, built with Electron, Next.js, and NestJS.

## 🏗️ Architecture

- **Frontend**: Next.js (App Router) with Material UI v5
- **Backend**: NestJS with Prisma and PostgreSQL
- **Desktop**: Electron with native printer support
- **Offline**: Dexie.js (IndexedDB) with sync queue
- **Database**: PostgreSQL (Docker)

## 📋 Prerequisites

### macOS Requirements

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (recommended) or npm >= 9.0.0
- **Docker Desktop**: For running PostgreSQL (optional, can use local PostgreSQL)
- **Xcode Command Line Tools**: `xcode-select --install`

## 🚀 Quick Start

### Windows Users
**👉 See [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) for complete Windows-specific setup guide**

Quick start on Windows:
```powershell
# Run the automated setup script
.\WINDOWS_QUICK_START.ps1

# Then start the application
pnpm dev
```

### macOS/Linux Users

### 1. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 2. Setup Environment

Copy `.env.example` files and configure:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
```

Edit `apps/backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/snooker_pos"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key"
```

### 3. Start Database (Docker)

```bash
docker-compose up -d
```

Or use a local PostgreSQL instance (update `DATABASE_URL` accordingly).

### 4. Run Database Migrations

```bash
cd apps/backend
pnpm prisma migrate dev
pnpm prisma generate
```

### 5. Seed Sample Data

```bash
cd apps/backend
pnpm prisma db seed
```

This creates:
- Admin user: `admin` / `admin123`
- Employee user: `employee` / `employee123`
- Sample products and categories

### 6. Start Development

From the root directory:

```bash
pnpm dev
```

This starts:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- Electron: Launches automatically

## 📦 Project Structure

```
snooker-pos/
├── apps/
│   ├── frontend/          # Next.js renderer
│   ├── backend/           # NestJS API
│   └── electron/          # Electron main process
├── packages/
│   ├── shared/            # Shared TypeScript types
│   └── ui/                # Shared MUI components
├── docker-compose.yml
└── package.json
```

## 🛠️ Development Workflow

### Running Individual Services

```bash
# Backend only
pnpm dev:backend

# Frontend only
pnpm dev:frontend

# Electron only (requires frontend & backend running)
pnpm dev:electron
```

### Database Commands

```bash
cd apps/backend

# Create migration
pnpm prisma migrate dev --name migration_name

# Reset database
pnpm prisma migrate reset

# Open Prisma Studio
pnpm prisma studio

# Generate Prisma client
pnpm prisma generate
```

### Testing Offline Sync

1. Start the app in development
2. Open DevTools and go to Application → IndexedDB → `snooker_pos_db`
3. Make some offline changes (stop backend)
4. Create sales/products while offline
5. Check `sync_log` table in IndexedDB
6. Restart backend and observe sync

### Testing Printing

1. Connect a USB thermal printer (or use a network printer)
2. In Electron app, go to POS screen
3. Create a sale and click "Print Receipt"
4. Check Electron console for printer detection logs
5. For development, you can test with virtual printers using CUPS

## 📱 Key Features

### POS Functionality
- **Table Management**: Create/open/close tables with per-hour billing
- **Timer System**: Real-time table usage tracking with configurable rates
- **Cart System**: Add items, apply discounts, calculate taxes
- **Payment Processing**: Cash and card payments with change calculation
- **Receipt Printing**: ESC/POS thermal printer support and PDF receipts

### Offline-First Architecture
- **Local Database**: Dexie.js (IndexedDB) for offline operations
- **Sync Queue**: Automatic sync on reconnect
- **Conflict Resolution**: Last Writer Wins (LWW) with admin review UI
- **Multi-terminal Support**: Multiple devices can sync independently

### Inventory Management
- **Product Management**: CRUD operations for canteen items
- **Stock Tracking**: Inventory movements and adjustments
- **Barcode Support**: USB scanner and camera scanning
- **Low Stock Alerts**: Automatic notifications

### Shift Management
- **Shift Tracking**: Start/end shifts with employee assignment
- **Cash Reconciliation**: Opening and closing cash tracking
- **Shift Reports**: End-of-shift summaries and discrepancies

### Reports & Analytics
- **Daily Reports**: Sales summaries, table usage, top products
- **Export**: Excel (XLSX) and PDF formats
- **Activity Logs**: Audit trail for all operations

## 🔐 Authentication & Security

- **JWT Tokens**: Access and refresh tokens with HTTP-only cookies
- **Role-Based Access**: ADMIN and EMPLOYEE roles
- **Secure IPC**: Electron context isolation with preload scripts
- **Input Validation**: DTO validation with class-validator

## 📦 Packaging for macOS

### Build Production

```bash
# Build frontend and backend
pnpm build

# Package Electron app
pnpm build:electron
```

This creates a `.app` bundle in `apps/electron/out/`.

### Code Signing (Optional)

For distribution, configure code signing in `apps/electron/electron-builder.yml`:

```yaml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"
```

Then build with:

```bash
cd apps/electron
pnpm build:electron
```

## 🧪 Testing

### Backend Tests

```bash
cd apps/backend
pnpm test
pnpm test:watch
pnpm test:cov
```

### Frontend Tests

```bash
cd apps/frontend
pnpm test
```

## 📝 API Documentation

### Authentication

- `POST /auth/login` - Login with username/password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout

### Products

- `GET /products` - List products (with `?since=ISO_DATE` for sync)
- `POST /products` - Create product
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Sales

- `POST /sales` - Create sale (append-only)
- `GET /sales/:id` - Get sale details
- `GET /sales` - List sales with filters

### Sync

- `POST /sync/push` - Push local changes to server
- `GET /sync/pull?since=ISO_DATE` - Pull server changes

### Tables

- `GET /tables` - List all tables
- `POST /tables/:id/start` - Start table session
- `POST /tables/:id/stop` - Stop table session
- `GET /tables/active` - Get active tables

### Shifts

- `POST /shifts/start` - Start shift
- `POST /shifts/:id/close` - Close shift
- `GET /shifts` - List shifts

### Reports

- `GET /reports/daily?date=YYYY-MM-DD` - Daily sales report

## 🐛 Troubleshooting

### Database Connection Issues

1. Verify Docker is running: `docker ps`
2. Check PostgreSQL logs: `docker-compose logs db`
3. Verify `DATABASE_URL` in `.env` matches Docker settings

### Printer Not Detected

1. Check macOS System Preferences → Printers
2. Ensure printer driver is installed
3. Test with `lpstat -p` in terminal
4. Check Electron console for printer detection logs

### Sync Issues

1. Check `sync_log` table in IndexedDB (DevTools → Application)
2. Verify backend is running and accessible
3. Check network tab for failed sync requests
4. Review backend logs for conflict details

## 📄 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a proprietary project. Contact the development team for contribution guidelines.

