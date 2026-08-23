#!/bin/bash
# BUMDeSMart — First-time setup & deploy script
# Jalankan: bash deploy.sh
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

echo ""
echo "================================================"
echo "   BUMDeSMart — Setup & Deploy"
echo "================================================"
echo ""

# Cek Docker
command -v docker &>/dev/null || error "Docker tidak ditemukan. Install dulu: https://docs.docker.com/engine/install/"
info "Docker ditemukan: $(docker --version)"

# Setup root .env
if [ ! -f .env ]; then
    cp .env.example .env
    warn ".env dibuat dari .env.example — EDIT sebelum lanjut!"
    warn "  → Isi DB_ROOT_PASSWORD, DB_PASSWORD, MIDTRANS_CLIENT_KEY, CADDY_DOMAIN, NEXT_PUBLIC_API_URL"
    echo ""
    read -p "Sudah edit .env? Tekan Enter untuk lanjut atau Ctrl+C untuk batalkan..."
else
    info ".env sudah ada"
fi

# Setup backend .env
if [ ! -f backend/.env ]; then
    cp backend/.env.docker.example backend/.env
    warn "backend/.env dibuat dari backend/.env.docker.example — EDIT sebelum lanjut!"
    warn "  → Isi DB_PASSWORD, MAIL_PASSWORD (Gmail App Password), MIDTRANS_SERVER_KEY, OPENWA_API_KEY"
    echo ""
    read -p "Sudah edit backend/.env? Tekan Enter untuk lanjut atau Ctrl+C untuk batalkan..."
else
    info "backend/.env sudah ada"
fi

# Cek variabel penting di root .env
source .env 2>/dev/null || true
[ -z "$DB_ROOT_PASSWORD" ] && error "DB_ROOT_PASSWORD kosong di .env"
[ -z "$DB_PASSWORD" ]      && error "DB_PASSWORD kosong di .env"
[ -z "$MIDTRANS_CLIENT_KEY" ] && warn "MIDTRANS_CLIENT_KEY belum diisi di .env"

echo ""
echo "--- Build & start containers ---"
docker compose pull --ignore-buildable
docker compose build --no-cache
docker compose up -d

echo ""
echo "--- Menunggu backend sehat (maks 2 menit) ---"
for i in $(seq 1 24); do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' bumdesmart_be 2>/dev/null || echo "starting")
    if [ "$STATUS" = "healthy" ]; then
        info "Backend healthy!"
        break
    fi
    echo "  ... $STATUS ($((i*5))s)"
    sleep 5
done

echo ""
echo "================================================"
echo "   Deploy selesai!"
echo "================================================"
echo ""
info "Containers berjalan:"
docker compose ps

echo ""
echo "Langkah manual setelah ini:"
echo "  1. Pasang DNS A record domain ke IP server ini"
echo "  2. Scan QR OpenWA di: http://$(hostname -I | awk '{print $1}'):2785"
echo "  3. Set Midtrans webhook URL di dashboard Midtrans:"
echo "     https://bumdesmartnukita.com/api/webhooks/midtrans"
echo ""
