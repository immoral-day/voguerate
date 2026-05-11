<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        
        $response = ['message' => 'Если этот email зарегистрирован, вы получите письмо со ссылкой для сброса пароля'];

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            return response()->json($response);
        }

        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        $token = Str::random(64);
        DB::table('password_reset_tokens')->insert([
            'email'      => $data['email'],
            'token'      => Hash::make($token),
            'created_at' => now(),
        ]);

        $resetUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/')
            . '?reset_token=' . $token
            . '&email=' . urlencode($data['email']);

        try {
            Mail::send(
                'emails.reset-password',
                ['resetUrl' => $resetUrl, 'username' => $user->username],
                function ($m) use ($data) {
                    $m->to($data['email'])->subject('Сброс пароля — Voguerate');
                }
            );
        } catch (\Exception $e) {
            Log::error('Password reset email failed: ' . $e->getMessage());
        }

        return response()->json($response);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'token'    => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $data['email'])
            ->first();

        if (!$record || !Hash::check($data['token'], $record->token)) {
            return response()->json(['error' => 'Неверный или истёкший токен'], 422);
        }

        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $data['email'])->delete();
            return response()->json(['error' => 'Срок действия токена истёк. Запросите сброс пароля заново'], 422);
        }

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            return response()->json(['error' => 'Пользователь не найден'], 404);
        }

        $user->update(['password' => Hash::make($data['password'])]);
        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        return response()->json(['message' => 'Пароль успешно изменён. Теперь вы можете войти']);
    }

    public function changePassword(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'currentPassword' => 'required|string',
            'newPassword'     => 'required|string|min:6',
        ]);

        if (!Hash::check($data['currentPassword'], $user->password)) {
            return response()->json(['error' => 'Неверный текущий пароль'], 422);
        }

        $user->update(['password' => Hash::make($data['newPassword'])]);

        return response()->json(['message' => 'Пароль успешно изменён']);
    }
}
