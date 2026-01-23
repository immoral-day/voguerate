<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'username',
        'avatar',
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
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'email_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'joined_date' => 'date',
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

    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'username' => $this->username,
            'avatar' => $this->avatar,
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
}
