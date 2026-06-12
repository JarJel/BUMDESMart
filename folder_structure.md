# Dokumentasi Struktur Folder BUMDESMart

Dokumen ini menjelaskan struktur folder dari proyek **BUMDESMart** (Platform Digital BUMDes untuk UMKM Desa Lengkong), fungsi dari masing-masing folder, evaluasi terhadap struktur yang ada saat ini, serta rekomendasi untuk perbaikan.

---

## 1. Pohon Struktur Folder (Folder Tree)

Berikut adalah visualisasi struktur folder utama dalam proyek BUMDESMart:

```text
BUMDESMart/                     # Root Directory (Monorepo)
├── .git/                       # Folder version control Git
├── backend/                    # Laravel 13 (REST API)
│   ├── app/                    # Logika utama aplikasi
│   │   ├── Exceptions/         # Penanganan error/exception kustom
│   │   ├── Http/               # HTTP Layer (Controllers & API Resources)
│   │   ├── Models/             # Eloquent Models (Database mapping - Singular)
│   │   ├── Providers/          # Laravel Service Providers
│   │   ├── Repositories/       # Data Access Layer (Repository Pattern)
│   │   └── Services/           # Business Logic Layer (Service Pattern)
│   ├── bootstrap/              # Konfigurasi bootstrap & cache Laravel
│   ├── config/                 # File konfigurasi Laravel
│   ├── database/               # Migrations, Seeders, & Factories
│   ├── public/                 # Entry point public (index.php) & assets
│   ├── resources/              # Blade templates & assets mentah
│   ├── routes/                 # Definisi routing API & Web
│   ├── storage/                # Cache, logs, & uploaded files
│   └── tests/                  # Automated Testing
├── frontend/                   # Next.js (React Framework)
│   ├── app/                    # Next.js App Router (Halaman & Routing)
│   ├── components/             # Komponen UI modular
│   │   ├── layout/             # Komponen tata letak (Header, Sidebar, dll)
│   │   ├── shared/             # Komponen yang digunakan bersama
│   │   └── ui/                 # Komponen UI dasar/atomik (Button, Input)
│   ├── hooks/                  # Custom React Hooks
│   ├── lib/                    # Helper/Utility & API Client (Axios)
│   ├── public/                 # Aset statis (Gambar, Icon, Font)
│   └── types/                  # Definisi tipe TypeScript
└── [Documentation - Root]      # File dokumentasi proyek
    ├── README.md               # Cara setup & panduan umum proyek
    ├── audit_relasi_model.md   # Laporan audit relasi database
    ├── cara_membuat_relasi_model.md  # Panduan pembuatan relasi
    ├── diagram_relasi_model.md # Mermaid diagram relasi database
    ├── folder_structure.md     # Dokumen struktur folder ini
    ├── multi_seller_flow.md    # Logika alur multi-seller
    └── multi_seller_flow.pdf   # Visualisasi PDF alur multi-seller
```

---

## 2. Penjelasan Fungsi Masing-Masing Folder

### A. Root Directory (BUMDESMart)

Berperan sebagai kontainer **Monorepo** yang menyatukan backend dan frontend ke dalam satu repository Git agar memudahkan pelacakan perubahan kode.

| Nama Folder / File                    | Fungsi / Deskripsi                                                                           |
| :------------------------------------ | :------------------------------------------------------------------------------------------- |
| `backend/`                          | Berisi seluruh kode program untuk API backend menggunakan framework Laravel 13.              |
| `frontend/`                         | Berisi seluruh kode program untuk antarmuka pengguna (user interface) menggunakan Next.js.   |
| `.gitignore`                        | Mengatur file/folder apa saja yang tidak boleh diunggah ke Git.                              |
| `README.md`                         | Dokumentasi utama cara menjalankan dan mengatur proyek untuk developer baru.                 |
| Dokumentasi Lain (`.md` / `.pdf`) | Menyimpan dokumentasi arsitektur database, relasi model, dan alur bisnis (*multi-seller*). |

---

### B. Backend Directory (`backend/`)

Menggunakan framework **Laravel 13** yang difungsikan sebagai **REST API** penyedia data.

