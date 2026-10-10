#!/bin/bash
# Setup OpenWA di server production (Ubuntu 24.04)
# Jalankan dari /var/www sebagai root

set -e

echo "=== 1. Clone OpenWA ==="
cd /var/www
if [ ! -d "OpenWA" ]; then
  git clone https://github.com/rmyndharis/OpenWA.git OpenWA
fi
cd OpenWA

echo "=== 2. Install Node 22 (jika belum) ==="
node --version | grep -q "v22" || (
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
)

echo "=== 3. Install Dependencies & Build ==="
npm ci
npm run build:all

echo "=== 4. Copy env (jika belum ada) ==="
if [ ! -f .env ]; then
  cp .env.example .env
  echo "AUTO_START_SESSIONS=true" >> .env
fi

echo "=== 5. Register ke PM2 ==="
pm2 start /var/www/BUMDESMart/openwa/ecosystem.config.js
pm2 save

echo "=== Selesai! OpenWA berjalan di http://localhost:2785 ==="
echo "Dashboard: http://localhost:2785/dashboard"
echo "Swagger:   http://localhost:2785/api"
