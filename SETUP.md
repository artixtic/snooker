# Setup Instructions

## Prerequisites

1. **Node.js** >= 18.0.0
2. **pnpm** >= 8.0.0 (or npm >= 9.0.0)
3. **Docker Desktop** (for PostgreSQL)
4. **macOS** development environment

## Initial Setup

### 1. Install Dependencies

```bash
# From root directory
pnpm install
```

### 2. Setup Environment Variables

```bash
# Backend
cd apps/backend
cp .env.example .env
# Edit .env with your database credentials
# Optional: Add BACKUP_DATABASE_URL for automatic backups (see BACKUP_CONFIG.md)

# Frontend (optional, defaults work for dev)
cd ../frontend
cp .env.example .env.local
```

**Backend Environment Variables:**
- `DATABASE_URL` - Main PostgreSQL database connection string (required)
- `BACKUP_DATABASE_URL` - Backup PostgreSQL database connection string (optional, see `BACKUP_CONFIG.md`)
- `PORT` - Backend server port (default: 3001)
- `CORS_ORIGIN` - Frontend origin URL (default: http://localhost:3000)
- `JWT_SECRET` - Secret key for JWT tokens (required)

### 3. Start Database

```bash
# From root
docker-compose up -d
```

### 4. Run Database Migrations

```bash
cd apps/backend
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
```

### 5. Build Shared Packages

```bash
# From root
cd packages/shared
pnpm build

cd ../ui
pnpm build
```

## Development

### Run All Services

```bash
# From root
pnpm dev
```

This starts:
- Backend on http://localhost:3001
- Frontend on http://localhost:3000
- Electron app (opens automatically)

### Run Individual Services

```bash
# Backend only
pnpm dev:backend

# Frontend only
pnpm dev:frontend

# Electron only (requires backend & frontend running)
pnpm dev:electron
```

## Building for Production

```bash
# Build all
pnpm build

# Build Electron app
pnpm build:electron
```

## Testing

```bash
# Backend tests
cd apps/backend
pnpm test

# With coverage
pnpm test:cov
```

## Troubleshooting

### Database Connection Issues

1. Ensure Docker is running: `docker ps`
2. Check PostgreSQL logs: `docker-compose logs db`
3. Verify `DATABASE_URL` in `apps/backend/.env`

### Port Already in Use

If ports 3000 or 3001 are in use, either:
- Kill the process using the port
- Update ports in config files

### Sync Issues

1. Check browser DevTools → Application → IndexedDB → `snooker_pos_db`
2. Verify sync_log table for pending operations
3. Check network tab for failed API calls

### Printer Not Working

1. Ensure printer driver is installed on macOS
2. Check System Preferences → Printers
3. Test with `lpstat -p` command
4. Check Electron console logs

