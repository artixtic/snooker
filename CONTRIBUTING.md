# Development Guide

## Architecture Overview

This is a monorepo POS system with:

- **Frontend**: Next.js 14 (App Router) with Material UI
- **Backend**: NestJS with Prisma ORM and PostgreSQL
- **Desktop**: Electron for native printer support
- **Offline**: Dexie.js (IndexedDB) with sync queue

## Key Design Patterns

### Offline-First Sync

1. All mutations are written to local IndexedDB first
2. Operations are queued in `sync_log` table
3. Background sync service pushes/pulls changes
4. Conflicts are detected server-side and returned for admin review

### Sync Flow Example

```typescript
// 1. Create product offline
await db.products.add(product);
await addToSyncQueue('product', 'create', product.id, product);

// 2. When online, sync service pushes
const result = await pushSyncQueue();
// Result contains conflicts if any

// 3. Server applies LWW (Last Writer Wins) or returns conflict
// 4. Client updates local state based on server response
```

### Conflict Resolution

- **Default**: Last Writer Wins (server timestamp wins)
- **Manual**: Admin reviews conflicts in `/admin/conflicts` page
- **Sales**: Append-only, no conflicts (each sale is a new record)

## Adding New Features

### Backend Module

1. Create module in `apps/backend/src/{module}/`
2. Add Prisma schema changes
3. Create DTOs for validation
4. Implement service with business logic
5. Add controller with routes
6. Update `app.module.ts`

### Frontend Feature

1. Create page in `apps/frontend/src/app/{route}/`
2. Add API hooks using React Query
3. Implement offline support with Dexie
4. Add to sync queue for mutations
5. Update navigation/routing

### Sync Integration

For a new entity to support offline sync:

1. Add to Prisma schema
2. Add to Dexie schema in `apps/frontend/src/lib/db.ts`
3. Implement sync handler in `apps/backend/src/sync/sync.service.ts`
4. Add pull handler for incoming changes

## Testing

### Unit Tests

```bash
cd apps/backend
pnpm test
```

### Sync Testing

1. Start app
2. Go offline (disable network)
3. Create/update entities
4. Check IndexedDB sync_log
5. Go online
6. Verify sync completion

## Code Style

- TypeScript strict mode
- ESLint + Prettier
- Prefer functional components
- Use React Query for server state
- Use Zustand for UI state only

## Database Migrations

```bash
cd apps/backend
pnpm prisma migrate dev --name migration_name
```

Always review generated migration before applying!

