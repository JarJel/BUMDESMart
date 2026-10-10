module.exports = {
  apps: [
    {
      name: "bumdesmart-openwa",
      cwd: "/var/www/OpenWA",
      script: "dist/main.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 2785,
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
    },
  ],
};
