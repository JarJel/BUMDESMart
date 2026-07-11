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
use App\Http\Controllers\Customers\CheckoutController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;
use App\Http\Controllers\Seller\SellerDiscountController;
use App\Http\Controllers\Seller\SellerDocumentController;
use App\Http\Controllers\SuperAdmin\BumdesController as SuperAdminBumdesController;
use App\Http\Controllers\Admin\RequiredDocumentController;
use App\Http\Controllers\Admin\UmkmVerificationController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::post('/profile/shop/logo', [ProfileController::class, 'updateShopLogo']);
    Route::post('/profile/shop/banner', [ProfileController::class, 'updateShopBanner']);
    Route::post('/profile/shop/halal-cert', [ProfileController::class, 'updateHalalCert']);
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
    Route::get('/checkout/preview', [CheckoutController::class, 'preview']);

    // Wishlist management routes
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'destroy']);

    // Notification management routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Seller document management routes
    Route::get('/seller/documents', [SellerDocumentController::class, 'index']);
    Route::post('/seller/documents/{requiredDocId}', [SellerDocumentController::class, 'upload']);

    // Seller discount management routes
    Route::get('/seller/discounts', [SellerDiscountController::class, 'index']);
    Route::post('/seller/discounts', [SellerDiscountController::class, 'store']);
    Route::put('/seller/discounts/{id}', [SellerDiscountController::class, 'update']);
    Route::delete('/seller/discounts/{id}', [SellerDiscountController::class, 'destroy']);
    Route::patch('/seller/discounts/{id}/toggle', [SellerDiscountController::class, 'toggle']);

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

// Admin BUMDes routes
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    // Verifikasi mitra
    Route::get('/umkm', [UmkmVerificationController::class, 'index']);
    Route::get('/umkm/{umkm}', [UmkmVerificationController::class, 'show']);
    Route::put('/umkm/{umkm}/verify', [UmkmVerificationController::class, 'verify']);
    Route::put('/umkm/{umkm}/reject', [UmkmVerificationController::class, 'reject']);
    Route::put('/umkm/{umkm}/reapply', [UmkmVerificationController::class, 'reapply']);

    Route::get('/required-documents', [RequiredDocumentController::class, 'index']);
    Route::post('/required-documents/seed-defaults', [RequiredDocumentController::class, 'seedDefaults']);
    Route::post('/required-documents', [RequiredDocumentController::class, 'store']);
    Route::put('/required-documents/{document}', [RequiredDocumentController::class, 'update']);
    Route::delete('/required-documents/{document}', [RequiredDocumentController::class, 'destroy']);
});

// Public: ambil dokumen wajib berdasarkan bumdes (untuk form daftar mitra)
Route::get('/bumdes/{bumdesId}/required-documents', function ($bumdesId) {
    $docs = \App\Models\BumdesRequiredDocument::where('bumdes_profile_id', $bumdesId)->get();
    return response()->json(['data' => $docs]);
});

// Super Admin routes
Route::middleware(['auth:sanctum'])->prefix('super-admin')->group(function () {
    Route::apiResource('bumdes', SuperAdminBumdesController::class);
});

// Public bumdes list (untuk FE pilih bumdes saat daftar mitra)
Route::get('/bumdes', [SuperAdminBumdesController::class, 'index']);

// Product public routes for customers
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{idOrSlug}', [ProductController::class, 'show']);

// Categories
Route::get('/categories', function () {
    return response()->json(['data' => \App\Models\Category::orderBy('name')->get(['id', 'name', 'slug'])]);
});
