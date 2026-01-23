<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClothingItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ClothingItemController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ClothingItem::all());
    }

    public function show(ClothingItem $item): JsonResponse
    {
        return response()->json($item);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'brand' => 'required|string',
                'name' => 'required|string',
                'image' => 'required|string',
                'images' => 'nullable|array',
                'releaseDate' => 'required|date',
                'type' => 'required|in:SINGLE_LOOK,COLLECTION',
                'category' => 'required|in:Streetwear,Luxury,Techwear,Vintage',
                'price' => 'required|integer',
                'tags' => 'nullable|array',
                'sizes' => 'nullable|array',
                'colors' => 'nullable|array',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $item = ClothingItem::create([
            'brand' => $data['brand'],
            'name' => $data['name'],
            'image' => $data['image'],
            'images' => $data['images'] ?? [],
            'release_date' => $data['releaseDate'],
            'type' => $data['type'],
            'category' => $data['category'],
            'price' => $data['price'],
            'tags' => $data['tags'] ?? [],
            'sizes' => $data['sizes'] ?? [],
            'colors' => $data['colors'] ?? [],
            'average_rating' => 0,
            'rating_count' => 0,
        ]);

        return response()->json($item, 201);
    }

    public function update(Request $request, ClothingItem $item): JsonResponse
    {
        try {
            $data = $request->validate([
                'brand' => 'sometimes|string',
                'name' => 'sometimes|string',
                'image' => 'sometimes|string',
                'images' => 'nullable|array',
                'releaseDate' => 'sometimes|date',
                'type' => 'sometimes|in:SINGLE_LOOK,COLLECTION',
                'category' => 'sometimes|in:Streetwear,Luxury,Techwear,Vintage',
                'price' => 'sometimes|integer',
                'tags' => 'nullable|array',
                'sizes' => 'nullable|array',
                'colors' => 'nullable|array',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $updateData = [];
        foreach (['brand', 'name', 'image', 'images', 'type', 'category', 'price', 'tags', 'sizes', 'colors'] as $field) {
            if (isset($data[$field])) $updateData[$field] = $data[$field];
        }
        if (isset($data['releaseDate'])) $updateData['release_date'] = $data['releaseDate'];

        $item->update($updateData);
        return response()->json($item);
    }

    public function destroy(ClothingItem $item): JsonResponse
    {
        $item->delete();
        return response()->json(null, 204);
    }
}
