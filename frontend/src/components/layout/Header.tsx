import React from 'react';
import { User } from '../../types';
import { DEFAULT_AVATAR } from '../../constants';

interface HeaderProps {
    currentUser: User;
    onSearch: (q: string) => void;
    onProfileClick: () => void;
    onFeedbackClick: () => void;
    onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onSearch, onProfileClick, onFeedbackClick, onHomeClick }) => (
    <header className="topbar">
        <button className="logo" type="button" onClick={onHomeClick}>
            ВОЯЖРЕЙТ
        </button>
        <div className="search">
            <input
                type="text"
                placeholder="поиск: вещи, бренды, люди"
                onChange={(event) => onSearch(event.target.value)}
            />
            <select defaultValue="all">
                <option value="all">везде</option>
                <option value="items">вещи</option>
                <option value="users">люди</option>
            </select>
        </div>
        <div className="actions">
            <button className="btn" type="button" onClick={onFeedbackClick}>Связь</button>
            <button className="btn" type="button" onClick={onProfileClick}>
                <span className="hidden sm:inline">{currentUser.username}</span>
                <span className="avatar !h-[24px] !w-[24px]"><img src={currentUser.avatar || DEFAULT_AVATAR} alt={currentUser.username} /></span>
            </button>
        </div>
    </header>
);
