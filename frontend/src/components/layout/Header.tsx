import React, { useDeferredValue, useEffect, useState } from 'react';
import { ClothingItem, User } from '../../types';
import { DEFAULT_AVATAR } from '../../constants';
import { SearchResultsOverlay } from './SearchResultsOverlay';

interface HeaderProps {
    currentUser: User | null;
    items: ClothingItem[];
    users: User[];
    searchRequest?: { value: string; id: number } | null;
    onItemClick: (id: string) => void;
    onUserClick: (id: string) => void;
    onProfileClick: () => void;
    onFeedbackClick: () => void;
    onMessagesClick: () => void;
    onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    currentUser,
    items,
    users,
    searchRequest,
    onItemClick,
    onUserClick,
    onProfileClick,
    onFeedbackClick,
    onMessagesClick,
    onHomeClick,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);

    useEffect(() => {
        if (searchRequest) setSearchQuery(searchRequest.value);
    }, [searchRequest]);

    return (
        <>
            <header className="topbar">
                <button className="logo" type="button" onClick={onHomeClick}>
                    ВОЯЖРЕЙТ
                </button>
                <div className="search">
                    <input
                        type="text"
                        value={searchQuery}
                        placeholder="поиск: вещи, бренды, люди"
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                    <select defaultValue="all">
                        <option value="all">везде</option>
                        <option value="items">вещи</option>
                        <option value="users">люди</option>
                    </select>
                </div>
                <div className="actions">
                    <button className="btn" type="button" onClick={onMessagesClick}>Чат</button>
                    <button className="btn" type="button" onClick={onFeedbackClick}>Связь</button>
                    <button className={`btn ${currentUser ? '' : 'guest-login'}`} type="button" onClick={onProfileClick}>
                        <span className="hidden sm:inline">{currentUser?.username || 'Войти'}</span>
                        {currentUser && (
                            <span className="avatar !h-[24px] !w-[24px]"><img src={currentUser.avatar || DEFAULT_AVATAR} alt={currentUser.username} /></span>
                        )}
                    </button>
                </div>
            </header>
            <SearchResultsOverlay
                query={deferredSearchQuery}
                items={items}
                users={users}
                onItemClick={onItemClick}
                onUserClick={onUserClick}
                onClose={() => setSearchQuery('')}
            />
        </>
    );
};
