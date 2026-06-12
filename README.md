# BUMDESMart

Platform Digital BUMDes untuk Meningkatkan Layanan Pemasaran UMKM  
Desa Lengkong, Kecamatan Bojongsoang, Kabupaten Bandung.

## Struktur Repo (Monorepo)

```
BUMDESMart/
├── backend/    → Laravel 13 (REST API)
└── frontend/   → Next.js 14 (React)
```

## Setup Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

> Laravel berjalan di http://localhost:8000

## Setup Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

> Next.js berjalan di http://localhost:3000

## Branching Strategy

```
main            → production ready
dev             → integrasi semua fitur
feature/xxx     → per fitur baru
fix/xxx         → bugfix
```

## Tim

- Backend  : Muhammad Dzaki A, Muhammad Fajar M
- Frontend : Muhammad Oki R
