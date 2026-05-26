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
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\BootstrapController;
use App\Http\Controllers\Api\HealthController;

Route::get('/health', HealthController::class);

Route::middleware(['auth:sanctum', 'throttle:writes'])->group(function () {
    Route::post('/upload', [UploadController::class, 'upload']);
    Route::delete('/upload', [UploadController::class, 'delete']);
});

Route::prefix('v1')->group(function () {
    Route::get('/bootstrap', BootstrapController::class);
    Route::post('/login', [UserController::class, 'login'])->middleware('throttle:auth');
    Route::post('/users', [UserController::class, 'store'])->middleware('throttle:auth');
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);

    Route::get('/items', [ClothingItemController::class, 'index']);
    Route::get('/items/{item}', [ClothingItemController::class, 'show']);
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::get('/reviews/{review}', [ReviewController::class, 'show']);
    Route::get('/drops', [DropController::class, 'index']);
    Route::get('/drops/{drop}', [DropController::class, 'show']);
    Route::get('/articles', [ArticleController::class, 'index']);
    Route::get('/articles/{article}', [ArticleController::class, 'show']);

    Route::middleware(['auth:sanctum', 'throttle:writes'])->group(function () {
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::patch('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::post('/users/{user}/report', [UserController::class, 'report']);
        Route::post('/users/{user}/ban', [UserController::class, 'ban']);
        Route::post('/users/{user}/verify', [UserController::class, 'verify']);

        Route::post('/items', [ClothingItemController::class, 'store']);
        Route::put('/items/{item}', [ClothingItemController::class, 'update']);
        Route::patch('/items/{item}', [ClothingItemController::class, 'update']);
        Route::delete('/items/{item}', [ClothingItemController::class, 'destroy']);

        Route::put('/reviews/{review}', [ReviewController::class, 'update']);
        Route::patch('/reviews/{review}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
        Route::post('/reviews/{review}/report', [ReviewController::class, 'report']);
        Route::post('/reviews/{review}/like', [ReviewController::class, 'like']);

        Route::post('/drops', [DropController::class, 'store']);
        Route::put('/drops/{drop}', [DropController::class, 'update']);
        Route::patch('/drops/{drop}', [DropController::class, 'update']);
        Route::delete('/drops/{drop}', [DropController::class, 'destroy']);
        Route::post('/drops/{drop}/cop', [DropController::class, 'cop']);

        Route::get('/report-reviews', [ReportController::class, 'reviewReports']);
        Route::get('/report-users', [ReportController::class, 'userReports']);
        Route::delete('/report-reviews/{report}', [ReportController::class, 'destroyReviewReport']);
        Route::delete('/report-users/{report}', [ReportController::class, 'destroyUserReport']);

        Route::post('/articles', [ArticleController::class, 'store']);
        Route::put('/articles/{article}', [ArticleController::class, 'update']);
        Route::patch('/articles/{article}', [ArticleController::class, 'update']);
        Route::delete('/articles/{article}', [ArticleController::class, 'destroy']);
    });

    Route::post('/reviews', [ReviewController::class, 'store'])
        ->middleware(['auth:sanctum', 'throttle:reviews']);

    Route::middleware(['auth:sanctum', 'throttle:writes'])->group(function () {
        Route::get('/authorship-requests', [AuthorshipController::class, 'index']);
        Route::post('/authorship-requests', [AuthorshipController::class, 'store']);
        Route::get('/authorship-requests/{authorshipRequest}', [AuthorshipController::class, 'show']);
        Route::post('/authorship-requests/{authorshipRequest}/approve', [AuthorshipController::class, 'approve']);
        Route::post('/authorship-requests/{authorshipRequest}/reject', [AuthorshipController::class, 'reject']);
    });

    Route::get('/feedback', [FeedbackController::class, 'index']);
    Route::post('/feedback', [FeedbackController::class, 'store'])->middleware(['auth:sanctum', 'throttle:writes']);

    Route::middleware(['auth:sanctum', 'throttle:messages'])->group(function () {
        Route::get('/chats', [ChatController::class, 'conversations']);
        Route::get('/chats/{user}/messages', [ChatController::class, 'messages']);
        Route::post('/chats/messages', [ChatController::class, 'send']);
    });
});
