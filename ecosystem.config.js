module.exports = {
  apps: [
    {
      name: 'ai-fishfinder',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/dombold/fishfinder',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
