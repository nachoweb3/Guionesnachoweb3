module.exports = {
  apps: [{
    name: 'JF-BOT-ULTIMATE',
    script: 'JESUS_FOLLOWER_BOT_ULTIMATE.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err-ultimate.log',
    out_file: './logs/out-ultimate.log',
    log_file: './logs/combined-ultimate.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 5000,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};