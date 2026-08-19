<?php

namespace App\Http\Controllers;

use App\Models\Disbursement;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\UmkmBalance;
use App\Models\UmkmBankAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WebhookController extends Controller
{
    public function xendit(Request $request)
    {
        $token = $request->header('x-callback-token');
        if ($token !== config('services.xendit.webhook_token')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $data = $request->all();
        Log::info('Xendit webhook received', $data);

        $externalId = $data['external_id'] ?? null;
        $status     = strtolower($data['status'] ?? '');

        $payment = Payment::where('xendit_external_id', $externalId)->first();
        if (! $payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        $map = ['paid' => 'paid', 'settled' => 'paid', 'expired' => 'expired', 'failed' => 'failed'];
        $newStatus = $map[$status] ?? null;

        if (! $newStatus || $payment->status === $newStatus) {
            return response()->json(['message' => 'ok']);
        }

        $payment->update([
            'status'   => $newStatus,
            'paid_at'  => $newStatus === 'paid' ? now() : null,
            'xendit_data' => $data,
        ]);

        $order = $payment->order;

        // Kembalikan stok saat invoice expired/failed agar tidak terkunci permanen
        if (in_array($newStatus, ['expired', 'failed']) && $order) {
            $order->load('items.product');
            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->increment('stock', $item->quantity);
                }
            }
            $order->update(['status' => 'cancelled']);
        }

        if ($newStatus === 'paid' && $order) {
            $order->update(['status' => 'pending']);
            $order->load('items', 'umkmProfile.bumdesProfile', 'umkmProfile.user');

            foreach ($order->items as $item) {
                \App\Models\ProductDiscount::applyUsage($item->product_id);
            }

            // Kredit pending balance UMKM: sub_total - komisi platform - fee BUMDes
            $commission = $this->calculateCommission((float) $order->sub_total);
            $bumdesFee  = (float) ($order->bumdes_fee ?? 0);
            $umkmAmount = max(0, (float) $order->sub_total - $commission - $bumdesFee);

            $umkmBalance = UmkmBalance::findOrCreateFor($order->umkm_profile_id, 'umkm');
            $umkmBalance->increment('pending', $umkmAmount);

            // Kredit pending balance BUMDes (bumdes_fee + service_fee)
            $serviceFee    = (float) ($order->service_fee ?? 0);
            $totalBumdes   = $bumdesFee + $serviceFee;
            if ($totalBumdes > 0 && $order->umkmProfile?->bumdesProfile) {
                $bumdesBalance = UmkmBalance::findOrCreateFor($order->umkmProfile->bumdesProfile->id, 'bumdes');
                $bumdesBalance->increment('pending', $totalBumdes);
            }

            // Notifikasi ke UMKM: pesanan baru sudah dibayar
            if ($order->umkmProfile?->user_id) {
                $totalItems = $order->items->sum('quantity');
                Notification::send(
                    $order->umkmProfile->user_id,
                    '🛍️ Pesanan Baru Masuk!',
                    "Pesanan #{$order->order_code} sudah dibayar. {$totalItems} item perlu disiapkan. Segera proses pesanan ini.",
                    'order_new',
                    'order',
                    $order->id
                );

                // Kirim notifikasi WhatsApp ke Seller via queue (anti-spam, driver-agnostic)
                $sellerPhone = $order->umkmProfile->phone;
                if (!$sellerPhone && $order->umkmProfile->user) {
                    $sellerPhone = $order->umkmProfile->user->phone;
                }
                if ($sellerPhone) {
                    $sellerName = $order->umkmProfile->owner_name ?? $order->umkmProfile->user?->name ?? 'Mitra BUMDeSMart';
                    \App\Helpers\WaNotification::orderMasukSeller($sellerPhone, $sellerName, $order->order_code, (int) $order->total);
                }

                // Cek stok setelah pesanan: kirim notif kalau ada produk stok menipis
                $order->load('items.product');
                foreach ($order->items as $item) {
                    $product = $item->product;
                    if (!$product) continue;
                    $newStock = $product->stock - $item->quantity;
                    if ($newStock <= 5 && $newStock >= 0) {
                        $msg = $newStock === 0
                            ? "Stok produk \"{$product->name}\" sudah habis setelah pesanan #{$order->order_code}. Segera isi ulang agar pembeli bisa memesan lagi."
                            : "Stok produk \"{$product->name}\" tinggal {$newStock} unit setelah pesanan #{$order->order_code}. Segera isi ulang sebelum kehabisan.";
                        Notification::send(
                            $order->umkmProfile->user_id,
                            $newStock === 0 ? '❌ Stok Produk Habis!' : '⚠️ Stok Produk Hampir Habis',
                            $msg,
                            'stock_warning',
                            'product',
                            $product->id
                        );
                    }
                }
            }
        }

        return response()->json(['message' => 'ok']);
    }

    // Dipanggil saat order selesai (delivered, completed pickup)
    public function triggerDisbursement(Order $order): void
    {
        $payment = $order->payment;
        if (! $payment || $payment->status !== 'paid') {
            return;
        }

        $order->load('umkmProfile.bumdesProfile');

        // Komisi dihitung dari sub_total (tidak termasuk ongkir)
        $commission  = $this->calculateCommission((float) $order->sub_total);
        $bumdesFee   = (float) ($order->bumdes_fee ?? 0);
        $umkmNet     = max(0, (float) $order->sub_total - $commission - $bumdesFee);
        $shippingNet = (float) $order->shipping_cost;

        // Proses saldo UMKM
        $umkmBalance = UmkmBalance::findOrCreateFor($order->umkm_profile_id, 'umkm');
        $umkmBalance->decrement('pending', $umkmNet);

        $umkmAccount = UmkmBankAccount::where('owner_id', $order->umkm_profile_id)
            ->where('owner_type', 'umkm')
            ->where('is_active', true)
            ->first();

        if ($umkmAccount) {
            $umkmBalance->increment('withdrawn', $umkmNet);
            $this->createXenditDisbursement($order, $umkmAccount, $umkmNet, 'umkm');
        } else {
            $umkmBalance->increment('available', $umkmNet);
        }

        // Proses saldo BUMDes (bumdes_fee + service_fee)
        if ($order->umkmProfile?->bumdesProfile) {
            $bumdesProfile = $order->umkmProfile->bumdesProfile;
            $serviceFee    = (float) ($order->service_fee ?? 0);
            $totalBumdes   = $bumdesFee + $serviceFee;

            if ($totalBumdes > 0) {
                $bumdesBalance = UmkmBalance::findOrCreateFor($bumdesProfile->id, 'bumdes');
                $bumdesBalance->decrement('pending', $totalBumdes);

                // Catat histori transaksi BUMDes
                if ($bumdesFee > 0) {
                    \App\Models\BumdesTransaction::create([
                        'bumdes_profile_id' => $bumdesProfile->id,
                        'order_id'          => $order->id,
                        'type'              => 'seller_fee',
                        'amount'            => (int) $bumdesFee,
                        'description'       => 'Fee dari seller order #' . $order->order_code,
                    ]);
                }
                if ($serviceFee > 0) {
                    \App\Models\BumdesTransaction::create([
                        'bumdes_profile_id' => $bumdesProfile->id,
                        'order_id'          => $order->id,
                        'type'              => 'service_fee',
                        'amount'            => (int) $serviceFee,
                        'description'       => 'Biaya layanan pembeli order #' . $order->order_code,
                    ]);
                }

                $bumdesAccount = UmkmBankAccount::where('owner_id', $bumdesProfile->id)
                    ->where('owner_type', 'bumdes')
                    ->where('is_active', true)
                    ->first();

                if ($bumdesAccount) {
                    $bumdesBalance->increment('withdrawn', $totalBumdes);
                    $this->createXenditDisbursement($order, $bumdesAccount, $totalBumdes, 'bumdes');
                } else {
                    $bumdesBalance->increment('available', $totalBumdes);
                }
            }
        }

        // Proses saldo Driver (ongkir)
        if ($order->driver_id) {
            $driverBalance = UmkmBalance::findOrCreateFor($order->driver_id, 'driver');

            $driverAccount = UmkmBankAccount::where('owner_id', $order->driver_id)
                ->where('owner_type', 'driver')
                ->where('is_active', true)
                ->first();

            if ($driverAccount) {
                $driverBalance->increment('withdrawn', $shippingNet);
                $this->createXenditDisbursement($order, $driverAccount, $shippingNet, 'driver');
            } else {
                $driverBalance->increment('available', $shippingNet);
            }
        }
    }

    private function createXenditDisbursement(Order $order, UmkmBankAccount $account, float $amount, string $ownerType): void
    {
        $referenceId = 'DISB-' . $order->order_code . '-' . $ownerType . '-' . Str::random(6);

        $disb = Disbursement::create([
            'order_id'       => $order->id,
            'owner_id'       => $account->owner_id,
            'owner_type'     => $ownerType,
            'channel_code'   => $account->channel_code,
            'account_number' => $account->account_number,
            'account_name'   => $account->account_name,
            'amount'         => $amount,
            'reference_id'   => $referenceId,
            'status'         => 'pending',
        ]);

        $response = Http::when(app()->environment('local'), fn($q) => $q->withoutVerifying())
            ->withHeaders([
                'Authorization' => 'Basic ' . base64_encode(config('services.xendit.secret_key') . ':'),
                'Content-Type'  => 'application/json',
            ])->post('https://api.xendit.co/disbursements', [
            'external_id'     => $referenceId,
            'amount'          => (int) $amount,
            'bank_code'       => $account->channel_code,
            'account_holder_name' => $account->account_name,
            'account_number'  => $account->account_number,
            'description'     => 'Disbursement order ' . $order->order_code,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $disb->update([
                'xendit_disbursement_id' => $data['id'] ?? null,
                'status' => $data['status'] === 'COMPLETED' ? 'completed' : 'processing',
            ]);
        } else {
            Log::error('Xendit disbursement failed', [
                'order_id' => $order->id,
                'response' => $response->json(),
            ]);
            $disb->update(['status' => 'failed', 'failure_reason' => json_encode($response->json())]);
        }
    }

    private function calculateCommission(float $total): int
    {
        $type  = \App\Models\PlatformSetting::getValue('commission_type', 'flat');
        $value = (float) \App\Models\PlatformSetting::getValue('commission_value', 1000);

        return $type === 'percent' ? (int) round($total * $value / 100) : (int) $value;
    }
}
