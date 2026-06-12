# Panduan Membuat Relasi Model di Laravel Eloquent

Dokumen ini menjelaskan cara membuat dan mendefinisikan relasi antar model di Laravel Eloquent menggunakan contoh-contoh yang relevan dengan proyek **BUMDESMart**.

---

## 1. Relasi One-to-One (Satu ke Satu)

Relasi satu-ke-satu digunakan ketika sebuah model hanya terhubung dengan tepat satu model lainnya.

### Contoh Kasus: `User` dengan `UmkmProfile`
*   Satu **User** memiliki satu **UmkmProfile**.
*   Satu **UmkmProfile** dimiliki oleh satu **User**.

### A. Mendefinisikan Relasi di Model Parent (`User`)
Gunakan method `hasOne()` pada model utama yang tidak menyimpan *foreign key*.

```php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model
{
    /**
     * Dapatkan profil UMKM yang terkait dengan user.
     */
    public function umkmProfile(): HasOne
    {
        // Parameter: (NamaModelTarget, foreign_key_di_tabel_target, local_key_di_tabel_ini)
        return $this->hasOne(UmkmProfile::class, 'user_id', 'id');
    }
}
```

### B. Mendefinisikan Relasi Kebalikan di Model Child (`UmkmProfile`)
Gunakan method `belongsTo()` pada model yang menyimpan *foreign key* (`user_id`).

```php
// app/Models/UmkmProfile.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UmkmProfile extends Model
{
    /**
     * Dapatkan user pemilik profil UMKM ini.
     */
    public function user(): BelongsTo
    {
        // Parameter: (NamaModelTarget, foreign_key_di_tabel_ini, owner_key_di_tabel_target)
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
```

---

## 2. Relasi One-to-Many (Satu ke Banyak)

Relasi satu-ke-banyak digunakan jika sebuah model dapat memiliki banyak model lain, namun model lain tersebut hanya dapat dimiliki oleh satu model utama.

### Contoh Kasus: `UmkmProfile` dengan `Products`
*   Satu **UmkmProfile** memiliki banyak **Products**.
*   Satu **Products** hanya dimiliki oleh satu **UmkmProfile**.

### A. Mendefinisikan Relasi di Model Parent (`UmkmProfile`)
Gunakan method `hasMany()` pada model parent. Penamaan method biasanya berbentuk jamak (*plural*).

```php
// app/Models/UmkmProfile.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UmkmProfile extends Model
{
    /**
     * Dapatkan semua produk milik UMKM ini.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Products::class, 'umkm_profile_id', 'id');
    }
}
```

### B. Mendefinisikan Relasi Kebalikan di Model Child (`Products`)
Gunakan method `belongsTo()` pada model child yang menyimpan *foreign key* (`umkm_profile_id`). Penamaan method berbentuk tunggal (*singular*).

```php
// app/Models/Products.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Products extends Model
{
    /**
     * Dapatkan UMKM pemilik produk ini.
     */
    public function umkmProfile(): BelongsTo
    {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id', 'id');
    }
}
```

---

## 3. Relasi Many-to-Many (Banyak ke Banyak)

Relasi banyak-ke-banyak digunakan jika sebuah model dapat memiliki banyak model lain, dan sebaliknya. Relasi ini membutuhkan **tabel perantara (pivot table)**.

### Contoh Kasus: `Products` dengan `Orders` melalui tabel pivot `order_items`
*   Satu **Products** bisa berada di banyak **Orders**.
*   Satu **Orders** bisa berisi banyak **Products**.

### A. Mendefinisikan Relasi di Model `Orders`
Gunakan method `belongsToMany()`.

```php
// app/Models/Orders.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Orders extends Model
{
    /**
     * Produk-produk yang ada di dalam order ini.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Products::class, 'order_items', 'order_id', 'product_id')
                    ->withPivot('quantity', 'price') // Jika ingin mengambil kolom tambahan di tabel pivot
                    ->withTimestamps();
    }
}
```

### B. Mendefinisikan Relasi di Model `Products`
Gunakan method `belongsToMany()`.

```php
// app/Models/Products.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Products extends Model
{
    /**
     * Order-order yang memuat produk ini.
     */
    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Orders::class, 'order_items', 'product_id', 'order_id')
                    ->withPivot('quantity', 'price')
                    ->withTimestamps();
    }
}
```

---

## 4. Cara Menggunakan dan Mengambil Data Relasi

Setelah mendefinisikan relasi di model, Anda dapat menggunakannya di Controller atau bagian aplikasi lainnya.

### A. Lazy Loading (Default)
Mengambil relasi hanya saat diakses. Ini bisa menyebabkan masalah performa **N+1 Query** jika dilakukan di dalam perulangan.

```php
$product = Products::find(1);
// Relasi dipanggil seperti property
$umkmName = $product->umkmProfile->name;
```

### B. Eager Loading (Direkomendasikan)
Mengambil data utama dan data relasinya sekaligus dalam query yang efisien menggunakan method `with()`.

```php
// Mengambil semua produk beserta data UMKM terkait
$products = Products::with('umkmProfile')->get();

foreach ($products as $product) {
    // Tidak ada query tambahan di sini karena data sudah di-load di awal
    echo $product->name . ' - ' . $product->umkmProfile->name;
}
```

### C. Menerapkan Kueri Filter pada Relasi (`whereHas`)
Membatasi hasil pencarian berdasarkan kondisi yang ada pada model relasi.

```php
// Mengambil UMKM yang memiliki produk dengan harga di atas 100.000
$umkms = UmkmProfile::whereHas('products', function ($query) {
    $query->where('price', '>', 100000);
})->get();
```

---

## 5. Tips dan Best Practices

1.  **Gunakan Type Hinting**: Selalu gunakan return type hint seperti `: HasOne`, `: BelongsTo`, `: HasMany`, `: BelongsToMany` untuk auto-complete editor yang lebih baik dan kode yang bersih.
2.  **Penamaan Method**:
    *   Gunakan huruf tunggal (**singular**) untuk relasi yang menghasilkan satu objek (misalnya `umkmProfile()`, `user()`).
    *   Gunakan huruf jamak (**plural**) untuk relasi yang menghasilkan banyak objek (misalnya `products()`, `orders()`).
3.  **Spesifikasikan Parameter jika Kustom**: Jika Anda tidak menggunakan nama foreign key standar Laravel (`{nama_model}_id`), selalu tuliskan parameter foreign key secara eksplisit (seperti `'user_id'`, `'id'`) untuk menghindari error relasi.
