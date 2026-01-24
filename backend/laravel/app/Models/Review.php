<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'clothing_item_id',
        'rating',
        'rating_breakdown',
        'text',
        'likes',
    ];

    protected function casts(): array
    {
        return [
            'rating_breakdown' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function clothingItem(): BelongsTo
    {
        return $this->belongsTo(ClothingItem::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(ReviewReport::class);
    }

    public function toArray(): array
    {
        $data = [
            'id' => (string) $this->id,
            'userId' => (string) $this->user_id,
            'clothingId' => (string) $this->clothing_item_id,
            'rating' => $this->rating,
            'ratingBreakdown' => $this->rating_breakdown,
            'text' => $this->text,
            'likes' => $this->likes,
            'date' => $this->created_at?->toDateString(),
            'comments' => [],
        ];

        if (array_key_exists('reports_count', $this->attributes)) {
            $data['reportsCount'] = $this->reports_count;
        }
        if ($this->relationLoaded('reports')) {
            $data['reportsCount'] = $this->reports->count();
        }

        if ($this->relationLoaded('user')) {
            $data['user'] = $this->user;
        }
        if ($this->relationLoaded('clothingItem')) {
            $data['clothing'] = $this->clothingItem;
        }
        if ($this->relationLoaded('comments')) {
            $data['comments'] = $this->comments->toArray();
        }

        return $data;
    }
}
