<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuthorshipRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'brand_name',
        'description',
        'reason',
        'message',
        'portfolio_link',
        'admin_comment',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'userId' => (string) $this->user_id,
            'status' => $this->status,
            'brandName' => $this->brand_name,
            'description' => $this->description,
            'message' => $this->message,
            'portfolioLink' => $this->portfolio_link,
            'adminComment' => $this->admin_comment,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'user' => $this->user ? $this->user->toArray() : null,
        ];
    }
}

