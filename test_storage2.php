<?php
require 'backend/vendor/autoload.php';
require 'backend/bootstrap/app.php';

$destinationPath = storage_path('app/public/uploads/shop/banners');
if (!is_dir($destinationPath)) {
    mkdir($destinationPath, 0775, true);
}

$filename  = time() . '_' . uniqid() . '.webp';
$targetAbs = rtrim($destinationPath, '/') . '/' . $filename;

// create dummy source
$sourceAbs = storage_path('app/temp_dummy.txt');
file_put_contents($sourceAbs, 'dummy image content');

$copyResult = @copy($sourceAbs, $targetAbs);
var_dump('copy result:', $copyResult);
var_dump('target exists:', file_exists($targetAbs));

$path = 'uploads/shop/banners/' . $filename;
$fullPath = storage_path('app/public/' . $path);
$realPath = realpath($fullPath);
$dir = realpath(storage_path('app/public'));

var_dump('real path:', $realPath);
var_dump('allowed?', str_starts_with($realPath, $dir . DIRECTORY_SEPARATOR));
