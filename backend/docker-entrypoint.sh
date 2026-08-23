#!/bin/sh
set -e

# Generate APP_KEY jika belum ada
if grep -q "APP_KEY=$" /var/www/html/.env 2>/dev/null || ! grep -q "APP_KEY=" /var/www/html/.env 2>/dev/null; then
    php artisan key:generate --force
fi

# Link storage ke public
php artisan storage:link --force 2>/dev/null || true

# Jalankan migrasi
php artisan migrate --force

# Cache semua untuk performa production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

exec "$@"
