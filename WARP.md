# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

---

## Tooling & Commands

### Package manager & prerequisites
- Node.js   18
- `pnpm` is the recommended package manager (repo is a JS/TS monorepo using npm-style workspaces).

### Install dependencies
- From repo root:
  - `pnpm install`
  - Or `make install` (wrapper around `pnpm install`).

### Run the full app in development
- From repo root:
  - `pnpm dev`
    - Runs backend, frontend, and Electron together via `concurrently`.
  - Or `make dev` (wrapper around `pnpm dev`).
- Dev ports & app entry points:
  - Backend API: `http://localhost:3001`
  - Frontend (Next.js): `http://localhost:3000`
  - Electron desktop shell: launched automatically.

### Run individual services
From repo root:
- Backend only: `pnpm dev:backend`
- Frontend only: `pnpm dev:frontend`
- Electron only (expects backend & frontend already running): `pnpm dev:electron`

### Build & production
From repo root:
- Build backend + frontend (dev-oriented build):
  - `pnpm build`
- Production builds:
  - Backend: `pnpm build:prod --workspace=apps/backend`
  - Frontend: `pnpm build:prod --workspace=apps/frontend`
  - Electron: `pnpm build:electron`
- Combined production workflows:
  - API + frontend only: `pnpm start:prod` (builds and starts backend + frontend).
  - All three (backend, frontend, Electron) end-to-end:
    - `pnpm start:prod:all`
    - Or `pnpm prod` (builds and then runs the same pipeline).
- Makefile wrappers:
  - `make build`  `pnpm build` + `pnpm build:electron`.

### Database & Prisma
- Start PostgreSQL via Docker (recommended):
  - `make docker-up`
  - Stop: `make docker-down`
- Create & apply dev migrations:
  - `cd apps/backend`
  - `pnpm prisma migrate dev`
  - Generate client: `pnpm prisma generate`
- Seed sample data (users, products, games, tables):
  - `cd apps/backend`
  - `pnpm prisma db seed` (also exposed via Makefile: `make seed`).
- Other useful backend scripts (run from `apps/backend`):
  - `pnpm prisma:studio`  Prisma Studio GUI
  - `pnpm prisma:clear`  clear database via custom script
  - `pnpm prisma:migrate` / `pnpm prisma:migrate:prod` / `pnpm prisma:generate:prod` for more advanced flows.

### Testing
**Backend (NestJS + Jest)**
- From `apps/backend`:
  - All tests: `pnpm test`
  - Watch mode: `pnpm test:watch`
  - Coverage: `pnpm test:cov`
  - E2E tests: `pnpm test:e2e`
- Run a single backend test file or pattern (uses Jests pattern matching):
  - `pnpm test -- tables`  runs tests whose file or suite names match `tables`.
  - Or `pnpm test -- path/to/your.test.ts`.

**Frontend (Next.js + Vitest)**
- From `apps/frontend`:
  - All tests: `pnpm test`
  - Watch mode: `pnpm test:watch`
  - Vitest UI: `pnpm test:ui`
- Run a single frontend test file or test name:
  - `pnpm test -- src/components/SomeComponent.test.tsx`
  - `pnpm test -- -t "matches table totals"`

**Monorepo-wide tests**
- From repo root:
  - `pnpm test` (runs `npm run test --workspaces`).
  - Makefile shortcut: `make test`.

### Linting & formatting
- Frontend lint (Next.js):
  - From `apps/frontend`: `pnpm lint`
- Backend lint (ESLint):
  - From `apps/backend`: `pnpm lint`
- Monorepo lint (delegates to workspaces):
  - From root: `pnpm lint`
- Backend formatting:
  - From `apps/backend`: `pnpm format` (Prettier on `src` and `test`).

### Cleaning
- From repo root:
  - `make clean` (removes `node_modules`, build artifacts, `.next`, Electron build output).

### Environment & configuration
- Backend env (NestJS + Prisma):
  - Base file: `apps/backend/.env` (copy from `.env.example`)
  - Key vars (see `.env.example`): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `CORS_ORIGIN`.
  - In production, `ConfigModule` reads `.env.production` when `NODE_ENV=production`.
- Frontend env (Next.js):
  - `apps/frontend/.env.local` (copy from `.env.example`).
  - Public endpoint vars include `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` (used by React Query / Socket.io clients).
- Default dev ports (matching code):
  - Backend: `3001`
  - Frontend: `3000`
  - Production scripts expect API on `4001` and frontend on `4000`.

### Seeded data & test credentials
- After running backend migrations + seed, you get:
  - Admin user: `admin` / `admin123`
  - Employee user: `employee` / `employee123`
  - Sample products, categories, games, and tables in AVAILABLE state.
