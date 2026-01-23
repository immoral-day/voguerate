<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ClothingItemController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\DropController;
use App\Http\Controllers\Api\UploadController;

Route::get('/health', fn () => response()->json(['ok' => true]));

Route::post('/upload', [UploadController::class, 'upload']);
Route::delete('/upload', [UploadController::class, 'delete']);

Route::prefix('v1')->group(function () {
    Route::post('/login', [UserController::class, 'login']);
    Route::apiResource('users', UserController::class);
    Route::apiResource('items', ClothingItemController::class)->parameters(['items' => 'item']);
    Route::apiResource('reviews', ReviewController::class);
    Route::post('/reviews/{review}/like', [ReviewController::class, 'like']);
    Route::apiResource('drops', DropController::class);
    Route::post('/drops/{drop}/cop', [DropController::class, 'cop']);
});
