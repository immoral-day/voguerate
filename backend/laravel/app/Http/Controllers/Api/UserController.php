<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(User::all());
    }

    public function show(User $user): JsonResponse
    {
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
}
