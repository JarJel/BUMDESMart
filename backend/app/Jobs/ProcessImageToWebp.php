<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessImageToWebp implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    /**
     * @param string $sourcePath  Absolute path to the original uploaded file (in temp storage)
     * @param string $targetPath  Absolute path where the final WebP should be saved
     * @param int    $quality     WebP quality 1-100
     */
    public function __construct(
        public readonly string $sourcePath,
        public readonly string $targetPath,
        public readonly int    $quality = 80,
    ) {}

    public function handle(): void
    {
        if (!file_exists($this->sourcePath)) {
            return;
        }

        $mime = @mime_content_type($this->sourcePath);

        // Ensure target directory exists
        $dir = dirname($this->targetPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Already WebP — just move
        if ($mime === 'image/webp') {
            @rename($this->sourcePath, $this->targetPath);
            return;
        }

        // Non-image or unsupported — move as-is (fallback)
        if (!$mime || !str_starts_with($mime, 'image/')) {
            @rename($this->sourcePath, $this->targetPath);
            return;
        }

        $image = match ($mime) {
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($this->sourcePath),
            'image/png'               => $this->loadPng($this->sourcePath),
            'image/gif'               => $this->loadGif($this->sourcePath),
            default                   => false,
        };

        if (!$image) {
            // Conversion failed — move original as fallback
            @rename($this->sourcePath, $this->targetPath);
            return;
        }

        $success = @imagewebp($image, $this->targetPath, $this->quality);
        imagedestroy($image);

        if ($success) {
            @unlink($this->sourcePath); // Delete original temp
        } else {
            @rename($this->sourcePath, $this->targetPath); // Fallback
        }
    }

    public function failed(\Throwable $exception): void
    {
        // Job gagal permanen → pindahkan file original ke target agar gambar masih bisa tampil
        if (file_exists($this->sourcePath) && !file_exists($this->targetPath)) {
            @rename($this->sourcePath, $this->targetPath);
        } elseif (file_exists($this->sourcePath)) {
            @unlink($this->sourcePath);
        }
    }

    private function loadPng(string $path): \GdImage|false
    {
        $img = @imagecreatefrompng($path);
        if ($img) {
            imagepalettetotruecolor($img);
            imagealphablending($img, true);
            imagesavealpha($img, true);
        }
        return $img;
    }

    private function loadGif(string $path): \GdImage|false
    {
        $img = @imagecreatefromgif($path);
        if ($img) {
            imagepalettetotruecolor($img);
        }
        return $img;
    }
}
