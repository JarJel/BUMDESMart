<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Helpers\WaNotification;
use App\Mail\AccountSuspendedMail;
use App\Models\AdminActionLog;
use App\Models\Notification;
use Illuminate\Support\Facades\Mail;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->select(['id', 'name', 'email', 'role', 'status', 'phone', 'avatar', 'created_at']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->latest()->paginate(20);

        return response()->json([
            'data' => $users,
            'meta' => [
                'total'    => $users->total(),
                'per_page' => $users->perPage(),
                'page'     => $users->currentPage(),
            ],
        ]);
    }

    public function show(User $user)
    {
        $user->load('umkmProfile.bumdesProfile');

        return response()->json(['data' => $user]);
    }

    public function update(Request $request, User $user)
    {
        // Super admin tidak boleh ubah dirinya sendiri lewat endpoint ini
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Gunakan halaman profil untuk mengubah akun sendiri.'], 422);
        }

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'role'   => ['sometimes', Rule::in(['super_admin', 'admin_bumdes', 'umkm', 'customer'])],
        ]);

        if (isset($validated['role'])) {
            $user->forceFill(['role' => $validated['role']]);
            unset($validated['role']);
        }
        $user->update($validated);
        $user->save();

        return response()->json(['message' => 'Pengguna berhasil diperbarui.', 'data' => $user]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Tidak dapat menghapus akun sendiri.'], 422);
        }

        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Tidak dapat menghapus akun super admin.'], 422);
        }

        // Cek transaksi dari semua sisi: pembeli, seller (UMKM), kurir, dan alamat
        $orderCount = 0;
        if ($user->role === 'customer') {
            $orderCount = \App\Models\Order::where('customer_id', $user->id)->count();
        } elseif ($user->role === 'umkm' && $user->umkmProfile) {
            $orderCount = \App\Models\Order::where('umkm_profile_id', $user->umkmProfile->id)->count();
        } elseif ($user->role === 'pengirim') {
            $orderCount = \App\Models\Order::where('driver_id', $user->id)->count();
        }

        // Cek juga alamat user yang mungkin direferensikan oleh orders
        if ($orderCount === 0) {
            $addressIds = \App\Models\Address::where('user_id', $user->id)->pluck('id');
            if ($addressIds->isNotEmpty()) {
                $orderCount = \App\Models\Order::whereIn('address_id', $addressIds)->count();
            }
        }

        if ($orderCount > 0) {
            return response()->json([
                'message' => "Akun ini memiliki {$orderCount} riwayat transaksi dan tidak dapat dihapus. Gunakan fitur Suspend untuk menonaktifkan akun.",
                'can_suspend' => true,
            ], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Akun berhasil dihapus.']);
    }

    public function suspend(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Tidak dapat menangguhkan akun sendiri.'], 422);
        }
        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Tidak dapat menangguhkan akun super admin.'], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        $user->status = 'suspended';
        $user->suspend_reason = $validated['reason'];
        $user->save();

        // Cabut semua token pengguna agar ter-logout dari semua perangkat
        $user->tokens()->delete();

        // Catat ke audit log admin
        AdminActionLog::create([
            'admin_id'       => $request->user()->id,
            'target_user_id' => $user->id,
            'action'         => 'suspend',
            'reason'         => $validated['reason'],
        ]);

        // Notif email + WA + in-app ke user yang di-suspend
        try {
            Mail::to($user->email)->send(new AccountSuspendedMail($user, $validated['reason']));
        } catch (\Exception $e) {
            // Ignore jika email gagal
        }
        try {
            if ($user->phone) {
                WaNotification::custom(
                    $user->phone,
                    "🚫 *Akun Ditangguhkan*\n\nHalo {$user->name},\n\nAkun Anda di BumDesMartNukita telah ditangguhkan.\n\nAlasan: {$validated['reason']}\n\nJika Anda merasa ini keliru, silakan ajukan permohonan pengaktifan kembali melalui halaman login."
                );
            }
            Notification::send($user->id, '🚫 Akun Ditangguhkan', "Akun Anda telah ditangguhkan. Alasan: {$validated['reason']}", 'error', 'user', $user->id);
        } catch (\Exception $e) {
            // Ignore
        }

        return response()->json(['message' => 'Pengguna berhasil ditangguhkan.']);
    }

    public function unsuspend(Request $request, User $user)
    {
        if ($user->status !== 'suspended') {
            return response()->json(['message' => 'Pengguna ini tidak sedang ditangguhkan.'], 422);
        }

        $user->status = 'active';
        $user->suspend_reason = null;
        $user->save();

        // Catat ke audit log admin
        AdminActionLog::create([
            'admin_id'       => $request->user()->id,
            'target_user_id' => $user->id,
            'action'         => 'unsuspend',
            'reason'         => 'Pengaktifan kembali secara manual oleh admin',
        ]);

        return response()->json(['message' => 'Pengguna berhasil diaktifkan kembali.']);
    }
}
