<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\User;
use App\Support\ApiAuth;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $userId = (int) $authUser->id;

        $limit = min(100, max(1, (int) $request->integer('limit', 50)));

        $latestRows = ChatMessage::query()
            ->selectRaw(
                'CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END as other_id, MAX(id) as last_message_id',
                [$userId],
            )
            ->where(fn (Builder $query) => $query
                ->where('sender_id', $userId)
                ->orWhere('recipient_id', $userId))
            ->groupBy('other_id')
            ->orderByDesc('last_message_id')
            ->limit($limit)
            ->get();

        if ($latestRows->isEmpty()) {
            return response()->json([]);
        }

        $otherIds = $latestRows->pluck('other_id')->map(fn ($id) => (int) $id)->all();
        $lastMessageIds = $latestRows->pluck('last_message_id')->map(fn ($id) => (int) $id)->all();

        $users = User::query()
            ->select([
                'id',
                'username',
                'brand_name',
                'avatar',
                'profile_background',
                'reputation',
                'reviews_count',
                'role',
                'bio',
                'joined_date',
                'badges',
            ])
            ->whereIn('id', $otherIds)
            ->get()
            ->keyBy('id');

        $lastMessages = ChatMessage::query()
            ->whereIn('id', $lastMessageIds)
            ->get()
            ->keyBy('id');

        $unreadCounts = ChatMessage::query()
            ->selectRaw('sender_id, COUNT(*) as unread_count')
            ->where('recipient_id', $userId)
            ->whereIn('sender_id', $otherIds)
            ->whereNull('read_at')
            ->groupBy('sender_id')
            ->pluck('unread_count', 'sender_id');

        $conversations = $latestRows
            ->map(function ($row) use ($userId, $users, $lastMessages, $unreadCounts) {
                $otherId = (int) $row->other_id;
                $message = $lastMessages->get((int) $row->last_message_id);
                $otherUser = $users->get($otherId);

                if (!$message || !$otherUser) {
                    return null;
                }

                return [
                    'id' => $this->conversationId($userId, $otherId),
                    'userId' => (string) $userId,
                    'otherUser' => $otherUser->toSummaryArray(),
                    'lastMessage' => $message,
                    'unreadCount' => (int) ($unreadCounts[$otherId] ?? 0),
                    'updatedAt' => $message->created_at?->toIso8601String(),
                ];
            })
            ->filter()
            ->values();

        return response()->json($conversations);
    }

    public function messages(Request $request, User $user): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $currentUserId = (int) $authUser->id;
        if ($currentUserId === (int) $user->id) {
            return response()->json(['error' => 'Нельзя открыть диалог с собой'], 400);
        }

        if ($request->boolean('markRead', true)) {
            ChatMessage::query()
                ->where('sender_id', $user->id)
                ->where('recipient_id', $currentUserId)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        $limit = min(200, max(20, (int) $request->integer('limit', 80)));
        $afterId = max(0, (int) $request->integer('afterId', 0));

        $query = ChatMessage::query()
            ->where(fn (Builder $conversation) => $conversation
                ->where(fn (Builder $direction) => $direction
                    ->where('sender_id', $currentUserId)
                    ->where('recipient_id', $user->id))
                ->orWhere(fn (Builder $direction) => $direction
                    ->where('sender_id', $user->id)
                    ->where('recipient_id', $currentUserId)));

        if ($afterId > 0) {
            $messages = $query
                ->where('id', '>', $afterId)
                ->orderBy('id')
                ->limit(100)
                ->get();
        } else {
            $messages = $query
                ->latest('id')
                ->limit($limit)
                ->get()
                ->sortBy('id')
                ->values();
        }

        return response()->json($messages);
    }

    public function send(Request $request): JsonResponse
    {
        $authUser = ApiAuth::user($request);
        if (!$authUser) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $data = $request->validate([
                'recipientId' => 'required|exists:users,id',
                'body' => 'required|string|min:1|max:2000',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        if ((int) $data['recipientId'] === (int) $authUser->id) {
            return response()->json(['error' => 'Cannot message yourself'], 400);
        }

        $message = ChatMessage::create([
            'sender_id' => $authUser->id,
            'recipient_id' => $data['recipientId'],
            'body' => trim($data['body']),
        ]);

        return response()->json($message, 201);
    }

    private function conversationId(int $firstUserId, int $secondUserId): string
    {
        $ids = [$firstUserId, $secondUserId];
        sort($ids);

        return implode(':', $ids);
    }
}