- These are useful for manual testing, E2E flows, and reproducing POS scenarios.

---

## High-Level Architecture & Data Flow

### Monorepo layout
- `apps/frontend`  Next.js 14 (App Router) client UI for the POS.
- `apps/backend`  NestJS API server with Prisma + PostgreSQL.
- `apps/electron`  Electron shell that wraps the Next.js frontend and coordinates local processes + printing.
- `packages/shared`  shared TypeScript types, entities, and sync-related helpers used across apps.
- `packages/ui`  shared UI component library built on Material UI.

The root `package.json` defines workspace scripts that orchestrate these, and the `Makefile` wraps the most common flows (install, dev, build, test, DB, Docker).

### Backend (NestJS + Prisma)
- Entrypoint:
  - `apps/backend/src/main.ts` bootstraps Nest with:
    - `ConfigModule` for environment configuration.
    - Global `ValidationPipe` (whitelists properties, rejects unknown fields, auto-transforms DTOs).
    - CORS configured from env (`CORS_ORIGIN`, default `http://localhost:3000`), credentials enabled.
    - `cookie-parser` middleware for handling refresh tokens.
- Root module:
  - `apps/backend/src/app.module.ts` wires the domain modules and infrastructure:
    - Infrastructure: `PrismaModule`, `WebSocketModule`, `SyncModule`, `BackupModule`.
    - Auth & users: `AuthModule`, `UsersModule`.
    - Core POS domains: `GamesModule`, `TablesModule`, `SalesModule`, `ShiftsModule`, `InventoryModule`, `ProductsModule`, `ExpensesModule`, `ReportsModule`, `BookingsModule`, `TableMaintenanceModule`, `TableRateRulesModule`, `KitchenOrdersModule`, `MatchesModule`, `TournamentsModule`, `ActivityLogsModule`.
- Each domain module (e.g. `games`, `tables`, `sales`, `shifts`, `reports`) follows a standard Nest pattern:
  - `*.module.ts` registers the corresponding controller + service and, where needed, exports the service.
  - Controllers expose the REST API described in `README.md` (auth, games, tables, sales, shifts, reports, etc.).
  - Services encapsulate business logic and talk to Prisma via `PrismaModule`.
- Sync & real-time behavior:
  - `SyncModule` + `SyncService` handle offline sync queues from clients (Dexie/IndexedDB on the frontend), resolving conflicts server-side.
  - `WebSocketModule` exposes a `WebSocketGateway` wrapping Socket.io for real-time updates to terminals (table state changes, sales, shift status, etc.).
- Reporting & analytics:
  - `ReportsModule` uses `PrismaModule` directly to aggregate data for daily/custom reports, tax breakdowns, and revenue summaries (as described under "Reports & Analytics" in `README.md`).

When changing domain behavior, prefer working within the relevant Nest module + service, keeping DTO validation and Prisma-specific details encapsulated there.

### Frontend (Next.js App Router + offline-first client)
- App entry & shell:
  - `apps/frontend/src/app/layout.tsx` defines the root layout:
    - Registers global providers via `Providers` (React Query, theme, etc.).
    - Wraps the app in an `ErrorBoundary` component.
    - Includes `UnregisterServiceWorker` and an inline script to aggressively unregister any service workers and suppress Electron-specific service worker storage errors (important for the Electron environment).
    - Injects a `DragEventFix` and a small script that initializes `window.dragEvent` early, working around Electron drag/drop issues.
  - `apps/frontend/src/app/page.tsx` is the initial route that immediately redirects:
    - If `localStorage.accessToken` exists, it navigates to `/dashboard`.
    - Otherwise it navigates to `/login`.
- State management:
  - Zustand stores live under `apps/frontend/src/store`.
  - Example: `cart-store.ts` manages the POS cart:
    - Persists cart state in `localStorage` under `snooker-pos-cart` via `zustand/middleware` + `createJSONStorage`.
    - Tracks cart items, linked `tableId`, subtotal, discount, tax, and total.
    - Computes per-item and total tax with a centralized `TAX_RATE` (currently 15%).
    - Exposes methods like `addItem`, `removeItem`, `updateQuantity`, `updateDiscount`, `applyGlobalDiscount`, `clearCart`, and `calculateTotals`.
  - Other stores (not shown here) manage tables, shifts, offline queues, and user/session state.
