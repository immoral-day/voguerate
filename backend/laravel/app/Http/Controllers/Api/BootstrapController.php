<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ClothingItem;
use App\Models\Drop;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class BootstrapController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $payload = Cache::remember('bootstrap:v4', now()->addSeconds(30), function () {
            $articles = Article::query()
                ->select(['id', 'title', 'topic', 'body', 'image', 'published_at', 'created_at', 'updated_at'])
                ->orderByDesc('created_at')
                ->limit(100)
                ->get()
                ->map(fn (Article $article) => [
                    'id' => (string) $article->id,
                    'title' => $article->title,
                    'topic' => $article->topic,
                    'body' => $this->excerpt($article->body),
                    'image' => $article->image,
                    'publishedAt' => $article->published_at?->toIso8601String(),
                    'createdAt' => $article->created_at?->toIso8601String(),
                    'updatedAt' => $article->updated_at?->toIso8601String(),
                ]);

            $reviews = Review::query()
                ->select(['id', 'user_id', 'clothing_item_id', 'rating', 'rating_breakdown', 'text', 'likes', 'created_at'])
                ->whereHas('user', function (Builder $query) {
                    $query->notBanned();
                })
                ->latest()
                ->limit(1000)
                ->get();

            $users = User::query()
                ->select([
                    'id',
                    'username',
                    'avatar',
                    'profile_background',
                    'reputation',
                    'reviews_count',
                    'role',
                    'bio',
                    'joined_date',
                    'badges',
                ])
                ->notBanned()
                ->limit(2000)
                ->get()
                ->map(fn (User $user) => $user->toSummaryArray());

            return [
                'items' => ClothingItem::query()->get(),
                'reviews' => $reviews,
                'users' => $users,
                'drops' => Drop::query()->orderByDesc('release_date')->get(),
                'articles' => $articles,
            ];
        });

        return response()->json($payload)
            ->header('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
    }

    private function excerpt(?string $body): string
    {
        $plain = trim(strip_tags($body ?? ''));

        return function_exists('mb_substr')
            ? mb_substr($plain, 0, 260)
            : substr($plain, 0, 260);
    }
}
