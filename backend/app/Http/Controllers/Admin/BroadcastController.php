<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesBroadcast;
use App\Models\BumdesProfile;
use App\Models\DriverProfile;
use App\Models\UmkmProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class BroadcastController extends Controller
{
    private function getBumdes(Request $request): BumdesProfile
    {
        $bumdes = BumdesProfile::where('user_id', $request->user()->id)->first();
        if (!$bumdes) abort(response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404));
        return $bumdes;
    }

    // GET /admin/broadcasts
    public function index(Request $request)
    {
        $bumdes = $this->getBumdes($request);

        $broadcasts = BumdesBroadcast::where('bumdes_profile_id', $bumdes->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json(['data' => $broadcasts]);
    }

    // POST /admin/broadcasts
    public function store(Request $request)
    {
        $bumdes = $this->getBumdes($request);

        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'category'      => 'required|in:pengumuman,pelatihan,info_bantuan,jadwal,acara,promosi,sistem,undangan',
            'content'       => 'required|string',
            'target'        => 'required|in:all,umkm,driver,umkm_category',
            'umkm_category' => 'required_if:target,umkm_category|nullable|string|max:100',
        ]);

        // Kumpulkan penerima
        $emails = $this->collectEmails($bumdes, $validated['target'], $validated['umkm_category'] ?? null);

        // Kirim email
        foreach ($emails as $email) {
            try {
                Mail::send([], [], function ($message) use ($email, $validated, $bumdes) {
                    $message->to($email)
                        ->subject("[{$bumdes->name}] {$validated['title']}")
                        ->html($this->buildEmailHtml($bumdes->name, $validated['title'], $validated['content'], $validated['category']));
                });
            } catch (\Throwable $e) {
                // Log saja, jangan berhenti
                \Log::warning("Broadcast email gagal ke {$email}: " . $e->getMessage());
            }
        }

        $broadcast = BumdesBroadcast::create([
            'bumdes_profile_id' => $bumdes->id,
            'title'             => $validated['title'],
            'category'          => $validated['category'],
            'content'           => $validated['content'],
            'target'            => $validated['target'],
            'umkm_category'     => $validated['umkm_category'] ?? null,
            'recipient_count'   => count($emails),
            'sent_at'           => now(),
        ]);

        return response()->json([
            'message'          => 'Broadcast berhasil dikirim ke ' . count($emails) . ' penerima.',
            'data'             => $broadcast,
            'recipient_count'  => count($emails),
        ], 201);
    }

    // GET /admin/broadcasts/{id}
    public function show(Request $request, int $id)
    {
        $bumdes    = $this->getBumdes($request);
        $broadcast = BumdesBroadcast::where('bumdes_profile_id', $bumdes->id)->findOrFail($id);
        return response()->json(['data' => $broadcast]);
    }

    private function collectEmails(BumdesProfile $bumdes, string $target, ?string $umkmCategory): array
    {
        $emails = [];

        if (in_array($target, ['all', 'umkm'])) {
            $query = UmkmProfile::where('bumdes_profile_id', $bumdes->id);
            if ($target === 'umkm_category' && $umkmCategory) {
                $query->where('business_category', $umkmCategory);
            }
            $umkmUserIds = $query->pluck('user_id');
            $umkmEmails  = User::whereIn('id', $umkmUserIds)->pluck('email')->toArray();
            $emails      = array_merge($emails, $umkmEmails);
        }

        if (in_array($target, ['all', 'driver'])) {
            $driverUserIds = DriverProfile::where('bumdes_profile_id', $bumdes->id)->pluck('user_id');
            $driverEmails  = User::whereIn('id', $driverUserIds)->pluck('email')->toArray();
            $emails        = array_merge($emails, $driverEmails);
        }

        if ($target === 'umkm_category' && $umkmCategory) {
            $umkmUserIds = UmkmProfile::where('bumdes_profile_id', $bumdes->id)
                ->where('business_category', $umkmCategory)
                ->pluck('user_id');
            $emails = User::whereIn('id', $umkmUserIds)->pluck('email')->toArray();
        }

        return array_unique(array_filter($emails));
    }

    private function buildEmailHtml(string $bumdesName, string $title, string $content, string $category): string
    {
        $categoryLabel = [
            'pengumuman'   => 'Pengumuman',
            'pelatihan'    => 'Pelatihan & Workshop',
            'info_bantuan' => 'Info Bantuan / Subsidi',
            'jadwal'       => 'Jadwal Pengiriman',
            'acara'        => 'Acara Desa',
            'promosi'      => 'Promosi Platform',
            'sistem'       => 'Pemberitahuan Sistem',
            'undangan'     => 'Undangan Rapat',
        ][$category] ?? $category;

        $contentHtml = nl2br(htmlspecialchars($content));

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a;">
          <div style="background:#2D6A4F;padding:16px 24px;border-radius:12px 12px 0 0;">
            <p style="color:#fff;font-size:12px;margin:0;opacity:.8;">{$bumdesName}</p>
            <h1 style="color:#fff;font-size:20px;margin:4px 0 0;">{$title}</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
            <span style="background:#D1FAE5;color:#065F46;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;">{$categoryLabel}</span>
            <div style="margin-top:16px;line-height:1.7;color:#374151;">{$contentHtml}</div>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
            <p style="font-size:11px;color:#9ca3af;">Pesan ini dikirim oleh {$bumdesName} melalui platform BUMDESMart.</p>
          </div>
        </body>
        </html>
        HTML;
    }
}
