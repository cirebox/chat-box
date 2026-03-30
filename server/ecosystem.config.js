module.exports = {
  apps: [{
    name: 'cirebox-chat',
    script: './index.js',
    cwd: __dirname,
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      HTTP_PORT: 8765,
      WS_PORT: 8766,
      SERVER_IP: '192.168.0.100'
    },
    env_development: {
      NODE_ENV: 'development'
    }
  }]
};
