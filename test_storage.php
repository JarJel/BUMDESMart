<?php
require 'backend/vendor/autoload.php';
require 'backend/bootstrap/app.php';

$path = 'uploads/shop/banners/dummy.webp';
$storagePathDir = storage_path('app/public/uploads/shop/banners');
if (!is_dir($storagePathDir)) {
    mkdir($storagePathDir, 0775, true);
}
touch(storage_path('app/public/' . $path));

$fullPath = storage_path('app/public/' . $path);
$realPath = realpath($fullPath);
$dir = realpath(storage_path('app/public'));

var_dump($realPath, $dir . DIRECTORY_SEPARATOR, str_starts_with($realPath, $dir . DIRECTORY_SEPARATOR));
