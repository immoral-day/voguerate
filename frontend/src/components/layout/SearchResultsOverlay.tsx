import React, { useMemo } from 'react';
import { ClothingItem, User } from '../../types';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../../constants';
import { Avatar, SafeImage } from '../UI';

interface SearchResultsOverlayProps {
    query: string;
    items: ClothingItem[];
    users: User[];
    onItemClick: (id: string) => void;
    onUserClick: (id: string) => void;
    onClose: () => void;
}

export const SearchResultsOverlay: React.FC<SearchResultsOverlayProps> = ({
    query,
    items,
    users,
    onItemClick,
    onUserClick,
    onClose,
}) => {
    const { filteredItems, filteredUsers } = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase('ru');

        return {
            filteredItems: items.filter((item) =>
                item.name.toLocaleLowerCase('ru').includes(normalized) ||
                item.brand.toLocaleLowerCase('ru').includes(normalized)
            ),
            filteredUsers: users.filter((user) =>
                user.username.toLocaleLowerCase('ru').includes(normalized)
            ),
        };
    }, [items, query, users]);

    if (!query) return null;

    return (
        <div className="fixed inset-0 z-[35] bg-black/70 p-4 pt-24 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2" onClick={(event) => event.stopPropagation()}>
                <div className="search-query-banner md:col-span-2">
                    <span>Поиск</span>
                    <strong>{query}</strong>
                </div>
                <section className="card p-4">
                    <div className="section-title mb-4">
                        <span className="section-icon">ВЩ</span>
                        <h2 className="vr-h2">Вещи</h2>
                        <span className="pill">{filteredItems.length}</span>
                    </div>
                    <div className="grid gap-2">
                        {filteredItems.slice(0, 8).map((item) => (
                            <button key={item.id} className="review-top text-left" onClick={() => { onItemClick(item.id); onClose(); }}>
                                <span className="avatar"><SafeImage src={item.image || DEFAULT_ITEM_IMAGE} fallback={DEFAULT_ITEM_IMAGE} alt="" loading="lazy" decoding="async" /></span>
                                <span>
                                    <strong>{item.name}</strong>
                                    <span className="block text-xs text-[var(--muted)]">{item.brand}</span>
                                </span>
                                <span className="score-badge">{item.averageRating || '—'}</span>
                            </button>
                        ))}
                        {filteredItems.length === 0 && <p className="muted">Ничего не найдено.</p>}
                    </div>
                </section>
                <section className="card p-4">
                    <div className="section-title mb-4">
                        <span className="section-icon">ЛЮ</span>
                        <h2 className="vr-h2">Люди</h2>
                        <span className="pill">{filteredUsers.length}</span>
                    </div>
                    <div className="grid gap-2">
                        {filteredUsers.slice(0, 8).map((user) => (
                            <button key={user.id} className="review-top text-left" onClick={() => { onUserClick(user.id); onClose(); }}>
                                <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.username} />
                                <span>
                                    <strong>{user.username}</strong>
                                    <span className="block text-xs text-[var(--muted)]">{user.reputation} репутация</span>
                                </span>
                            </button>
                        ))}
                        {filteredUsers.length === 0 && <p className="muted">Ничего не найдено.</p>}
                    </div>
                </section>
            </div>
        </div>
    );
};
