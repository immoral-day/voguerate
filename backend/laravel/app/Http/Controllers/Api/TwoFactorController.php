<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TwoFactorCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TwoFactorController extends Controller
{
    
    public function enable(User $user): JsonResponse
    {
        $user->update(['two_factor_confirmed_at' => now()]);

        return response()->json([
            'message'          => 'Двухфакторная аутентификация через email включена',
            'twoFactorEnabled' => true,
        ]);
    }

    
    public function disable(User $user): JsonResponse
    {
        $user->update(['two_factor_confirmed_at' => null]);
        TwoFactorCode::where('user_id', $user->id)->delete();

        return response()->json([
            'message'          => 'Двухфакторная аутентификация отключена',
            'twoFactorEnabled' => false,
        ]);
    }

    /
    public static function sendCode(User $user): void
    {
        
        TwoFactorCode::where('user_id', $user->id)->delete();

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        TwoFactorCode::create([
            'user_id'    => $user->id,
            'code'       => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::send(
                'emails.two-factor-code',
                ['code' => $code, 'username' => $user->username],
                function ($m) use ($user) {
                    $m->to($user->email)->subject('Код входа — Voguerate');
                }
            );
        } catch (\Exception $e) {
            Log::error('2FA email failed: ' . $e->getMessage());
        }
    }

    
    public function verify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'userId' => 'required',
            'code'   => 'required|string|size:6',
        ]);

        $user = User::find($data['userId']);
        if (!$user) {
            return response()->json(['error' => 'Пользователь не найден'], 404);
        }

        $record = TwoFactorCode::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        if (!$record) {
            return response()->json(['error' => 'Код не найден. Попробуйте войти снова'], 422);
        }

        if ($record->isExpired()) {
            $record->delete();
            return response()->json(['error' => 'Код устарел. Попробуйте войти снова'], 422);
        }

        if (!Hash::check($data['code'], $record->code)) {
            return response()->json(['error' => 'Неверный код'], 422);
        }

        $record->delete();

        return response()->json($user);
    }
}
