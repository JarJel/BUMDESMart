<?php

namespace App\Helpers;

use App\Jobs\ProcessImageToWebp;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageHelper
{
    /**
     * Store uploaded image and queue WebP conversion.
     *
     * Saves the original to a temp location immediately, then dispatches
     * ProcessImageToWebp to convert it in the background.
     * Returns the target WebP path right away so the controller can store it.
     *
     * Falls back to sync conversion when QUEUE_CONNECTION=sync.
     */
    public static function uploadAsWebp(UploadedFile $file, string $folder, int $quality = 80): ?string
    {
        $mime = $file->getMimeType() ?? '';

        // SVG / PDF / non-image → store as-is, no conversion
        if (!str_contains($mime, 'image') || str_contains($mime, 'svg') || str_contains($mime, 'xml')) {
            return $file->store($folder, 'public');
        }

        // Already WebP → store directly, no job needed
        if (str_contains($mime, 'webp')) {
            return $file->store($folder, 'public');
        }

        // Target path (we commit the filename to DB immediately)
        $filename   = Str::random(40) . '.webp';
        $targetPath = rtrim($folder, '/') . '/' . $filename;

        // Save original to temp storage (local disk, not public)
        $ext      = $file->extension() ?: 'tmp';
        $tempPath = $file->storeAs('temp', Str::random(32) . '.' . $ext, 'local');

        $sourceAbs = storage_path('app/' . $tempPath);
        $targetAbs = Storage::disk('public')->path($targetPath);

        // Copy file asli langsung agar bisa diakses sebelum konversi selesai
        $targetDir = dirname($targetAbs);
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0775, true);
        }
        @copy($sourceAbs, $targetAbs);

        // Dispatch job untuk convert ke WebP di background
        ProcessImageToWebp::dispatch($sourceAbs, $targetAbs, $quality);

        return $targetPath;
    }

    /**
     * Store uploaded image to an absolute destination path and queue WebP conversion.
     *
     * Saves the original to temp, dispatches the job, and returns the final
     * WebP filename immediately. Same contract as the old synchronous version.
     */
    public static function uploadToPathAsWebp(UploadedFile $file, string $destinationPath, int $quality = 80): string
    {
        $mime = $file->getMimeType() ?? '';

        if (!is_dir($destinationPath)) {
            mkdir($destinationPath, 0775, true);
        }

        // Non-image → move directly, no conversion
        if (!str_contains($mime, 'image') || str_contains($mime, 'svg') || str_contains($mime, 'xml')) {
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationPath, $filename);
            return $filename;
        }

        // Already WebP → move directly
        if (str_contains($mime, 'webp')) {
            $filename = time() . '_' . uniqid() . '.webp';
            $file->move($destinationPath, $filename);
            return $filename;
        }

        $filename  = time() . '_' . uniqid() . '.webp';
        $targetAbs = rtrim($destinationPath, '/') . '/' . $filename;

        // Simpan file asli dulu di folder yang sama agar dijamin bisa di-write
        $ext      = $file->extension() ?: 'tmp';
        $tempName = time() . '_' . uniqid() . '_temp.' . $ext;
        $file->move($destinationPath, $tempName);
        $sourceAbs = rtrim($destinationPath, '/') . '/' . $tempName;
        
        $copyResult = @copy($sourceAbs, $targetAbs);
        if (!$copyResult) {
            $isWritable = is_writable($destinationPath) ? 'Yes' : 'No';
            throw new \Exception("copy failed from $sourceAbs to $targetAbs. Dest writable? $isWritable. Source exists? " . (file_exists($sourceAbs) ? 'Yes' : 'No'));
        }

        // Dispatch job untuk convert ke WebP di background
        ProcessImageToWebp::dispatch($sourceAbs, $targetAbs, $quality);

        return $filename;
    }
}
