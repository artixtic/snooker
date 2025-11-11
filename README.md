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

### Dashboard View
*Main dashboard showing game-based table management with real-time timers*

<div align="center" style="margin: 20px 0;">

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white; margin: 20px 0; max-width: 900px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <h2 style="margin: 0;">🎱 Snooker Club POS</h2>
    <div>
      <button style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 5px; margin: 0 5px;">Start Shift</button>
      <button style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 5px; margin: 0 5px;">Manage Games</button>
    </div>
  </div>
  
  <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
    <h3 style="margin: 0 0 10px 0;">🎮 Snooker</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
      <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">Snooker 1</div>
        <div style="font-size: 12px; opacity: 0.9;">AVAILABLE</div>
        <div style="background: #4CAF50; padding: 5px; border-radius: 5px; margin-top: 10px; text-align: center; cursor: pointer;">Start Table</div>
      </div>
      <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">Snooker 2</div>
        <div style="font-size: 12px; opacity: 0.9;">OCCUPIED</div>
        <div style="margin-top: 10px;">
          <div style="font-size: 24px; font-weight: bold;">00:45:23</div>
          <div style="font-size: 14px;">PKR 48.00</div>
        </div>
        <div style="background: #FF9800; padding: 5px; border-radius: 5px; margin-top: 10px; text-align: center; cursor: pointer;">Checkout</div>
      </div>
    </div>
  </div>
  
  <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
    <h3 style="margin: 0 0 10px 0;">🎮 Table Tennis</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
      <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">Table Tennis 1</div>
        <div style="font-size: 12px; opacity: 0.9;">AVAILABLE</div>
        <div style="background: #4CAF50; padding: 5px; border-radius: 5px; margin-top: 10px; text-align: center; cursor: pointer;">Start Table</div>
      </div>
    </div>
  </div>
</div>

</div>

### Checkout Dialog
*Checkout interface with table charges, canteen items, tax calculation, and payment processing*

<div align="center" style="margin: 20px 0;">

<div style="background: white; border: 2px solid #e0e0e0; border-radius: 10px; padding: 25px; max-width: 500px; margin: 20px auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <h2 style="margin: 0 0 20px 0; color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">💳 Checkout - Snooker 2</h2>
  
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <span style="color: #666;">🎱 Table Time (45:23):</span>
      <span style="font-weight: bold; color: #333;">PKR 48.00</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <span style="color: #666;">🛒 Canteen Items:</span>
      <span style="font-weight: bold; color: #333;">PKR 25.00</span>
    </div>
    <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="color: #666;">Subtotal:</span>
        <span style="font-weight: bold;">PKR 73.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="color: #666;">Tax (15%):</span>
        <span style="font-weight: bold; color: #FF9800;">PKR 10.95</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; color: #4CAF50; margin-top: 10px; padding-top: 10px; border-top: 2px solid #4CAF50;">
        <span>Total:</span>
        <span>PKR 83.95</span>
      </div>
    </div>
  </div>
  
  <div style="margin-bottom: 15px;">
    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: bold;">Payment Method:</label>
    <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px;">
      <option>Cash</option>
      <option>Card</option>
      <option>Mixed</option>
    </select>
  </div>
  
  <div style="margin-bottom: 20px;">
    <label style="display: block; margin-bottom: 5px; color: #666; font-weight: bold;">Payment Amount:</label>
    <input type="number" value="84.00" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px;">
  </div>
  
  <button style="width: 100%; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);">
    ✅ Complete Sale
  </button>
</div>

</div>

### Shift Closing Report
*Detailed shift closing report with game-based revenue breakdown and tax information*

<div align="center" style="margin: 20px 0;">

<div style="background: white; border: 2px solid #9C27B0; border-radius: 10px; padding: 25px; max-width: 700px; margin: 20px auto; box-shadow: 0 4px 6px rgba(156, 39, 176, 0.2);">
  <h2 style="margin: 0 0 20px 0; color: #9C27B0; border-bottom: 2px solid #9C27B0; padding-bottom: 10px;">🔒 Shift Closing Report</h2>
  
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Category</th>
        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Amount (PKR)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">🎮 Snooker (2 sessions)</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #00BCD4; border-bottom: 1px solid #eee;">123.00</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">🎮 Table Tennis (1 session)</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #00BCD4; border-bottom: 1px solid #eee;">59.00</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">🛒 Canteen</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #00BCD4; border-bottom: 1px solid #eee;">41.00</td>
      </tr>
      <tr style="background: rgba(0, 188, 212, 0.1);">
        <td style="padding: 12px; font-weight: bold; border-bottom: 2px solid #ddd;">Subtotal (Before Tax)</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #00BCD4; border-bottom: 2px solid #ddd;">223.00</td>
      </tr>
      <tr style="background: rgba(0, 188, 212, 0.1);">
        <td style="padding: 12px; font-weight: bold; border-bottom: 2px solid #ddd;">Total Sales (With Tax)</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #00BCD4; border-bottom: 2px solid #ddd;">236.00</td>
      </tr>
    </tbody>
  </table>
  
  <div style="background: rgba(255, 152, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="margin: 0 0 10px 0; color: #FF9800;">💰 Tax Breakdown</h3>
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
      <span>🎮 Snooker Tax (1 of 2 sessions)</span>
      <span style="font-weight: bold; color: #FF9800;">PKR 9.00</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
      <span>🛒 Canteen Tax (1 sale with tax)</span>
      <span style="font-weight: bold; color: #FF9800;">PKR 4.00</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px solid #FF9800;">
      <span>Total Taxes Collected</span>
      <span style="color: #FF9800;">PKR 13.00</span>
    </div>
  </div>
  
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <span style="font-weight: bold;">Opening Cash:</span>
      <span style="font-weight: bold;">PKR 10.00</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <span>Cash Sales:</span>
      <span>PKR 236.00</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #f44336;">
      <span>Expenses:</span>
      <span>PKR 0.00</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd;">
      <span>Expected Cash:</span>
      <span style="color: #4CAF50;">PKR 246.00</span>
    </div>
  </div>
  
  <button style="width: 100%; background: linear-gradient(135deg, #f44336 30%, #d32f2f 90%); color: white; border: none; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 20px; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);">
    🔒 Close Shift!
  </button>
