<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProductImage;
use App\Models\User;
use App\Models\UmkmProfile;
use App\Models\DriverProfile;
use Illuminate\Support\Facades\DB;

class ConvertImagesToWebp extends Command
{
    protected $signature = 'images:convert-webp';
    protected $description = 'Convert existing images in public/uploads and storage to WebP format and update database references';

    public function handle()
    {
        $this->info('Starting conversion of existing images to WebP...');

        // 1. Convert Product Images
        $this->convertProductImages();

        // 2. Convert Avatars
        $this->convertAvatars();

        // 3. Convert Shop Logos and Banners
        $this->convertShopMedia();

        // 4. Convert Driver Profiles (photo_profile, photo_ktp)
        $this->convertDriverPhotos();

        $this->info('All conversions completed successfully!');
    }

    private function convertFileToWebp(string $relativeUrl)
    {
        // Check if file is local and exists
        if (str_starts_with($relativeUrl, 'http')) {
            return null;
        }

        // Clean leading slash if any
        $cleanPath = ltrim($relativeUrl, '/');
        
        // Handle storage/ paths vs public/ paths
        $fullPath = '';
        if (str_starts_with($cleanPath, 'storage/')) {
            $storageSubPath = substr($cleanPath, 8); // remove storage/
            $fullPath = storage_path('app/public/' . $storageSubPath);
        } else {
            $fullPath = public_path($cleanPath);
        }

        if (!file_exists($fullPath) || is_dir($fullPath)) {
            return null;
        }

        $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        if ($extension === 'webp') {
            return $relativeUrl; // already webp
        }

        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif'])) {
            return null; // not a supported image
        }

        $mime = @mime_content_type($fullPath);
        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = @imagecreatefromjpeg($fullPath);
                break;
            case 'image/png':
                $image = @imagecreatefrompng($fullPath);
                if ($image) {
                    imagepalettetotruecolor($image);
                    imagealphablending($image, true);
                    imagesavealpha($image, true);
                }
                break;
            case 'image/gif':
                $image = @imagecreatefromgif($fullPath);
                if ($image) {
                    imagepalettetotruecolor($image);
                }
                break;
            default:
                return null;
        }

        if (!$image) {
            return null;
        }

        $webpFullPath = pathinfo($fullPath, PATHINFO_DIRNAME) . '/' . pathinfo($fullPath, PATHINFO_FILENAME) . '.webp';
        
        // Save as webp
        $result = imagewebp($image, $webpFullPath, 80);
        imagedestroy($image);

        if ($result) {
            // Delete original file
            @unlink($fullPath);
            
            // Return new relative URL
            $newRelativeUrl = pathinfo($relativeUrl, PATHINFO_DIRNAME) . '/' . pathinfo($relativeUrl, PATHINFO_FILENAME) . '.webp';
            return $newRelativeUrl;
        }

        return null;
    }

    private function convertProductImages()
    {
        $this->info('Converting product images...');
        $images = ProductImage::all();
        $count = 0;

        foreach ($images as $img) {
            if (!$img->file_path) continue;
            
            $newUrl = $this->convertFileToWebp($img->file_path);
            if ($newUrl && $newUrl !== $img->file_path) {
                $img->update(['file_path' => $newUrl]);
                $count++;
            }
        }

        $this->info("Converted $count product images to WebP.");
    }

    private function convertAvatars()
    {
        $this->info('Converting user avatars...');
        $users = User::whereNotNull('avatar')->get();
        $count = 0;

        foreach ($users as $user) {
            $newUrl = $this->convertFileToWebp($user->avatar);
            if ($newUrl && $newUrl !== $user->avatar) {
                $user->update(['avatar' => $newUrl]);
                $count++;
            }
        }

        $this->info("Converted $count avatars to WebP.");
    }

    private function convertShopMedia()
    {
        $this->info('Converting shop logos and banners...');
        $profiles = UmkmProfile::all();
        $logoCount = 0;
        $bannerCount = 0;

        foreach ($profiles as $p) {
            if ($p->logo) {
                $newLogo = $this->convertFileToWebp($p->logo);
                if ($newLogo && $newLogo !== $p->logo) {
                    $p->update(['logo' => $newLogo]);
                    $logoCount++;
                }
            }
            if ($p->banner) {
                $newBanner = $this->convertFileToWebp($p->banner);
                if ($newBanner && $newBanner !== $p->banner) {
                    $p->update(['banner' => $newBanner]);
                    $bannerCount++;
                }
            }
        }

        $this->info("Converted $logoCount shop logos and $bannerCount shop banners to WebP.");
    }

    private function convertDriverPhotos()
    {
        $this->info('Converting driver profiles...');
        $drivers = DriverProfile::all();
        $profileCount = 0;
        $ktpCount = 0;

        foreach ($drivers as $d) {
            if ($d->photo_profile) {
                $newProfile = $this->convertFileToWebp($d->photo_profile);
                if ($newProfile && $newProfile !== $d->photo_profile) {
                    $d->update(['photo_profile' => $newProfile]);
                    $profileCount++;
                }
            }
            if ($d->photo_ktp) {
                $newKtp = $this->convertFileToWebp($d->photo_ktp);
                if ($newKtp && $newKtp !== $d->photo_ktp) {
                    $d->update(['photo_ktp' => $newKtp]);
                    $ktpCount++;
                }
            }
        }

        $this->info("Converted $profileCount driver profile photos and $ktpCount driver KTP photos to WebP.");
    }
}
