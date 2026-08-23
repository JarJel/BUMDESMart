<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountSuspendedMail;
use App\Models\AdminActionLog;

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

        $user->delete();

        return response()->json(['message' => 'Pengguna berhasil dihapus.']);
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

        // Kirim email notifikasi
        try {
            Mail::to($user->email)->send(new AccountSuspendedMail($user, $validated['reason']));
        } catch (\Exception $e) {
            // Log error or ignore
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