| Nama Folder / File    | Fungsi / Deskripsi                                                                                                                                                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/`              | Folder inti aplikasi PHP.                                                                                                                                                                                                 |
| `app/Http/`         | Menangani request HTTP yang masuk. Terdiri dari:`<br>`- `Controllers`: Mengatur alur request dan memanggil Services.`<br>`- `Resources`: Mentransformasi data model menjadi format JSON yang konsisten untuk API. |
| `app/Models/`       | Definisi tabel database dan relasi antar model menggunakan Eloquent ORM. Menggunakan nama kelas tunggal (singular).                                                                                                       |
| `app/Repositories/` | Lapisan perantara untuk query database (SQL/Eloquent). Memisahkan query database dari logika bisnis utama.                                                                                                                |
| `app/Services`      | Lapisan logika bisnis (*Business Logic Layer*). Semua kalkulasi, aturan transaksi, dan proses bisnis ditulis di sini agar Controllers tetap bersih (*skinny controllers*).                                            |
| `app/Providers/`    | Service provider untuk registrasi binding interface, event, atau custom tools.                                                                                                                                            |
| `config/`           | Berisi semua pengaturan sistem seperti database, mail, file system, session, dll.                                                                                                                                         |
| `database/`         | Berisi file skema database (`migrations`), data awal untuk testing (`seeders`), dan generator data palsu (`factories`).                                                                                             |
| `routes/`           | Berisi file konfigurasi routing. Contoh:`auth.php` untuk route login/register.                                                                                                                                          |
| `storage/`          | Tempat penyimpanan file log error aplikasi, session, cache, serta file upload-an user.                                                                                                                                    |
| `tests/`            | Tempat menulis pengujian otomatis (*unit test* & *feature test*).                                                                                                                                                     |
| `artisan`           | Utilitas baris perintah (CLI) bawaan Laravel untuk menjalankan migrasi, membuat controller, dll.                                                                                                                          |

---

### C. Frontend Directory (`frontend/`)

Menggunakan **Next.js** (React) dengan TypeScript dan Tailwind CSS v4 sebagai kerangka kerja aplikasi client-side.

| Nama Folder / File     | Fungsi / Deskripsi                                                                                                                                                                    |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/`               | Struktur*App Router* Next.js. Nama folder di dalam sini otomatis menjadi path URL website (routing). Berisi file `layout.tsx` (tata letak global) dan `page.tsx` (isi halaman). |
| `components/`        | Komponen visual React yang reusable (bisa digunakan berkali-kali).                                                                                                                    |
| `components/ui/`     | Komponen UI dasar (*atomic design*) seperti tombol (`Button.tsx`), input teks (`Input.tsx`), dll. Biasanya dikelola menggunakan Tailwind CSS.                                   |
| `components/shared/` | Komponen yang dipakai di beberapa halaman (misal: kartu produk, banner).                                                                                                              |
| `components/layout/` | Komponen tata letak tetap seperti `Navbar`, `Footer`, atau `Sidebar`.                                                                                                           |
| `hooks/`             | Menyimpan*custom React hooks* untuk menangani state logic yang kompleks.                                                                                                            |
| `lib/`               | Library pembantu atau konfigurasi pihak ketiga. Contoh: konfigurasi Axios untuk menembak API backend.                                                                                 |
| `public/`            | Menyimpan file statis seperti gambar logo, ikon, dan font yang dapat diakses langsung oleh browser.                                                                                   |
| `types/`             | Definisi interface / tipe data TypeScript untuk memastikan keamanan tipe data (*type safety*) saat berkomunikasi dengan API backend.                                                |
| `next.config.ts`     | File konfigurasi kustom untuk Next.js.                                                                                                                                                |
| `package.json`       | Daftar library/dependensi npm yang diinstal untuk frontend.                                                                                                                           |

---

## 3. Evaluasi Struktur Saat Ini: Apakah Sudah Baik?

Secara keseluruhan, struktur proyek ini **Sudah Sangat Baik** dan menggunakan standar modern. Berikut adalah poin-poin kekuatannya:

1. **Pemisahan Tanggung Jawab (Separation of Concerns)**:
   Dengan menggunakan pola *Monorepo*, backend (Laravel) dan frontend (Next.js) terisolasi dengan baik. Ini mencegah konflik pustaka (dependency) dan mempermudah proses deployment di masa depan.
2. **Penerapan Design Pattern yang Dewasa (Mature)**:
   Penggunaan **Service Layer** (`app/Services`) dan **Repository Pattern** (`app/Repositories`) di backend Laravel sangat bagus. Ini membuat kode bersih, terstruktur, mudah diuji (*testable*), dan tidak menumpuk logika di Controller atau Model.
3. **Pemanfaatan Fitur Modern**:
   Frontend sudah menggunakan Next.js **App Router** (standar terbaru Next.js) dan backend menggunakan **Laravel 13** yang sangat baru dan efisien.
4. **Dokumentasi Lengkap di Root**:
   Adanya diagram relasi, audit model, dan panduan alur multi-seller langsung di root mempermudah proses *onboarding* developer baru.

---

## 4. Status Masalah & Tindakan yang Telah Dilakukan

Berikut adalah pembaruan status terhadap masalah-masalah yang sempat diidentifikasi:

### ✅ Masalah 1: Folder/File Sampah (Legacy) di Root (SELESAI)

Sebelumnya terdapat folder `node_modules/`, `vendor/`, dan `.env` bekas di root direktori yang mengotori workspace.

* **Tindakan**: Berkas-berkas tersebut **telah dihapus secara permanen** dari root direktori pada tanggal 12 Juni 2026. Proyek kini sepenuhnya bersih dan developer hanya berinteraksi dengan dependensi di dalam folder `backend/` dan `frontend/`.

### ✅ Masalah 2: Konvensi Penamaan Model Eloquent (Plural vs Singular) (SELESAI)

Sebelumnya penamaan kelas model di backend Laravel menggunakan bentuk jamak/plural (seperti `Products.php`, `Categories.php`).

* **Tindakan**: Seluruh model telah **direfaktorisasi menjadi bentuk tunggal (singular)** (contoh: `Product.php`, `Category.php`, `Customer.php`, `Address.php`). Struktur kelas, penulisan nama relasi, dan dokumentasi diagram hubungan model telah disesuaikan agar sejalan dengan *Laravel Conventions*. Model-model tersebut tetap diarahkan ke tabel jamak di database dengan properti `protected $table`.

### 💡 Rekomendasi Tambahan: Otomatisasi Start Script Monorepo (Open)

* **Rekomendasi**: Membuat file `package.json` di **root** direktori untuk menjalankan skrip dev frontend dan backend secara bersamaan menggunakan library `concurrently`.
* **Contoh setup `package.json` di root**:
  ```json
  {
    "name": "bumdesmart-root",
    "private": true,
    "scripts": {
      "dev": "npx concurrently -c \"#93c5fd,#fb7185\" \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\" --names=frontend,backend"
    },
    "devDependencies": {
      "concurrently": "^8.2.2"
    }
  }
  ```
