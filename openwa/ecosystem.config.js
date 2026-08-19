module.exports = {
  apps: [
    {
      name: "bumdesmart-openwa",
      cwd: "/var/www/OpenWA",
      script: "node_modules/.bin/ts-node",
      args: "-r tsconfig-paths/register src/main.ts",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 2785,
        // Isi setelah OpenWA dikonfigurasi
        // OPENWA_API_KEY: "",
        // DB_TYPE: "sqlite",
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
    },
  ],
};
