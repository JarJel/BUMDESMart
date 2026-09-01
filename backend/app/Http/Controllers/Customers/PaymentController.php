<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    private function midtransAuth(): string
    {
        return base64_encode(config('services.midtrans.server_key') . ':');
    }

    private function midtransApiUrl(): string
    {
        return config('services.midtrans.is_production')
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
    }

    private function snapApiUrl(): string
    {
        return config('services.midtrans.is_production')
            ? 'https://app.midtrans.com'
            : 'https://app.sandbox.midtrans.com';
    }

    public function createInvoice(Request $request, int $orderId)
    {
        try {
            $customer = $request->user()->customer;

            $order = Order::with(['items.product', 'customer.user', 'umkmProfile'])
                ->where('id', $orderId)
                ->where('customer_id', $customer->id)
                ->where('status', 'pending')
                ->firstOrFail();

            if ($order->payment) {
                $existingPayment = $order->payment;

                // Kalau sudah paid/expired/failed, kembalikan status saja
                if (in_array($existingPayment->status, ['paid', 'expired', 'failed'])) {
                    return response()->json([
                        'snap_token'  => null,
                        'invoice_url' => $existingPayment->payment_data['redirect_url'] ?? null,
                        'payment_id'  => $existingPayment->id,
                        'status'      => $existingPayment->status,
                    ]);
                }

                // Pending: buat snap_token baru (order_id baru) agar tidak expired/salah environment
                $mtOrderId = 'BUMDES-' . $order->order_code . '-' . time();

                $payload = [
                    'transaction_details' => [
                        'order_id'     => $mtOrderId,
                        'gross_amount' => (int) $order->total,
                    ],
                    'customer_details' => [
                        'first_name' => $order->customer->user->name,
                        'email'      => $order->customer->user->email,
                    ],
                    'callbacks' => [
                        'finish' => config('app.frontend_url') . '/pembayaran/sukses?order=' . $order->order_code,
                    ],
                ];

                $response = Http::withHeaders([
                    'Authorization' => 'Basic ' . $this->midtransAuth(),
                    'Content-Type'  => 'application/json',
                ])->post($this->snapApiUrl() . '/snap/v1/transactions', $payload);

                if ($response->failed()) {
                    return response()->json([
                        'snap_token'  => $existingPayment->snap_token,
                        'invoice_url' => $existingPayment->payment_data['redirect_url'] ?? null,
                        'payment_id'  => $existingPayment->id,
                        'status'      => $existingPayment->status,
                    ]);
                }

                $data = $response->json();
                $existingPayment->update([
                    'snap_token'        => $data['token'] ?? $existingPayment->snap_token,
                    'midtrans_order_id' => $mtOrderId,
                    'payment_data'      => $data,
                    'expired_at'        => now()->addDay(),
                ]);

                return response()->json([
                    'snap_token'  => $data['token'] ?? null,
                    'invoice_url' => $data['redirect_url'] ?? null,
                    'payment_id'  => $existingPayment->id,
                    'status'      => $existingPayment->status,
                ]);
            }

            $mtOrderId = 'BUMDES-' . $order->order_code . '-' . time();

            $payload = [
                'transaction_details' => [
                    'order_id'     => $mtOrderId,
                    'gross_amount' => (int) $order->total,
                ],
                'customer_details' => [
                    'first_name' => $order->customer->user->name,
                    'email'      => $order->customer->user->email,
                ],
                'callbacks' => [
                    'finish' => config('app.frontend_url') . '/pembayaran/sukses?order=' . $order->order_code,
                ],
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . $this->midtransAuth(),
                'Content-Type'  => 'application/json',
            ])->post($this->snapApiUrl() . '/snap/v1/transactions', $payload);

            if ($response->failed()) {
                return response()->json([
                    'message' => 'Gagal membuat transaksi pembayaran.',
                    'error'   => $response->json(),
                ], 502);
            }

            $data = $response->json();

            $payment = Payment::create([
                'order_id'          => $order->id,
                'snap_token'        => $data['token'] ?? null,
                'midtrans_order_id' => $mtOrderId,
                'payment_code'      => strtoupper(Str::random(12)),
                'amount'            => $order->total,
                'status'            => 'pending',
                'expired_at'        => now()->addDay(),
                'payment_data'      => $data,
            ]);

            return response()->json([
                'snap_token'  => $data['token'] ?? null,
                'invoice_url' => $data['redirect_url'] ?? null,
                'payment_id'  => $payment->id,
                'status'      => 'pending',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    public function checkStatus(Request $request, int $orderId)
    {
        $customer = $request->user()->customer;

        $order = Order::with(['payment', 'umkmProfile.user'])
            ->where('id', $orderId)
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        $payment = $order->payment;

        if (! $payment) {
            return response()->json(['status' => 'no_payment']);
        }

        if (in_array($payment->status, ['paid', 'expired', 'failed'])) {
            return response()->json([
                'status'       => $payment->status,
                'order_status' => $order->status,
                'paid_at'      => $payment->paid_at,
            ]);
        }

        // Pembayaran manual UMKM — tidak ada Midtrans, kembalikan status saja
        if ($payment->payment_type === 'manual_umkm') {
            return response()->json([
                'status'       => $payment->status,
                'order_status' => $order->status,
                'paid_at'      => $payment->paid_at,
            ]);
        }

        // Cek status ke Midtrans
        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $this->midtransAuth(),
        ])->get($this->midtransApiUrl() . '/v2/' . $payment->midtrans_order_id . '/status');

        if ($response->failed()) {
            return response()->json(['status' => $payment->status]);
        }

        $data       = $response->json();
        $txStatus   = strtolower($data['transaction_status'] ?? 'pending');
        $map        = [
            'settlement' => 'paid',
            'capture'    => 'paid',
            'pending'    => 'pending',
            'expire'     => 'expired',
            'cancel'     => 'failed',
            'deny'       => 'failed',
        ];
        $newStatus = $map[$txStatus] ?? 'pending';

        if ($newStatus !== $payment->status) {
            $payment->update([
                'status'       => $newStatus,
                'paid_at'      => $newStatus === 'paid' ? now() : null,
                'payment_data' => $data,
            ]);

            if (in_array($newStatus, ['expired', 'failed'])) {
                $order->load('items.product');
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $item->product->increment('stock', $item->quantity);
                    }
                }
                $order->update(['status' => 'cancelled']);
            }

            if ($newStatus === 'paid') {
                $order->update(['status' => 'pending']);

                $sellerPhone = $order->umkmProfile->phone ?? null;
                if (!$sellerPhone && $order->umkmProfile && $order->umkmProfile->user) {
                    $sellerPhone = $order->umkmProfile->user->phone;
                }
                if ($sellerPhone) {
                    $sellerName = $order->umkmProfile->owner_name ?? $order->umkmProfile->user->name ?? 'Mitra BumDesMartNukita';
                    \App\Helpers\WaNotification::orderMasukSeller($sellerPhone, $sellerName, $order->order_code, (int) $order->total);
                }
            }
        }

        return response()->json([
            'status'       => $newStatus,
            'order_status' => $order->fresh()->status,
            'paid_at'      => $payment->fresh()->paid_at,
        ]);
    }

    public function uploadProof(Request $request, int $orderId)
    {
        if (Setting::getValue('payment_qris_enabled', '1') !== '1') {
            return response()->json(['message' => 'Metode pembayaran langsung ke UMKM sedang dinonaktifkan.'], 403);
        }

        $customer = $request->user()->customer;

        $order = Order::with(['payment', 'umkmProfile.user'])
            ->where('id', $orderId)
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        $request->validate([
            'proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        try {
            $file = $request->file('proof');
            $dir = storage_path('app/public/uploads/payment_proofs');
            if (!file_exists($dir)) mkdir($dir, 0775, true);

            $filename = \App\Helpers\ImageHelper::uploadToPathAsWebp($file, $dir);
            $path = 'uploads/payment_proofs/' . $filename;

            $payment = $order->payment;
            if (!$payment) {
                $payment = Payment::create([
                    'order_id'         => $order->id,
                    'payment_type'     => 'manual_umkm',
                    'payment_code'     => 'MAN-' . strtoupper(Str::random(10)),
                    'amount'           => $order->total,
                    'status'           => 'pending',
                    'proof_of_payment' => $path,
                    'rejection_reason' => null,
                ]);
            } else {
                if ($payment->proof_of_payment) {
                    $old = storage_path('app/public/' . ltrim($payment->proof_of_payment, '/'));
                    if (file_exists($old)) @unlink($old);
                }
                $payment->update([
                    'payment_type'     => 'manual_umkm',
                    'proof_of_payment' => $path,
                    'rejection_reason' => null,
                    'status'           => 'pending',
                ]);
            }

            // Kirim notifikasi WA ke Seller jika ada
            $sellerPhone = $order->umkmProfile->phone ?? $order->umkmProfile->user->phone ?? null;
            if ($sellerPhone) {
                $sellerName = $order->umkmProfile->shop_name ?? 'Mitra';
                $customerName = $request->user()->name;
                \App\Helpers\WaNotification::custom(
                    $sellerPhone,
                    "🔔 *Bukti Pembayaran Masuk!*\n\nHalo {$sellerName},\nCustomer *{$customerName}* telah mengunggah bukti pembayaran langsung untuk pesanan #*{$order->order_code}* senilai *Rp " . number_format($order->total, 0, ',', '.') . "*.\n\nSilakan cek dan verifikasi di Dashboard Seller Anda."
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi toko.',
                'proof_url' => $path,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah bukti pembayaran: ' . $e->getMessage()
            ], 500);
        }
    }

    private function calculateCommission(float $total): int
    {
        $type  = \App\Models\PlatformSetting::getValue('commission_type', 'flat');
        $value = (float) \App\Models\PlatformSetting::getValue('commission_value', 1000);

        if ($type === 'percent') {
            return (int) round($total * $value / 100);
        }

        return (int) $value;
    }
}
