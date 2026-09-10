<?php

namespace App\Http\Controllers;

use App\Helpers\WaNotification;
use App\Models\Appeal;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class AppealController extends Controller
{
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'reason' => 'required|string|min:10',
            'captcha_token' => 'required|string',
        ]);

        // Verifikasi CAPTCHA (Contoh verifikasi reCAPTCHA/hCaptcha)
        // Note: Gunakan secret key dari config jika di production
        /*
        $response = Http::asForm()->post('https://hcaptcha.com/siteverify', [
            'secret' => env('HCAPTCHA_SECRET'),
            'response' => $validated['captcha_token'],
        ]);
        if (!$response->successful() || !$response->json('success')) {
            return response()->json(['message' => 'Verifikasi CAPTCHA gagal.'], 422);
        }
        */

        $email = $validated['email'];

        // Cek duplikasi
        $existing = Appeal::where('email', $email)->where('status', 'pending')->exists();
        if (!$existing) {
            $user = User::where('email', $email)->first();
            
            $appeal = Appeal::create([
                'user_id' => $user ? $user->id : null,
                'email' => $email,
                'reason' => $validated['reason'],
                'status' => 'pending',
            ]);

            // Notif WA + in-app ke semua Super Admin
            $superAdmins = User::where('role', 'super_admin')->get();
            foreach ($superAdmins as $admin) {
                try {
                    if ($admin->phone) {
                        WaNotification::custom(
                            $admin->phone,
                            "🆘 *Pengajuan Aktivasi Akun*\n\nAda pengajuan pengaktifan akun baru dari *{$email}*.\n\nAlasan: {$validated['reason']}\n\nSilakan tinjau di panel Super Admin."
                        );
                    }
                    Notification::send($admin->id, '🆘 Pengajuan Aktivasi Akun', "Ada pengajuan dari {$email}: {$validated['reason']}", 'info', 'appeal', $appeal->id);
                } catch (\Exception $e) {
                    // Ignore
                }
            }
        }

        // Pesan respons generik
        return response()->json([
            'message' => 'Pengajuan Anda telah diterima dan akan segera ditinjau.'
        ]);
    }
}
