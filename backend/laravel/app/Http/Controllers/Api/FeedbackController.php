<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeedbackMessage;
use App\Support\ApiAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FeedbackController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!ApiAuth::isAdmin(ApiAuth::user($request))) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json(
            FeedbackMessage::with('user')->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $data = $request->validate([
                'message' => 'required|string|min:3|max:4000',
                'page' => 'nullable|string|max:255',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $feedback = FeedbackMessage::create([
            'user_id' => $user?->id,
            'message' => trim($data['message']),
            'page' => $data['page'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        return response()->json($feedback->fresh()->load('user'), 201);
    }
}
