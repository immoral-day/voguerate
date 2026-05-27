<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthorshipRequest;
use App\Support\ApiAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class AuthorshipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $query = AuthorshipRequest::with('user')->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if (ApiAuth::isAdmin($authUser)) {
            if ($userId = $request->query('userId')) {
                $query->where('user_id', $userId);
            }
        } else {
            $query->where('user_id', $authUser->id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $user = ApiAuth::user($request);
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $data = $request->validate([
                // Заявка должна быть содержательной
                'message' => 'required|string|min:80|max:4000',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

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

        $payload = [
            'user_id' => $user->id,
            'status' => 'PENDING',
        ];

        foreach ([
            'message' => $data['message'] ?? null,
            'portfolio_link' => null,
            'brand_name' => $user->username ?? 'Unknown',
            'description' => $this->shortText($data['message'], 0, 255),
            'reason' => 'AUTHORSHIP_REQUEST',
        ] as $column => $value) {
            if (Schema::hasColumn('authorship_requests', $column)) {
                $payload[$column] = $value;
            }
        }

        $requestModel = AuthorshipRequest::create($payload);

        return response()->json($requestModel->load('user'), 201);
    }

    public function show(AuthorshipRequest $authorshipRequest): JsonResponse
    {
        $authUser = ApiAuth::user(request());
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        if (!ApiAuth::isAdmin($authUser) && (int) $authorshipRequest->user_id !== (int) $authUser->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json($authorshipRequest->load('user'));
    }

    public function approve(AuthorshipRequest $authorshipRequest): JsonResponse
    {
        $authUser = ApiAuth::user(request());
        if (!$authUser || !ApiAuth::isAdmin($authUser)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if ($authorshipRequest->status === 'APPROVED') {
            return response()->json($authorshipRequest->load('user'));
        }

        $authorshipRequest->status = 'APPROVED';
        $authorshipRequest->admin_comment = $authorshipRequest->admin_comment;
        $authorshipRequest->save();

        $user = $authorshipRequest->user;
        if ($user) {
            $badges = $user->badges ?? [];
            if (!in_array('ДИЗАЙНЕР', $badges, true)) {
                $badges[] = 'ДИЗАЙНЕР';
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
        $authUser = ApiAuth::user($request);
        if (!$authUser || !ApiAuth::isAdmin($authUser)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

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

    private function shortText(string $value, int $start, int $length): string
    {
        if (function_exists('mb_substr')) {
            return mb_substr($value, $start, $length);
        }

        return substr($value, $start, $length);
    }
}

