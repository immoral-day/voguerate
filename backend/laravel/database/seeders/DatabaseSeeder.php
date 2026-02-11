<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\ClothingItem;
use App\Models\Drop;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (User::where('username', 'admin')->doesntExist()) {
            User::create([
                'name' => 'Admin',
                'username' => 'admin',
                'email' => 'admin@voguerate.com',
                'password' => Hash::make('admin123'),
                'role' => 'ADMIN',
                'reputation' => 1000,
                'reviews_count' => 0,
                'bio' => 'System Administrator',
                'joined_date' => now(),
                'favorite_designers' => [],
                'favorites' => [],
                'wardrobe' => ['owned' => [], 'wanted' => [], 'sold' => []],
                'badges' => ['АДМИН', 'ВЕРИФИЦИРОВАН'],
                'following' => [],
                'followers' => [],
            ]);
        }

        if (ClothingItem::count() === 0) {
            $items = [
                ['brand' => 'Balenciaga', 'name' => 'Oversized Layered Parka', 'category' => 'Luxury', 'price' => 3200, 'tags' => ['Oversized', 'Winter'], 'sizes' => ['44', '46', '48', '50'], 'colors' => ['Black', 'Navy']],
                ['brand' => "Arc'teryx", 'name' => 'Alpha SV Jacket', 'category' => 'Techwear', 'price' => 900, 'tags' => ['Gore-Tex', 'Waterproof'], 'sizes' => ['S', 'M', 'L', 'XL'], 'colors' => ['Black', 'Alpha Gold', 'Orca']],
                ['brand' => 'Stüssy', 'name' => "Big Ol' Jeans", 'category' => 'Streetwear', 'price' => 160, 'tags' => ['Baggy', 'Denim'], 'sizes' => ['28', '30', '32', '34', '36'], 'colors' => ['Blue', 'Black']],
                ['brand' => 'Rick Owens', 'name' => 'Geobasket Sneakers', 'category' => 'Luxury', 'price' => 1100, 'tags' => ['High-top', 'Leather'], 'sizes' => ['39', '40', '41', '42', '43', '44'], 'colors' => ['Black/Milk', 'Milk/Black']],
                ['brand' => 'Carhartt WIP', 'name' => 'Detroit Jacket', 'category' => 'Streetwear', 'price' => 240, 'tags' => ['Workwear', 'Canvas'], 'sizes' => ['S', 'M', 'L', 'XL', 'XXL'], 'colors' => ['Hamilton Brown', 'Black']],
                ['brand' => 'Prada', 'name' => 'Re-Nylon Shirt', 'category' => 'Luxury', 'price' => 1400, 'tags' => ['Nylon', 'Formal'], 'sizes' => ['S', 'M', 'L'], 'colors' => ['Black']],
                ['brand' => 'Supreme', 'name' => 'Box Logo Hoodie', 'category' => 'Streetwear', 'price' => 168, 'tags' => ['Hype', 'Hoodie'], 'sizes' => ['S', 'M', 'L', 'XL'], 'colors' => ['Grey', 'Red']],
                ['brand' => 'Stone Island', 'name' => 'Crinkle Reps Down Jacket', 'category' => 'Techwear', 'price' => 950, 'tags' => ['Outerwear', 'Down'], 'sizes' => ['S', 'M', 'L', 'XL', 'XXL'], 'colors' => ['Sage Green']],
            ];
            
            foreach ($items as $i => $item) {
                ClothingItem::create([
                    'brand' => $item['brand'],
                    'name' => $item['name'],
                    'image' => "https://picsum.photos/seed/item{$i}/400/500",
                    'images' => [],
                    'release_date' => now()->subDays(rand(30, 365)),
                    'average_rating' => rand(70, 95),
                    'rating_count' => rand(50, 500),
                    'type' => 'SINGLE_LOOK',
                    'category' => $item['category'],
                    'price' => $item['price'],
                    'tags' => $item['tags'],
                    'sizes' => $item['sizes'],
                    'colors' => $item['colors'],
                ]);
            }
        }

        if (Drop::count() === 0) {
            Drop::create([
                'brand' => 'Nike',
                'name' => 'Air Max 2026 Collection',
                'image' => 'https://picsum.photos/seed/drop1/400/500',
                'release_date' => now()->addDays(7),
                'cop_count' => 0,
                'drop_count' => 0,
            ]);
            Drop::create([
                'brand' => 'Adidas',
                'name' => 'Yeezy Boost 350 V3',
                'image' => 'https://picsum.photos/seed/drop2/400/500',
                'release_date' => now()->addDays(14),
                'cop_count' => 0,
                'drop_count' => 0,
            ]);
        }
    }
}
