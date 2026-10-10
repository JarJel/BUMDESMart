# Panduan Instalasi & Konfigurasi Prometheus, Node Exporter, dan Grafana (Ubuntu Server)

Dokumen ini berisi panduan *clean & step-by-step* hasil instalasi server monitoring menggunakan **Prometheus**, **Node Exporter**, dan **Grafana** pada OS Ubuntu Linux.

---

## 📋 Ringkasan Alokasi Port & Service

| Service | Port | Akses / Function | Status Service |
| :--- | :--- | :--- | :--- |
| **Prometheus Server** | `9090` | `http://localhost:9090` (Scraping Metrics) | `prometheus.service` |
| **Node Exporter** | `9100` | `http://localhost:9100/metrics` (OS Health) | `prometheus-node-exporter.service` |
| **Grafana Dashboard** | `3002` | `http://<IP_SERVER>:3002` (UI Monitoring) | `grafana-server.service` |

---

## 🛠️ Langkah 1: Perbaikan DNS Server (Permanen)

Sebelum menginstal paket, pastikan resolusi DNS pada server telah dikonfigurasi menggunakan Google DNS & Cloudflare DNS untuk mencegah error name resolution.

```bash
# 1. Konfigurasi DNS permanen di systemd-resolved
sudo mkdir -p /etc/systemd/resolved.conf.d
sudo tee /etc/systemd/resolved.conf.d/dns.conf <<'EOF'
[Resolve]
DNS=8.8.8.8 1.1.1.1
DNSOverTLS=yes
EOF

# 2. Restart service DNS resolver
sudo systemctl restart systemd-resolved
sudo ln -sf /run/systemd/resolve/stub-resolv.conf /etc/resolv.conf
```

---

## 📦 Langkah 2: Instalasi Prometheus & Node Exporter

Instalasi dilakukan secara langsung menggunakan paket sistem `apt` agar service berjalan otomatis sebagai `systemd daemon`.

```bash
# 1. Update repository & install prometheus + node-exporter
sudo apt update
sudo apt install -y prometheus prometheus-node-exporter

# 2. Pastikan service aktif
sudo systemctl enable prometheus
sudo systemctl start prometheus

sudo systemctl enable prometheus-node-exporter
sudo systemctl start prometheus-node-exporter
```

### Verifikasi Status Service:
```bash
sudo systemctl status prometheus
sudo systemctl status prometheus-node-exporter
```

---

## ⚙️ Langkah 3: Konfigurasi Target Scraping Prometheus

Edit file konfigurasi Prometheus di `/etc/prometheus/prometheus.yml`:

```bash
sudo nano /etc/prometheus/prometheus.yml
```

Tambahkan target scraping berikut pada bagian `scrape_configs`:

```yaml
scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node_exporter"
    static_configs:
      - targets: ["localhost:9100"]

  - job_name: "openwa_gateway"
    static_configs:
      - targets: ["localhost:2785"]
```

Simpan file (`Ctrl + O`, `Enter`), lalu keluar (`Ctrl + X`). Kemudian restart Prometheus:

```bash
sudo systemctl restart prometheus
```

---

## 📊 Langkah 4: Instalasi & Konfigurasi Grafana OSS

### 1. Tambahkan GPG Key & Repository Resmi Grafana
```bash
sudo mkdir -p /etc/apt/keyrings
wget -q -O - https://apt.grafana.com/gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/grafana.gpg
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
```

### 2. Update & Install Grafana
```bash
sudo apt update
sudo apt install -y grafana
```

### 3. Ubah Port Grafana ke `3002` (Mencegah Bentrok Port)
> *Port 3000 digunakan oleh Next.js Frontend BUMDESMart & Port 3001 digunakan oleh Uptime Kuma.*

```bash
sudo sed -i 's/;http_port = 3000/http_port = 3002/' /etc/grafana/grafana.ini
sudo sed -i 's/http_port = 3001/http_port = 3002/' /etc/grafana/grafana.ini
```

### 4. Aktifkan & Jalankan Service Grafana
```bash
sudo systemctl daemon-reload
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

---

## 🔑 Langkah 5: Reset Password Admin Grafana (Opsional)

Jika lupa atau ingin meriset password admin Grafana dari CLI:

```bash
sudo grafana cli --homepath /usr/share/grafana --config /etc/grafana/grafana.ini admin reset-admin-password admin123
sudo systemctl restart grafana-server
```

---

## 🌐 Langkah 6: Menghubungkan Grafana ke Prometheus & Import Dashboard

1. **Akses Dashboard Grafana**:
   Buka di browser: `http://<IP_SERVER>:3002`
   - **Username**: `admin`
   - **Password**: `admin123` *(atau password baru yang diset)*

2. **Tambahkan Data Source Prometheus**:
   - Pilih menu **Connections** -> **Data Sources** -> **Add data source**.
   - Pilih **Prometheus**.
   - Di kolom **Prometheus server URL**, isi: `http://localhost:9090`
   - Scroll ke bawah dan klik **Save & test** *(Hingga muncul banner hijau: Data source is working)*.

3. **Import Dashboard Node Exporter Full**:
   - Pilih menu **Dashboards** -> **New** -> **Import**.
   - Di kolom **Find and import dashboards...**, ketik ID: `1860` (Node Exporter Full).
   - Klik **Load**.
   - Pada dropdown Data Source Prometheus, pilih **Prometheus**.
   - Klik **Import**.

---

## 🔒 Konfigurasi Firewall UFW (Jika Aktif)

Buka port monitoring jika ingin diakses dari jaringan luar:

```bash
sudo ufw allow 3002/tcp  # Grafana Dashboard UI
sudo ufw allow 9090/tcp  # Prometheus Web (Opsional)
```

---
*Dokumen ini dibuat otomatis sebagai acuan deployment server monitoring BUMDESMart.*
