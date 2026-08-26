<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
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
                return response()->json([
                    'invoice_url' => $order->payment->payment_data['redirect_url'] ?? null,
                    'payment_id'  => $order->payment->id,
                    'status'      => $order->payment->status,
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
                    $sellerName = $order->umkmProfile->owner_name ?? $order->umkmProfile->user->name ?? 'Mitra BUMDeSMart';
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
