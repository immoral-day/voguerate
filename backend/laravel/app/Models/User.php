<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'username',
        'avatar',
        'profile_background',
        'reputation',
        'reviews_count',
        'role',
        'bio',
        'joined_date',
        'favorite_designers',
        'favorites',
        'wardrobe',
        'badges',
        'following',
        'followers',
        'banned_until',
        'api_token_hash',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'api_token_hash',
        'email_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'joined_date' => 'date',
            'banned_until' => 'datetime',
            'favorite_designers' => 'array',
            'favorites' => 'array',
            'wardrobe' => 'array',
            'badges' => 'array',
            'following' => 'array',
            'followers' => 'array',
        ];
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function authorshipRequests(): HasMany
    {
        return $this->hasMany(AuthorshipRequest::class);
    }

    public function sentChatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'sender_id');
    }

    public function receivedChatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'recipient_id');
    }

    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'username' => $this->username,
            'avatar' => $this->avatar,
            'profileBackground' => $this->profile_background,
            'reputation' => $this->reputation,
            'reviewsCount' => $this->reviews_count,
            'role' => $this->role,
            'bio' => $this->bio,
            'joinedDate' => $this->joined_date?->toDateString(),
            'bannedUntil' => $this->banned_until?->toDateTimeString(),
            'favoriteDesigners' => $this->favorite_designers ?? [],
            'favorites' => $this->favorites ?? [],
            'wardrobe' => $this->wardrobe ?? ['owned' => [], 'wanted' => [], 'sold' => []],
            'badges' => $this->badges ?? [],
            'following' => $this->following ?? [],
            'followers' => $this->followers ?? [],
        ];
    }

    public function toSummaryArray(): array
    {
        return [
            'id' => (string) $this->id,
            'username' => $this->username,
            'avatar' => $this->avatar,
            'profileBackground' => $this->profile_background,
            'reputation' => $this->reputation,
            'reviewsCount' => $this->reviews_count,
            'role' => $this->role,
            'bio' => $this->bio,
            'joinedDate' => $this->joined_date?->toDateString(),
            'bannedUntil' => $this->banned_until?->toDateTimeString(),
            'badges' => $this->badges ?? [],
            'favoriteDesigners' => [],
            'favorites' => [],
            'wardrobe' => ['owned' => [], 'wanted' => [], 'sold' => []],
            'following' => [],
            'followers' => [],
            'isSummary' => true,
        ];
    }
}
