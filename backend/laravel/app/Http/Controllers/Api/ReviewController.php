<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ClothingItem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function index(): JsonResponse
    {
        $reviews = Review::with(['user', 'clothingItem'])->get();
        return response()->json($reviews);
    }

    public function show(Review $review): JsonResponse
    {
        $review->load(['user', 'clothingItem', 'comments.user']);
        return response()->json($review);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'userId' => 'required|exists:users,id',
                'clothingId' => 'required|exists:clothing_items,id',
                'rating' => 'required|integer|min:0|max:90',
                'ratingBreakdown' => 'nullable|array',
                'text' => 'required|string|min:100',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $review = Review::create([
            'user_id' => $data['userId'],
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

        $user = User::find($data['userId']);
        $user->update([
            'reviews_count' => $user->reviews_count + 1,
            'reputation' => $user->reputation + 5,
        ]);

        $review->load(['user', 'clothingItem']);
        return response()->json($review, 201);
    }

    public function update(Request $request, Review $review): JsonResponse
    {
        try {
            $data = $request->validate([
                'rating' => 'sometimes|integer|min:0|max:90',
                'ratingBreakdown' => 'nullable|array',
                'text' => 'sometimes|string|min:100',
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
        $user = $review->user;
        $user->update([
            'reviews_count' => max(0, $user->reviews_count - 1),
            'reputation' => max(0, $user->reputation - 5),
        ]);
        $review->delete();
        return response()->json(null, 204);
    }

    public function like(Review $review): JsonResponse
    {
        $review->increment('likes');
        $review->user->increment('reputation');
        $review->load(['user', 'clothingItem']);
        return response()->json($review);
    }
}
