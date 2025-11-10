# Testing Checklist for Smart Cue Dashboard

## ✅ Backend API Tests

### 1. Tables API
- [ ] **GET /tables** - Should return all tables with member data
- [ ] **GET /tables/:id** - Should return single table with member
- [ ] **POST /tables/:id/start** - Should start table with optional memberId
  - Test: Start table without member
  - Test: Start table with member
  - Test: Start already occupied table (should fail)
- [ ] **POST /tables/:id/stop** - Should stop table and calculate charge
  - Test: Stop occupied table
  - Test: Calculate charge correctly
  - Test: Handle paused time correctly
- [ ] **PATCH /tables/:id/member** - Should update table member
  - Test: Set member
  - Test: Remove member (null)
- [ ] **POST /tables/:id/pause** - Should pause table
- [ ] **POST /tables/:id/resume** - Should resume table

### 2. Sales API
- [ ] **POST /sales** - Should create sale
  - Test: Create sale with items
  - Test: Create sale without items (table-only)
  - Test: Create sale with tableId
  - Test: Create sale with memberId
  - Test: Handle credit payment
- [ ] **GET /sales?tableId=xxx** - Should filter sales by table
- [ ] **GET /sales** - Should return all sales

### 3. Members API
- [ ] **GET /members** - Should return all members

### 4. Products API
- [ ] **GET /products** - Should return all products
- [ ] **POST /products** - Should create product
- [ ] **PATCH /products/:id** - Should update product stock

### 5. Expenses API
- [ ] **GET /expenses** - Should return all expenses
- [ ] **POST /expenses** - Should create expense

## ✅ Frontend Component Tests

### 1. Dashboard Page (`/dashboard`)
- [ ] **Table Cards Display**
  - [ ] Shows all tables
  - [ ] Green background for snooker tables
  - [ ] Shows table number and rate per minute
  - [ ] Shows "View History" button (orange)
  - [ ] Shows timer for occupied tables
  - [ ] Shows current charge
  - [ ] Shows member selection dropdown
  - [ ] Shows "Check Out" button for occupied tables
  - [ ] Shows "Add" button for occupied tables
  - [ ] Shows "Check In" button for available tables

- [ ] **Check In Functionality**
  - [ ] Click "Check In" starts table
  - [ ] Table status changes to OCCUPIED
  - [ ] Timer starts
  - [ ] Can select member before or after check in

- [ ] **Check Out Functionality**
  - [ ] Click "Check Out" opens dialog
  - [ ] Dialog shows table charge
  - [ ] Can enter payment amount
  - [ ] Shows change calculation
  - [ ] Completing checkout:
    - [ ] Stops table
    - [ ] Creates sale
    - [ ] Updates table status to AVAILABLE
    - [ ] Closes dialog

- [ ] **Member Selection**
  - [ ] Dropdown shows all members
  - [ ] Selecting member updates table
  - [ ] Can clear member selection

- [ ] **View History**
  - [ ] Opens history dialog
  - [ ] Shows three tabs: Playing, Unpaid, Paid
  - [ ] Displays sales for the table
  - [ ] Shows correct data in table columns

### 2. Table History Dialog
- [ ] **Tabs**
  - [ ] Playing tab (blue) - shows active table sessions
  - [ ] Unpaid tab (orange) - shows unpaid sales
  - [ ] Paid tab (green) - shows paid sales
- [ ] **Table Columns**
  - [ ] # (row number)
  - [ ] Member (dropdown)
  - [ ] Check In time
  - [ ] Check Out time
  - [ ] Minutes played
  - [ ] Rate
  - [ ] Gross Total
  - [ ] Canteen total
  - [ ] Grand Total
  - [ ] Options (View Bill, Canteen, Paid status)

### 3. Inventory Dialog
- [ ] **Create Form**
  - [ ] New Inventory Name field
  - [ ] Price field
  - [ ] Quantity field
  - [ ] "Create Inventory" button creates product
- [ ] **Inventory List**
  - [ ] Shows all products
  - [ ] Editable quantity field
  - [ ] Updates stock on change

### 4. Canteen Dialog
- [ ] **Item Selection**
  - [ ] Dropdown shows all products
  - [ ] Quantity input
  - [ ] "Add Item" button adds to list
