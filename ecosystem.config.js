/**
 * PM2 Ecosystem Configuration for AHCP System
 * 
 * Production deployment configuration using PM2 process manager
 * 
 * Usage:
 *   Production: pm2 start ecosystem.config.js --env production
 *   Development: pm2 start ecosystem.config.js --env development
 *   Stop all: pm2 stop all
 *   Restart: pm2 restart all
 *   Monitor: pm2 monit
 */

module.exports = {
  apps: [
    // Backend API Server
    {
      name: 'ahcp-backend',
      script: './ahcp-backend/src/server.js',
      cwd: './ahcp-backend',
      instances: 2, // Use 2 instances for load balancing
      exec_mode: 'cluster',
      watch: false, // Disable watch in production
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/ahcp-backend-error.log',
      out_file: './logs/ahcp-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000
    },
    
    // Frontend Dashboard
    {
      name: 'ahcp-dashboard',
      script: 'npm',
      args: 'start',
      cwd: './ahcp-dashboard',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/ahcp-dashboard-error.log',
      out_file: './logs/ahcp-dashboard-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/animal-care-system.git',
      path: '/var/www/ahcp',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};

