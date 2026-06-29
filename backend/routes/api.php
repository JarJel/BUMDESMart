<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Customers\ProfileController;
use App\Http\Controllers\Customers\AddressController;
use App\Http\Controllers\Customers\CartController;
use App\Http\Controllers\Customers\WishlistController;
use App\Http\Controllers\Customers\NotificationController;
use App\Http\Controllers\Customers\SellerController;
use App\Http\Controllers\Customers\ProductController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::match(['put', 'post'], '/profile/password', [ProfileController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Address management routes
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
    Route::put('/addresses/{id}/default', [AddressController::class, 'setDefault']);

    // Cart management routes
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart', [CartController::class, 'update']);
    Route::delete('/cart', [CartController::class, 'destroy']);

    // Wishlist management routes
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'destroy']);

    // Notification management routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Seller product management routes
    Route::get('/seller/products', [SellerProductController::class, 'index']);
    Route::post('/seller/products', [SellerProductController::class, 'store']);
    Route::get('/seller/products/{id}', [SellerProductController::class, 'show']);
    Route::put('/seller/products/{id}', [SellerProductController::class, 'update']);
    Route::post('/seller/products/{id}', [SellerProductController::class, 'update']); // Support for multipart PUT request
    Route::delete('/seller/products/{id}', [SellerProductController::class, 'destroy']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/register/umkm', [AuthController::class, 'registerUmkm']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/google', [AuthController::class, 'loginWithGoogle']);

// Seller/UMKM public routes for customers
Route::get('/sellers', [SellerController::class, 'index']);
Route::get('/sellers/{idOrSlug}', [SellerController::class, 'show']);

// Product public routes for customers
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{idOrSlug}', [ProductController::class, 'show']);
