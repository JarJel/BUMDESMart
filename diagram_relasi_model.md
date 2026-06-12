# Diagram Relasi Model BUMDESMart

Dokumen ini berisi visualisasi hubungan (Entity Relationship Diagram - ERD) dari semua model Eloquent pada proyek **BUMDESMart**. Untuk memudahkan pembacaan, diagram dibagi menjadi diagram global (keseluruhan) dan sub-diagram berdasarkan modul fungsional.

---

## 1. Diagram Relasi Global (Semua Model)

Di bawah ini adalah diagram hubungan dari ke-21 model yang ada dalam sistem:

```mermaid
erDiagram
    %% Hubungan User & Profiling
    User ||--o| UmkmProfile : "umkmProfile (hasOne)"
    User ||--o| Customers : "customer (hasOne)"
    User ||--o{ OrderHistory : "orderHistories (hasMany)"
    UmkmProfile ||--o{ UmkmDocuments : "umkmDocuments (hasMany)"
    Customers ||--o{ Addresses : "addresses (hasMany)"

    %% Hubungan Katalog Produk & Promosi
    UmkmProfile ||--o{ Products : "products (hasMany)"
    Categories ||--o{ Products : "products (hasMany)"
    Categories ||--o{ Categories : "parent / childs (self-relation)"
    Products ||--o{ ProductImages : "images (hasMany)"
    Products ||--o{ ProductVariants : "variants (hasMany)"
    ProductVariants ||--o{ ProductVariantsOptions : "options (hasMany)"
    
    Customers ||--o{ Wishlist : "wishlist (hasMany)"
    Products ||--o{ Wishlist : "wishlist (belongsTo)"
    
    UmkmProfile ||--o{ Promotions : "promotions (hasMany)"
    Promotions ||--o{ PromotionProducts : "promotionProducts (hasMany)"
    Products ||--o{ PromotionProducts : "promotionProducts (belongsTo)"
    Categories ||--o{ PromotionProducts : "promotionProducts (belongsTo)"

    %% Hubungan Transaksi, Pembayaran & Pengiriman
    Customers ||--o{ Orders : "orders (hasMany)"
    UmkmProfile ||--o{ Orders : "orders (hasMany)"
    
    Orders ||--o{ OrderHistory : "orderHistories (hasMany)"
    Orders ||--o{ OrdersItems : "orderItems (hasMany)"
    OrdersItems ||--o| Products : "product (belongsTo)"
    OrdersItems ||--o| ProductVariants : "variant (belongsTo)"
    
    Orders ||--o| Payments : "payment (hasOne)"
    Payments ||--o{ PaymentDetails : "paymentDetails (hasMany)"
    
    Orders ||--o| Shipments : "shipment (hasOne)"
    ShippingServices ||--o{ Shipments : "shipments (hasMany)"
    Shipments ||--o{ ShipmentTracking : "shipmentTrackings (hasMany)"
```

---

## 2. Diagram Berdasarkan Modul

Karena kompleksitas diagram global di atas, berikut adalah pembagian per modul fungsional agar lebih mudah dianalisis.

### A. Modul User, Pelanggan, dan UMKM
Modul ini menangani akun pengguna, data pelanggan, alamat, profil UMKM, dan dokumen legalitas UMKM.

```mermaid
erDiagram
    User ||--o| UmkmProfile : "user_id"
    User ||--o| Customers : "user_id"
    UmkmProfile ||--o{ UmkmDocuments : "umkm_profile_id"
    Customers ||--o{ Addresses : "customer_id"
```

