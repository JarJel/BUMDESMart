#!/bin/sh
set -e

# Perbaiki ownership storage/bootstrap-cache — volume Docker baru selalu
# root-owned saat mount, override permission yang di-set saat image build
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Generate APP_KEY jika belum ada
if grep -q "APP_KEY=$" /var/www/html/.env 2>/dev/null || ! grep -q "APP_KEY=" /var/www/html/.env 2>/dev/null; then
    php artisan key:generate --force
fi

# Link storage ke public
php artisan storage:link --force 2>/dev/null || true

# Jalankan migrasi
php artisan migrate --force

# Cache config & route untuk performa
php artisan config:cache
php artisan route:cache

exec "$@"
