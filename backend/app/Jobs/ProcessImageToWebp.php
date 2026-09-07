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
     * @param string $sourcePath        Absolute path to original temp file
     * @param string $targetPath        Absolute path where primary WebP should be saved
     * @param int    $quality           WebP quality (default 80)
     * @param bool   $generateVariants  Generate _thumb (200px) & _medium (600px) variants
     */
    public function __construct(
        public readonly string $sourcePath,
        public readonly string $targetPath,
        public readonly int    $quality = 80,
        public readonly bool   $generateVariants = true,
    ) {}

    public function handle(): void
    {
        if (!file_exists($this->sourcePath)) {
            return;
        }

        $dir = dirname($this->targetPath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        if (!extension_loaded('gd') || !function_exists('imagewebp')) {
            @rename($this->sourcePath, $this->targetPath);
            return;
        }

        try {
            $mime = @mime_content_type($this->sourcePath);

            $image = match ($mime) {
                'image/jpeg', 'image/jpg' => function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($this->sourcePath) : false,
                'image/png'               => function_exists('imagecreatefrompng') ? $this->loadPng($this->sourcePath) : false,
                'image/gif'               => function_exists('imagecreatefromgif') ? $this->loadGif($this->sourcePath) : false,
                'image/webp'              => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($this->sourcePath) : false,
                default                   => false,
            };

            if (!$image) {
                @rename($this->sourcePath, $this->targetPath);
                return;
            }

            // 1. Simpan gambar utama (max 1200px)
            $largeImage = $this->resizeImage($image, 1200);
            @imagewebp($largeImage, $this->targetPath, $this->quality);
            if ($largeImage !== $image && (is_resource($largeImage) || $largeImage instanceof \GdImage)) {
                @imagedestroy($largeImage);
            }

            // 2. Simpan Varian Thumbnail & Medium jika diminta
            if ($this->generateVariants) {
                $basePath = preg_replace('/\.webp$/i', '', $this->targetPath);
                $thumbPath = $basePath . '_thumb.webp';
                $mediumPath = $basePath . '_medium.webp';

                $thumbImg = $this->resizeImage($image, 200);
                @imagewebp($thumbImg, $thumbPath, $this->quality);
                if ($thumbImg !== $image && (is_resource($thumbImg) || $thumbImg instanceof \GdImage)) {
                    @imagedestroy($thumbImg);
                }

                $mediumImg = $this->resizeImage($image, 600);
                @imagewebp($mediumImg, $mediumPath, $this->quality);
                if ($mediumImg !== $image && (is_resource($mediumImg) || $mediumImg instanceof \GdImage)) {
                    @imagedestroy($mediumImg);
                }
            }

            if (is_resource($image) || $image instanceof \GdImage) {
                @imagedestroy($image);
            }

            @unlink($this->sourcePath); // Hapus temp
        } catch (\Throwable $e) {
            if (file_exists($this->sourcePath)) {
                @rename($this->sourcePath, $this->targetPath);
            }
        }
    }

    private function resizeImage(\GdImage|resource $srcImage, int $maxDimension): \GdImage|resource
    {
        $width = imagesx($srcImage);
        $height = imagesy($srcImage);

        if ($width <= $maxDimension && $height <= $maxDimension) {
            return $srcImage;
        }

        if ($width > $height) {
            $newWidth = $maxDimension;
            $newHeight = (int) round(($height / $width) * $maxDimension);
        } else {
            $newHeight = $maxDimension;
            $newWidth = (int) round(($width / $height) * $maxDimension);
        }

        $dstImage = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($dstImage, false);
        imagesavealpha($dstImage, true);
        $transparent = imagecolorallocatealpha($dstImage, 255, 255, 255, 127);
        imagefilledrectangle($dstImage, 0, 0, $newWidth, $newHeight, $transparent);

        imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        return $dstImage;
    }

    private function loadPng(string $path)
    {
        $im = @imagecreatefrompng($path);
        if ($im) {
            imagealphablending($im, true);
            imagesavealpha($im, true);
        }
        return $im;
    }

    private function loadGif(string $path)
    {
        return @imagecreatefromgif($path);
    }

    public function failed(\Throwable $exception): void
    {
        if (file_exists($this->sourcePath) && !file_exists($this->targetPath)) {
            @rename($this->sourcePath, $this->targetPath);
        } elseif (file_exists($this->sourcePath)) {
            @unlink($this->sourcePath);
        }
    }
}
