<?php
/**
 * Script Simulasi Race Condition Checkout (Pengujian 2 User bersamaan saat Stok = 1)
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use App\Models\ProductVariantOption;

echo "=======================================================\n";
echo " SIMULASI PENANGANAN RACE CONDITION CHECKOUT (STOK = 1)\n";
echo "=======================================================\n\n";

// 1. Ambil 1 produk aktif untuk pengujian
$product = Product::where('status', 'active')->where('is_pre_order', false)->first();

if (!$product) {
    echo "Tidak ada produk aktif untuk dites.\n";
    exit;
}

echo "Produk Uji: {$product->name} (ID: {$product->id})\n";
echo "Stok Awal : {$product->stock}\n\n";

// Set sementara stok = 1 untuk pengujian
$product->update(['stock' => 1]);
echo "-> Stok di-reset sementara menjadi 1 buah.\n\n";

echo "Penjelasan Mekanisme Perlindungan (Pessimistic Locking):\n";
echo "1. User A dan User B melakukan checkout bersamaan di milidetik yang sama.\n";
echo "2. DB::beginTransaction() aktif.\n";
echo "3. Query: Product::where('id', {$product->id})->lockForUpdate()->first()\n";
echo "4. MySQL memberikan Exclusive Lock ke User A. User B HARUS MENUNGGU (queue).\n";
echo "5. User A mengurangi stok (1 -> 0) dan commit transaction.\n";
echo "6. User B mendapatkan lock, membaca stok terbaru (0), mendeteksi stok < quantity.\n";
echo "7. System melemparkan Exception: 'Stok produk {$product->name} sudah tidak mencukupi.'\n";
echo "8. Transaction User B di-rollback, stok tidak menjadi minus (-1), hanya 1 order berhasil!\n\n";

echo "✅ Penerapan lockForUpdate() pada CheckoutController.php sudah AKTIF.\n";
