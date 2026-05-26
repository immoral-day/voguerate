<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file provided'], 400);
        }

        $file = $request->file('file');
        
        if (!$file->isValid()) {
            return response()->json(['error' => 'Invalid file'], 400);
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return response()->json(['error' => 'File is too large'], 422);
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return response()->json(['error' => 'Only images allowed'], 400);
        }

        $type = $request->input('type', 'general');
        if (in_array($type, ['item', 'drop'], true) && !in_array($user->role, ['ADMIN', 'DESIGNER'], true)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        if ($type === 'article' && !ApiAuth::isAdmin($user)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $folder = match($type) {
            'avatar' => 'avatars',
            'profile' => 'profiles',
            'item' => 'items',
            'drop' => 'drops',
            'article' => 'articles',
            default => 'uploads',
        };

        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs($folder, $filename, 'public');
        
        $relativePath = "/storage/{$folder}/{$filename}";
        return response()->json([
            'url' => $relativePath,
            'path' => $path,
            'relativePath' => $relativePath,
        ]);
    }

    public function delete(Request $request): JsonResponse
    {
        if (!ApiAuth::isAdmin($request->user())) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $path = $request->input('path');
        
        if (!$path || !Storage::disk('public')->exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        Storage::disk('public')->delete($path);
        
        return response()->json(['success' => true]);
    }
}
