<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;
use Exception;

class NotificationController extends Controller
{
    private function getUserId(Request $request): int
    {
        return $request->user()->id;
    }

    public function index(Request $request)
    {
        $userId = $this->getUserId($request);

        try {
            $notifications = Notification::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            $unreadCount = Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'success'      => true,
                'data'         => $notifications,
                'unread_count' => $unreadCount,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil notifikasi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function markAsRead(Request $request, $id)
    {
        $userId = $this->getUserId($request);

        try {
            $notification = Notification::where('id', $id)
                ->where('user_id', $userId)
                ->first();

            if (!$notification) {
                return response()->json(['success' => false, 'message' => 'Notifikasi tidak ditemukan.'], 404);
            }

            $notification->update(['is_read' => true]);

            return response()->json(['success' => true, 'data' => $notification]);

        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function markAllAsRead(Request $request)
    {
        $userId = $this->getUserId($request);

        try {
            Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json(['success' => true, 'message' => 'Semua notifikasi ditandai sudah dibaca.']);

        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $userId = $this->getUserId($request);

        try {
            $notification = Notification::where('id', $id)
                ->where('user_id', $userId)
                ->firstOrFail();

            $notification->delete();

            return response()->json(['success' => true, 'message' => 'Notifikasi dihapus.']);

        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
