<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\Notification;
use App\Models\Product;
use App\Helpers\WaNotification;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    private function getBumdesProfile(Request $request): ?BumdesProfile
    {
        return BumdesProfile::where('user_id', $request->user()->id)->first();
    }

    public function index(Request $request)
    {
        $search = $request->query('search');

        $query = Product::with(['umkmProfile', 'category', 'images', 'variants.options']);
        
        if ($request->user()->role !== 'super_admin') {
            $bumdes = $this->getBumdesProfile($request);
            if (!$bumdes) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 10, 'total' => 0]
                ]);
            }
            $query->whereHas('umkmProfile', function($q) use ($bumdes) {
                $q->where('bumdes_profile_id', $bumdes->id);
            });
        }

        if ($search) {
            $query->where(function($q2) use ($search) {
                $q2->where('name', 'like', "%{$search}%")
                   ->orWhereHas('umkmProfile', function($q) use ($search) {
                       $q->where('shop_name', 'like', "%{$search}%");
                   });
            });
        }

        $products = $query->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data'    => $products->items(),
            'meta'    => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ]
        ]);
    }

    public function ban(Request $request, $id)
    {
        $bumdes = $this->getBumdesProfile($request);
        if (!$bumdes) {
            return response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $product = Product::whereHas('umkmProfile', function ($q) use ($bumdes) {
            $q->where('bumdes_profile_id', $bumdes->id);
        })->findOrFail($id);

        if ($product->status === 'banned') {
            return response()->json(['message' => 'Produk sudah dalam status banned.'], 422);
        }

        $product->update([
            'status'            => 'banned',
            'ban_reason'        => $validated['reason'],
            'banned_by_id'      => $request->user()->id,
            'banned_at'         => now(),
            'ban_appeal'        => null,
            'ban_appeal_status' => 'none',
        ]);

        // Notif ke UMKM
        $umkmUser = $product->umkmProfile?->user;
        if ($umkmUser) {
            $msg = "🚫 *Produk Dinonaktifkan*\n\nProduk *\"{$product->name}\"* Anda telah dinonaktifkan oleh Admin BUMDes.\n\nAlasan: {$validated['reason']}\n\nAnda dapat mengajukan banding melalui aplikasi jika merasa keberatan.";
            if ($umkmUser->phone) {
                WaNotification::custom($umkmUser->phone, $msg);
            }
            Notification::send($umkmUser->id, '🚫 Produk Dinonaktifkan', "Produk \"{$product->name}\" dinonaktifkan. Alasan: {$validated['reason']}", 'warning', 'product', $product->id);
        }

        return response()->json(['message' => 'Produk berhasil dibanned.', 'data' => $product]);
    }

    public function unban(Request $request, $id)
    {
        $bumdes = $this->getBumdesProfile($request);
        if (!$bumdes && $request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404);
        }

        $query = Product::query();
        if ($request->user()->role !== 'super_admin') {
            $query->whereHas('umkmProfile', function ($q) use ($bumdes) {
                $q->where('bumdes_profile_id', $bumdes->id);
            });
        }

        $product = $query->findOrFail($id);

        if ($product->status !== 'banned') {
            return response()->json(['message' => 'Produk tidak dalam status banned.'], 422);
        }

        $product->update([
            'status'            => 'active',
            'ban_reason'        => null,
            'banned_by_id'      => null,
            'banned_at'         => null,
            'ban_appeal'        => null,
            'ban_appeal_status' => 'none',
        ]);

        // Notif ke UMKM
        $umkmUser = $product->umkmProfile?->user;
        if ($umkmUser) {
            $msg = "✅ *Produk Diaktifkan Kembali*\n\nProduk *\"{$product->name}\"* Anda telah diaktifkan kembali.";
            if ($umkmUser->phone) {
                WaNotification::custom($umkmUser->phone, $msg);
            }
            Notification::send($umkmUser->id, '✅ Produk Aktif Kembali', "Produk \"{$product->name}\" telah diaktifkan kembali.", 'success', 'product', $product->id);
        }

        return response()->json(['message' => 'Produk berhasil di-unban.', 'data' => $product]);
    }

    public function destroy(Request $request, $id)
    {
        $query = Product::query();
        
        if ($request->user()->role !== 'super_admin') {
            $bumdes = $this->getBumdesProfile($request);
            if (!$bumdes) {
                return response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404);
            }
            $query->whereHas('umkmProfile', function($q) use ($bumdes) {
                $q->where('bumdes_profile_id', $bumdes->id);
            });
        }

        $product = $query->findOrFail($id);

        // Soft delete the product
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.'
        ]);
    }
}
