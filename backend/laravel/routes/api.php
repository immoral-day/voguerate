<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ClothingItemController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\DropController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AuthorshipController;
use App\Http\Controllers\Api\ArticleController;

Route::get('/health', fn () => response()->json(['ok' => true]));

Route::post('/upload', [UploadController::class, 'upload']);
Route::delete('/upload', [UploadController::class, 'delete']);

Route::prefix('v1')->group(function () {
    Route::post('/login', [UserController::class, 'login']);
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/report', [UserController::class, 'report']);
    Route::post('/users/{user}/ban', [UserController::class, 'ban']);
    Route::post('/users/{user}/verify', [UserController::class, 'verify']);
    Route::apiResource('items', ClothingItemController::class)->parameters(['items' => 'item']);
    Route::apiResource('reviews', ReviewController::class);
    Route::post('/reviews/{review}/report', [ReviewController::class, 'report']);
    Route::post('/reviews/{review}/like', [ReviewController::class, 'like']);
    Route::apiResource('drops', DropController::class);
    Route::post('/drops/{drop}/cop', [DropController::class, 'cop']);
    Route::get('/report-reviews', [ReportController::class, 'reviewReports']);
    Route::get('/report-users', [ReportController::class, 'userReports']);
    Route::delete('/report-reviews/{report}', [ReportController::class, 'destroyReviewReport']);
    Route::delete('/report-users/{report}', [ReportController::class, 'destroyUserReport']);

    Route::get('/authorship-requests', [AuthorshipController::class, 'index']);
    Route::post('/authorship-requests', [AuthorshipController::class, 'store']);
    Route::get('/authorship-requests/{authorshipRequest}', [AuthorshipController::class, 'show']);
    Route::post('/authorship-requests/{authorshipRequest}/approve', [AuthorshipController::class, 'approve']);
    Route::post('/authorship-requests/{authorshipRequest}/reject', [AuthorshipController::class, 'reject']);

    Route::apiResource('articles', ArticleController::class)->parameters(['articles' => 'article']);
});
