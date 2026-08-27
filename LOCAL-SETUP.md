# BumDesMartNukita — Local Development Setup

Panduan menjalankan aplikasi di lokal dengan **Midtrans Sandbox** dan **Google OAuth**.

## Prasyarat

- Docker Desktop (Windows/Mac) atau Docker Engine (Linux)
- Git
- Port 80, 3000, 8000 tersedia

---

## Cara 1: Docker (Rekomendasi)

### 1. Clone repo & masuk direktori

```bash
git clone https://github.com/JarJel/BumDesMartNukita.git
cd BumDesMartNukita
```

### 2. Setup file `.env`

```bash
cp .env.example .env
cp backend/.env.docker.example backend/.env
```

### 3. Edit `.env` (root) — isi minimal:

```env
DB_ROOT_PASSWORD=passwordkuat123
DB_PASSWORD=passwordkuat123
NEXT_PUBLIC_API_URL=http://localhost/api/v1

# Midtrans Sandbox — ambil dari dashboard.sandbox.midtrans.com → Settings → Access Keys
MIDTRANS_CLIENT_KEY=<CLIENT_KEY_SANDBOX>
MIDTRANS_IS_PRODUCTION=false

# Google OAuth — ambil dari console.cloud.google.com → Credentials → OAuth 2.0 Client IDs
GOOGLE_CLIENT_ID=<CLIENT_ID>.apps.googleusercontent.com
```

### 4. Edit `backend/.env` — sinkronkan `DB_PASSWORD` sama dengan root, dan Midtrans:

```env
DB_PASSWORD=passwordkuat123

MIDTRANS_SERVER_KEY=<SERVER_KEY_SANDBOX>
MIDTRANS_CLIENT_KEY=<CLIENT_KEY_SANDBOX>
MIDTRANS_MERCHANT_ID=<MERCHANT_ID>
MIDTRANS_IS_PRODUCTION=false

GOOGLE_CLIENT_ID=<CLIENT_ID>.apps.googleusercontent.com
```

> **Catatan:** Ambil key sandbox Midtrans dari [dashboard.sandbox.midtrans.com](https://dashboard.sandbox.midtrans.com) → Settings → Access Keys.
> Google Client ID dari [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials.

### 5. Generate APP_KEY (kalau belum ada)

```bash
docker compose run --rm backend php artisan key:generate
```

### 6. Build & start

```bash
docker compose build
docker compose up -d
```

### 7. Migrate database

```bash
docker compose exec backend php artisan migrate --seed
```

### 8. Buka di browser

- Frontend: http://localhost
- Backend API: http://localhost/api/v1
- OpenWA (WhatsApp): http://localhost:2785

---

## Cara 2: Tanpa Docker (Manual)

### Backend (Laravel)

```bash
cd backend
cp .env.example .env
# Edit .env: sesuaikan DB, Midtrans Sandbox, GOOGLE_CLIENT_ID
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Backend jalan di `http://localhost:8000`.

### Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local
# .env.local sudah default ke http://localhost:8000/api/v1
npm install
npm run dev
```

Frontend jalan di `http://localhost:3000`.

---

## Testing Midtrans Sandbox

- Buat order dari frontend
- Di halaman payment, gunakan test card / VA:
  - Card: `4811 1111 1111 1114`, CVV `123`, expiry bebas
  - OTP: `112233`
- QRIS: langsung tunggu status ke "settlement"

Reference lengkap: https://docs.midtrans.com/docs/testing-payment-on-sandbox

---

## Google Login Testing

1. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` **wajib diisi** di `.env` root (untuk build args)
2. `GOOGLE_CLIENT_ID` di `backend/.env` sama dengan yang di frontend
3. Domain `localhost` sudah masuk ke Authorized JavaScript origins di:
   https://console.cloud.google.com/apis/credentials

---

## Troubleshooting

### Frontend tidak menampilkan tombol Google Login

- Cek `NEXT_PUBLIC_GOOGLE_CLIENT_ID` di root `.env` sudah terisi
- Rebuild frontend dengan `--no-cache`:
  ```bash
  docker compose build --no-cache frontend && docker compose up -d --force-recreate frontend
  ```

### Snap popup Midtrans muncul "Transaksi tidak ditemukan"

- Backend key **harus match** dengan frontend key (keduanya Sandbox atau keduanya Production)
- Cek `backend/.env` dan root `.env`:
  ```bash
  docker exec BumDesMartNukita_be grep -i midtrans /var/www/html/.env
  ```

### `npm ci` gagal saat build (DNS error `EAI_AGAIN`)

Tambahkan DNS Google ke Docker daemon:

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF
sudo systemctl restart docker
```

### Reset semua data (fresh restart)

```bash
docker compose down -v
docker compose up -d
docker compose exec backend php artisan migrate --seed
```
