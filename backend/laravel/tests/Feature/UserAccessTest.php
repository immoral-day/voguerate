<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_requires_matching_password_confirmation(): void
    {
        $this->postJson('/api/v1/users', [
            'username' => 'new_user',
            'email' => 'new@example.com',
            'password' => 'secret12',
            'password_confirmation' => 'different12',
        ])->assertUnprocessable();

        $this->postJson('/api/v1/users', [
            'username' => 'new_user',
            'email' => 'new@example.com',
            'password' => 'secret12',
            'password_confirmation' => 'secret12',
        ])->assertCreated();
    }

    public function test_permanent_ban_hides_user_and_explains_login_failure(): void
    {
        $admin = $this->createUser('admin_test', 'admin@example.com', 'ADMIN');
        $target = $this->createUser('blocked_test', 'blocked@example.com');
        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/users/{$target->id}/ban", [
            'days' => null,
            'permanent' => true,
            'reason' => 'Повторное нарушение правил',
            'reporterId' => $admin->id,
        ])
            ->assertOk()
            ->assertJsonPath('bannedPermanently', true)
            ->assertJsonPath('banReason', 'Повторное нарушение правил');

        $this->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonMissing(['id' => (string) $target->id]);

        $this->postJson('/api/v1/login', [
            'username' => $target->username,
            'password' => 'password',
        ])
            ->assertForbidden()
            ->assertJsonPath(
                'error',
                'Аккаунт заблокирован навсегда. Причина: Повторное нарушение правил'
            );
    }

    private function createUser(string $username, string $email, string $role = 'USER'): User
    {
        return User::create([
            'name' => $username,
            'username' => $username,
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => $role,
        ]);
    }
}