- Data fetching & offline behavior:
  - React Query handles API calls to the Nest backend (`NEXT_PUBLIC_API_URL`) and caching.
  - Dexie.js wraps IndexedDB for offline-first storage; changes are queued locally and sent to the backend via the sync endpoints when connectivity returns.
  - UI components surface the offline state and conflict resolutions described in `README.md` (e.g., Last Writer Wins with admin review).
- UI & flows:
  - Material UI + a shared `@snooker-pos/ui` library provide consistent styling and components (e.g., game cards, tables, reports, dialogs).
  - Main functional areas (as documented in `README.md`):
    - Game management, table management, POS checkout, shift management, reports & analytics, inventory.
  - For most user flows, the sequence is:
    - Start shift > manage games > create tables > start table sessions > add canteen items > checkout > close shift > generate reports.

When adding new UI, decide whether the feature belongs in the main dashboard/shift flow (tables, POS, checkout) or in an "Add-ons" section (reporting, back-office utilities), and try to reuse shared UI components from `packages/ui`.

### Electron desktop shell
- Entrypoint: `apps/electron/src/main.ts`.
- Responsibilities:
  - Creates the main `BrowserWindow` sized for POS usage (1400x900) and loads the frontend:
    - Dev mode (`NODE_ENV !== 'production'`): loads `FRONTEND_URL` (default `http://localhost:3000`) and opens DevTools.
    - Production: loads a built frontend bundle from the filesystem.
  - Navigation safety:
    - Intercepts `will-navigate` events and blocks navigation to non-local origins to prevent the app from being hijacked via external links.
  - Drag & drop hardening:
    - On `dom-ready`, injects JavaScript to prevent dragover/drop events from opening files and to neutralize problematic drag events.
  - Backend orchestration:
    - Maintains `backendProcess` and `frontendProcess` child process references.
    - In production, starts the backend from the built `backend/dist/main.js` and tears it down when the app quits.
    - In dev, backend and frontend are expected to be started externally (`pnpm dev`); Electron just delays window creation to give them time to boot.
  - Printing & IPC:
    - Registers IPC handlers:
      - `printer:list`  uses `listPrinters()` to enumerate connected printers.
      - `printer:print`  uses `printReceipt(data)` to send ESC/POS print jobs.
      - `app:status`  reports basic health (online flag and whether the backend process is alive).

Any changes to how the app is started or how printers work should be coordinated between the Electron main process, the frontend (which sends IPC calls), and the backend (which supplies data for receipts).

### Shared packages
- `packages/shared`:
  - Exports shared types and entities via `src/index.ts`:
    - `export * from './types';`
    - `export * from './sync';`
    - `export * from './entities';`
  - Intended as the canonical source for:
    - Domain entities shared between backend and frontend (e.g., Game, Table, Sale, Shift, Product, Expense).
    - Sync-related DTOs and queue formats used by Dexie and the backend sync endpoints.
  - When introducing new cross-cutting domain models or sync payloads, define them here so both frontend and backend stay aligned.
- `packages/ui`:
  - Wraps Material UI with project-specific components and styles.
  - Built with `tsc`, exposes `dist/index.js` and `.d.ts` types.
  - Shared between the Next.js frontend and (potentially) other UIs that require the same component set.

---

## Domain Concepts (from README)

These concepts are central to how the system is structured and are implemented across multiple modules and layers:
- **Game**: A game type (Snooker, Table Tennis, PlayStation, etc.) with rate configuration (per-minute, per-hour) and other defaults.
- **Table**: Physical playing surface/station tied to a `Game`, with status lifecycle: AVAILABLE, OCCUPIED, PAUSED, RESERVED. Backend `TablesModule` and frontend dashboard components both reflect this state.
- **Sale & SaleItem**: Represent POS transactions combining table time and canteen items, including per-item tax and discounts. Implemented via backend `SalesModule` + frontend cart / checkout UI.
- **Shift**: Work session for a staff member, including opening cash, cash sales, expenses, expected vs. closing cash, and discrepancies. Implemented via backend `ShiftsModule` and frontend shift screens.
- **Product & Inventory**: Canteen products with categories, stock tracking, low stock alerts, and validation on checkout. Implemented via `ProductsModule` + `InventoryModule` and corresponding frontend views.
- **Reports**: Aggregated views over sales/shifts/products, including daily and custom date range reports with tax breakdowns and sessions per game. Implemented via `ReportsModule` and reporting UI.
- **Offline sync & multi-terminal**: Clients operate on Dexie/IndexedDB, queue changes, and sync with the backend via sync endpoints and Socket.io-based updates; conflict resolution is last-writer-wins with admin review tooling.

Understanding how these concepts map across backend modules, shared types, and frontend stores/components is key to making non-trivial changes safely.