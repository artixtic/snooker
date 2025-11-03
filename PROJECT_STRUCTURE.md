# Project Structure

## Monorepo Layout

```
snooker-pos/
├── apps/
│   ├── frontend/              # Next.js App Router + MUI
│   │   ├── src/
│   │   │   ├── app/          # Pages (login, pos, admin)
│   │   │   ├── lib/          # DB, sync, API clients
│   │   │   └── theme.ts      # MUI theme
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── backend/               # NestJS API
│   │   ├── src/
│   │   │   ├── auth/         # JWT auth, guards, strategies
│   │   │   ├── users/        # User management
│   │   │   ├── products/     # Product CRUD
│   │   │   ├── sales/        # Sale creation (append-only)
│   │   │   ├── inventory/    # Stock movements
│   │   │   ├── tables/       # Table sessions
│   │   │   ├── shifts/       # Shift management
│   │   │   ├── sync/         # Offline sync (push/pull)
│   │   │   ├── reports/      # Daily reports
│   │   │   ├── activity-logs/# Audit logs
│   │   │   ├── websocket/    # Real-time updates
│   │   │   └── prisma/       # Prisma service
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema
│   │   │   └── seed.ts       # Sample data
│   │   └── package.json
│   │
│   └── electron/              # Electron main process
│       ├── src/
│       │   ├── main.ts       # Electron entry point
│       │   └── printer.ts    # ESC/POS printing
│       ├── preload/
│       │   └── preload.ts    # Secure IPC bridge
│       └── package.json
│
├── packages/
│   ├── shared/                # Shared TypeScript types
│   │   └── src/
│   │       ├── types.ts      # Entity types
│   │       ├── sync.ts       # Sync interfaces
│   │       └── entities.ts
│   │
│   └── ui/                    # Shared MUI components
│       └── src/
│
├── docker-compose.yml         # PostgreSQL container
├── package.json               # Root workspace config
├── README.md                  # Main documentation
├── SETUP.md                   # Setup instructions
└── CONTRIBUTING.md            # Development guide
```

## Key Files

### Backend

- **Prisma Schema**: `apps/backend/prisma/schema.prisma`
  - Models: User, Product, Sale, SaleItem, TableSession, Shift, InventoryMovement, SyncLog, ActivityLog

- **Sync Service**: `apps/backend/src/sync/sync.service.ts`
  - Handles push/pull operations
  - Conflict detection (LWW)
  - Transaction support

- **Auth**: `apps/backend/src/auth/`
  - JWT with refresh tokens
  - Role-based guards (ADMIN, EMPLOYEE)
  - HTTP-only cookies

### Frontend

- **Database**: `apps/frontend/src/lib/db.ts`
  - Dexie.js IndexedDB setup
  - Entity tables: products, sales, sync_log, etc.

- **Sync Service**: `apps/frontend/src/lib/sync.ts`
  - Queue management
  - Push/pull operations
  - Online/offline detection

- **API Client**: `apps/frontend/src/lib/api.ts`
  - Axios with auth interceptors
  - Automatic token refresh

### Electron

- **Main Process**: `apps/electron/src/main.ts`
  - Starts backend/frontend in production
  - IPC handlers for printer
  - Window management

- **Preload**: `apps/electron/preload/preload.ts`
  - Secure context bridge
  - Exposes: printer, app status, file export

## Database Schema Highlights

- **Products**: SKU, barcode, price, stock, version (optimistic locking)
- **Sales**: Append-only, includes receipt number, payment method
- **Tables**: Session tracking with per-hour billing
- **Shifts**: Cash reconciliation with discrepancy tracking
- **SyncLog**: Queue for offline operations

## API Endpoints

### Auth
- `POST /auth/login` - Login with username/password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout

### Products
- `GET /products?since=ISO_DATE` - List products (sync support)
- `POST /products` - Create product
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Soft delete

### Sales
- `POST /sales` - Create sale (append-only)
- `GET /sales/:id` - Get sale details
- `GET /sales` - List sales with filters

### Sync
- `POST /sync/push` - Push local changes
- `GET /sync/pull?since=ISO_DATE` - Pull server changes

### Tables
- `GET /tables` - List all tables
- `POST /tables/:id/start` - Start table session
- `POST /tables/:id/stop` - Stop table session
- `GET /tables/active` - Get active tables

### Shifts
- `POST /shifts/start` - Start shift
- `POST /shifts/:id/close` - Close shift

### Reports
- `GET /reports/daily?date=YYYY-MM-DD` - Daily sales report

## Next Steps

1. **Complete UI Pages**:
   - Enhance `/pos` page with full cart, payment, print functionality
   - Add `/admin/dashboard` with widgets
   - Add `/admin/products` management
   - Add `/admin/reports` with export
   - Add `/admin/conflicts` for sync conflict resolution

2. **Business Logic**:
   - Implement table timer calculations
   - Add discount rules
   - Implement tax calculations
   - Add barcode scanning UI

3. **Testing**:
   - Add more unit tests
   - Add E2E tests for critical flows
   - Test offline sync scenarios

4. **Production Ready**:
   - Environment-specific configs
   - Error monitoring (Sentry)
   - Logging strategy
   - Performance optimization

## Notes

- All timestamps use ISO 8601 format
- IDs use CUID (via Prisma)
- Soft deletes for most entities
- Version field on products for optimistic locking
- Sales are append-only (no updates, only new records or credit memos)

