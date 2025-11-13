# Production Deployment Guide

This guide covers deploying the Snooker POS application to production.

## Prerequisites

- Node.js 18+ installed on production server
- PostgreSQL database (production instance)
- Domain name with SSL certificate (for HTTPS)
- PM2 or similar process manager (recommended)

## Step 1: Environment Setup

### Backend Environment

1. Copy the production environment template:
   ```bash
   cd apps/backend
   cp .env.production.template .env.production
   ```

2. Edit `.env.production` with your production values:
   ```env
   DATABASE_URL="postgresql://user:password@your-db-host:5432/snooker_pos?schema=public"
   BACKUP_DATABASE_URL="postgresql://user:password@your-db-host:5432/snooker_pos_backup?schema=public"
   ENABLE_BACKUP_SERVICE="true"
   PORT=4001
   NODE_ENV=production
   CORS_ORIGIN="https://your-domain.com"
   JWT_SECRET="your-strong-secret-key-here"
   JWT_REFRESH_SECRET="your-strong-refresh-secret-key-here"
   ```

### Frontend Environment

1. Copy the production environment template:
   ```bash
   cd apps/frontend
   cp .env.production.template .env.production
   ```

2. Edit `.env.production` with your production values:
   ```env
   NEXT_PUBLIC_API_URL="https://api.your-domain.com"
   NEXT_PUBLIC_WS_URL="https://api.your-domain.com"
   PORT=4000
   ```

## Step 2: Database Setup

1. **Create Production Database:**
   ```sql
   CREATE DATABASE snooker_pos;
   CREATE DATABASE snooker_pos_backup;
   ```

2. **Run Migrations:**
   ```bash
   cd apps/backend
   npm run prisma:generate:prod
   npm run prisma:migrate:prod
   ```

3. **Seed Database (Optional):**
   ```bash
   npm run prisma:seed
   ```

## Step 3: Build Applications

### Option A: Build from Root (Recommended)

```bash
# From project root
npm run build:prod
```

This will build both backend and frontend for production.

### Option B: Build Individually

**Backend:**
```bash
cd apps/backend
npm install
npm run build:prod
```

**Frontend:**
```bash
cd apps/frontend
npm install
npm run build:prod
```

## Step 4: Start Production Servers

### Option A: Using npm scripts

```bash
# From project root
npm run start:prod
```

### Option B: Using PM2 (Recommended for Production)

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 ecosystem file** (`ecosystem.config.js` in project root):
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'snooker-backend',
         script: './apps/backend/dist/main.js',
         cwd: './apps/backend',
         instances: 1,
         exec_mode: 'fork',
         env: {
           NODE_ENV: 'production',
         },
         env_file: './apps/backend/.env.production',
         error_file: './logs/backend-error.log',
         out_file: './logs/backend-out.log',
         log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
         merge_logs: true,
         autorestart: true,
         max_memory_restart: '1G',
       },
       {
         name: 'snooker-frontend',
         script: 'node_modules/next/dist/bin/next',
        args: 'start',
        cwd: './apps/frontend',
        instances: 1,
        exec_mode: 'fork',
        env: {
          NODE_ENV: 'production',
          PORT: 4000,
        },
         env_file: './apps/frontend/.env.production',
         error_file: './logs/frontend-error.log',
         out_file: './logs/frontend-out.log',
         log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
         merge_logs: true,
         autorestart: true,
         max_memory_restart: '1G',
       },
     ],
   };
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **PM2 Commands:**
   ```bash
   pm2 list              # View running processes
   pm2 logs              # View logs
   pm2 restart all       # Restart all apps
   pm2 stop all          # Stop all apps
   pm2 delete all        # Delete all apps
   ```

## Step 5: Reverse Proxy Setup (Nginx)

Create an Nginx configuration file (`/etc/nginx/sites-available/snooker-pos`):

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # Frontend
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # Backend API
    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/snooker-pos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: Security Checklist

- [ ] Use strong, unique JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Set up firewall rules (only allow ports 80, 443, and SSH)
- [ ] Use environment variables for all sensitive data
- [ ] Never commit `.env.production` files to version control
- [ ] Set up database backups (automated backup service is enabled)
- [ ] Configure CORS to only allow your production domain
- [ ] Use a process manager (PM2) for automatic restarts
- [ ] Set up log rotation
- [ ] Monitor application health and logs
- [ ] Keep dependencies updated
- [ ] Use a reverse proxy (Nginx) for SSL termination

## Step 7: Monitoring & Maintenance

### Logs

- Backend logs: `./logs/backend-*.log` (if using PM2)
- Frontend logs: `./logs/frontend-*.log` (if using PM2)
- PM2 logs: `pm2 logs`

### Database Backups

The backup service automatically backs up data every minute to the backup database. Additionally, set up regular PostgreSQL dumps:

```bash
# Daily backup script
pg_dump -h localhost -U user -d snooker_pos > /backups/snooker_pos_$(date +%Y%m%d).sql
```

### Updates

1. Pull latest code
2. Install dependencies: `npm install`
3. Run migrations: `npm run prisma:migrate:prod --workspace=apps/backend`
4. Rebuild: `npm run build:prod`
5. Restart: `pm2 restart all` or `npm run start:prod`

## Troubleshooting

### Backend won't start
- Check database connection in `.env.production`
- Verify JWT secrets are set
- Check port 4001 is not in use (or check PORT in .env.production)
- Review backend logs

### Frontend won't start
- Verify `NEXT_PUBLIC_API_URL` points to correct backend
- Check port 4000 is not in use (or check PORT in .env.production)
- Review frontend logs

### Database connection errors
- Verify database credentials
- Check database is running
- Ensure network/firewall allows connections
- Test connection: `psql $DATABASE_URL`

### CORS errors
- Verify `CORS_ORIGIN` in backend `.env.production` matches frontend domain
- Check Nginx proxy headers are set correctly

## Environment Variables Reference

### Backend (.env.production)
- `DATABASE_URL` - PostgreSQL connection string
- `BACKUP_DATABASE_URL` - Backup database connection string
- `ENABLE_BACKUP_SERVICE` - Enable/disable backup service
- `PORT` - Backend server port (4001 for production, 3001 for dev)
- `NODE_ENV` - Set to "production"
- `CORS_ORIGIN` - Frontend domain (with protocol)
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `JWT_EXPIRES_IN` - Access token expiration
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration

### Frontend (.env.production)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (usually same as API URL)
- `PORT` - Frontend server port (4000 for production, 3000 for dev)

