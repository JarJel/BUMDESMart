<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\WhatsappQueue;
use Illuminate\Http\Request;

class WhatsappQueueController extends Controller
{
    /** GET /super-admin/whatsapp-queue */
    public function index(Request $request)
    {
        $query = WhatsappQueue::with('logs')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $data = $query->paginate(20);

        return response()->json([
            'data' => $data,
            'settings' => [
                'wa_max_attempts' => Setting::where('key', 'wa_max_attempts')->value('value') ?? '3',
                'wa_retry_delay'  => Setting::where('key', 'wa_retry_delay')->value('value')  ?? '60',
            ],
        ]);
    }

    /** POST /super-admin/whatsapp-queue — kirim manual */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'phone'   => 'required|string|max:20',
            'message' => 'required|string|max:4000',
            'context' => 'nullable|string|max:100',
        ]);

        $maxAttempts = (int) (Setting::where('key', 'wa_max_attempts')->value('value') ?? 3);
        $retryDelay  = (int) (Setting::where('key', 'wa_retry_delay')->value('value')  ?? 60);

        $queue = WhatsappQueue::create([
            'phone'        => $validated['phone'],
            'message'      => $validated['message'],
            'context'      => $validated['context'] ?? 'manual',
            'status'       => 'pending',
            'attempt'      => 0,
            'max_attempts' => $maxAttempts,
            'retry_delay'  => $retryDelay,
        ]);

        return response()->json(['message' => 'Pesan masuk antrian.', 'data' => $queue], 201);
    }

    /** GET /super-admin/whatsapp-queue/{id} */
    public function show(WhatsappQueue $whatsappQueue)
    {
        return response()->json(['data' => $whatsappQueue->load('logs')]);
    }

    /** DELETE /super-admin/whatsapp-queue/{id} */
    public function destroy(WhatsappQueue $whatsappQueue)
    {
        $whatsappQueue->delete();
        return response()->json(['message' => 'Item antrian dihapus.']);
    }

    /** PUT /super-admin/whatsapp-settings */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'wa_max_attempts' => 'required|integer|min:1|max:5',
            'wa_retry_delay'  => 'required|integer|min:10|max:3600',
        ]);

        Setting::where('key', 'wa_max_attempts')->update(['value' => (string) $validated['wa_max_attempts']]);
        Setting::where('key', 'wa_retry_delay')->update(['value'  => (string) $validated['wa_retry_delay']]);

        return response()->json(['message' => 'Pengaturan WhatsApp diperbarui.']);
    }
}
