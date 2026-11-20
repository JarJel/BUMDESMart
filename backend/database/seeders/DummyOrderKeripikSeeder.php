<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\UmkmProfile;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\UmkmBalance;
use App\Models\User;
use App\Models\BumdesProfile;
use App\Models\Category;

class DummyOrderKeripikSeeder extends Seeder
{
    public function run(): void
    {
        DB::beginTransaction();
        try {
            // 1. Cari Toko Keripik Mang Acuy (atau varian nama serupa)
            $toko = UmkmProfile::where('shop_name', 'like', '%Keripik Mang Acuy%')
                ->orWhere('shop_name', 'like', '%Mang Acuy%')
                ->orWhere('shop_name', 'like', '%Keripik Mang Asep%')
                ->first();

            // Jika belum ada toko, buatkan profil toko dengan QRIS statis
            if (!$toko) {
                $this->command->info("Toko tidak ditemukan, membuat toko 'Keripik Mang Acuy'...");
                $bumdes = BumdesProfile::first();
                $sellerUser = User::firstOrCreate(
                    ['email' => 'acuy@bumdesmart.id'],
                    [
                        'name'     => 'Mang Acuy',
                        'password' => bcrypt('password'),
                        'role'     => 'umkm',
                        'phone'    => '081234567899',
                        'status'   => 'active',
                    ]
                );

                $toko = UmkmProfile::create([
                    'user_id'           => $sellerUser->id,
                    'bumdes_profile_id' => $bumdes ? $bumdes->id : 1,
                    'shop_name'         => 'Keripik Mang Acuy',
                    'slug'              => 'keripik-mang-acuy',
                    'owner_name'        => 'Mang Acuy',
                    'email'             => 'acuy@bumdesmart.id',
                    'phone'             => '081234567899',
                    'description'       => 'Aneka keripik renyah khas desa',
                    'address'           => 'Jl. Desa No. 12',
                    'city'              => 'Sukabumi',
                    'province'          => 'Jawa Barat',
                    'qris_image'        => 'uploads/shop/qris/dummy_qris_mang_acuy.png', // QRIS Statis Toko
                    'status'            => 'active',
                    'is_open'           => true,
                ]);
            } else {
                // Pastikan toko memiliki qris_image statis
                if (empty($toko->qris_image)) {
                    $toko->update([
                        'qris_image' => 'uploads/shop/qris/dummy_qris_mang_acuy.png'
                    ]);
                }
            }

            // 2. Ambil produk milik toko
            $products = $toko->products()->get();
            if ($products->isEmpty()) {
                $this->command->info("Produk toko belum ada, membuat produk dummy...");
                $category = Category::first() ?? Category::create(['name' => 'Makanan & Minuman', 'slug' => 'makanan-minuman']);
                
                $prod1 = Product::create([
                    'umkm_profile_id' => $toko->id,
                    'category_id'     => $category->id,
                    'name'            => 'Keripik Singkong Pedas Mang Acuy',
                    'slug'            => 'keripik-singkong-pedas-mang-acuy-' . time(),
                    'description'     => 'Keripik singkong pedas gurih renyah.',
                    'price'           => 15000,
                    'stock'           => 50,
                    'weight'          => 200,
                    'status'          => 'active',
                ]);

                $prod2 = Product::create([
                    'umkm_profile_id' => $toko->id,
                    'category_id'     => $category->id,
                    'name'            => 'Keripik Pisang Cokelat Mang Acuy',
                    'slug'            => 'keripik-pisang-cokelat-mang-acuy-' . time(),
                    'description'     => 'Keripik pisang lumer cokelat manis renyah.',
                    'price'           => 18000,
                    'stock'           => 40,
                    'weight'          => 250,
                    'status'          => 'active',
                ]);

                $products = collect([$prod1, $prod2]);
            }

            // 3. Pastikan customer ada
            $customer = Customer::first();
            if (!$customer) {
                $custUser = User::firstOrCreate(
                    ['email' => 'pembeli@gmail.com'],
                    ['name' => 'Budi Santoso', 'password' => bcrypt('password'), 'role' => 'customer']
                );
                $customer = Customer::create(['user_id' => $custUser->id]);
            }

            // 4. Buat 3 pesanan dengan pembayaran QRIS Statis Toko (manual_umkm)
            $ordersData = [
                ['qty' => 3, 'fee' => 1500, 'ship' => 8000, 'days_ago' => 5],
                ['qty' => 2, 'fee' => 1000, 'ship' => 8000, 'days_ago' => 2],
                ['qty' => 4, 'fee' => 2000, 'ship' => 10000, 'days_ago' => 0],
            ];

            $totalNetRevenue = 0;
            $totalStockReduced = 0;

            foreach ($ordersData as $idx => $data) {
                $product = $products[$idx % $products->count()];
                $qty = $data['qty'];
                $subTotal = (float) $product->price * $qty;
                $bumdesFee = $data['fee'];
                $shippingCost = $data['ship'];
                $total = $subTotal + $shippingCost;
                $orderDate = now()->subDays($data['days_ago']);
                $orderCode = 'ORD-ACUY-' . strtoupper(Str::random(5)) . '-' . ($idx + 1);

                // Kurangi stok produk & update sold_count
                $oldStock = $product->stock;
                $product->decrement('stock', $qty);
                $product->increment('sold_count', $qty);
                $newStock = $product->fresh()->stock;
                $totalStockReduced += $qty;

                // Buat Order status completed
                $order = Order::create([
                    'customer_id'     => $customer->id,
                    'umkm_profile_id' => $toko->id,
                    'address_id'      => $customer->addresses()->first()?->id ?? null,
                    'order_code'      => $orderCode,
                    'sub_total'       => $subTotal,
                    'shipping_cost'   => $shippingCost,
                    'discount'        => 0,
                    'total'           => $total,
                    'bumdes_fee'      => $bumdesFee,
                    'service_fee'     => 1000,
                    'status'          => 'completed',
                    'delivery_type'   => 'pickup',
                    'created_at'      => $orderDate,
                    'updated_at'      => $orderDate,
                ]);

                // Buat Order Item
                OrderItem::create([
                    'order_id'      => $order->id,
                    'product_id'    => $product->id,
                    'product_name'  => $product->name,
                    'product_price' => $product->price,
                    'quantity'      => $qty,
                    'sub_total'     => $subTotal,
                    'created_at'    => $orderDate,
                    'updated_at'    => $orderDate,
                ]);

                // Buat Pembayaran QRIS Statis Toko Langsung (manual_umkm)
                Payment::create([
                    'order_id'         => $order->id,
                    'payment_type'     => 'manual_umkm', // Bayar langsung ke toko via QRIS statis
                    'payment_code'     => 'MAN-' . strtoupper(Str::random(10)),
                    'amount'           => $total,
                    'channel'          => 'qris',
                    'channel_code'     => 'qris_statis_toko',
                    'proof_of_payment' => 'uploads/payments/dummy_bukti_transfer_qris.jpg', // Bukti transfer pembeli
                    'status'           => 'paid', // Sudah diverifikasi toko
                    'paid_at'          => $orderDate,
                    'created_at'       => $orderDate,
                    'updated_at'       => $orderDate,
                ]);

                // Pendapatan bersih toko: sub_total - bumdes_fee
                $net = max(0, $subTotal - $bumdesFee);
                $totalNetRevenue += $net;

                $this->command->info("Pesanan #{$orderCode}: {$product->name} (Qty: {$qty}, Stok: {$oldStock} -> {$newStock}) | Pembayaran: QRIS Statis Toko | Pendapatan: Rp " . number_format($net, 0, ',', '.'));
            }

            // Update saldo toko (available)
            $balance = UmkmBalance::findOrCreateFor($toko->id, 'umkm');
            $balance->increment('available', $totalNetRevenue);

            DB::commit();

            $this->command->info("\n========================================================");
            $this->command->info("BERHASIL MEMBUAT PESANAN DUMMY QRIS STATIS TOKO!");
            $this->command->info("Toko              : " . $toko->shop_name);
            $this->command->info("Metode Pembayaran : QRIS Statis Toko (manual_umkm)");
            $this->command->info("Total Stok Keluar : {$totalStockReduced} unit");
            $this->command->info("Total Pendapatan  : Rp " . number_format($totalNetRevenue, 0, ',', '.'));
            $this->command->info("Saldo Siap Cair   : Rp " . number_format($balance->fresh()->available, 0, ',', '.'));
            $this->command->info("========================================================");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Gagal membuat dummy order: " . $e->getMessage());
        }
    }
}
