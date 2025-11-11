# Building a Production-Ready Snooker Club POS System: A Journey with Modern Web Technologies and AI-Assisted Development

*How I built a complete offline-first Point of Sale system using Electron, Next.js, NestJS, and Cursor AI*

---

## Introduction

Running a snooker club isn't just about maintaining tables and serving drinks—it's about managing complex operations: tracking table usage by the minute, handling canteen sales, managing inventory, reconciling cash at shift end, and generating detailed reports. Traditional POS systems are expensive, often require internet connectivity, and rarely cater to the unique needs of recreational facilities.

That's why I decided to build a custom POS system from scratch—one that's tailored specifically for snooker clubs, works offline, and provides real-time insights into business operations. And I did it with the help of **Cursor**, an AI-powered code editor that transformed my development workflow.

In this article, I'll walk you through the architecture, key features, and most importantly, how leveraging Cursor's AI capabilities accelerated development while maintaining code quality.

---

## The Challenge

Snooker clubs have unique requirements that generic POS systems don't address:

1. **Time-based billing**: Tables are charged per minute or per hour, requiring real-time timer tracking
2. **Multiple game types**: Snooker, Table Tennis, PlayStation, Foosball—each with different rate structures
3. **Offline-first operation**: Internet connectivity can be unreliable, but business must continue
4. **Complex tax calculations**: Separate tax handling for table charges and canteen items
5. **Shift management**: Cash reconciliation with opening/closing amounts and discrepancy tracking
6. **Game-based reporting**: Revenue breakdown by game type with detailed tax information

---

## The Solution: A Modern Tech Stack

I chose a modern, full-stack architecture that balances performance, developer experience, and offline capabilities:

### Frontend
- **Next.js 14** (App Router) - React framework with server-side rendering
- **Material UI v5** - Beautiful, accessible component library
- **React Query** - Efficient data fetching and caching
- **Dexie.js** - IndexedDB wrapper for offline storage

### Backend
- **NestJS** - Enterprise-grade Node.js framework
- **Prisma** - Type-safe ORM with excellent developer experience
- **PostgreSQL** - Robust relational database
- **JWT Authentication** - Secure token-based auth with refresh tokens

### Desktop
- **Electron** - Cross-platform desktop application
- **ESC/POS** - Thermal printer support for receipts

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Desktop App                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   Backend    │  │   Printer    │     │
│  │   Next.js    │◄─┤   NestJS     │  │   Support    │     │
│  │              │  │              │  │              │     │
│  │  Material UI │  │   Prisma     │  │  ESC/POS     │     │
│  │  React Query │  │   PostgreSQL │  │  PDF Export  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                                │
│         └──────────────────┘                                │
│                    │                                        │
│         ┌──────────▼──────────┐                            │
│         │   IndexedDB (Dexie) │                            │
│         │   Offline Storage   │                            │
│         └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Game-Based Table Management

The system supports multiple game types, each with its own rate structure:

```typescript
// Game model with flexible rate types
model Game {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  rateType    RateType // PER_MINUTE or PER_HOUR
  defaultRate Decimal
  isActive    Boolean  @default(true)
  tables      Table[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum RateType {
  PER_MINUTE
  PER_HOUR
}
```

Tables are dynamically linked to games, and the UI groups them accordingly:

```typescript
// Real-time charge calculation based on game rate type
calculateCurrentCharge(table: Table): number {
  const elapsed = this.getElapsedTime(table);
  const rate = Number(table.ratePerHour || table.game.defaultRate);
  
  if (table.game.rateType === 'PER_HOUR') {
    return Math.ceil((elapsed / 3600000) * rate);
  } else {
    return Math.ceil((elapsed / 60000) * rate);
  }
}
```

### 2. Offline-First Architecture

All operations work offline using IndexedDB, with automatic sync when connectivity is restored:

```typescript
// Offline-first sale creation
async createSale(saleData: CreateSaleDto) {
  // 1. Save to local IndexedDB immediately
  const localSale = await db.sales.add({
    ...saleData,
    synced: false,
    createdAt: new Date(),
  });
  
  // 2. Queue for sync
  await addToSyncQueue('sale', 'create', localSale.id, saleData);
  
  // 3. Attempt immediate sync (if online)
  if (navigator.onLine) {
    await syncService.pushSyncQueue();
  }
  
  return localSale;
}
```

### 3. Complex Tax Calculations

The system handles separate tax calculations for table charges and canteen items:

```typescript
// Backend: Separate tax calculation
async createSale(dto: CreateSaleDto) {
  let tableTax = 0;
  let canteenTax = 0;
  
  // Calculate table tax
  if (dto.applyTaxToTable && dto.tableCharge) {
    tableTax = Math.ceil(Number(dto.tableCharge) * 0.15);
  }
  
  // Calculate canteen tax per item
  dto.items.forEach(item => {
    if (item.applyTax) {
      const itemTax = Math.ceil(Number(item.subtotal) * 0.15);
      canteenTax += itemTax;
      item.tax = itemTax;
    }
  });
  
  const totalTax = tableTax + canteenTax;
  const total = Number(dto.subtotal) + totalTax;
  
  return this.prisma.sale.create({
    data: {
      ...dto,
      tax: totalTax,
      total,
    },
  });
}
```

