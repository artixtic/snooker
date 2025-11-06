# Fix TypeScript Errors - Manual Steps

## ⚠️ PowerShell Execution Policy Issue

PowerShell is blocking npm commands. You have two options:

### Option 1: Enable PowerShell Scripts (Quick Fix)

Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then install the missing package:
```powershell
cd apps\backend
npm install @nestjs/mapped-types
```

### Option 2: Use Command Prompt (CMD)

Instead of PowerShell, use CMD:
```cmd
cd apps\backend
npm install @nestjs/mapped-types
```

## ✅ Code Fixes Applied

I've fixed all TypeScript errors in the code:

1. ✅ **Electron printer types** - Added type definitions
2. ✅ **Auth controller** - Added type annotations for `req` parameter
3. ✅ **Sales controller** - Removed non-existent `ParseDatePipe`
4. ✅ **Sync service** - Fixed type guards for conflict detection
5. ✅ **Sync service** - Fixed delete operator issue
6. ✅ **Sync service** - Fixed updatedAt property access
7. ✅ **Jest test** - Fixed `mockResolvedValue` method name
8. ✅ **WebSocket gateway** - Fixed import conflict

## 📦 Install Missing Package

After enabling PowerShell scripts or using CMD:

```powershell
cd "C:\Users\HP PROBOOK 450 G10\Desktop\MahboobAhmed\Snooker\apps\backend"
npm install @nestjs/mapped-types
```

## 🔄 Then Restart Dev Servers

```powershell
cd "C:\Users\HP PROBOOK 450 G10\Desktop\MahboobAhmed\Snooker"
npm run dev
```

All TypeScript errors should now be resolved!

