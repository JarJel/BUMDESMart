<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;

Route::get('/profile', [ProfileController::class, 'show'])->middleware('auth:sanctum');
Route::put('/profile', [ProfileController::class, 'update'])->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/register/umkm', [AuthController::class, 'registerUmkm']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/google', [AuthController::class, 'loginWithGoogle']);