- [ ] **Item List**
  - [ ] Shows added items
  - [ ] Shows quantity and total
  - [ ] Shows grand total
- [ ] **Integration**
  - [ ] Can link to table
  - [ ] Adds to checkout total

### 5. Reports Dialog
- [ ] **Display**
  - [ ] Snooker/Billard total
  - [ ] Canteen total
  - [ ] Total (highlighted)
  - [ ] Expense
  - [ ] Profit (highlighted)
- [ ] **Close Today Button**
  - [ ] Closes daily report

### 6. Expense Dialog
- [ ] **Add Form**
  - [ ] Expense name field
  - [ ] Amount field
  - [ ] "Add Expense" button creates expense
- [ ] **Expense List**
  - [ ] Shows all expenses
  - [ ] Shows date
  - [ ] Empty state message when no expenses

### 7. Navigation
- [ ] **Header**
  - [ ] Shows "Smart Cue" branding
  - [ ] Shows phone number "+92 316 1126671"
- [ ] **Buttons**
  - [ ] "New Table" button (functionality TBD)
  - [ ] "Add-ons" dropdown menu
  - [ ] "Inventory" opens inventory dialog
  - [ ] "Expense" opens expense dialog
  - [ ] "Closing" opens reports dialog
  - [ ] "Logout" clears session and redirects

### 8. Add-ons Menu
- [ ] Shows all menu items:
  - [ ] Receipt Printer
  - [ ] Mobile App
  - [ ] Reporting
  - [ ] Control AC/Light
  - [ ] QR Code Check-in
  - [ ] SMS Notification
  - [ ] WhatsApp Notification

## ✅ Integration Tests

### 1. Table Lifecycle
1. Start table (Check In)
2. Select member
3. Add canteen items
4. Check out
5. Verify sale created
6. Verify table available again

### 2. Member Management
1. Select member on table
2. Change member
3. Remove member
4. Verify updates persist

### 3. Sales Flow
1. Start table
2. Play for some time
3. Add canteen items
4. Check out with payment
5. Verify sale includes:
   - Table charge
   - Canteen items
   - Correct totals
   - Payment method

### 4. History View
1. Create multiple sales for a table
2. View history
3. Verify tabs show correct data:
   - Playing: active sessions
   - Unpaid: unpaid sales
   - Paid: completed sales

## ✅ Error Handling

- [ ] Handle network errors gracefully
- [ ] Show error messages for failed operations
- [ ] Validate input fields
- [ ] Handle edge cases:
  - [ ] Starting already occupied table
  - [ ] Stopping available table
  - [ ] Invalid payment amounts
  - [ ] Missing required fields

## ✅ UI/UX

- [ ] All buttons are clickable
- [ ] Loading states shown during API calls
- [ ] Success feedback after operations
- [ ] Error messages are clear
- [ ] Responsive design works on different screen sizes
- [ ] Colors match screenshot requirements:
  - [ ] Green table cards
  - [ ] Blue Playing tab
  - [ ] Orange Unpaid tab
  - [ ] Green Paid tab

## 🐛 Known Issues to Fix

1. **Sale Creation**: Fixed - items array is now optional
2. **Checkout Dialog**: Fixed - properly calculates total with canteen
3. **Member Update**: Fixed - API endpoint added
4. **Table History**: Needs to show actual sales data from API

## 📝 Test Data Setup

Before testing, ensure:
- [ ] Database has sample tables
- [ ] Database has sample members
- [ ] Database has sample products
- [ ] User is logged in
- [ ] Backend server is running
- [ ] Frontend server is running

## 🚀 Quick Test Script

1. **Login** → Navigate to `/dashboard`
2. **Check In** → Click "Check In" on an available table
3. **Select Member** → Choose a member from dropdown
4. **View Timer** → Verify timer is running
5. **Add Canteen** → Click "Add" button, add items
6. **Check Out** → Click "Check Out", enter payment, complete
7. **View History** → Click "View History", check tabs
8. **Inventory** → Click "Inventory", create item, update stock
9. **Expense** → Click "Expense", add expense
10. **Reports** → Click "Closing", view totals
11. **Logout** → Click "Logout", verify redirect

