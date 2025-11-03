# Snooker POS - Windows Quick Start Script
# Run this script in PowerShell as Administrator (if needed for Docker)

Write-Host "🚀 Snooker POS - Windows Setup" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check pnpm or npm
Write-Host "Checking package manager..." -ForegroundColor Yellow
$usePnpm = $false
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm installed: $pnpmVersion" -ForegroundColor Green
    $usePnpm = $true
    $pkgCmd = "pnpm"
} catch {
    Write-Host "⚠️  pnpm not found, using npm" -ForegroundColor Yellow
    $pkgCmd = "npm"
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
& $pkgCmd install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Install cookie-parser types
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location apps\backend
& $pkgCmd add -D @types/cookie-parser
Set-Location ..\..

# Check Docker
Write-Host ""
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker installed: $dockerVersion" -ForegroundColor Green
    
    # Start Docker containers
    Write-Host ""
    Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Docker Compose failed. You may need to start Docker Desktop first." -ForegroundColor Yellow
        Write-Host "   Or use local PostgreSQL and update DATABASE_URL in apps\backend\.env" -ForegroundColor Yellow
    } else {
        Write-Host "✅ PostgreSQL container started" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Docker not found. Please install Docker Desktop or use local PostgreSQL" -ForegroundColor Yellow
}

# Setup environment files
Write-Host ""
Write-Host "Setting up environment files..." -ForegroundColor Yellow

# Backend .env
if (-not (Test-Path "apps\backend\.env")) {
    if (Test-Path "apps\backend\.env.example") {
        Copy-Item "apps\backend\.env.example" "apps\backend\.env"
        Write-Host "✅ Created apps\backend\.env (please update DATABASE_URL if needed)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Please create apps\backend\.env manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ apps\backend\.env already exists" -ForegroundColor Green
}

# Frontend .env.local
if (-not (Test-Path "apps\frontend\.env.local")) {
    @"
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
"@ | Out-File -FilePath "apps\frontend\.env.local" -Encoding utf8
    Write-Host "✅ Created apps\frontend\.env.local" -ForegroundColor Green
} else {
    Write-Host "✅ apps\frontend\.env.local already exists" -ForegroundColor Green
}

# Database setup
Write-Host ""
Write-Host "Setting up database..." -ForegroundColor Yellow
Set-Location apps\backend

Write-Host "  Generating Prisma Client..." -ForegroundColor Cyan
& $pkgCmd prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host "   Make sure PostgreSQL is running and DATABASE_URL is correct" -ForegroundColor Yellow
    Set-Location ..\..
    exit 1
}

Write-Host "  Running migrations..." -ForegroundColor Cyan
& $pkgCmd prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations" -ForegroundColor Red
    Set-Location ..\..
    exit 1
}

Write-Host "  Seeding database..." -ForegroundColor Cyan
& $pkgCmd prisma db seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Failed to seed database (this is optional)" -ForegroundColor Yellow
}

Set-Location ..\..

# Build shared packages
Write-Host ""
Write-Host "Building shared packages..." -ForegroundColor Yellow
Set-Location packages\shared
& $pkgCmd build
Set-Location ..\ui
& $pkgCmd build
Set-Location ..\..

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure PostgreSQL is running (Docker or local)" -ForegroundColor White
Write-Host "  2. Verify apps\backend\.env has correct DATABASE_URL" -ForegroundColor White
Write-Host "  3. Run: $pkgCmd dev" -ForegroundColor White
Write-Host ""
Write-Host "This will start:" -ForegroundColor Cyan
Write-Host "  - Backend: http://localhost:3001" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Electron app (opens automatically)" -ForegroundColor White
Write-Host ""
Write-Host "Default login: admin / admin123" -ForegroundColor Yellow
Write-Host ""

