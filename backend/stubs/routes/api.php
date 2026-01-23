<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));

Route::prefix('v1')->group(function () {
    Route::get('/users', fn () => response()->json(require base_path('storage/app/mock/users.php')));
    Route::get('/items', fn () => response()->json(require base_path('storage/app/mock/items.php')));
    Route::get('/reviews', fn () => response()->json(require base_path('storage/app/mock/reviews.php')));
    Route::get('/drops', fn () => response()->json(require base_path('storage/app/mock/drops.php')));
});


