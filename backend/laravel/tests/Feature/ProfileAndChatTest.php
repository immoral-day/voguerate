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

    public function test_bootstrap_returns_every_visible_user_without_cache(): void
    {
        $reviewAuthor = $this->createUser('visible_one', 'visible-one@example.com');
        $this->createUser('visible_two', 'visible-two@example.com');
        $blocked = $this->createUser('blocked_user', 'blocked@example.com');
        $blocked->update(['banned_permanently' => true]);
        $item = $this->createItem();
        $review = Review::create([
            'user_id' => $reviewAuthor->id,
            'clothing_item_id' => $item->id,
            'rating' => 80,
            'text' => 'Рецензия загружается вместе с bootstrap.',
            'likes' => 0,
        ]);

        $response = $this->getJson('/api/v1/bootstrap')
            ->assertOk()
            ->assertHeader('X-Bootstrap-Users', '2')
            ->assertJsonCount(2, 'users')
            ->assertJsonCount(1, 'items')
            ->assertJsonCount(1, 'reviews')
            ->assertJsonPath('reviews.0.id', (string) $review->id)
            ->assertJsonPath('reviews.0.userId', (string) $reviewAuthor->id)
            ->assertJsonPath('reviews.0.clothingId', (string) $item->id);

        $this->assertStringContainsString(
            'no-store',
            (string) $response->headers->get('Cache-Control'),
        );
    }

    public function test_health_endpoint_checks_database_connection(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertExactJson([
                'ok' => true,
                'database' => true,
            ]);
    }

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

    public function test_chat_returns_recent_page_and_incremental_messages(): void
    {
        $currentUser = $this->createUser('chat_page_owner', 'page-owner@example.com');
        $peer = $this->createUser('chat_page_peer', 'page-peer@example.com');

        for ($index = 1; $index <= 90; $index++) {
            ChatMessage::create([
                'sender_id' => $index % 2 === 0 ? $currentUser->id : $peer->id,
                'recipient_id' => $index % 2 === 0 ? $peer->id : $currentUser->id,
                'body' => "Message {$index}",
            ]);
        }

        Sanctum::actingAs($currentUser);

        $page = $this->getJson("/api/v1/chats/{$peer->id}/messages?markRead=0")
            ->assertOk()
            ->assertJsonCount(80);

        $lastId = (int) $page->json('79.id');
        $newMessage = ChatMessage::create([
            'sender_id' => $peer->id,
            'recipient_id' => $currentUser->id,
            'body' => 'New incremental message',
        ]);

        $this->getJson("/api/v1/chats/{$peer->id}/messages?markRead=0&afterId={$lastId}")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', (string) $newMessage->id)
            ->assertJsonPath('0.body', 'New incremental message');
    }

    public function test_review_like_endpoints_return_small_idempotent_payloads(): void
    {
        $author = $this->createUser('review_author', 'review-author@example.com');
        $liker = $this->createUser('review_liker', 'review-liker@example.com');
        $review = Review::create([
            'user_id' => $author->id,
            'clothing_item_id' => $this->createItem()->id,
            'rating' => 70,
            'text' => 'Рецензия для проверки лёгкого ответа лайка.',
            'likes' => 0,
        ]);

        Sanctum::actingAs($liker);

        $expectedLiked = [
            'review_id' => (string) $review->id,
            'likes' => 1,
            'liked' => true,
        ];

        $this->postJson("/api/v1/reviews/{$review->id}/like")
            ->assertOk()
            ->assertExactJson($expectedLiked);

        $this->postJson("/api/v1/reviews/{$review->id}/like")
            ->assertOk()
            ->assertExactJson($expectedLiked);

        $expectedUnliked = [
            'review_id' => (string) $review->id,
            'likes' => 0,
            'liked' => false,
        ];

        $this->deleteJson("/api/v1/reviews/{$review->id}/like")
            ->assertOk()
            ->assertExactJson($expectedUnliked);

        $this->deleteJson("/api/v1/reviews/{$review->id}/like")
            ->assertOk()
            ->assertExactJson($expectedUnliked);
    }

    private function createItem(): ClothingItem
    {
        return ClothingItem::create([
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
