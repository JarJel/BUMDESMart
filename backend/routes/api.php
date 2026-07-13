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
use App\Http\Controllers\Customers\PaymentController;
use App\Http\Controllers\Customers\OrderController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;
use App\Http\Controllers\Seller\BankAccountController;
use App\Http\Controllers\Seller\SellerDiscountController;
use App\Http\Controllers\Seller\SellerDocumentController;
use App\Http\Controllers\Seller\SellerOrderController;
use App\Http\Controllers\Seller\ReviewController as SellerReviewController;
use App\Http\Controllers\Seller\PromotionController as SellerPromotionController;
use App\Http\Controllers\Seller\ShopStatusController;
use App\Http\Controllers\Customers\ReviewController;
use App\Http\Controllers\Admin\MitraPerformanceController;
use App\Http\Controllers\SuperAdmin\BumdesController as SuperAdminBumdesController;
use App\Http\Controllers\SuperAdmin\UserController as SuperAdminUserController;
use App\Http\Controllers\SuperAdmin\UmkmController as SuperAdminUmkmController;
use App\Http\Controllers\SuperAdmin\ReportController as SuperAdminReportController;
use App\Http\Controllers\SuperAdmin\SettingController as SuperAdminSettingController;
use App\Http\Controllers\Admin\RequiredDocumentController;
use App\Http\Controllers\Admin\UmkmVerificationController;
use App\Http\Controllers\Driver\DriverController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::post('/profile/shop/logo', [ProfileController::class, 'updateShopLogo']);
    Route::post('/profile/shop/banner', [ProfileController::class, 'updateShopBanner']);
    Route::post('/profile/shop/halal-cert', [ProfileController::class, 'updateHalalCert']);
    Route::match(['put', 'post'], '/profile/password', [ProfileController::class, 'changePassword']);
    Route::put('/seller/reapply', [ProfileController::class, 'reapplyRequest']);
    Route::get('/seller/balance', [ProfileController::class, 'sellerBalance']);
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
    Route::delete('/cart/clear', [CartController::class, 'clear']);
    Route::get('/checkout/preview', [CheckoutController::class, 'preview']);
    Route::post('/checkout/confirm', [CheckoutController::class, 'confirm']);
    Route::post('/checkout/payment/{orderId}', [PaymentController::class, 'createInvoice']);
    Route::get('/checkout/payment/{orderId}/status', [PaymentController::class, 'checkStatus']);

    // Customer orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/delivered', [OrderController::class, 'confirmDelivered']);
    Route::post('/orders/{orderId}/reviews', [ReviewController::class, 'store']);
    Route::get('/orders/{orderId}/reviews', [ReviewController::class, 'showByOrder']);

    // Seller bank account & balance
    Route::get('/seller/bank-accounts', [BankAccountController::class, 'index']);
    Route::post('/seller/bank-accounts', [BankAccountController::class, 'store']);
    Route::delete('/seller/bank-accounts/{id}', [BankAccountController::class, 'destroy']);

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

    // Seller shop status & hours
    Route::get('/seller/shop/status', [ShopStatusController::class, 'show']);
    Route::patch('/seller/shop/toggle', [ShopStatusController::class, 'toggle']);
    Route::put('/seller/shop/hours', [ShopStatusController::class, 'updateHours']);

    // Seller review management
    Route::get('/seller/reviews', [SellerReviewController::class, 'index']);

    // Seller promotion management
    Route::get('/seller/promotions', [SellerPromotionController::class, 'index']);
    Route::post('/seller/promotions', [SellerPromotionController::class, 'store']);
    Route::put('/seller/promotions/{id}', [SellerPromotionController::class, 'update']);
    Route::delete('/seller/promotions/{id}', [SellerPromotionController::class, 'destroy']);
    Route::patch('/seller/promotions/{id}/toggle', [SellerPromotionController::class, 'toggle']);

    // Seller order management routes
    Route::get('/seller/orders', [SellerOrderController::class, 'index']);
    Route::get('/seller/orders/{id}', [SellerOrderController::class, 'show']);
    Route::patch('/seller/orders/{id}/status', [SellerOrderController::class, 'updateStatus']);

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
Route::post('/register/pengirim', [AuthController::class, 'registerDriver']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/google', [AuthController::class, 'loginWithGoogle']);

// Seller/UMKM public routes for customers
Route::get('/sellers', [SellerController::class, 'index']);
Route::get('/sellers/{idOrSlug}', [SellerController::class, 'show']);

// Admin BUMDes routes
Route::middleware(['auth:sanctum', 'role:admin_bumdes,super_admin'])->prefix('admin')->group(function () {
    // Verifikasi mitra
    Route::get('/umkm', [UmkmVerificationController::class, 'index']);
    Route::get('/umkm/{umkm}', [UmkmVerificationController::class, 'show']);
    Route::put('/umkm/{umkm}/verify', [UmkmVerificationController::class, 'verify']);
    Route::put('/umkm/{umkm}/reject', [UmkmVerificationController::class, 'reject']);
    Route::put('/umkm/{umkm}/reapply', [UmkmVerificationController::class, 'reapply']);

    Route::get('/reports/mitra', [MitraPerformanceController::class, 'index']);

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
Route::middleware(['auth:sanctum', 'role:super_admin'])->prefix('super-admin')->group(function () {
    Route::apiResource('bumdes', SuperAdminBumdesController::class);

    // User management
    Route::get('/users', [SuperAdminUserController::class, 'index']);
    Route::get('/users/{user}', [SuperAdminUserController::class, 'show']);
    Route::put('/users/{user}', [SuperAdminUserController::class, 'update']);
    Route::delete('/users/{user}', [SuperAdminUserController::class, 'destroy']);

    // UMKM management
    Route::get('/umkm', [SuperAdminUmkmController::class, 'index']);
    Route::get('/umkm/{id}', [SuperAdminUmkmController::class, 'show']);
    Route::patch('/umkm/{id}/status', [SuperAdminUmkmController::class, 'updateStatus']);

    // Laporan
    Route::get('/reports/overview', [SuperAdminReportController::class, 'overview']);
    Route::get('/reports/bumdes', [SuperAdminReportController::class, 'bumdesBreakdown']);

    // Pengaturan platform
    Route::get('/settings', [SuperAdminSettingController::class, 'index']);
    Route::put('/settings', [SuperAdminSettingController::class, 'update']);
});

// Driver routes
Route::middleware(['auth:sanctum', 'role:pengirim'])->prefix('driver')->group(function () {
    Route::get('/profile', [DriverController::class, 'profile']);
    Route::put('/profile', [DriverController::class, 'updateProfile']);
    Route::patch('/profile/availability', [DriverController::class, 'toggleAvailability']);
    Route::get('/orders/available', [DriverController::class, 'availableOrders']);
    Route::get('/orders/active', [DriverController::class, 'activeOrders']);
    Route::post('/orders/{id}/accept', [DriverController::class, 'acceptOrder']);
    Route::patch('/orders/{id}/status', [DriverController::class, 'updateOrderStatus']);
    Route::get('/history', [DriverController::class, 'orderHistory']);
    Route::get('/stats', [DriverController::class, 'stats']);
});

// Public bumdes list (untuk FE pilih bumdes saat daftar mitra)
Route::get('/bumdes', [SuperAdminBumdesController::class, 'index']);

// Webhook Xendit (tidak perlu auth Sanctum)
Route::post('/webhooks/xendit', [WebhookController::class, 'xendit']);

// Validate promo code (public — checkout page needs it before login check)
Route::get('/promotions/validate', [SellerPromotionController::class, 'validate']);

// Product public routes for customers
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{idOrSlug}', [ProductController::class, 'show']);

// Categories
Route::get('/categories', function () {
    return response()->json(['data' => \App\Models\Category::orderBy('name')->get(['id', 'name', 'slug'])]);
});