</div>

</div>

### Reports & Analytics
*Custom date range reports with game-specific analytics and detailed tax breakdown*

<div align="center" style="margin: 20px 0;">

<div style="background: white; border: 2px solid #00BCD4; border-radius: 10px; padding: 25px; max-width: 800px; margin: 20px auto; box-shadow: 0 4px 6px rgba(0, 188, 212, 0.2);">
  <h2 style="margin: 0 0 20px 0; color: #00BCD4; border-bottom: 2px solid #00BCD4; padding-bottom: 10px;">📊 Custom Reports</h2>
  
  <div style="display: flex; gap: 10px; margin-bottom: 20px;">
    <div style="flex: 1;">
      <label style="display: block; margin-bottom: 5px; color: #666; font-weight: bold;">Start Date:</label>
      <input type="date" value="2025-11-01" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
    </div>
    <div style="flex: 1;">
      <label style="display: block; margin-bottom: 5px; color: #666; font-weight: bold;">End Date:</label>
      <input type="date" value="2025-11-11" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
    </div>
    <div style="display: flex; align-items: flex-end;">
      <button style="background: #00BCD4; color: white; border: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; cursor: pointer;">Generate Report</button>
    </div>
  </div>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="margin: 0 0 15px 0; color: #333;">Revenue Summary</h3>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
      <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #4CAF50;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Sales</div>
        <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">PKR 1,250</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #FF9800;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Taxes</div>
        <div style="font-size: 24px; font-weight: bold; color: #FF9800;">PKR 187.50</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #2196F3;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Sessions</div>
        <div style="font-size: 24px; font-weight: bold; color: #2196F3;">42</div>
      </div>
    </div>
  </div>
  
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Game</th>
        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Sessions</th>
        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Revenue</th>
        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Tax</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">🎮 Snooker</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">15</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #00BCD4; border-bottom: 1px solid #eee;">PKR 450</td>
        <td style="padding: 10px; text-align: right; color: #FF9800; border-bottom: 1px solid #eee;">PKR 67.50</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">🎮 Table Tennis</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">12</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #00BCD4; border-bottom: 1px solid #eee;">PKR 360</td>
        <td style="padding: 10px; text-align: right; color: #FF9800; border-bottom: 1px solid #eee;">PKR 54.00</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">🎮 PlayStation</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">8</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #00BCD4; border-bottom: 1px solid #eee;">PKR 240</td>
        <td style="padding: 10px; text-align: right; color: #FF9800; border-bottom: 1px solid #eee;">PKR 36.00</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">🛒 Canteen</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">-</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #00BCD4; border-bottom: 1px solid #eee;">PKR 200</td>
        <td style="padding: 10px; text-align: right; color: #FF9800; border-bottom: 1px solid #eee;">PKR 30.00</td>
      </tr>
    </tbody>
  </table>
  
  <div style="margin-top: 20px; display: flex; gap: 10px;">
    <button style="flex: 1; background: #4CAF50; color: white; border: none; padding: 12px; border-radius: 5px; font-weight: bold; cursor: pointer;">📥 Export Excel</button>
    <button style="flex: 1; background: #f44336; color: white; border: none; padding: 12px; border-radius: 5px; font-weight: bold; cursor: pointer;">📄 Export PDF</button>
  </div>
</div>

</div>

### Inventory Management
*Product management with stock tracking, barcode support, and low stock alerts*

<div align="center" style="margin: 20px 0;">

<div style="background: white; border: 2px solid #4CAF50; border-radius: 10px; padding: 25px; max-width: 900px; margin: 20px auto; box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; flex: 1;">📦 Inventory Management</h2>
    <button style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; cursor: pointer; margin-left: 20px;">+ Add Product</button>
  </div>
  
  <div style="margin-bottom: 20px;">
    <input type="text" placeholder="🔍 Search products by name, SKU, or barcode..." style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px;">
  </div>
  
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Category</th>
        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Stock</th>
        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold;">Coca Cola</div>
          <div style="font-size: 12px; color: #666;">SKU: DRK-001</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">Drinks</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: #4CAF50; border-bottom: 1px solid #eee;">PKR 2.50</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
          <span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">100</span>
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">
          <button style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 0 2px; cursor: pointer;">Edit</button>
          <button style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 0 2px; cursor: pointer;">Delete</button>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold;">Snickers</div>
          <div style="font-size: 12px; color: #666;">SKU: SNK-001</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">Snacks</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: #4CAF50; border-bottom: 1px solid #eee;">PKR 3.00</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
          <span style="background: #FF9800; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">5</span>
          <span style="font-size: 12px; color: #f44336; margin-left: 5px;">⚠️ Low Stock</span>
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">
          <button style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 0 2px; cursor: pointer;">Edit</button>
          <button style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 0 2px; cursor: pointer;">Delete</button>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold;">Water Bottle</div>
          <div style="font-size: 12px; color: #666;">SKU: DRK-003</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">Drinks</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: #4CAF50; border-bottom: 1px solid #eee;">PKR 1.50</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
          <span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">143</span>
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">
          <button style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 0 2px; cursor: pointer;">Edit</button>
          <button style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin: 0 2px; cursor: pointer;">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

</div>

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
