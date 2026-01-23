<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'review_id',
        'text',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }

    public function toArray(): array
    {
        $data = [
            'id' => (string) $this->id,
            'userId' => (string) $this->user_id,
            'text' => $this->text,
            'date' => $this->created_at?->toDateString(),
        ];

        if ($this->relationLoaded('user')) {
            $data['user'] = $this->user;
        }

        return $data;
    }
}
