<?php

namespace Tests\Feature;

use App\Models\ChatMessage;
use App\Models\ClothingItem;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileAndChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_endpoint_returns_user_and_their_reviews(): void
    {
        $user = $this->createUser('profile_user', 'profile@example.com');
        $item = ClothingItem::create([
            'brand' => 'Test Brand',
            'name' => 'Test Item',
            'image' => '/storage/items/test.webp',
            'release_date' => now()->toDateString(),
            'average_rating' => 75,
            'rating_count' => 1,
            'type' => 'SINGLE_LOOK',
            'category' => 'Streetwear',
            'price' => 1000,
        ]);
        $review = Review::create([
            'user_id' => $user->id,
            'clothing_item_id' => $item->id,
            'rating' => 75,
            'text' => 'Подробная тестовая рецензия.',
            'likes' => 0,
        ]);

        $this->getJson("/api/v1/profiles/{$user->id}")
            ->assertOk()
            ->assertJsonPath('user.id', (string) $user->id)
            ->assertJsonPath('reviews.0.id', (string) $review->id)
            ->assertJsonPath('reviews.0.userId', (string) $user->id);
    }

    public function test_chat_conversation_contains_peer_without_bootstrap_user_list(): void
    {
        $currentUser = $this->createUser('chat_owner', 'owner@example.com');
        $peer = $this->createUser('chat_peer', 'peer@example.com');
        $message = ChatMessage::create([
            'sender_id' => $peer->id,
            'recipient_id' => $currentUser->id,
            'body' => 'Сохранённое сообщение',
        ]);

        Sanctum::actingAs($currentUser);

        $this->getJson('/api/v1/chats')
            ->assertOk()
            ->assertJsonPath('0.otherUser.id', (string) $peer->id)
            ->assertJsonPath('0.otherUser.username', $peer->username)
            ->assertJsonPath('0.lastMessage.id', (string) $message->id);

        $this->getJson("/api/v1/chats/{$peer->id}/messages?markRead=0")
            ->assertOk()
            ->assertJsonPath('0.body', 'Сохранённое сообщение');
    }

    private function createUser(string $username, string $email): User
    {
        return User::create([
            'name' => $username,
            'username' => $username,
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => 'USER',
        ]);
    }
}
