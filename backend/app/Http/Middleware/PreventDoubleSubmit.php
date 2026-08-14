<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class PreventDoubleSubmit
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Hanya kunci request yang bersifat mutasi (POST, PUT, PATCH, DELETE)
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $user = $request->user();
            
            // Kunci unik berdasarkan user ID (jika login) atau IP address (jika guest) + path + method + hash body request
            $keyIdentifier = $user ? 'user_' . $user->id : 'ip_' . $request->ip();
            $requestHash = md5(json_encode($request->all()));
            
            $lockKey = 'double_submit_lock:' . $keyIdentifier . ':' . sha1($request->fullUrl() . '|' . $requestHash);
            
            // Coba dapatkan kunci selama 10 detik. Jika dalam proses ada hit ulang, langsung tolak.
            $lock = Cache::lock($lockKey, 10);
            
            if (!$lock->get()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permintaan Anda sedang diproses. Silakan tunggu sebentar.'
                ], 409); // 409 Conflict
            }
            
            // Simpan instance lock ke request agar bisa dilepas saat terminate atau setelah response selesai
            $request->attributes->set('double_submit_lock', $lock);
        }

        return $next($request);
    }

    /**
     * Release the lock after the response is sent to the client.
     */
    public function terminate(Request $request, Response $response): void
    {
        $lock = $request->attributes->get('double_submit_lock');
        
        if ($lock) {
            $lock->release();
        }
    }
}