### 4. Shift Management with Cash Reconciliation

Shift closing includes comprehensive cash reconciliation:

```typescript
async closeShift(id: string, dto: CloseShiftDto) {
  // Validate all tables are closed
  const activeTables = await this.prisma.tableSession.findMany({
    where: {
      status: { in: ['OCCUPIED', 'PAUSED'] },
    },
  });
  
  if (activeTables.length > 0) {
    throw new BadRequestException(
      `Cannot close shift. ${activeTables.length} table(s) still active.`
    );
  }
  
  // Calculate expected cash
  const shift = await this.findOne(id);
  const cashSales = await this.getCashSalesTotal(shift.startedAt);
  const expenses = await this.getExpensesTotal(shift.startedAt);
  
  const expectedCash = 
    Number(shift.openingCash) + cashSales - expenses;
  const cashDiscrepancy = 
    Number(dto.closingCash) - expectedCash;
  
  return this.prisma.shift.update({
    where: { id },
    data: {
      status: 'CLOSED',
      endedAt: new Date(),
      closingCash: dto.closingCash,
      cashDiscrepancy,
    },
  });
}
```

### 5. Game-Based Reporting

Reports provide detailed breakdowns by game type:

```typescript
async getShiftReport(id: string) {
  const sales = await this.getSalesForShift(id);
  
  const gameTotals: Record<string, GameTotal> = {};
  let canteenTotal = 0;
  let canteenTax = 0;
  
  sales.forEach(sale => {
    // Calculate canteen totals
    const canteenSubtotal = sale.items.reduce(
      (sum, item) => sum + Number(item.subtotal), 0
    );
    canteenTotal += canteenSubtotal;
    canteenTax += sale.items.reduce(
      (sum, item) => sum + Number(item.tax || 0), 0
    );
    
    // Calculate game-specific totals
    if (sale.table?.game) {
      const gameId = sale.table.game.id;
      if (!gameTotals[gameId]) {
        gameTotals[gameId] = {
          gameName: sale.table.game.name,
          total: 0,
          tableSessions: 0,
          tax: 0,
          sessionsWithTax: 0,
        };
      }
      
      const tableCharge = Number(sale.subtotal) - canteenSubtotal;
      gameTotals[gameId].total += tableCharge;
      gameTotals[gameId].tableSessions += 1;
      
      const tableTax = Number(sale.tax || 0) - 
        sale.items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
      gameTotals[gameId].tax += Math.max(0, tableTax);
      if (tableTax > 0) {
        gameTotals[gameId].sessionsWithTax += 1;
      }
    }
  });
  
  return {
    gameTotals: Object.values(gameTotals),
    canteenTotal,
    canteenTax,
    totalTaxes: Object.values(gameTotals)
      .reduce((sum, g) => sum + g.tax, 0) + canteenTax,
  };
}
```

---

## How Cursor Accelerated Development

**Cursor** is an AI-powered code editor built on VS Code that understands your entire codebase context. Here's how it transformed my development process:

### 1. Context-Aware Code Generation

Cursor's AI understands the full context of your project. When I asked it to implement a new feature, it would:

- Read existing code patterns and follow them
- Understand the database schema from Prisma files
- Generate TypeScript types that match existing conventions
- Create components that match the Material UI design system already in use

**Example**: When implementing the game management feature, I simply described what I needed:

> "Create a games management module with CRUD operations. Games should have a name, description, rate type (per minute or per hour), and default rate. Tables should be linked to games."

Cursor generated:
- The Prisma schema changes
- The NestJS module structure (controller, service, DTOs)
- The frontend React components with Material UI
- The API integration hooks with React Query
- Proper TypeScript types throughout

All following the existing patterns in the codebase.

### 2. Refactoring Made Easy

When I needed to refactor the tax calculation logic (which was initially incorrect), Cursor helped:

- Identify all places where tax was calculated
- Update the logic consistently across backend and frontend
- Ensure type safety throughout
- Update related tests and documentation

**Example**: I asked Cursor to "fix the tax calculation to separate table tax and canteen tax properly." It:

1. Analyzed the current implementation
2. Identified the double-counting issue
3. Refactored the backend services
4. Updated the frontend display logic
5. Ensured consistency in reports

### 3. Bug Detection and Fixes

Cursor caught bugs before they reached production:

- Type mismatches (e.g., `null` vs `undefined` in TypeScript)
- Missing null checks
- Incorrect API endpoint usage
- Inconsistent state management

**Example**: When I had a TypeScript error:

```typescript
// Error: Type 'null' is not assignable to type 'number | undefined'
rate = table.ratePerHour ? Number(table.ratePerHour) : null;
```

Cursor immediately suggested the fix:

```typescript
rate = table.ratePerHour ? Number(table.ratePerHour) : undefined;
```

And explained why: Prisma's optional fields use `undefined`, not `null`.

### 4. Documentation Generation

