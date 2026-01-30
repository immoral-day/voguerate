<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
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

        return response()->json($query->get());
    }

    public function show(Article $article): JsonResponse
    {
        return response()->json($article);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'body' => 'required|string',
                'image' => 'nullable|string|max:500',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $article = Article::create([
            'title' => $data['title'],
            'body' => $data['body'],
            'image' => $data['image'] ?? null,
        ]);

        return response()->json($article, 201);
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        try {
            $data = $request->validate([
                'title' => 'sometimes|string|max:255',
                'body' => 'sometimes|string',
                'image' => 'nullable|string|max:500',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        if (array_key_exists('title', $data)) {
            $article->title = $data['title'];
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
        $article->delete();
        return response()->json(null, 204);
    }
}
