<?php
require 'backend/vendor/autoload.php';
require 'backend/bootstrap/app.php';

$path = 'uploads/shop/banners/1785725480_6a700228c21a7.webp';
$fullPath = public_path($path);
$realPath = realpath($fullPath);
$dir = realpath(public_path());
var_dump($realPath, $dir . DIRECTORY_SEPARATOR, str_starts_with($realPath, $dir . DIRECTORY_SEPARATOR));
