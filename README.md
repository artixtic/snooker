# 🎱 Snooker Club POS System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)

**A complete, production-ready offline-first Point of Sale (POS) system for Snooker Clubs**

Built with Electron, Next.js, NestJS, and PostgreSQL

[Features](#-key-features) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation)

</div>

---

## 📸 UI Preview

> **Note**: GitHub markdown doesn't render HTML with inline styles. For the best visual representation, please add actual screenshots to the `docs/screenshots/` directory. See [SCREENSHOTS_GUIDE.md](./SCREENSHOTS_GUIDE.md) for instructions.

### Dashboard View
*Main dashboard showing game-based table management with real-time timers*

#### 🎮 Snooker Section
**Rate Type:** `Per Minute` | **Description:** Snooker tables

| Table | Status | Rate | Actions |
|-------|--------|------|---------|
| 🎱 **Snooker 1** | 🟣 AVAILABLE | 8 PKR/min | `[VIEW HISTORY]` `[START SHIFT FIRST]` |
| 🎱 **Snooker 2** | 🔴 OCCUPIED | - | Timer: `00:45:23`<br>Charge: `PKR 48.00`<br>`[Pause]` `[Checkout]` |
| 🎱 **Snooker 3** | 🟣 AVAILABLE | 8 PKR/min | `[START SHIFT FIRST]` |

**Card Colors:**
- 🟣 **Purple Gradient** (`#667eea` → `#764ba2`) - AVAILABLE tables
- 🔴 **Pink/Red Gradient** (`#f093fb` → `#f5576c`) - OCCUPIED tables
- 🔵 **Blue Gradient** (`#4facfe` → `#00f2fe`) - PAUSED tables

#### 🎮 Table Tennis Section
**Rate Type:** `Per Minute` | **Description:** Table Tennis tables

| Table | Status | Rate | Actions |
|-------|--------|------|---------|
| 🎮 **Table Tennis 1** | 🟣 AVAILABLE | 6 PKR/min | `[START SHIFT FIRST]` |
| 🎮 **Table Tennis 2** | 🟣 AVAILABLE | 6 PKR/min | `[START SHIFT FIRST]` |

#### 🎮 PlayStation Section
**Rate Type:** `Per Hour` | **Description:** PlayStation gaming stations

| Table | Status | Rate | Actions |
|-------|--------|------|---------|
| 🎮 **PlayStation 1** | 🟣 AVAILABLE | 200 PKR/hour | `[START SHIFT FIRST]` |
| 🎮 **PlayStation 2** | 🔵 PAUSED | - | Timer: `00:30:15`<br>Charge: `PKR 100.50`<br>`[Resume]` `[Checkout]` |

#### ➕ Create Table Card
**Color:** 🟢 Green Gradient (`#11998e` → `#38ef7d`)

---

**Visual Design Features:**
- ✨ Gradient backgrounds for each card based on status
- 🎨 Game section headers with rate type badges
- 📊 Expandable/collapsible table cards
- ⏱️ Real-time timer display for active tables
- 💰 Current charge calculation
- 🎯 Color-coded status indicators

### Checkout Dialog
*Checkout interface with table charges, canteen items, tax calculation, and payment processing*

```
┌─────────────────────────────────────────────────────────────┐
│  💳 Checkout - Snooker 2                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🎱 Table Time (45:23)          PKR 48.00            │ │
│  │  🛒 Canteen Items               PKR 25.00            │ │
│  │  ─────────────────────────────────────────────────── │ │
│  │  Subtotal                        PKR 73.00           │ │
│  │  Tax (15%)                       PKR 10.95           │ │
│  │  ═══════════════════════════════════════════════════ │ │
│  │  Total                           PKR 83.95           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Payment Method:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Cash ▼                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Payment Amount:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  84.00                                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         ✅ Complete Sale                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Shift Closing Report
*Detailed shift closing report with game-based revenue breakdown and tax information*

```
┌─────────────────────────────────────────────────────────────┐
│  🔒 Shift Closing Report                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Category                    Amount (PKR)             │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  🎮 Snooker (2 sessions)           123.00             │ │
│  │  🎮 Table Tennis (1 session)        59.00             │ │
│  │  🛒 Canteen                         41.00             │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  Subtotal (Before Tax)             223.00             │ │
│  │  Total Sales (With Tax)            236.00             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  💰 Tax Breakdown                                      │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  🎮 Snooker Tax (1 of 2 sessions)    PKR 9.00         │ │
│  │  🛒 Canteen Tax (1 sale with tax)    PKR 4.00         │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  Total Taxes Collected              PKR 13.00         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Opening Cash:                    PKR 10.00           │ │
│  │  Cash Sales:                      PKR 236.00          │ │
│  │  Expenses:                        PKR 0.00            │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  Expected Cash:                   PKR 246.00          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         🔒 Close Shift!                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Reports & Analytics
*Custom date range reports with game-specific analytics and detailed tax breakdown*

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Custom Reports                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Start Date: [2025-11-01]  End Date: [2025-11-11]          │
│                              [Generate Report]              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Revenue Summary                                       │ │
│  ├──────────────┬──────────────┬──────────────┐          │ │
│  │ Total Sales  │ Total Taxes  │  Sessions    │          │ │
│  │  PKR 1,250   │  PKR 187.50  │     42       │          │ │
│  └──────────────┴──────────────┴──────────────┘          │ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Game          Sessions    Revenue        Tax         │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  🎮 Snooker        15      PKR 450      PKR 67.50     │ │
│  │  🎮 Table Tennis   12      PKR 360      PKR 54.00     │ │
│  │  🎮 PlayStation     8      PKR 240      PKR 36.00     │ │
│  │  🛒 Canteen         -      PKR 200      PKR 30.00     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [📥 Export Excel]  [📄 Export PDF]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Inventory Management
*Product management with stock tracking, barcode support, and low stock alerts*

```
┌─────────────────────────────────────────────────────────────┐
│  📦 Inventory Management                    [+ Add Product] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 [Search products by name, SKU, or barcode...        ]  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Product      Category    Price      Stock    Actions │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  Coca Cola    Drinks      PKR 2.50   [100]   [Edit]  │ │
│  │  SKU: DRK-001                              [Delete]   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  Snickers     Snacks      PKR 3.00   [5] ⚠️  [Edit]  │ │
│  │  SKU: SNK-001            Low Stock         [Delete]   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  Water Bottle Drinks      PKR 1.50   [143]   [Edit]  │ │
│  │  SKU: DRK-003                              [Delete]   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features

### 🎮 Game Management
- **Multiple Game Types**: Support for Snooker, Table Tennis, PlayStation, Foosball, and custom games
- **Flexible Rate Types**: Per-minute or per-hour billing based on game type
- **Game-Specific Defaults**: Each game has its own default rate and configuration
- **CRUD Operations**: Full create, read, update, and delete functionality for games

### 🎱 Table Management
- **Game-Linked Tables**: Tables are automatically linked to games
- **Real-Time Timers**: Live tracking of table usage with pause/resume functionality
- **Expandable Cards**: Tables start collapsed and expand when active
- **Status Tracking**: AVAILABLE, OCCUPIED, PAUSED, RESERVED states
- **Dynamic Naming**: Tables display as "Game Name 1", "Game Name 2", etc.

### 💰 POS Functionality
- **Table Check-in**: Start table sessions with custom rate per hour/minute
- **Shopping Cart**: Add canteen items with quantity and pricing
- **Tax Calculation**: Optional 15% tax on table charges and/or canteen items
- **Payment Methods**: Cash, Card, Mixed, and Credit payment options
- **Receipt Generation**: Print receipts via thermal printer or PDF export
- **Bill Details**: Separate display of table tax and canteen tax

### 📊 Shift Management
- **Shift Tracking**: Start and end shifts with employee assignment
- **Cash Reconciliation**: 
  - Opening cash tracking
  - Expected cash calculation (Opening + Cash Sales - Expenses)
  - Closing cash input
  - Cash discrepancy calculation
- **Validation**: Prevents closing shift if tables are still active
- **Shift Reports**: Game-based revenue breakdown with session counts

### 📈 Reports & Analytics
- **Daily Reports**: Sales summaries grouped by games
- **Custom Reports**: Date range reports with game-specific analytics
- **Tax Breakdown**: Detailed tax information showing:
  - Game-specific taxes with session counts
  - Canteen tax with sales count
  - Total taxes collected
- **Revenue Tracking**: Subtotal (before tax) and total sales (with tax)
- **Export Options**: Excel (XLSX) and PDF formats

### 🏪 Inventory Management
- **Product CRUD**: Full product management with categories
- **Stock Tracking**: Real-time inventory movements and adjustments
- **Barcode Support**: USB scanner and camera scanning
- **Low Stock Alerts**: Automatic notifications when stock is low
- **Stock Validation**: Prevents checkout if items are out of stock

### 🔄 Offline-First Architecture
- **Local Database**: Dexie.js (IndexedDB) for offline operations
- **Sync Queue**: Automatic sync on reconnect
- **Conflict Resolution**: Last Writer Wins (LWW) with admin review UI
- **Multi-terminal Support**: Multiple devices can sync independently

### 🔐 Security & Authentication
- **JWT Tokens**: Access and refresh tokens with HTTP-only cookies
- **Role-Based Access**: ADMIN and EMPLOYEE roles
- **Secure IPC**: Electron context isolation with preload scripts
- **Input Validation**: DTO validation with class-validator

---

## 🏗️ Architecture

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

### Tech Stack

**Frontend:**
- ⚛️ **Next.js 14** (App Router) - React framework
- 🎨 **Material UI v5** - Component library
- 🔄 **React Query** - Data fetching and caching
- 💾 **Dexie.js** - IndexedDB wrapper for offline storage
- 📊 **Zustand** - State management

**Backend:**
- 🚀 **NestJS** - Node.js framework
- 🗄️ **Prisma** - ORM and database toolkit
- 🐘 **PostgreSQL** - Relational database
- 🔐 **Passport.js** - Authentication
- 📡 **Socket.io** - Real-time updates

**Desktop:**
- ⚡ **Electron** - Desktop application framework
- 🖨️ **ESC/POS** - Thermal printer support
- 📄 **PDFMake** - PDF generation

---

## 📋 Prerequisites

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (recommended) or npm >= 9.0.0
- **Docker Desktop**: For running PostgreSQL (optional, can use local PostgreSQL)
- **Git**: For cloning the repository

### Windows Users
👉 See [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) for complete Windows-specific setup guide

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/snooker-pos.git
cd snooker-pos
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Setup Environment Variables

**Backend:**
```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/snooker_pos"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key"
```

**Frontend:**
```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

### 4. Start Database

Using Docker (recommended):
```bash
docker-compose up -d
```

Or use a local PostgreSQL instance (update `DATABASE_URL` accordingly).

### 5. Run Database Migrations

```bash
cd apps/backend
pnpm prisma migrate dev
pnpm prisma generate
```

### 6. Seed Sample Data

```bash
cd apps/backend
pnpm prisma db seed
```

This creates:
- ✅ Admin user: `admin` / `admin123`
- ✅ Employee user: `employee` / `employee123`
- ✅ Sample products and categories
- ✅ 4 games: Snooker, Table Tennis, PlayStation, Foosball
- ✅ 2 tables per game (8 tables total), all in AVAILABLE status

### 7. Start Development

From the root directory:

```bash
pnpm dev
```

This starts:
- 🔵 Backend: http://localhost:3001
- 🟢 Frontend: http://localhost:3000
- 🟡 Electron: Launches automatically

---

## 💻 Usage

### Starting a Shift

1. Click on **"Start Shift"** in the header
2. Enter opening cash amount
3. Click **"Start Shift"**

### Managing Games

1. Click **"Manage Games"** in the header
2. Create new games with:
   - Name (e.g., "Snooker", "Table Tennis")
   - Description
   - Rate Type (Per Minute or Per Hour)
   - Default Rate
3. Edit or delete existing games (only if no tables are linked)

### Creating Tables

1. Click **"Create Table"** button
2. Select a game from the dropdown
3. Enter table number
4. Set rate per hour/minute (defaults to game's default rate)
5. Click **"Create"**

### Starting a Table Session

1. **Prerequisite**: An active shift must be running
2. Click on an available table card
3. Enter rate per hour/minute (defaults to game's default rate)
4. Click **"Start Table"**
5. The table card will expand showing the timer and current charge

### Adding Items to Cart

1. While a table is active, click **"Canteen"** button
2. Browse products and click to add to cart
3. Adjust quantities as needed
4. Items are automatically added to the current table's cart

### Checkout

1. Click **"Checkout"** on an active table
2. Review table charges and cart items
3. Optionally enable tax (15%) for:
   - Table charge
   - Canteen items
   - Both
4. Select payment method (Cash, Card, Mixed, Credit)
5. Enter payment amount (for cash)
6. Click **"Complete Sale"**
7. Print receipt if needed

### Closing a Shift

1. **Prerequisite**: All tables must be closed (AVAILABLE status)
2. Click **"Shift Closing Report"** in the header
3. Review the shift report:
   - Game-based revenue breakdown
   - Canteen sales
   - Tax breakdown
   - Expenses
   - Profit calculation
4. Click **"Close Shift!"**
5. Enter closing cash amount
6. Review expected cash calculation:
   - Opening Cash
   - Cash Sales
   - Expenses
   - Expected Cash = Opening + Cash Sales - Expenses
7. Add optional notes
8. Click **"Confirm Close"**
9. View success alert with cash discrepancy

### Generating Reports

1. Click **"Add-ons"** → **"Reporting"**
2. Select date range
3. Click **"Generate Report"**
4. View detailed report with:
   - Game-based revenue
   - Canteen sales
   - Tax breakdown
   - Session counts
5. Export to Excel or PDF

---

## 📁 Project Structure

```
snooker-pos/
├── apps/
│   ├── frontend/              # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/          # Next.js app router pages
│   │   │   ├── components/   # React components
│   │   │   ├── lib/          # Utilities and API client
│   │   │   └── store/        # Zustand state management
│   │   └── package.json
│   │
│   ├── backend/               # NestJS backend API
│   │   ├── src/
│   │   │   ├── auth/         # Authentication module
│   │   │   ├── games/        # Game management
│   │   │   ├── tables/       # Table management
│   │   │   ├── sales/        # Sales processing
│   │   │   ├── shifts/       # Shift management
│   │   │   ├── reports/      # Reporting
│   │   │   ├── products/     # Product management
│   │   │   └── ...
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema
│   │   │   ├── seed.ts       # Database seeder
│   │   │   └── migrations/   # Database migrations
│   │   └── package.json
│   │
│   └── electron/              # Electron desktop app
│       ├── src/
│       │   ├── main.ts       # Main process
│       │   └── printer.ts    # Printer integration
│       └── package.json
│
├── packages/
│   ├── shared/                # Shared TypeScript types
│   └── ui/                    # Shared UI components
│
├── docker-compose.yml         # PostgreSQL Docker setup
├── package.json               # Root package.json
└── README.md                  # This file
```

---

## 🔌 API Documentation

### Authentication

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Games

```http
GET    /games              # List all games
POST   /games              # Create new game
PATCH  /games/:id          # Update game
DELETE /games/:id          # Delete game (only if no tables linked)
```

### Tables

```http
GET    /tables             # List all tables (includes game info)
POST   /tables             # Create new table (requires gameId)
POST   /tables/:id/start   # Start table session (requires active shift)
POST   /tables/:id/pause   # Pause table session
POST   /tables/:id/resume  # Resume table session
POST   /tables/:id/stop    # Stop table session
DELETE /tables/:id         # Delete table
DELETE /tables             # Delete all tables
```

### Sales

```http
POST /sales                # Create sale
GET  /sales/:id            # Get sale details
GET  /sales                # List sales with filters
```

### Shifts

```http
POST /shifts/start         # Start shift
POST /shifts/:id/close     # Close shift (validates all tables closed)
GET  /shifts               # List shifts
GET  /shifts/:id/report    # Get shift report with game-based breakdown
```

### Reports

```http
GET /reports/daily?date=YYYY-MM-DD  # Daily sales report
```

For complete API documentation, see [API.md](./API.md) (if available).

---

## 🧪 Development

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

# Open Prisma Studio (database GUI)
pnpm prisma studio

# Generate Prisma client
pnpm prisma generate

# Clear all data
pnpm prisma:clear
```

### Testing

```bash
# Backend tests
cd apps/backend
pnpm test
pnpm test:watch
pnpm test:cov

# Frontend tests
cd apps/frontend
pnpm test
```

---

## 🐛 Troubleshooting

### Database Connection Issues

1. Verify Docker is running: `docker ps`
2. Check PostgreSQL logs: `docker-compose logs db`
3. Verify `DATABASE_URL` in `.env` matches Docker settings

### Printer Not Detected

1. Check system printer settings
2. Ensure printer driver is installed
3. Test with system print command
4. Check Electron console for printer detection logs

### Sync Issues

1. Check `sync_log` table in IndexedDB (DevTools → Application)
2. Verify backend is running and accessible
3. Check network tab for failed sync requests
4. Review backend logs for conflict details

### Shift Closing Issues

- **Error: "Cannot close shift. There are X active table(s)"**
  - Solution: Close all active tables before closing the shift

- **Error: "Cannot delete game. There are X table(s) associated"**
  - Solution: Delete or reassign all tables linked to the game first

---

## 📊 Database Schema

### Key Models

- **Game**: Games (Snooker, Table Tennis, etc.) with rate types
- **Table**: Tables linked to games with status and timer tracking
- **Sale**: Sales transactions with table and canteen items
- **SaleItem**: Individual items in a sale with tax calculation
- **Shift**: Shift tracking with cash reconciliation
- **Product**: Canteen products with stock tracking
- **Expense**: Expenses that reduce cash in drawer

For complete schema, see `apps/backend/prisma/schema.prisma`.

---

## 🎨 UI/UX Features

- **Modern Design**: Gradient backgrounds, glassmorphism effects, smooth animations
- **Responsive Layout**: Works on different screen sizes
- **Color-Coded Status**: Visual indicators for table status, payment methods, etc.
- **Real-Time Updates**: Live timer updates and status changes
- **Expandable Cards**: Tables collapse/expand for better organization
- **Keyboard Support**: All numeric fields support keyboard input
- **Accessibility**: Proper ARIA labels and keyboard navigation

---

## 📝 License

Proprietary - All rights reserved

---

## 🤝 Contributing

This is a proprietary project. Contact the development team for contribution guidelines.

---

## 📞 Support

For issues, questions, or feature requests, please contact the development team.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Material UI](https://mui.com/)
- Database management with [Prisma](https://www.prisma.io/)
- Desktop app with [Electron](https://www.electronjs.org/)

---

<div align="center">

**Made with ❤️ for Snooker Clubs**

⭐ Star this repo if you find it helpful!

</div>
