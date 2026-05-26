<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ClothingItem;
use App\Models\ReviewReport;
use App\Models\ReviewLike;
use App\Support\ApiAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Review::query()
            ->withCount('reports')
            ->whereHas('user', function ($q) {
                $q->whereNull('banned_until')
                    ->orWhere('banned_until', '<=', now());
            });

        if (!$request->boolean('compact')) {
            $query->with(['user', 'clothingItem']);
        }

        return response()->json($query->latest()->get());
    }

    public function show(Review $review): JsonResponse
    {
        $review->load(['user', 'clothingItem', 'comments.user']);
        return response()->json($review);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $data = $request->validate([
                'clothingId' => 'required|exists:clothing_items,id',
                'rating' => 'required|integer|min:0|max:90',
                'ratingBreakdown' => 'nullable|array',
                'text' => 'required|string|min:10',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $existingReview = Review::where('user_id', $authUser->id)
            ->where('clothing_item_id', $data['clothingId'])
            ->first();

        if ($existingReview) {
            return response()->json(['error' => 'Вы уже написали рецензию на этот предмет'], 400);
        }

        $review = Review::create([
            'user_id' => $authUser->id,
            'clothing_item_id' => $data['clothingId'],
            'rating' => $data['rating'],
            'rating_breakdown' => $data['ratingBreakdown'] ?? null,
            'text' => $data['text'],
            'likes' => 0,
        ]);

        $item = ClothingItem::find($data['clothingId']);
        $newCount = $item->rating_count + 1;
        $newAvg = (int) round((($item->average_rating * $item->rating_count) + $data['rating']) / $newCount);
        $item->update(['rating_count' => $newCount, 'average_rating' => $newAvg]);

        $user = $authUser;
        $user->update([
            'reviews_count' => $user->reviews_count + 1,
            'reputation' => $user->reputation + 5,
        ]);

        $review->load(['user', 'clothingItem']);
        return response()->json($review, 201);
    }

    public function update(Request $request, Review $review): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        if (!ApiAuth::isAdmin($authUser) && (int) $review->user_id !== (int) $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        try {
            $data = $request->validate([
                'rating' => 'sometimes|integer|min:0|max:90',
                'ratingBreakdown' => 'nullable|array',
                'text' => 'sometimes|string|min:10',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $updateData = [];
        if (isset($data['rating'])) $updateData['rating'] = $data['rating'];
        if (isset($data['ratingBreakdown'])) $updateData['rating_breakdown'] = $data['ratingBreakdown'];
        if (isset($data['text'])) $updateData['text'] = $data['text'];

        $review->update($updateData);
        $review->load(['user', 'clothingItem']);
        return response()->json($review);
    }

    public function destroy(Review $review): JsonResponse
    {
        $authUser = ApiAuth::user(request());
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        if (!ApiAuth::isAdmin($authUser) && (int) $review->user_id !== (int) $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user = $review->user;
        $item = $review->clothingItem;

        if ($item) {
            $newCount = max(0, $item->rating_count - 1);
            $newAvg = $newCount === 0
                ? 0
                : (int) round((($item->average_rating * $item->rating_count) - $review->rating) / $newCount);
            $item->update(['rating_count' => $newCount, 'average_rating' => $newAvg]);
        }

        $user->update([
            'reviews_count' => max(0, $user->reviews_count - 1),
            'reputation' => max(0, $user->reputation - 5),
        ]);
        $review->delete();
        return response()->json(null, 204);
    }

    public function report(Request $request, Review $review): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'reason' => 'nullable|string',
        ]);

        if ((int) $review->user_id === (int) $authUser->id) {
            return response()->json(['error' => 'Cannot report yourself'], 400);
        }

        $exists = ReviewReport::where('review_id', $review->id)
            ->where('reporter_id', $authUser->id)
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Вы уже отправляли репорт'], 400);
        }

        ReviewReport::create([
            'review_id' => $review->id,
            'reporter_id' => $authUser->id,
            'reason' => $data['reason'] ?? null,
        ]);

        return response()->json(['success' => true]);
    }

    public function like(Request $request, Review $review): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ((int) $review->user_id === (int) $authUser->id) {
            return response()->json(['error' => 'Нельзя лайкать свою рецензию'], 400);
        }

        $exists = ReviewLike::where('review_id', $review->id)
            ->where('user_id', $authUser->id)
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Вы уже лайкали эту рецензию'], 400);
        }

        ReviewLike::create([
            'review_id' => $review->id,
            'user_id' => $authUser->id,
        ]);

        $review->increment('likes');
        $review->user->increment('reputation');
        $review->load(['user', 'clothingItem']);
        return response()->json($review);
    }
}
