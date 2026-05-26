<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Support\ApiAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Article::orderByDesc('created_at');

        if ($request->boolean('published_only')) {
            $query->whereNotNull('published_at')->where('published_at', '<=', now());
        }

        if ($request->filled('topic')) {
            $query->where('topic', $request->input('topic'));
        }

        $articles = $query->get();

        if ($request->boolean('summary')) {
            return response()->json($articles->map(function (Article $article) {
                return [
                    'id' => (string) $article->id,
                    'title' => $article->title,
                    'topic' => $article->topic,
                    'body' => $this->excerpt($article->body),
                    'image' => $article->image,
                    'publishedAt' => $article->published_at?->toIso8601String(),
                    'createdAt' => $article->created_at?->toIso8601String(),
                    'updatedAt' => $article->updated_at?->toIso8601String(),
                ];
            }));
        }

        return response()->json($articles);
    }

    public function show(Article $article): JsonResponse
    {
        return response()->json($article);
    }

    public function store(Request $request): JsonResponse
    {
        if (!ApiAuth::isAdmin($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'topic' => 'nullable|string|max:255',
                'body' => 'required|string',
                'image' => 'nullable|string|max:500',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $article = Article::create([
            'title' => $data['title'],
            'topic' => $data['topic'] ?? null,
            'body' => $data['body'],
            'image' => $data['image'] ?? null,
        ]);

        return response()->json($article, 201);
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        if (!ApiAuth::isAdmin($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        try {
            $data = $request->validate([
                'title' => 'sometimes|string|max:255',
                'topic' => 'nullable|string|max:255',
                'body' => 'sometimes|string',
                'image' => 'nullable|string|max:500',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        if (array_key_exists('title', $data)) {
            $article->title = $data['title'];
        }
        if (array_key_exists('topic', $data)) {
            $article->topic = $data['topic'];
        }
        if (array_key_exists('body', $data)) {
            $article->body = $data['body'];
        }
        if (array_key_exists('image', $data)) {
            $article->image = $data['image'];
        }
        $article->save();

        return response()->json($article);
    }

    public function destroy(Article $article): JsonResponse
    {
        if (!ApiAuth::isAdmin(request()->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $article->delete();
        return response()->json(null, 204);
    }

    private function excerpt(?string $body): string
    {
        $plain = trim(strip_tags($body ?? ''));

        return function_exists('mb_substr')
            ? mb_substr($plain, 0, 260)
            : substr($plain, 0, 260);
    }
}
