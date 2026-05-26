<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

class ApiAuth
{
    public static function user(Request $request): ?User
    {
        $userId = (int) $request->header('X-User-Id', 0);
        $token = (string) $request->header('X-Auth-Token', '');

        if ($userId <= 0 || $token === '') {
            return null;
        }

        $user = User::find($userId);
        if (!$user || !$user->api_token_hash) {
            return null;
        }

        if (!hash_equals((string) $user->api_token_hash, hash('sha256', $token))) {
            return null;
        }

        if ($user->banned_until && $user->banned_until->isFuture()) {
            return null;
        }

        return $user;
    }

    public static function isAdmin(User $user): bool
    {
        return $user->role === 'ADMIN';
    }
}
