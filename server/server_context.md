# BumDesMart Server Context

## Tentang Aplikasi
BumDesMart adalah platform e-commerce untuk BUMDes (Badan Usaha Milik Desa) Nukita.
Memungkinkan UMKM desa mendaftarkan toko dan menjual produk secara online.

## Stack Teknologi
- **Backend**: Laravel 11 (PHP 8.3), REST API
- **Frontend**: Next.js 14 (React), TypeScript
- **Database**: MariaDB 11
- **Cache/Queue**: Redis 7
- **Web Server**: Caddy 2 (reverse proxy + SSL otomatis)
- **Tunnel**: Cloudflare Tunnel (cloudflared) — karena ISP blokir port inbound
- **WhatsApp Gateway**: OpenWA (notifikasi order)
- **Deployment**: Docker Compose di VPS Ubuntu

## Containers
| Container | Fungsi |
|-----------|--------|
| bumdesmart_be | Laravel backend API |
| bumdesmart_fe | Next.js frontend |
| bumdesmart_db | MariaDB database |
| bumdesmart_redis | Redis cache + queue broker |
| bumdesmart_caddy | Reverse proxy, SSL termination |
| bumdesmart_cloudflared | Cloudflare Tunnel (TCP/http2, UDP 7844 diblokir ISP) |
| bumdesmart_queue | Laravel Queue Worker (konversi gambar WebP) |
| bumdesmart_openwa | WhatsApp gateway |

## Konfigurasi Penting
- Cloudflared: wajib `--protocol http2` karena ISP blokir UDP 7844
- DNS cloudflared: 1.1.1.1 dan 8.8.8.8 (hardcoded agar tidak gagal resolve)
- Storage: Docker named volume `backend_storage` untuk persistensi file upload
- Queue: async WebP image conversion via `ProcessImageToWebp` job

## Domain
- Production: bumdesmartnukita.com (via Cloudflare Tunnel)

## Fitur Utama
- Upload dokumen UMKM (PDF/JPG/PNG → dikonversi WebP async)
- Pembayaran via Midtrans (production)
- Login Google OAuth
- Notifikasi WhatsApp untuk order baru
- Seller dashboard dengan manajemen produk, pesanan, ulasan, diskon, voucher

## Tim Dev
- Dzaki (Telegram ID: 6483972454) — lead dev
- Fajar (Telegram ID: 8129182235) — dev
- Oki — dev (Telegram ID belum dikonfigurasi)

## Hal yang Perlu Diperhatikan
- Cloudflared sering restart jika jaringan ISP tidak stabil → normal, tapi perlu dipantau
- Queue worker harus selalu UP, kalau down gambar tidak akan dikonversi ke WebP
- Disk usage perlu dipantau, file WebP original (`_orig_*`) perlu dibersihkan berkala
