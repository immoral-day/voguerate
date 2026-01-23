<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClothingItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'brand',
        'name',
        'image',
        'images',
        'release_date',
        'average_rating',
        'rating_count',
        'type',
        'category',
        'price',
        'tags',
        'sizes',
        'colors',
    ];

    protected function casts(): array
    {
        return [
            'release_date' => 'date',
            'images' => 'array',
            'tags' => 'array',
            'sizes' => 'array',
            'colors' => 'array',
        ];
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'brand' => $this->brand,
            'name' => $this->name,
            'image' => $this->image,
            'images' => $this->images ?? [],
            'releaseDate' => $this->release_date?->toDateString(),
            'averageRating' => $this->average_rating,
            'ratingCount' => $this->rating_count,
            'type' => $this->type,
            'category' => $this->category,
            'price' => $this->price,
            'tags' => $this->tags ?? [],
            'sizes' => $this->sizes ?? [],
            'colors' => $this->colors ?? [],
        ];
    }
}
