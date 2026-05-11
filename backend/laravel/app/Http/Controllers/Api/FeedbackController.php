<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeedbackMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FeedbackController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            FeedbackMessage::with('user')->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'userId' => 'nullable|exists:users,id',
                'message' => 'required|string|min:3|max:4000',
                'page' => 'nullable|string|max:255',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $feedback = FeedbackMessage::create([
            'user_id' => $data['userId'] ?? null,
            'message' => trim($data['message']),
            'page' => $data['page'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        return response()->json($feedback->fresh()->load('user'), 201);
    }
}
