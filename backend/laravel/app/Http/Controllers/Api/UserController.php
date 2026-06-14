<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\User;
use App\Support\ApiAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\UserReport;
use Illuminate\Validation\ValidationException;
use Throwable;

class UserController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function index(Request $request): JsonResponse
    {
        $includeBanned = $request->boolean('includeBanned');
        if ($includeBanned && !ApiAuth::isAdmin(ApiAuth::user($request))) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $columns = [
            'id',
            'username',
            'brand_name',
            'avatar',
            'profile_background',
            'reputation',
            'reviews_count',
            'role',
            'bio',
            'joined_date',
            'badges',
        ];
        if ($includeBanned) {
            array_push($columns, 'banned_until', 'banned_permanently', 'ban_reason');
        }

        $query = User::query()->select($columns);
        if (!$includeBanned) {
            $query->notBanned();
        }

        $defaultLimit = $includeBanned ? 500 : 200;
        $limit = min(500, max(1, $request->integer('limit', $defaultLimit)));
        $users = $query->limit($limit)->get();

        $payload = $users->map(
            fn (User $user) => $user->toSummaryArray($includeBanned)
        );

        return response()->json($payload)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('X-Total-Users', (string) User::query()->count())
            ->header('X-Visible-Users', (string) $payload->count());
    }

    public function show(User $user): JsonResponse
    {
        if ($user->isBanned() && !request()->boolean('includeBanned')) {
            return response()->json(['error' => 'User not found'], 404);
        }
        return response()->json($user);
    }

    public function profile(User $user): JsonResponse
    {
        if ($user->isBanned()) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $reviews = Review::query()
            ->select([
                'id',
                'user_id',
                'clothing_item_id',
                'rating',
                'rating_breakdown',
                'text',
                'likes',
                'created_at',
            ])
            ->where('user_id', $user->id)
            ->latest()
            ->limit(500)
            ->get();

        return response()->json([
            'user' => $user->toArray(),
            'reviews' => $reviews,
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);
        $data['username'] = trim($data['username']);

        $user = User::where('username', $data['username'])
            ->orWhere('email', $data['username'])
            ->first();
        if (!$user || !is_string($user->password) || $user->password === '') {
            return response()->json(['error' => 'Неверный логин или пароль'], 401);
        }

        try {
            if (!Hash::check($data['password'], $user->password)) {
                return response()->json(['error' => 'Неверный логин или пароль'], 401);
            }
        } catch (Throwable) {
            return response()->json(['error' => 'Неверный логин или пароль'], 401);
        }

        if ($user->isBanned()) {
            $period = $user->banned_permanently
                ? 'навсегда'
                : 'до ' . $user->banned_until->format('d.m.Y H:i');
            $reason = trim((string) $user->ban_reason);

            return response()->json([
                'error' => 'Аккаунт заблокирован ' . $period
                    . ($reason !== '' ? '. Причина: ' . $reason : '.'),
            ], 403);
        }

        return response()->json($this->issueAuthToken($user));
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'username' => 'required|string|unique:users',
                'email' => 'required|email|unique:users',
                'password' => 'required|string|min:6|confirmed',
                'avatar' => 'nullable|string',
                'bio' => 'nullable|string',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $isFirstUser = User::count() === 0;

        $user = User::create([
            'name' => $data['username'],
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'avatar' => $data['avatar'] ?? null,
            'bio' => $data['bio'] ?? null,
            'role' => $isFirstUser ? 'ADMIN' : 'USER',
            'reputation' => 0,
            'reviews_count' => 0,
            'joined_date' => now(),
            'favorite_designers' => [],
            'favorites' => [],
            'wardrobe' => ['owned' => [], 'wanted' => [], 'sold' => []],
            'badges' => $isFirstUser ? ['АДМИН'] : [],
            'following' => [],
            'followers' => [],
        ]);

        return response()->json($this->issueAuthToken($user), 201);
    }

    private function issueAuthToken(User $user): array
    {
        return array_merge($user->fresh()->toArray(), [
            'authToken' => ApiAuth::issueToken($user),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        if (!ApiAuth::isAdmin($authUser) && (int) $authUser->id !== (int) $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        try {
            $data = $request->validate([
                'username' => 'sometimes|string|unique:users,username,' . $user->id,
                'avatar' => 'nullable|string',
                'profileBackground' => 'nullable|string',
                'bio' => 'nullable|string',
                'role' => 'nullable|in:USER,DESIGNER,ADMIN',
                'favoriteDesigners' => 'nullable|array',
                'favorites' => 'nullable|array',
                'wardrobe' => 'nullable|array',
                'badges' => 'nullable|array',
                'following' => 'nullable|array',
                'followers' => 'nullable|array',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $updateData = [];
        if (isset($data['username'])) $updateData['username'] = $data['username'];
        if (array_key_exists('avatar', $data)) $updateData['avatar'] = $data['avatar'];
        if (array_key_exists('profileBackground', $data)) $updateData['profile_background'] = $data['profileBackground'];
        if (array_key_exists('bio', $data)) $updateData['bio'] = $data['bio'];
        if (isset($data['role']) && ApiAuth::isAdmin($authUser)) {
            if ((int) $authUser->id === (int) $user->id && $data['role'] !== 'ADMIN') {
                return response()->json(['error' => 'Cannot remove your own admin role'], 422);
            }

            $updateData['role'] = $data['role'];
        }
        if (isset($data['favoriteDesigners'])) $updateData['favorite_designers'] = $data['favoriteDesigners'];
        if (isset($data['favorites'])) $updateData['favorites'] = $data['favorites'];
        if (isset($data['wardrobe'])) $updateData['wardrobe'] = $data['wardrobe'];
        if (isset($data['badges']) && ApiAuth::isAdmin($authUser)) {
            $allowed = ['АДМИН', 'ВЕРИФИЦИРОВАН', 'ДИЗАЙНЕР'];
            $updateData['badges'] = array_values(array_unique(array_filter(
                $data['badges'],
                fn ($b) => is_string($b) && in_array($b, $allowed, true)
            )));
        }
        if (isset($data['following'])) $updateData['following'] = $data['following'];
        if (isset($data['followers'])) $updateData['followers'] = $data['followers'];

        $user->update($updateData);
        $updatedUser = $user->fresh();

        return response()->json(
            ApiAuth::isAdmin($authUser) ? $updatedUser->toModerationArray() : $updatedUser
        );
    }

    public function destroy(User $user): JsonResponse
    {
        $authUser = ApiAuth::user(request());
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        if (!ApiAuth::isAdmin($authUser) && (int) $authUser->id !== (int) $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user->delete();
        return response()->json(null, 204);
    }

    public function report(Request $request, User $user): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'reason' => 'required|string|min:3',
        ]);

        if ((int) $authUser->id === (int) $user->id) {
            return response()->json(['error' => 'Нельзя репортить себя'], 400);
        }

        $exists = UserReport::where('reported_user_id', $user->id)
            ->where('reporter_id', $authUser->id)
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Вы уже отправляли репорт'], 400);
        }

        UserReport::create([
            'reported_user_id' => $user->id,
            'reporter_id' => $authUser->id,
            'reason' => $data['reason'],
        ]);

        return response()->json(['success' => true]);
    }

    public function ban(Request $request, User $user): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser || !ApiAuth::isAdmin($authUser)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'days' => 'nullable|required_unless:permanent,true|integer|min:1|max:365',
            'permanent' => 'required|boolean',
            'reason' => 'required|string|min:3|max:500',
            'reporterId' => 'nullable|exists:users,id',
        ]);

        if (isset($data['reporterId']) && (string) $data['reporterId'] === (string) $user->id) {
            return response()->json(['error' => 'Нельзя банить себя'], 400);
        }

        $user->update([
            'banned_until' => $data['permanent'] ? null : now()->addDays($data['days']),
            'banned_permanently' => $data['permanent'],
            'ban_reason' => trim($data['reason']),
        ]);

        return response()->json($user->fresh()->toModerationArray());
    }

    public function unban(Request $request, User $user): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser || !ApiAuth::isAdmin($authUser)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $user->update([
            'banned_until' => null,
            'banned_permanently' => false,
            'ban_reason' => null,
        ]);

        return response()->json($user->fresh()->toModerationArray());
    }

    public function verify(Request $request, User $user): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser || !ApiAuth::isAdmin($authUser)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'verified' => 'required|boolean',
        ]);

        $badges = $user->badges ?? [];
        $hasVerified = in_array('ВЕРИФИЦИРОВАН', $badges, true);

        if ($data['verified'] && !$hasVerified) {
            $badges[] = 'ВЕРИФИЦИРОВАН';
        }
        if (!$data['verified'] && $hasVerified) {
            $badges = array_values(array_filter($badges, fn ($b) => $b !== 'ВЕРИФИЦИРОВАН'));
        }

        $user->update(['badges' => $badges]);

        return response()->json($user->fresh());
    }
}
