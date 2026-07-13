<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'suspended'])],
            'role'   => ['sometimes', Rule::in(['super_admin', 'admin_bumdes', 'umkm', 'customer'])],
        ]);

        $user->update($validated);

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
}
