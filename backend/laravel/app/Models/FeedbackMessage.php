<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'message',
        'page',
        'ip_address',
        'user_agent',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'userId' => $this->user_id ? (string) $this->user_id : null,
            'message' => $this->message,
            'page' => $this->page,
            'createdAt' => $this->created_at?->toIso8601String(),
            'user' => $this->relationLoaded('user') ? $this->user : null,
        ];
    }
}
