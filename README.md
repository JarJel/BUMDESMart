# BUMDESMart

Platform Digital BUMDes untuk Meningkatkan Layanan Pemasaran UMKM  
Desa Lengkong, Kecamatan Bojongsoang, Kabupaten Bandung.

## Struktur Repo

```
BUMDESMart/
├── app/            → Laravel (Controllers, Models, Services)
├── frontend/       → Next.js 14
├── database/       → Migrations & Seeders
├── routes/         → API Routes
└── ...
```

## Branching Strategy

```
main          → stable, production ready
dev           → integrasi semua fitur
feature/xxx   → branch per fitur (contoh: feature/auth, feature/product)
fix/xxx       → branch untuk bugfix
```

## Setup Backend (Laravel)

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

## Setup Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## Tim

- Backend    : Muhammad Fajar M
- Frontend   : Muhammad Oki R
- Penghubung : Muhammad Dzaki A
