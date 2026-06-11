import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChatConversation, ChatMessage, User } from '../types';
import { DEFAULT_AVATAR } from '../constants';
import { Button, SafeImage } from '../components/UI';
import { MessageSquareIcon } from '../components/icons/Icons';
import { apiService } from '../services/apiService';

interface ChatViewProps {
    currentUser: User;
    users: User[];
    initialRecipientId?: string;
    onUserClick: (id: string) => void;
    onToast: (message: string) => void;
}

const formatMessageTime = (value?: string) => {
    if (!value) return '';
    return new Date(value).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const ChatView: React.FC<ChatViewProps> = ({
    currentUser,
    users,
    initialRecipientId,
    onUserClick,
    onToast,
}) => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>(initialRecipientId);
    const [draft, setDraft] = useState('');
    const [search, setSearch] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [pollingPaused, setPollingPaused] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const loadingConversationsRef = useRef(false);
    const loadingMessagesRef = useRef(false);
    const sendingRef = useRef(false);
    const lastConversationsPollRef = useRef(0);
    const messagesRef = useRef<ChatMessage[]>([]);

    const chatUsers = useMemo(() => {
        const merged = new Map(users.map((user) => [user.id, user]));
        conversations.forEach((conversation) => {
            merged.set(conversation.otherUser.id, conversation.otherUser);
        });
        return [...merged.values()];
    }, [conversations, users]);

    const availableUsers = useMemo(
        () => chatUsers
            .filter((user) => user.id !== currentUser.id)
            .filter((user) => user.username.toLowerCase().includes(search.trim().toLowerCase()))
            .sort((a, b) => a.username.localeCompare(b.username, 'ru')),
        [chatUsers, currentUser.id, search],
    );

    const selectedUser = useMemo(
        () => chatUsers.find((user) => user.id === selectedUserId),
        [chatUsers, selectedUserId],
    );

    const loadConversations = async (silent = false) => {
        if (pollingPaused) return;
        if (loadingConversationsRef.current) return;
        loadingConversationsRef.current = true;
        if (!silent) setLoadingConversations(true);
        try {
            const data = await apiService.get<ChatConversation[]>('/v1/chats');
            setConversations(data);
            if (!selectedUserId && data[0]?.otherUser?.id) {
                setSelectedUserId(data[0].otherUser.id);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
            if (!silent) onToast('Не удалось загрузить диалоги');
        } finally {
            loadingConversationsRef.current = false;
            if (!silent) setLoadingConversations(false);
        }
    };

    const loadMessages = async (silent = false) => {
        if (pollingPaused) return;
        if (!selectedUserId) return;
        if (loadingMessagesRef.current) return;
        loadingMessagesRef.current = true;
        if (!silent) setLoadingMessages(true);
        try {
            const markRead = silent ? 0 : 1;
            const lastMessageId = silent ? messagesRef.current.at(-1)?.id : undefined;
            const after = lastMessageId ? `&afterId=${encodeURIComponent(lastMessageId)}` : '';
            const data = await apiService.get<ChatMessage[]>(
                `/v1/chats/${selectedUserId}/messages?markRead=${markRead}${after}`,
            );

            if (silent && lastMessageId) {
                if (data.length > 0) {
                    setMessages((current) => {
                        const knownIds = new Set(current.map((message) => message.id));
                        return [...current, ...data.filter((message) => !knownIds.has(message.id))];
                    });
                }
            } else {
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            if (!silent) onToast('Не удалось загрузить сообщения');
        } finally {
            loadingMessagesRef.current = false;
            if (!silent) setLoadingMessages(false);
        }
    };

    useEffect(() => {
        setSelectedUserId(initialRecipientId);
    }, [initialRecipientId]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        const updatePollingState = () => setPollingPaused(document.visibilityState !== 'visible');
        updatePollingState();
        document.addEventListener('visibilitychange', updatePollingState);

        return () => document.removeEventListener('visibilitychange', updatePollingState);
    }, []);

    useEffect(() => {
        loadConversations();
    }, [currentUser.id]);

    useEffect(() => {
        setMessages([]);
        loadMessages();
    }, [selectedUserId, currentUser.id]);

    useEffect(() => {
        if (!selectedUserId) return undefined;
        if (pollingPaused) return undefined;
        loadMessages(true);
        loadConversations(true);
        lastConversationsPollRef.current = Date.now();

        const timer = window.setInterval(() => {
            loadMessages(true);
            const now = Date.now();
            if (now - lastConversationsPollRef.current > 30000) {
                lastConversationsPollRef.current = now;
                loadConversations(true);
            }
        }, 15000);

        return () => window.clearInterval(timer);
    }, [selectedUserId, currentUser.id, pollingPaused]);

    useEffect(() => {
        const refreshAfterReconnect = () => {
            loadConversations(true);
            loadMessages(true);
        };

        window.addEventListener('online', refreshAfterReconnect);
        return () => window.removeEventListener('online', refreshAfterReconnect);
    }, [selectedUserId, currentUser.id, pollingPaused]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' });
    }, [messages.length, selectedUserId]);

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        setSearch('');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const body = draft.trim();
        if (!selectedUserId || !body) return;
        if (sendingRef.current) return;

        sendingRef.current = true;
        setSending(true);
        try {
            const message = await apiService.post<ChatMessage>('/v1/chats/messages', {
                recipientId: selectedUserId,
                body,
            });
            setMessages((prev) => [...prev, message]);
            setDraft('');
            void loadConversations(true);
        } catch (error) {
            const err = error as Error;
            onToast(err.message || 'Не удалось отправить сообщение');
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    return (
        <div className="chat-page">
            <div className="section-head chat-head">
                <div className="section-title">
                    <div className="section-icon"><MessageSquareIcon /></div>
                    <h1 className="vr-h2">Сообщения</h1>
                </div>
                <span className="pill">{conversations.length} диалогов</span>
            </div>

            <section className="chat-shell">
                <aside className="chat-sidebar">
                    <div className="chat-search">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Найти пользователя"
                        />
                    </div>

                    <div className="chat-list">
                        {!search && conversations.map((conversation) => {
                            const isActive = selectedUserId === conversation.otherUser.id;
                            return (
                                <button
                                    key={conversation.id}
                                    type="button"
                                    className={`chat-list-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleSelectUser(conversation.otherUser.id)}
                                >
                                    <SafeImage src={conversation.otherUser.avatar || DEFAULT_AVATAR} fallback={DEFAULT_AVATAR} alt={conversation.otherUser.username} loading="lazy" decoding="async" />
                                    <span>
                                        <strong>{conversation.otherUser.username}</strong>
                                        <small>{conversation.lastMessage.body}</small>
                                    </span>
                                    {conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}
                                </button>
                            );
                        })}

                        {search && availableUsers.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                className={`chat-list-item ${selectedUserId === user.id ? 'active' : ''}`}
                                onClick={() => handleSelectUser(user.id)}
                            >
                                <SafeImage src={user.avatar || DEFAULT_AVATAR} fallback={DEFAULT_AVATAR} alt={user.username} loading="lazy" decoding="async" />
                                <span>
                                    <strong>{user.username}</strong>
                                    <small>Начать диалог</small>
                                </span>
                            </button>
                        ))}

                        {loadingConversations && <div className="chat-empty">Загрузка диалогов...</div>}
                        {!loadingConversations && !search && conversations.length === 0 && (
                            <div className="chat-empty">Диалогов пока нет. Найдите пользователя выше.</div>
                        )}
                        {search && availableUsers.length === 0 && (
                            <div className="chat-empty">Пользователь не найден.</div>
                        )}
                    </div>
                </aside>

                <main className="chat-main">
                    {selectedUser ? (
                        <>
                            <div className="chat-peer">
                                <button type="button" onClick={() => onUserClick(selectedUser.id)}>
                                    <SafeImage src={selectedUser.avatar || DEFAULT_AVATAR} fallback={DEFAULT_AVATAR} alt={selectedUser.username} decoding="async" />
                                    <span>
                                        <strong>{selectedUser.username}</strong>
                                        <small>Профиль пользователя</small>
                                    </span>
                                </button>
                            </div>

                            <div className="chat-messages">
                                {loadingMessages && <div className="chat-empty">Загрузка сообщений...</div>}
                                {!loadingMessages && messages.length === 0 && (
                                    <div className="chat-empty">Напишите первое сообщение.</div>
                                )}
                                {messages.map((message) => {
                                    const isMine = message.senderId === currentUser.id;
                                    return (
                                        <article className={`chat-bubble ${isMine ? 'mine' : ''}`} key={message.id}>
                                            <p>{message.body}</p>
                                            <time>{formatMessageTime(message.createdAt)}</time>
                                        </article>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            <form className="chat-compose" onSubmit={handleSubmit}>
                                <textarea
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    placeholder="Сообщение"
                                    rows={2}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            event.currentTarget.form?.requestSubmit();
                                        }
                                    }}
                                />
                                <Button type="submit" disabled={sending || !draft.trim()}>
                                    {sending ? 'Отправка...' : 'Отправить'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="chat-placeholder">
                            <MessageSquareIcon />
                            <strong>Выберите собеседника</strong>
                            <span>Откройте существующий диалог или найдите пользователя слева.</span>
                        </div>
                    )}
                </main>
            </section>
        </div>
    );
};
