<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthorshipRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthorshipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuthorshipRequest::with('user')->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($userId = $request->query('userId')) {
            $query->where('user_id', $userId);
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'userId' => 'required|exists:users,id',
                // Заявка должна быть содержательной
                'message' => 'required|string|min:80|max:4000',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $user = User::findOrFail($data['userId']);

        $hasActive = $user->authorshipRequests()
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->exists();

        if ($hasActive) {
            return response()->json([
                'error' => ['request' => ['У вас уже есть активная заявка или вы уже являетесь автором.']],
            ], 422);
        }

        // Ограничение: новая заявка не чаще, чем раз в день
        $recentRequestExists = $user->authorshipRequests()
            ->where('created_at', '>=', now()->subDay())
            ->exists();

        if ($recentRequestExists) {
            return response()->json([
                'error' => ['request' => ['Новую заявку можно отправлять не чаще, чем раз в день.']],
            ], 422);
        }

        $requestModel = AuthorshipRequest::create([
            'user_id' => $user->id,
            'status' => 'PENDING',
            // бренд и описание заполняем автоматически по пользователю и сообщению
            'brand_name' => $user->username ?? 'Unknown',
            'description' => mb_substr($data['message'], 0, 255),
            'reason' => 'AUTHORSHIP_REQUEST',
            'message' => $data['message'] ?? null,
            'portfolio_link' => null,
        ]);

        return response()->json($requestModel->load('user'), 201);
    }

    public function show(AuthorshipRequest $authorshipRequest): JsonResponse
    {
        return response()->json($authorshipRequest->load('user'));
    }

    public function approve(AuthorshipRequest $authorshipRequest): JsonResponse
    {
        if ($authorshipRequest->status === 'APPROVED') {
            return response()->json($authorshipRequest->load('user'));
        }

        $authorshipRequest->status = 'APPROVED';
        $authorshipRequest->admin_comment = $authorshipRequest->admin_comment;
        $authorshipRequest->save();

        $user = $authorshipRequest->user;
        if ($user) {
            $badges = $user->badges ?? [];
            if (!in_array('DESIGNER', $badges, true)) {
                $badges[] = 'DESIGNER';
            }

            $user->update([
                'role' => 'DESIGNER',
                'badges' => $badges,
            ]);
        }

        return response()->json($authorshipRequest->fresh()->load('user'));
    }

    public function reject(Request $request, AuthorshipRequest $authorshipRequest): JsonResponse
    {
        try {
            $data = $request->validate([
                'adminComment' => 'nullable|string|max:2000',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $authorshipRequest->status = 'REJECTED';
        $authorshipRequest->admin_comment = $data['adminComment'] ?? null;
        $authorshipRequest->save();

        return response()->json($authorshipRequest->fresh()->load('user'));
    }
}

