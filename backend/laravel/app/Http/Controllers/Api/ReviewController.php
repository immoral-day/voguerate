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
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Review::query()
            ->whereHas('user', function ($q) {
                $q->notBanned();
            });

        if ($request->boolean('compact')) {
            $query->select([
                'id',
                'user_id',
                'clothing_item_id',
                'rating',
                'rating_breakdown',
                'text',
                'likes',
                'created_at',
            ]);
        } else {
            $query->withCount('reports');
            $query->with(['user', 'clothingItem']);
        }

        if ($request->filled('clothingId')) {
            $query->where('clothing_item_id', $request->integer('clothingId'));
        }

        if ($request->filled('userId')) {
            $query->where('user_id', $request->integer('userId'));
        }

        $limit = min(500, max(1, $request->integer('limit', 200)));

        return response()->json($query->latest()->limit($limit)->get());
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
            ->exists();

        if ($existingReview) {
            return response()->json(['error' => 'Вы уже написали рецензию на этот предмет'], 400);
        }

        $review = DB::transaction(function () use ($authUser, $data) {
            $review = Review::create([
                'user_id' => $authUser->id,
                'clothing_item_id' => $data['clothingId'],
                'rating' => $data['rating'],
                'rating_breakdown' => $data['ratingBreakdown'] ?? null,
                'text' => $data['text'],
                'likes' => 0,
            ]);

            DB::table('clothing_items')
                ->where('id', $data['clothingId'])
                ->update([
                    'rating_count' => DB::raw('rating_count + 1'),
                    'average_rating' => DB::raw(
                        'CAST(ROUND(((average_rating * rating_count) + '
                        . (int) $data['rating']
                        . ') / (rating_count + 1.0)) AS INTEGER)'
                    ),
                    'updated_at' => now(),
                ]);

            DB::table('users')
                ->where('id', $authUser->id)
                ->update([
                    'reviews_count' => DB::raw('reviews_count + 1'),
                    'reputation' => DB::raw('reputation + 5'),
                    'updated_at' => now(),
                ]);

            return $review;
        });

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

        $result = DB::transaction(function () use ($review, $authUser) {
            $like = ReviewLike::firstOrCreate([
                'review_id' => $review->id,
                'user_id' => $authUser->id,
            ]);

            if ($like->wasRecentlyCreated) {
                $review->increment('likes');
                $review->user()->increment('reputation');
            }

            $review->refresh();

            return [
                'review_id' => (string) $review->id,
                'likes' => (int) $review->likes,
                'liked' => true,
            ];
        });

        return response()->json($result);
    }

    public function unlike(Request $request, Review $review): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $result = DB::transaction(function () use ($review, $authUser) {
            $removed = ReviewLike::where('review_id', $review->id)
                ->where('user_id', $authUser->id)
                ->delete();

            if ($removed > 0) {
                $review->update(['likes' => max(0, (int) $review->likes - 1)]);

                $author = $review->user;
                if ($author && $author->reputation > 0) {
                    $author->decrement('reputation');
                }
            }

            $review->refresh();

            return [
                'review_id' => (string) $review->id,
                'likes' => (int) $review->likes,
                'liked' => false,
            ];
        });

        return response()->json($result);
    }
}
