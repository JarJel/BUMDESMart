FROM php:8.3-apache

# 1. Install sistem dependensi
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libgd-dev \
    zip \
    unzip \
    git \
    curl \
 && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip \
 && rm -rf /var/lib/apt/lists/*

# Redis client pakai predis/predis (pure PHP, via Composer/Packagist) —
# menghindari kebutuhan compile ekstensi native yang butuh akses GitHub/PECL,
# yang diblokir di jaringan kampus. Lihat REDIS_CLIENT=predis di .env

# 2. Enable mod_rewrite Apache untuk Laravel
RUN a2enmod rewrite

# Arahkan document root ke folder public Laravel
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Izinkan .htaccess override
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Naikkan batas upload PHP ke 10MB (default 2MB tidak cukup untuk foto 5MB)
RUN echo "upload_max_filesize = 10M\npost_max_size = 12M\nmax_execution_time = 120" \
    > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Pakai mirror Aliyun untuk packagist — mirror ini menyimpan file ZIP paket
# sendiri (bukan cuma metadata), jadi tidak perlu akses api.github.com yang
# diblokir/timeout di jaringan kampus
RUN composer config -g repos.packagist composer https://mirrors.aliyun.com/composer/

WORKDIR /var/www/html

COPY . .

RUN composer install --no-interaction --optimize-autoloader --no-dev \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