*   **[User](file:///c:/xampp/htdocs/BUMDESMart/app/Models/User.php)**: Model utama untuk autentikasi. Memiliki relasi satu-ke-satu ke pelanggan dan profil UMKM.
*   **[Customers](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Customers.php)**: Menyimpan profil pembeli/pelanggan.
*   **[Addresses](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Addresses.php)**: Menyimpan alamat pengiriman dari pelanggan (bisa lebih dari satu).
*   **[UmkmProfile](file:///c:/xampp/htdocs/BUMDESMart/app/Models/UmkmProfile.php)**: Menyimpan profil pedagang/mitra UMKM.
*   **[UmkmDocuments](file:///c:/xampp/htdocs/BUMDESMart/app/Models/UmkmDocuments.php)**: Menyimpan berkas/dokumen verifikasi legalitas UMKM.

---

### B. Modul Katalog Produk, Stok & Promosi
Modul ini menangani klasifikasi kategori, produk, gambar produk, variasi produk (seperti ukuran/warna), serta sistem promosi/diskon.

```mermaid
erDiagram
    UmkmProfile ||--o{ Products : "umkm_profile_id"
    Categories ||--o{ Products : "category_id"
    Categories ||--o{ Categories : "parent_id (self)"
    Products ||--o{ ProductImages : "product_id"
    Products ||--o{ ProductVariants : "product_id"
    ProductVariants ||--o{ ProductVariantsOptions : "product_variant_id"
    
    Customers ||--o{ Wishlist : "customer_id"
    Products ||--o{ Wishlist : "product_id"
    
    UmkmProfile ||--o{ Promotions : "umkm_profile_id"
    Promotions ||--o{ PromotionProducts : "promotion_id"
    Products ||--o{ PromotionProducts : "product_id"
    Categories ||--o{ PromotionProducts : "category_id"
```

*   **[Products](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Products.php)**: Model produk yang dijual oleh UMKM.
*   **[Categories](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Categories.php)**: Kategori berstruktur hierarki (self-referencing parent-child).
*   **[ProductImages](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ProductImages.php)**: Galeri foto produk.
*   **[ProductVariants](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ProductVariants.php)**: Varian produk (misal: "Baju Kaos").
*   **[ProductVariantsOptions](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ProductVariantsOptions.php)**: Opsi dari varian produk (misal: "Ukuran L", "Warna Merah").
*   **[Wishlist](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Wishlist.php)**: Menyimpan daftar produk favorit pelanggan.
*   **[Promotions](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Promotions.php)**: Data promosi/kupon yang dibuat oleh UMKM.
*   **[PromotionProducts](file:///c:/xampp/htdocs/BUMDESMart/app/Models/PromotionProducts.php)**: Pivot untuk membatasi promosi pada produk atau kategori tertentu.

---

### C. Modul Transaksi (Order, Pembayaran & Pengiriman)
Modul inti e-commerce yang melacak pembuatan pesanan, pembayaran, serta status pengiriman ekspedisi logistik.

```mermaid
erDiagram
    Customers ||--o{ Orders : "customer_id"
    UmkmProfile ||--o{ Orders : "umkm_profile_id"
    
    Orders ||--o{ OrderHistory : "order_id"
    User ||--o{ OrderHistory : "user_id"
    
    Orders ||--o{ OrdersItems : "order_id"
    OrdersItems ||--o| Products : "product_id"
    OrdersItems ||--o| ProductVariants : "variant_id"
    
    Orders ||--o| Payments : "order_id"
    Payments ||--o{ PaymentDetails : "payment_id"
    
    Orders ||--o| Shipments : "order_id"
    ShippingServices ||--o{ Shipments : "shipping_service_id"
    Shipments ||--o{ ShipmentTracking : "shipment_id"
```

*   **[Orders](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Orders.php)**: Dokumen utama transaksi belanja.
*   **[OrdersItems](file:///c:/xampp/htdocs/BUMDESMart/app/Models/OrdersItems.php)**: Detail item produk & varian yang dibeli beserta harga saat transaksi.
*   **[OrderHistory](file:///c:/xampp/htdocs/BUMDESMart/app/Models/OrderHistory.php)**: Log jejak perubahan status order (dibuat, diproses, dikirim, selesai, dibatalkan) oleh User/System.
*   **[Payments](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Payments.php)**: Data transaksi pembayaran (gateway, nominal, status).
*   **[PaymentDetails](file:///c:/xampp/htdocs/BUMDESMart/app/Models/PaymentDetails.php)**: Data tambahan/meta pembayaran (token gateway, detail instruksi bank, dll).
*   **[Shipments](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Shipments.php)**: Informasi pengiriman barang (no resi, ongkos kirim, status pengiriman).
*   **[ShippingServices](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ShippingServices.php)**: Daftar pilihan kurir/layanan ekspedisi pengiriman.
*   **[ShipmentTracking](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ShipmentTracking.php)**: Log detail pelacakan posisi paket (milestone tracking resi).

---

## 3. Rincian Hubungan & Kunci Asing (Foreign Keys)

Berikut adalah daftar detail relasi antar model beserta nama fungsi relasi, tipe relasi, target model, dan foreign key yang digunakan:

| No | Model Asal (Source) | Nama Fungsi Relasi | Tipe Relasi | Model Target | Foreign Key | Deskripsi |
|---|---|---|---|---|---|---|
| 1 | **[Addresses](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Addresses.php)** | `customer` | `belongsTo` | `Customers` | `customer_id` | Alamat dimiliki oleh satu pelanggan |
| 2 | **[Categories](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Categories.php)** | `products` | `hasMany` | `Products` | `category_id` | Satu kategori bisa memiliki banyak produk |
| | | `parent` | `belongsTo` | `Categories` | `parent_id` | Menunjuk ke kategori induk (hirarki atas) |
| | | `childs` | `hasMany` | `Categories` | `parent_id` | Mendapatkan semua sub-kategori di bawahnya |
| 3 | **[Customers](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Customers.php)** | `user` | `belongsTo` | `User` | `user_id` | Akun user yang terhubung dengan pelanggan |
| | | `orders` | `hasMany` | `Orders` | `customer_id` | Riwayat pesanan milik pelanggan |
| | | `addresses` | `hasMany` | `Addresses` | `customer_id` | Daftar alamat pengiriman milik pelanggan |
| | | `wishlist` | `hasMany` | `Wishlist` | `customer_id` | Daftar item produk favorit pelanggan |
| 4 | **[OrderHistory](file:///c:/xampp/htdocs/BUMDESMart/app/Models/OrderHistory.php)** | `order` | `belongsTo` | `Orders` | `order_id` | Log riwayat merujuk ke satu order |
| | | `user` | `belongsTo` | `User` | `user_id` | User/aktor yang memicu perubahan status order |
| 5 | **[Orders](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Orders.php)** | `customer` | `belongsTo` | `Customers` | `customer_id` | Pelanggan yang membuat pesanan |
| | | `umkmProfile` | `belongsTo` | `UmkmProfile` | `umkm_profile_id` | UMKM yang menjual produk dalam pesanan ini |
| | | `orderHistories` | `hasMany` | `OrderHistory` | `order_id` | Riwayat perubahan status pesanan ini |
| | | `orderItems` | `hasMany` | `OrdersItems` | `order_id` | Daftar item produk yang dibeli |
| | | `payment` | `hasOne` | `Payments` | `order_id` | Informasi pembayaran pesanan ini |
| | | `shipment` | `hasOne` | `Shipments` | `order_id` | Informasi pengiriman barang |
| 6 | **[OrdersItems](file:///c:/xampp/htdocs/BUMDESMart/app/Models/OrdersItems.php)** | `order` | `belongsTo` | `Orders` | `order_id` | Pesanan induk dari item ini |
| | | `product` | `belongsTo` | `Products` | `product_id` | Produk asli yang dibeli |
| | | `variant` | `belongsTo` | `ProductVariants` | `variant_id` | Varian produk spesifik (jika ada) |
| 7 | **[PaymentDetails](file:///c:/xampp/htdocs/BUMDESMart/app/Models/PaymentDetails.php)** | `payment` | `belongsTo` | `Payments` | `payment_id` | Data pembayaran induk dari detail/meta ini |
| 8 | **[Payments](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Payments.php)** | `order` | `belongsTo` | `Orders` | `order_id` | Pesanan terkait pembayaran ini |
| | | `paymentDetails` | `hasMany` | `PaymentDetails` | `payment_id` | Rincian meta transaksi pembayaran |
| 9 | **[ProductImages](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ProductImages.php)** | `product` | `belongsTo` | `Products` | `product_id` | Produk pemilik gambar |
| 10 | **[ProductVariants](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ProductVariants.php)** | `product` | `belongsTo` | `Products` | `product_id` | Produk induk dari varian ini |
| | | `options` | `hasMany` | `ProductVariantsOptions` | `product_variant_id` | Detail pilihan opsi dari varian ini |
| 11 | **[ProductVariantsOptions](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ProductVariantsOptions.php)** | `productVariant` | `belongsTo` | `ProductVariants` | `product_variant_id` | Varian induk dari opsi ini |
| 12 | **[Products](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Products.php)** | `umkmProfile` | `belongsTo` | `UmkmProfile` | `umkm_profile_id` | UMKM pemilik produk ini |
| | | `category` | `belongsTo` | `Categories` | `category_id` | Kategori tempat produk ini berada |
| | | `images` | `hasMany` | `ProductImages` | `product_id` | Daftar gambar/foto dari produk ini |
| | | `variants` | `hasMany` | `ProductVariants` | `product_id` | Daftar varian model dari produk ini |
| 13 | **[PromotionProducts](file:///c:/xampp/htdocs/BUMDESMart/app/Models/PromotionProducts.php)** | `promotion` | `belongsTo` | `Promotions` | `promotion_id` | Promosi induk terkait |
| | | `product` | `belongsTo` | `Products` | `product_id` | Produk spesifik yang dikenakan promosi |
| | | `category` | `belongsTo` | `Categories` | `category_id` | Kategori spesifik yang dikenakan promosi |
| 14 | **[Promotions](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Promotions.php)** | `umkmProfile` | `belongsTo` | `UmkmProfile` | `umkm_profile_id` | Profil UMKM pembuat kupon promosi |
| | | `promotionProducts` | `hasMany` | `PromotionProducts` | `promotion_id` | Daftar produk/kategori khusus promo ini |
| 15 | **[ShipmentTracking](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ShipmentTracking.php)** | `shipment` | `belongsTo` | `Shipments` | `shipment_id` | Pengiriman induk terkait tracking |
| 16 | **[Shipments](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Shipments.php)** | `order` | `belongsTo` | `Orders` | `order_id` | Pesanan terkait pengiriman ini |
| | | `shippingService` | `belongsTo` | `ShippingServices` | `shipping_service_id` | Layanan ekspedisi kurir yang digunakan |
| | | `shipmentTrackings` | `hasMany` | `ShipmentTracking` | `shipment_id` | Catatan/log perjalanan resi |
| 17 | **[ShippingServices](file:///c:/xampp/htdocs/BUMDESMart/app/Models/ShippingServices.php)** | `shipments` | `hasMany` | `Shipments` | `shipping_service_id` | Daftar pengiriman yang memakai layanan ini |
| 18 | **[UmkmDocuments](file:///c:/xampp/htdocs/BUMDESMart/app/Models/UmkmDocuments.php)** | `umkmProfile` | `belongsTo` | `UmkmProfile` | `umkm_profile_id` | Profil UMKM pemilik berkas dokumen |
| 19 | **[UmkmProfile](file:///c:/xampp/htdocs/BUMDESMart/app/Models/UmkmProfile.php)** | `user` | `belongsTo` | `User` | `user_id` | Akun user terdaftar pemilik UMKM |
| | | `products` | `hasMany` | `Products` | `umkm_profile_id` | Daftar produk yang dijual UMKM |
| | | `umkmDocuments` | `hasMany` | `UmkmDocuments` | `umkm_profile_id` | Dokumen persyaratan milik UMKM |
| | | `orders` | `hasMany` | `Orders` | `umkm_profile_id` | Daftar pesanan masuk yang diproses UMKM |
| 20 | **[User](file:///c:/xampp/htdocs/BUMDESMart/app/Models/User.php)** | `umkmProfile` | `hasOne` | `UmkmProfile` | `user_id` | Profil UMKM pengguna (jika berperan sebagai penjual) |
| | | `customer` | `hasOne` | `Customers` | `user_id` | Profil pelanggan pengguna (jika berperan sebagai pembeli) |
| | | `orderHistories` | `hasMany` | `OrderHistory` | `user_id` | Catatan riwayat order yang diubah oleh user ini |
| 21 | **[Wishlist](file:///c:/xampp/htdocs/BUMDESMart/app/Models/Wishlist.php)** | `customer` | `belongsTo` | `Customers` | `customer_id` | Pelanggan pemilik wishlist |
| | | `product` | `belongsTo` | `Products` | `product_id` | Detail data produk yang disukai |
