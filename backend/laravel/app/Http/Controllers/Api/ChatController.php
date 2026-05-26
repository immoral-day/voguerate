<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'userId' => 'required|exists:users,id',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $userId = (int) $data['userId'];

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
                    'otherUser' => $otherUser,
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
        try {
            $data = $request->validate([
                'userId' => 'required|exists:users,id',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $currentUserId = (int) $data['userId'];
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

        $messages = ChatMessage::query()
            ->where(fn (Builder $query) => $query
                ->where('sender_id', $currentUserId)
                ->where('recipient_id', $user->id))
            ->orWhere(fn (Builder $query) => $query
                ->where('sender_id', $user->id)
                ->where('recipient_id', $currentUserId))
            ->latest()
            ->limit($limit)
            ->get()
            ->sortBy('id')
            ->values();

        return response()->json($messages);
    }

    public function send(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'senderId' => 'required|exists:users,id',
                'recipientId' => 'required|exists:users,id|different:senderId',
                'body' => 'required|string|min:1|max:2000',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        }

        $message = DB::transaction(function () use ($data) {
            return ChatMessage::create([
                'sender_id' => $data['senderId'],
                'recipient_id' => $data['recipientId'],
                'body' => trim($data['body']),
            ]);
        });

        return response()->json($message->fresh(), 201);
    }

    private function conversationId(int $firstUserId, int $secondUserId): string
    {
        $ids = [$firstUserId, $secondUserId];
        sort($ids);

        return implode(':', $ids);
    }
}
