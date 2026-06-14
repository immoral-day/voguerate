<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drop;
use App\Support\ApiAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DropController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Drop::orderBy('release_date', 'desc')->get());
    }

    public function show(Drop $drop): JsonResponse
    {
        return response()->json($drop);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$this->canPublish($authUser)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        try {
            $data = $request->validate([
                'brand' => ApiAuth::isAdmin($authUser) ? 'required|string' : 'nullable|string',
                'name' => 'required|string',
                'image' => 'required|string',
                'releaseDate' => 'required|date',
                'price' => 'nullable',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $drop = Drop::create([
            'brand' => ApiAuth::isAdmin($authUser) ? $data['brand'] : $authUser->publishingBrand(),
            'name' => $data['name'],
            'image' => $data['image'],
            'release_date' => $data['releaseDate'],
            'price' => $data['price'] ?? 'TBA',
            'cop_count' => 0,
            'drop_count' => 0,
        ]);

        return response()->json($drop, 201);
    }

    public function update(Request $request, Drop $drop): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$this->canManage($authUser, $drop->brand)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        try {
            $data = $request->validate([
                'brand' => 'sometimes|string',
                'name' => 'sometimes|string',
                'image' => 'sometimes|string',
                'releaseDate' => 'sometimes|date',
                'price' => 'nullable',
                'copCount' => 'sometimes|integer',
                'dropCount' => 'sometimes|integer',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $updateData = [];
        foreach (['brand', 'name', 'image', 'price'] as $field) {
            if (isset($data[$field])) $updateData[$field] = $data[$field];
        }
        if (!ApiAuth::isAdmin($authUser)) {
            unset($updateData['brand']);
        }
        if (isset($data['releaseDate'])) $updateData['release_date'] = $data['releaseDate'];
        if (isset($data['copCount'])) $updateData['cop_count'] = $data['copCount'];
        if (isset($data['dropCount'])) $updateData['drop_count'] = $data['dropCount'];

        $drop->update($updateData);
        return response()->json($drop);
    }

    public function destroy(Drop $drop): JsonResponse
    {
        $authUser = ApiAuth::user(request());
        if (!$this->canManage($authUser, $drop->brand)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $drop->delete();
        return response()->json(null, 204);
    }

    public function cop(Request $request, Drop $drop): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $userId = (string) $authUser->id;
        $coppedBy = $drop->copped_by ?? [];
        if (in_array($userId, $coppedBy)) {
            return response()->json(['error' => 'Вы уже ждёте этот релиз'], 400);
        }

        $coppedBy[] = $userId;
        $drop->update([
            'copped_by' => $coppedBy,
            'cop_count' => count($coppedBy),
        ]);

        return response()->json($drop);
    }

    private function canPublish($user): bool
    {
        return $user && in_array($user->role, ['ADMIN', 'DESIGNER'], true);
    }

    private function canManage($user, string $brand): bool
    {
        if (!$this->canPublish($user)) {
            return false;
        }

        return ApiAuth::isAdmin($user) || $user->ownsBrand($brand);
    }
}
