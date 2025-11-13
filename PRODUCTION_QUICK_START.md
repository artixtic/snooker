# Production Quick Start Guide

## Quick Setup Steps

### 1. Create Production Environment Files

**Backend:**
```bash
cd apps/backend
cp .env.production.template .env.production
# Edit .env.production with your production values
```

**Frontend:**
```bash
cd apps/frontend
cp .env.production.template .env.production
# Edit .env.production with your production values
```

### 2. Setup Database

```bash
cd apps/backend
npm run prisma:generate:prod
npm run prisma:migrate:prod
```

### 3. Build for Production

```bash
# From project root
npm run build:prod
```

### 4. Start Production Servers

**Option A: Using npm**
```bash
npm run start:prod
```

**Option B: Using PM2 (Recommended)**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Important Notes

- **Never commit `.env.production` files** - They contain sensitive credentials
- Always use HTTPS in production
- Set strong, unique JWT secrets (minimum 32 characters)
- Configure CORS to only allow your production domain
- Set up database backups (backup service is enabled by default)

## Full Documentation

See `PRODUCTION_DEPLOYMENT.md` for complete deployment guide including:
- Nginx reverse proxy configuration
- SSL certificate setup
- Security checklist
- Monitoring and maintenance
- Troubleshooting

