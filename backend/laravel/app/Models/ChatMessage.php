<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'recipient_id',
        'body',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'senderId' => (string) $this->sender_id,
            'recipientId' => (string) $this->recipient_id,
            'body' => $this->body,
            'readAt' => $this->read_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'sender' => $this->relationLoaded('sender') ? $this->sender : null,
            'recipient' => $this->relationLoaded('recipient') ? $this->recipient : null,
        ];
    }
}
