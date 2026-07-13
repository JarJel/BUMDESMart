<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\UmkmBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    private function xenditAuth(): string
    {
        return base64_encode(config('services.xendit.secret_key') . ':');
    }

    public function createInvoice(Request $request, int $orderId)
    {
        $customer = $request->user()->customer;

        $order = Order::with(['items.product', 'customer.user', 'umkmProfile'])
            ->where('id', $orderId)
            ->where('customer_id', $customer->id)
            ->where('status', 'pending')
            ->firstOrFail();

        if ($order->payment) {
            return response()->json([
                'invoice_url' => $order->payment->xendit_data['invoice_url'] ?? null,
                'payment_id'  => $order->payment->id,
                'status'      => $order->payment->status,
            ]);
        }

        $externalId  = 'BUMDES-' . $order->order_code . '-' . time();
        $paymentCode = strtoupper(Str::random(12));

        $items = $order->items->map(fn($i) => [
            'name'     => $i->product_name ?: ($i->product->name ?? 'Produk'),
            'quantity' => $i->quantity,
            'price'    => (int) $i->product_price,
        ])->toArray();

        $payload = [
            'external_id'      => $externalId,
            'amount'           => (int) $order->total,
            'description'      => 'Pembayaran Order ' . $order->order_code . ' - ' . $order->umkmProfile->shop_name,
            'invoice_duration' => 86400, // 24 jam
            'customer'         => [
                'given_names'   => $order->customer->user->name,
                'email'         => $order->customer->user->email,
            ],
            'items'            => $items,
            'success_redirect_url' => config('app.frontend_url') . '/pembayaran/sukses?order=' . $order->order_code,
            'failure_redirect_url' => config('app.frontend_url') . '/pembayaran/gagal?order=' . $order->order_code,
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $this->xenditAuth(),
            'Content-Type'  => 'application/json',
        ])->post('https://api.xendit.co/v2/invoices', $payload);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Gagal membuat invoice pembayaran.',
                'error'   => $response->json(),
            ], 502);
        }

        $data = $response->json();

        Payment::create([
            'order_id'          => $order->id,
            'xendit_invoice_id' => $data['id'],
            'xendit_external_id'=> $externalId,
            'payment_code'      => $paymentCode,
            'amount'            => $order->total,
            'status'            => 'pending',
            'expired_at'        => now()->addDay(),
            'xendit_data'       => $data,
        ]);

        // Balance UMKM dan BUMDes dikreditkan di webhook saat payment confirmed (paid)
        // Tidak diincrement di sini agar tidak salah jika invoice expired/failed

        return response()->json([
            'invoice_url' => $data['invoice_url'],
            'payment_id'  => Payment::where('xendit_invoice_id', $data['id'])->first()->id,
            'status'      => 'pending',
        ]);
    }

    public function checkStatus(Request $request, int $orderId)
    {
        $customer = $request->user()->customer;

        $order = Order::with('payment')
            ->where('id', $orderId)
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        $payment = $order->payment;

        if (! $payment) {
            return response()->json(['status' => 'no_payment']);
        }

        // Jika sudah paid/expired di DB, langsung kembalikan
        if (in_array($payment->status, ['paid', 'expired', 'failed'])) {
            return response()->json([
                'status'    => $payment->status,
                'order_status' => $order->status,
                'paid_at'   => $payment->paid_at,
            ]);
        }

        // Cek langsung ke Xendit
        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $this->xenditAuth(),
        ])->get('https://api.xendit.co/v2/invoices/' . $payment->xendit_invoice_id);

        if ($response->failed()) {
            return response()->json(['status' => $payment->status]);
        }

        $data = $response->json();

        $xenditStatus = strtolower($data['status'] ?? 'pending');
        $map = ['pending' => 'pending', 'paid' => 'paid', 'settled' => 'paid', 'expired' => 'expired'];
        $newStatus = $map[$xenditStatus] ?? 'pending';

        if ($newStatus !== $payment->status) {
            $payment->update([
                'status'      => $newStatus,
                'paid_at'     => $xenditStatus === 'paid' ? now() : null,
                'xendit_data' => $data,
            ]);

            if ($newStatus === 'paid') {
                $order->update(['status' => 'confirmed']);
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
