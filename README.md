# BUMDESMart

Platform Digital BUMDes untuk Meningkatkan Layanan Pemasaran UMKM
Desa Lengkong, Kecamatan Bojongsoang, Kabupaten Bandung.

## Struktur Repo

```
BUMDESMart/
├── backend/    → Laravel 13 (REST API)
└── frontend/   → Next.js 14
```

## Setup Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

## Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tim

- Backend    : Muhammad Fajar M
- Frontend   : Muhammad Oki R
- Penghubung : Muhammad Dzaki A
