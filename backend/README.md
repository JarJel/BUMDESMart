# BUMDESMart Backend Documentation

Selamat datang di repositori API Backend BUMDESMart. Dokumentasi ini merangkum perubahan, penambahan fitur, dan perbaikan struktur database yang telah dilakukan pada sisi backend.

---

## Ringkasan Perubahan Backend

### 1. Keamanan & Profil (`ProfileController` & `Routes`)
* **Endpoint Baru (`PUT|POST /api/v1/profile/password`)**:
  * Menambahkan fitur ubah kata sandi di halaman profil.
  * Mendukung method **`PUT`** dan **`POST`** untuk menghindari error 405 Method Not Allowed saat diuji menggunakan Postman atau di-submit dari form dengan tipe data multipart.
  * Validasi yang diterapkan:
    * `current_password` (Kata sandi lama, divalidasi kebenaran hash-nya).
    * `new_password` (Kata sandi baru, minimal 8 karakter).
    * `new_password_confirmation` (Konfirmasi kata sandi baru, harus cocok dengan `new_password`).
  * File yang diubah:
    * [routes/api.php](file:///c:/xampp/htdocs/BUMDESMart/backend/routes/api.php)
    * [ProfileController.php](file:///c:/xampp/htdocs/BUMDESMart/backend/app/Http/Controllers/Customers/ProfileController.php)

### 2. Pencarian Produk (`ProductController`)
* **Dukungan Pencarian Dinamis (`search` atau `q`)**:
  * Memperbarui filter pencarian produk pada endpoint `GET /api/v1/products` agar dapat memproses parameter pencarian baik menggunakan kata kunci `search` maupun singkatan `q` (`$request->input('search') ?: $request->input('q')`).
  * File yang diubah:
    * [ProductController.php](file:///c:/xampp/htdocs/BUMDESMart/backend/app/Http/Controllers/Customers/ProductController.php)

### 3. Perbaikan Skema Alamat (`Addresses Migration`)
* **Penyelarasan Nama Kolom**:
  * Mengubah definisi kolom dari `address_line` menjadi `address` pada file migrasi tabel `addresses`.
  * Penyelarasan ini dilakukan agar database sinkron dengan model Eloquent, Request Validator pada controller, dan payload form alamat dari sisi frontend, guna mencegah error 500 saat membuat alamat baru.
  * File yang diubah:
    * [2026_06_10_122103_create_addresses_table.php](file:///c:/xampp/htdocs/BUMDESMart/backend/database/migrations/2026_06_10_122103_create_addresses_table.php)

### 4. Data Awal / Seeder (`UserSeeder`)
* **Kategori & Produk Tambahan**:
  * Menambahkan seeder data awal untuk kategori (Makanan, Minuman, Kerajinan).
  * Menambahkan seeder produk dummy milik UMKM Mang Asep (seperti *Keripik Singkong Keju* dan *Madu Hutan Asli*) lengkap dengan gambar bawaannya agar katalog awal aplikasi terisi secara otomatis saat seeding dijalankan.
  * File yang diubah:
    * [UserSeeder.php](file:///c:/xampp/htdocs/BUMDESMart/backend/database/seeders/UserSeeder.php)

---

## Panduan Pengujian API Utama via Postman

### A. Autentikasi (Dapatkan Bearer Token)
* **Method**: `POST`
* **URL**: `http://localhost:8000/api/v1/login`
* **Headers**:
  * `Accept` : `application/json`
  * `Content-Type` : `application/json`
* **Body (JSON)**:
  ```json
  {
      "email": "customer@bumdesmart.id",
      "password": "password123"
  }
  ```

### B. Ubah Password Profil
* **Method**: `POST` atau `PUT`
* **URL**: `http://localhost:8000/api/v1/profile/password`
* **Headers**:
  * `Accept` : `application/json`
  * `Authorization` : `Bearer <MASUKKAN_TOKEN_LOGIN_DI_SINI>`
  * `Content-Type` : `application/json`
* **Body (JSON)**:
  ```json
  {
      "current_password": "password123",
      "new_password": "newsecurepassword123",
      "new_password_confirmation": "newsecurepassword123"
  }
  ```

### C. Kelola Wishlist (Contoh)
* **GET List Wishlist**: `GET http://localhost:8000/api/v1/wishlist` (sertakan Header `Authorization: Bearer <TOKEN>`)
* **POST Add Wishlist**: `POST http://localhost:8000/api/v1/wishlist` (Body JSON: `{"product_id": 1}`)
* **DELETE Wishlist**: `DELETE http://localhost:8000/api/v1/wishlist/1` (Hapus produk ID 1 dari wishlist)
