<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file provided'], 400);
        }

        $file = $request->file('file');
        
        if (!$file->isValid()) {
            return response()->json(['error' => 'Invalid file'], 400);
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return response()->json(['error' => 'Only images allowed'], 400);
        }

        $type = $request->input('type', 'general');
        $folder = match($type) {
            'avatar' => 'avatars',
            'item' => 'items',
            'drop' => 'drops',
            default => 'uploads',
        };

        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs($folder, $filename, 'public');
        
        $relativePath = "/storage/{$folder}/{$filename}";
        $url = "http://localhost:8080{$relativePath}";

        return response()->json([
            'url' => $url,
            'path' => $path,
            'relativePath' => $relativePath,
        ]);
    }

    public function delete(Request $request): JsonResponse
    {
        $path = $request->input('path');
        
        if (!$path || !Storage::exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        Storage::delete($path);
        
        return response()->json(['success' => true]);
    }
}
