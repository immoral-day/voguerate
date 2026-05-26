import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChatConversation, ChatMessage, User } from '../types';
import { DEFAULT_AVATAR } from '../constants';
import { Button } from '../components/UI';
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
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const availableUsers = useMemo(
        () => users
            .filter((user) => user.id !== currentUser.id)
            .filter((user) => user.username.toLowerCase().includes(search.trim().toLowerCase()))
            .sort((a, b) => a.username.localeCompare(b.username, 'ru')),
        [users, currentUser.id, search],
    );

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedUserId),
        [users, selectedUserId],
    );

    const loadConversations = async (silent = false) => {
        if (!silent) setLoadingConversations(true);
        try {
            const data = await apiService.get<ChatConversation[]>(`/v1/chats?userId=${currentUser.id}`);
            setConversations(data);
            if (!selectedUserId && data[0]?.otherUser?.id) {
                setSelectedUserId(data[0].otherUser.id);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
            if (!silent) onToast('Не удалось загрузить диалоги');
        } finally {
            if (!silent) setLoadingConversations(false);
        }
    };

    const loadMessages = async (silent = false) => {
        if (!selectedUserId) return;
        if (!silent) setLoadingMessages(true);
        try {
            const markRead = silent ? 0 : 1;
            const data = await apiService.get<ChatMessage[]>(`/v1/chats/${selectedUserId}/messages?userId=${currentUser.id}&markRead=${markRead}`);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
            if (!silent) onToast('Не удалось загрузить сообщения');
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    useEffect(() => {
        setSelectedUserId(initialRecipientId);
    }, [initialRecipientId]);

    useEffect(() => {
        loadConversations();
    }, [currentUser.id]);

    useEffect(() => {
        setMessages([]);
        loadMessages();
    }, [selectedUserId, currentUser.id]);

    useEffect(() => {
        if (!selectedUserId) return undefined;
        const timer = window.setInterval(() => {
            loadMessages(true);
            loadConversations(true);
        }, 5000);

        return () => window.clearInterval(timer);
    }, [selectedUserId, currentUser.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages.length, selectedUserId]);

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        setSearch('');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const body = draft.trim();
        if (!selectedUserId || !body) return;

        setSending(true);
        try {
            const message = await apiService.post<ChatMessage>('/v1/chats/messages', {
                senderId: currentUser.id,
                recipientId: selectedUserId,
                body,
            });
            setMessages((prev) => [...prev, message]);
            setDraft('');
            await loadConversations();
        } catch (error) {
            const err = error as Error;
            onToast(err.message || 'Не удалось отправить сообщение');
        } finally {
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
                                    <img src={conversation.otherUser.avatar || DEFAULT_AVATAR} alt={conversation.otherUser.username} />
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
                                <img src={user.avatar || DEFAULT_AVATAR} alt={user.username} />
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
                                    <img src={selectedUser.avatar || DEFAULT_AVATAR} alt={selectedUser.username} />
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