Cursor helped maintain comprehensive documentation:

- Generated JSDoc comments for complex functions
- Created API documentation from controllers
- Updated README files with new features
- Generated inline code comments explaining business logic

### 5. Database Schema Evolution

When adding new features, Cursor would:

- Generate Prisma migrations
- Update related models consistently
- Handle foreign key relationships correctly
- Update seed files with sample data

**Example**: When adding the Game model, Cursor:

1. Created the Prisma model with proper relationships
2. Generated the migration
3. Updated the Table model to include `gameId`
4. Updated the seeder to create initial games
5. Updated all services that query tables to include game relations

### 6. UI Component Generation

For the frontend, Cursor generated Material UI components that:

- Matched the existing design system
- Used consistent styling patterns
- Included proper accessibility attributes
- Handled loading and error states

**Example**: The checkout dialog was generated with:

- Proper form validation
- Material UI Dialog component
- React Query integration
- Error handling
- Loading states
- Responsive design

### 7. Testing Support

While I didn't write extensive tests, Cursor helped generate:

- Unit test skeletons
- Integration test examples
- Mock data for testing
- Test utilities

### Best Practices When Using Cursor

Based on my experience, here are tips for getting the most out of Cursor:

1. **Provide Clear Context**: Always explain what you're trying to achieve, not just what code you want.

2. **Review Generated Code**: Cursor is powerful, but always review and understand the code it generates.

3. **Iterate on Feedback**: If the first generation isn't perfect, provide feedback and let Cursor refine it.

4. **Use for Boilerplate**: Cursor excels at generating boilerplate code (DTOs, controllers, components) that follows patterns.

5. **Leverage for Refactoring**: When refactoring, Cursor can help ensure consistency across the codebase.

6. **Ask for Explanations**: Don't just accept code—ask Cursor to explain why it made certain decisions.

7. **Maintain Code Quality**: Use Cursor to generate code, but maintain your coding standards and best practices.

---

## Lessons Learned

### 1. Offline-First is Complex but Worth It

Building an offline-first system requires careful consideration of:
- Data synchronization strategies
- Conflict resolution
- Queue management
- User experience during offline periods

But the result—a system that works reliably even without internet—is invaluable for businesses.

### 2. Type Safety is Crucial

Using TypeScript with Prisma provided:
- Compile-time error detection
- Auto-completion in the IDE
- Refactoring confidence
- Self-documenting code

### 3. Component Reusability Saves Time

Building reusable components (dialogs, forms, tables) early paid off as the project grew. Cursor helped identify patterns and extract them into reusable components.

### 4. Database Design Matters

A well-designed database schema makes everything easier:
- Clear relationships between entities
- Proper indexing for performance
- Consistent naming conventions
- Thoughtful use of enums and constraints

### 5. AI-Assisted Development is a Game Changer

Cursor didn't replace my thinking—it amplified it. By handling boilerplate and catching errors early, I could focus on:
- Business logic
- User experience
- Architecture decisions
- Problem-solving

---

## Results

The final system includes:

✅ **Complete POS functionality** with table management, canteen sales, and checkout  
✅ **Offline-first architecture** that works without internet  
✅ **Game-based management** supporting multiple game types with different rates  
✅ **Comprehensive reporting** with game-specific breakdowns and tax details  
✅ **Shift management** with cash reconciliation  
✅ **Inventory management** with stock tracking and low stock alerts  
✅ **Modern, responsive UI** with Material UI components  
✅ **Production-ready** with proper error handling, validation, and security  

All built in a fraction of the time it would have taken without AI assistance.

---

## Conclusion

Building a production-ready POS system is a complex undertaking, but modern tools make it achievable. By combining:

- **Modern web technologies** (Next.js, NestJS, Prisma)
- **Offline-first architecture** (IndexedDB, sync queues)
- **AI-assisted development** (Cursor)

I was able to create a robust, feature-rich system that meets the unique needs of snooker clubs.

**Cursor** wasn't just a code generator—it was a development partner that:
- Understood my codebase context
- Followed existing patterns
- Caught errors early
- Accelerated development
- Maintained code quality

If you're building a complex application, I highly recommend giving Cursor a try. It's not about replacing developers—it's about making us more productive and allowing us to focus on what matters: solving problems and building great software.

---

## Resources

- **Project Repository**: [GitHub - Snooker POS](https://github.com/artixtic/snooker)
- **Cursor**: [cursor.sh](https://cursor.sh)
- **Next.js**: [nextjs.org](https://nextjs.org)
- **NestJS**: [nestjs.com](https://nestjs.com)
- **Prisma**: [prisma.io](https://prisma.io)

---

## About the Author

I'm a full-stack developer passionate about building practical solutions for real-world problems. This POS system was built to solve actual challenges faced by snooker club owners, combining modern web technologies with AI-assisted development to deliver a production-ready solution.

**Connect with me:**
- GitHub: [@artixtic](https://github.com/artixtic)
- LinkedIn: [Your LinkedIn Profile]

---

*If you found this article helpful, please give it a clap and share it with others who might benefit. Questions or feedback? Leave a comment below!*

