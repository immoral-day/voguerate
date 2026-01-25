<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\UserReport;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $includeBanned = request()->boolean('includeBanned');
        $query = User::query();
        if (!$includeBanned) {
            $query->where(function ($q) {
                $q->whereNull('banned_until')
                    ->orWhere('banned_until', '<=', now());
            });
        }

        return response()->json($query->get());
    }

    public function show(User $user): JsonResponse
    {
        if ($user->banned_until && $user->banned_until->isFuture() && !request()->boolean('includeBanned')) {
            return response()->json(['error' => 'User not found'], 404);
        }
        return response()->json($user);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $data['username'])
            ->orWhere('email', $data['username'])
            ->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['error' => 'Неверный логин или пароль'], 401);
        }

        if ($user->banned_until && $user->banned_until->isFuture()) {
            return response()->json(['error' => 'Пользователь заблокирован'], 403);
        }

        return response()->json($user);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'username' => 'required|string|unique:users',
                'email' => 'required|email|unique:users',
                'password' => 'required|string|min:6',
                'avatar' => 'nullable|string',
                'bio' => 'nullable|string',
                'role' => 'nullable|in:USER,DESIGNER,ADMIN',
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
            'role' => $isFirstUser ? 'ADMIN' : ($data['role'] ?? 'USER'),
            'reputation' => 0,
            'reviews_count' => 0,
            'joined_date' => now(),
            'favorite_designers' => [],
            'favorites' => [],
            'wardrobe' => ['owned' => [], 'wanted' => [], 'sold' => []],
            'badges' => $isFirstUser ? ['ADMIN'] : [],
            'following' => [],
            'followers' => [],
        ]);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
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
        if (isset($data['role'])) $updateData['role'] = $data['role'];
        if (isset($data['favoriteDesigners'])) $updateData['favorite_designers'] = $data['favoriteDesigners'];
        if (isset($data['favorites'])) $updateData['favorites'] = $data['favorites'];
        if (isset($data['wardrobe'])) $updateData['wardrobe'] = $data['wardrobe'];
        if (isset($data['badges'])) $updateData['badges'] = $data['badges'];
        if (isset($data['following'])) $updateData['following'] = $data['following'];
        if (isset($data['followers'])) $updateData['followers'] = $data['followers'];

        $user->update($updateData);
        return response()->json($user->fresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();
        return response()->json(null, 204);
    }

    public function report(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'reporterId' => 'required|exists:users,id',
            'reason' => 'required|string|min:3',
        ]);

        if ((string) $data['reporterId'] === (string) $user->id) {
            return response()->json(['error' => 'Нельзя репортить себя'], 400);
        }

        $exists = UserReport::where('reported_user_id', $user->id)
            ->where('reporter_id', $data['reporterId'])
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Вы уже отправляли репорт'], 400);
        }

        UserReport::create([
            'reported_user_id' => $user->id,
            'reporter_id' => $data['reporterId'],
            'reason' => $data['reason'],
        ]);

        return response()->json(['success' => true]);
    }

    public function ban(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'days' => 'required|integer|min:1|max:365',
            'reporterId' => 'nullable|exists:users,id',
        ]);

        if (isset($data['reporterId']) && (string) $data['reporterId'] === (string) $user->id) {
            return response()->json(['error' => 'Нельзя банить себя'], 400);
        }

        $user->update([
            'banned_until' => now()->addDays($data['days']),
        ]);

        return response()->json($user->fresh());
    }

    public function verify(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'verified' => 'required|boolean',
        ]);

        $badges = $user->badges ?? [];
        $hasVerified = in_array('VERIFIED', $badges, true);

        if ($data['verified'] && !$hasVerified) {
            $badges[] = 'VERIFIED';
        }
        if (!$data['verified'] && $hasVerified) {
            $badges = array_values(array_filter($badges, fn ($b) => $b !== 'VERIFIED'));
        }

        $user->update(['badges' => $badges]);

        return response()->json($user->fresh());
    }
}
