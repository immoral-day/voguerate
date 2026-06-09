<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

class ApiAuth
{
    public static function user(Request $request): ?User
    {
        $user = $request->user();
        if (!$user instanceof User) {
            return null;
        }

        if ($user->isBanned()) {
            return null;
        }

        return $user;
    }

    public static function issueToken(User $user): string
    {
        $user->tokens()->delete();

        return $user
            ->createToken('web', ['*'], now()->addDays(14))
            ->plainTextToken;
    }

    public static function isAdmin(?User $user): bool
    {
        return $user?->role === 'ADMIN';
    }
}
