<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Appeal;
use App\Models\User;
use App\Models\AdminActionLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Helpers\WaNotification;
use App\Models\Notification;

class AppealController extends Controller
{
    public function index(Request $request)
    {
        $query = Appeal::query()->with('user:id,name,email,role,status');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $appeals = $query->latest()->paginate(20);

        return response()->json([
            'data' => $appeals,
            'meta' => [
                'total'    => $appeals->total(),
                'per_page' => $appeals->perPage(),
                'page'     => $appeals->currentPage(),
            ],
        ]);
    }

    public function resolve(Request $request, Appeal $appeal)
    {
        if ($appeal->status !== 'pending') {
            return response()->json(['message' => 'Pengajuan ini sudah diproses sebelumnya.'], 422);
        }

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'admin_note' => 'nullable|string',
        ]);

        $appeal->status = $validated['decision'];
        $appeal->admin_note = $validated['admin_note'] ?? null;
        $appeal->admin_id = $request->user()->id;
        $appeal->resolved_at = now();
        $appeal->save();

        if ($appeal->user_id) {
            $user = User::find($appeal->user_id);
            if ($user && $user->status === 'suspended') {
                if ($validated['decision'] === 'approved') {
                    $user->status = 'active';
                    $user->suspend_reason = null;
                    $user->save();

                    AdminActionLog::create([
                        'admin_id'       => $request->user()->id,
                        'target_user_id' => $user->id,
                        'action'         => 'unsuspend',
                        'reason'         => 'Disetujui melalui pengajuan pengaktifan akun',
                    ]);
                }
            }
        }

        // Notif WA + in-app ke user yang mengajukan
        try {
            $targetUser = $appeal->user_id ? User::find($appeal->user_id) : null;
            $isApproved = $validated['decision'] === 'approved';
            $note       = $appeal->admin_note ? "\n\nCatatan: {$appeal->admin_note}" : '';
            $waMsg = $isApproved
                ? "✅ *Pengajuan Aktivasi Disetujui*\n\nAkun Anda ({$appeal->email}) telah diaktifkan kembali. Silakan login ke aplikasi.{$note}"
                : "❌ *Pengajuan Aktivasi Ditolak*\n\nMaaf, pengajuan aktivasi akun Anda ({$appeal->email}) tidak dapat kami setujui.{$note}";
            if ($targetUser?->phone) {
                WaNotification::custom($targetUser->phone, $waMsg);
            }
            if ($targetUser) {
                Notification::send($targetUser->id, $isApproved ? '✅ Akun Diaktifkan Kembali' : '❌ Pengajuan Ditolak', $isApproved ? 'Akun Anda telah diaktifkan kembali. Silakan login.' : 'Pengajuan aktivasi akun Anda ditolak.' . ($appeal->admin_note ? ' Alasan: ' . $appeal->admin_note : ''), $isApproved ? 'success' : 'error', 'appeal', $appeal->id);
            }
        } catch (\Exception $e) {
            // Ignore
        }

        return response()->json([
            'message' => 'Pengajuan berhasil diproses.',
            'data' => $appeal
        ]);
    }
}
