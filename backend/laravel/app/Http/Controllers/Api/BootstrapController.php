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

class BootstrapController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $articles = Article::query()
            ->orderByDesc('created_at')
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
            ->withCount('reports')
            ->whereHas('user', function (Builder $query) {
                $query->whereNull('banned_until')
                    ->orWhere('banned_until', '<=', now());
            })
            ->latest()
            ->get();

        $users = User::query()
            ->where(fn (Builder $query) => $query
                ->whereNull('banned_until')
                ->orWhere('banned_until', '<=', now()))
            ->get();

        return response()->json([
            'items' => ClothingItem::query()->get(),
            'reviews' => $reviews,
            'users' => $users,
            'drops' => Drop::query()->orderByDesc('release_date')->get(),
            'articles' => $articles,
        ]);
    }

    private function excerpt(?string $body): string
    {
        $plain = trim(strip_tags($body ?? ''));

        return function_exists('mb_substr')
            ? mb_substr($plain, 0, 260)
            : substr($plain, 0, 260);
    }
}
