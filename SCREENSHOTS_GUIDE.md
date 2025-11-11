# Screenshots Guide

This guide explains how to add screenshots to the README.md file.

## Screenshot Requirements

To make the README look professional on GitHub, you should add actual screenshots of the application. Here are the recommended screenshots:

### 1. Dashboard View
- **File**: `docs/screenshots/dashboard.png`
- **Description**: Main dashboard showing game-based table management
- **What to capture**: 
  - Game sections (Snooker, Table Tennis, PlayStation, Foosball)
  - Table cards in collapsed state
  - Header with buttons (Start Shift, Manage Games, etc.)

### 2. Table Management
- **File**: `docs/screenshots/table-management.png`
- **Description**: Create table dialog and table cards
- **What to capture**:
  - Create Table dialog
  - Expanded table card showing timer
  - Multiple tables in different states

### 3. Checkout Dialog
- **File**: `docs/screenshots/checkout.png`
- **Description**: Checkout interface with items and payment
- **What to capture**:
  - Table charges
  - Canteen items in cart
  - Tax options
  - Payment method selection
  - Total calculation

### 4. Shift Closing Report
- **File**: `docs/screenshots/shift-closing.png`
- **Description**: Shift closing report with game breakdown
- **What to capture**:
  - Game-based revenue breakdown
  - Tax breakdown section
  - Cash reconciliation (Opening, Expected, Closing)
  - Success alert

### 5. Reports & Analytics
- **File**: `docs/screenshots/reports.png`
- **Description**: Custom reports with date range
- **What to capture**:
  - Date range selector
  - Game-specific revenue
  - Tax breakdown
  - Export options

### 6. Inventory Management
- **File**: `docs/screenshots/inventory.png`
- **Description**: Product management interface
- **What to capture**:
  - Product list
  - Add/Edit product dialog
  - Stock levels
  - Categories

## How to Add Screenshots

### Step 1: Create Screenshots Directory

```bash
mkdir -p docs/screenshots
```

### Step 2: Take Screenshots

1. Run the application: `pnpm dev`
2. Navigate to each screen
3. Take screenshots using:
   - **Windows**: `Win + Shift + S` (Snipping Tool)
   - **macOS**: `Cmd + Shift + 4`
   - **Linux**: Use screenshot tool

### Step 3: Save Screenshots

Save screenshots with the following names:
- `dashboard.png`
- `table-management.png`
- `checkout.png`
- `shift-closing.png`
- `reports.png`
- `inventory.png`

### Step 4: Update README.md

Replace the placeholder image URLs in README.md with relative paths:

```markdown
![Dashboard](./docs/screenshots/dashboard.png)
![Table Management](./docs/screenshots/table-management.png)
![Checkout](./docs/screenshots/checkout.png)
![Shift Closing](./docs/screenshots/shift-closing.png)
![Reports](./docs/screenshots/reports.png)
![Inventory](./docs/screenshots/inventory.png)
```

### Step 5: Commit Screenshots

```bash
git add docs/screenshots/*.png
git commit -m "Add screenshots for README"
git push
```

## Screenshot Best Practices

1. **Resolution**: Use at least 1920x1080 resolution
2. **Format**: PNG format for best quality
3. **Size**: Optimize images (use tools like TinyPNG) to keep file sizes reasonable
4. **Content**: Make sure UI is clean and shows key features
5. **Privacy**: Blur or remove any sensitive data before committing

## Alternative: Using GitHub Issues/PRs

If you want to add screenshots later, you can:
1. Create a GitHub Issue with screenshots
2. Add screenshots to a Pull Request
3. Reference them in the README

## Using Online Tools

You can also use online tools to create mockups:
- [Figma](https://www.figma.com/)
- [Canva](https://www.canva.com/)
- [Screenshot.rocks](https://screenshot.rocks/)

