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
          PORT: 4001,
        },
        env_file: './apps/backend/.env.production',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
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
      watch: false,
    },
  ],
};

