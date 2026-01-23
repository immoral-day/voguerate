<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Drop extends Model
{
    use HasFactory;

    protected $fillable = [
        'brand',
        'name',
        'image',
        'release_date',
        'price',
        'cop_count',
        'drop_count',
        'copped_by',
    ];

    protected function casts(): array
    {
        return [
            'release_date' => 'datetime',
            'copped_by' => 'array',
        ];
    }

    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'brand' => $this->brand,
            'name' => $this->name,
            'image' => $this->image,
            'releaseDate' => $this->release_date?->toIso8601String(),
            'price' => is_numeric($this->price) ? (int) $this->price : $this->price,
            'copCount' => $this->cop_count,
            'dropCount' => $this->drop_count,
            'coppedBy' => $this->copped_by ?? [],
        ];
    }
}
