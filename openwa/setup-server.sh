#!/bin/bash
# Setup OpenWA di server production (Ubuntu 24.04)
# Jalankan dari /var/www sebagai root

set -e

echo "=== 1. Clone OpenWA ==="
cd /var/www
git clone https://github.com/rmyndharis/OpenWA.git OpenWA
cd OpenWA

echo "=== 2. Install Node 22 (jika belum) ==="
node --version | grep -q "v22" || (
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
)

echo "=== 3. Install dependencies ==="
npm ci --omit=dev

echo "=== 4. Build ==="
npm run build 2>/dev/null || echo "No build step needed"

echo "=== 5. Copy env ==="
cp .env.example .env
echo ""
echo ">>> Edit /var/www/OpenWA/.env sesuai kebutuhan, lalu lanjutkan"
echo ">>> Minimal isi: PORT=2785, DB_TYPE=sqlite"
echo ""

echo "=== 6. Register ke PM2 ==="
pm2 start /var/www/BUMDESMart/openwa/ecosystem.config.js
pm2 save

echo "=== Done! OpenWA berjalan di http://localhost:2785 ==="
echo "Dashboard: http://localhost:2785/dashboard"
echo "Swagger:   http://localhost:2785/api"
