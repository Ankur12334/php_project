<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AdminController;

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/google', [AuthController::class, 'googleAuth'])->middleware('throttle:30,1');
    Route::post('/otp/send', [AuthController::class, 'sendOtp'])->middleware('throttle:30,1');
    Route::post('/otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:30,1');
    Route::post('/register', [AuthController::class, 'completeRegistration'])->middleware('throttle:30,1');
});

// Room Routes
Route::prefix('rooms')->group(function () {
    Route::get('/', [RoomController::class, 'index']);
    Route::get('/my/listings', [RoomController::class, 'ownerRooms'])->middleware(['auth.jwt', 'role:user']);
    Route::get('/owner/me', [RoomController::class, 'ownerRooms'])->middleware(['auth.jwt', 'role:user']);
    Route::get('/{id}/contact', [RoomController::class, 'contactOwner'])->middleware('auth.jwt');
    Route::get('/{id}', [RoomController::class, 'show'])->middleware('auth.jwt:optional');

    Route::post('/', [RoomController::class, 'store'])->middleware(['auth.jwt', 'role:user']);
    Route::put('/{id}', [RoomController::class, 'update'])->middleware(['auth.jwt', 'role:user']);
    Route::delete('/{id}', [RoomController::class, 'destroy'])->middleware(['auth.jwt', 'role:user,admin']);
});

// Booking / Connect Routes
Route::prefix('bookings')->group(function () {
    Route::post('/', [BookingController::class, 'store'])->middleware(['auth.jwt', 'role:user']);
    Route::get('/user', [BookingController::class, 'userBookings'])->middleware(['auth.jwt', 'role:user']);
    Route::get('/owner', [BookingController::class, 'ownerNotifications'])->middleware(['auth.jwt', 'role:user']);
});

// Admin Routes
Route::prefix('admin')->middleware(['auth.jwt', 'role:admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/rooms/pending', [AdminController::class, 'pendingRooms']);
    Route::put('/rooms/{id}/approve', [AdminController::class, 'approveRoom']);
    Route::put('/rooms/{id}/reject', [AdminController::class, 'rejectRoom']);
    Route::get('/users', [AdminController::class, 'allUsers']);
    Route::get('/reports', [AdminController::class, 'reports']);
});
