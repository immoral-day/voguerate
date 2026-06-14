<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
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
        'brand_name',
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
        'banned_permanently',
        'ban_reason',
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
            'banned_permanently' => 'boolean',
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

    public function scopeNotBanned(Builder $query): Builder
    {
        return $query
            ->where(function (Builder $visibility) use ($query) {
                $column = $query->qualifyColumn('banned_permanently');
                $visibility->whereNull($column)->orWhere($column, false);
            })
            ->where(function (Builder $visibility) use ($query) {
                $column = $query->qualifyColumn('banned_until');
                $visibility->whereNull($column)->orWhere($column, '<=', now());
            });
    }

    public function isBanned(): bool
    {
        return $this->banned_permanently
            || ($this->banned_until && $this->banned_until->isFuture());
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

    public function publishingBrand(): string
    {
        $brandName = trim((string) $this->brand_name);

        return $brandName !== '' ? $brandName : $this->username;
    }

    public function ownsBrand(string $brand): bool
    {
        $normalizedBrand = mb_strtolower(trim($brand));

        return in_array($normalizedBrand, [
            mb_strtolower(trim($this->username)),
            mb_strtolower($this->publishingBrand()),
        ], true);
    }

    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'username' => $this->username,
            'brandName' => $this->brand_name,
            'avatar' => $this->avatar,
            'profileBackground' => $this->profile_background,
            'reputation' => $this->reputation,
            'reviewsCount' => $this->reviews_count,
            'role' => $this->role,
            'bio' => $this->bio,
            'joinedDate' => $this->joined_date?->toDateString(),
            'favoriteDesigners' => $this->favorite_designers ?? [],
            'favorites' => $this->favorites ?? [],
            'wardrobe' => $this->wardrobe ?? ['owned' => [], 'wanted' => [], 'sold' => []],
            'badges' => $this->badges ?? [],
            'following' => $this->following ?? [],
            'followers' => $this->followers ?? [],
        ];
    }

    public function toSummaryArray(bool $includeModeration = false): array
    {
        $summary = [
            'id' => (string) $this->id,
            'username' => $this->username,
            'brandName' => $this->brand_name,
            'avatar' => $this->avatar,
            'profileBackground' => $this->profile_background,
            'reputation' => $this->reputation,
            'reviewsCount' => $this->reviews_count,
            'role' => $this->role,
            'bio' => $this->bio,
            'joinedDate' => $this->joined_date?->toDateString(),
            'badges' => $this->badges ?? [],
            'favoriteDesigners' => [],
            'favorites' => [],
            'wardrobe' => ['owned' => [], 'wanted' => [], 'sold' => []],
            'following' => [],
            'followers' => [],
            'isSummary' => true,
        ];

        if ($includeModeration) {
            $summary['bannedUntil'] = $this->banned_until?->toDateTimeString();
            $summary['bannedPermanently'] = $this->banned_permanently;
            $summary['banReason'] = $this->ban_reason;
        }

        return $summary;
    }

    public function toModerationArray(): array
    {
        return array_merge($this->toArray(), [
            'bannedUntil' => $this->banned_until?->toDateTimeString(),
            'bannedPermanently' => $this->banned_permanently,
            'banReason' => $this->ban_reason,
        ]);
    }
}
