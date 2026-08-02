<?php

namespace App\Helpers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageHelper
{
    /**
     * Convert an uploaded image to WebP and save it in the storage.
     *
     * @param UploadedFile $file The uploaded file.
     * @param string $folder The destination folder under public disk.
     * @param int $quality The output quality (1-100).
     * @return string|null The stored filepath relative to disk root, or original store path on failure.
     */
    public static function uploadAsWebp(UploadedFile $file, string $folder, int $quality = 80): ?string
    {
        $mime = $file->getMimeType();
        
        // Only convert images, skip pdf / documents / svg
        if (!str_contains($mime, 'image') || str_contains($mime, 'svg') || str_contains($mime, 'xml')) {
            return $file->store($folder, 'public');
        }

        try {
            // Load the image based on mime type
            switch ($mime) {
                case 'image/jpeg':
                case 'image/jpg':
                    $image = imagecreatefromjpeg($file->getRealPath());
                    break;
                case 'image/png':
                    $image = imagecreatefrompng($file->getRealPath());
                    // Preserve alpha transparency
                    imagepalettetotruecolor($image);
                    imagealphablending($image, true);
                    imagesavealpha($image, true);
                    break;
                case 'image/gif':
                    $image = imagecreatefromgif($file->getRealPath());
                    imagepalettetotruecolor($image);
                    break;
                case 'image/webp':
                    // Already webp, just store it
                    return $file->store($folder, 'public');
                default:
                    // If GD doesn't support, just store normally
                    return $file->store($folder, 'public');
            }

            if (!$image) {
                return $file->store($folder, 'public');
            }

            // Create temporary file path
            $tempFile = tempnam(sys_get_temp_dir(), 'webp_');
            
            // Convert to webp
            $result = imagewebp($image, $tempFile, $quality);
            imagedestroy($image);

            if (!$result) {
                return $file->store($folder, 'public');
            }

            // Read the webp file and store it
            $filename = Str::random(40) . '.webp';
            $targetPath = rtrim($folder, '/') . '/' . $filename;
            
            Storage::disk('public')->put($targetPath, file_get_contents($tempFile));
            @unlink($tempFile);

            return $targetPath;
        } catch (\Throwable $e) {
            // Fallback to standard Laravel store
            return $file->store($folder, 'public');
        }
    }

    /**
     * Convert an uploaded image to WebP and save it in a custom absolute path.
     *
     * @param UploadedFile $file The uploaded file.
     * @param string $destinationPath Absolute destination folder path.
     * @param int $quality The output quality (1-100).
     * @return string The filename of the saved file.
     */
    public static function uploadToPathAsWebp(UploadedFile $file, string $destinationPath, int $quality = 80): string
    {
        $mime = $file->getMimeType();
        
        // If it's not an image or is SVG, move normally
        if (!str_contains($mime, 'image') || str_contains($mime, 'svg') || str_contains($mime, 'xml')) {
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationPath, $filename);
            return $filename;
        }

        try {
            switch ($mime) {
                case 'image/jpeg':
                case 'image/jpg':
                    $image = imagecreatefromjpeg($file->getRealPath());
                    break;
                case 'image/png':
                    $image = imagecreatefrompng($file->getRealPath());
                    imagepalettetotruecolor($image);
                    imagealphablending($image, true);
                    imagesavealpha($image, true);
                    break;
                case 'image/gif':
                    $image = imagecreatefromgif($file->getRealPath());
                    imagepalettetotruecolor($image);
                    break;
                case 'image/webp':
                    $filename = time() . '_' . uniqid() . '.webp';
                    $file->move($destinationPath, $filename);
                    return $filename;
                default:
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->move($destinationPath, $filename);
                    return $filename;
            }

            if (!$image) {
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                return $filename;
            }

            $filename = time() . '_' . uniqid() . '.webp';
            $targetFile = rtrim($destinationPath, '/') . '/' . $filename;
            
            $result = imagewebp($image, $targetFile, $quality);
            imagedestroy($image);

            if (!$result) {
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                return $filename;
            }

            return $filename;
        } catch (\Throwable $e) {
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationPath, $filename);
            return $filename;
        }
    }
}
