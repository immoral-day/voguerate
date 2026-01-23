import React from 'react';
import { User } from '../../types';
import { DEFAULT_AVATAR } from '../../constants';
import { SearchIcon } from '../icons/Icons';
import { Button, Avatar } from '../UI';

interface HeaderProps {
    currentUser: User;
    onSearch: (q: string) => void;
    onProfileClick: () => void;
    onFeedbackClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onSearch, onProfileClick, onFeedbackClick }) => (
    <header className="fixed top-0 left-[88px] right-0 h-24 bg-bg/90 backdrop-blur-sm border-b-2 border-black flex items-center justify-between px-8 z-40">
        <div className="flex items-center gap-4 bg-white border-2 border-black px-4 py-3 w-96 shadow-neo transition-transform focus-within:translate-y-1 focus-within:shadow-none">
            <SearchIcon className="text-black" />
            <input 
                type="text" 
                placeholder="ПОИСК ПО АРХИВУ..." 
                className="bg-transparent border-none focus:outline-none text-sm w-full text-black placeholder-gray-500 font-bold uppercase tracking-wide" 
                onChange={(e) => onSearch(e.target.value)} 
            />
        </div>
        <div className="flex items-center gap-6">
            <Button 
                variant="ghost" 
                onClick={onFeedbackClick} 
                className="hidden md:flex text-xs font-black tracking-widest border-2 border-transparent hover:border-black text-black"
            >
                ФИДБЕК
            </Button>
            <div 
                onClick={onProfileClick} 
                className="cursor-pointer hover:-translate-y-1 transition-transform flex items-center gap-4 bg-white border-2 border-black px-4 py-2 shadow-neo"
            >
                <div className="text-right hidden sm:block">
                    <div className="text-xs font-black text-black uppercase tracking-wider">{currentUser.username}</div>
                    <div className="text-[10px] text-gray-500 font-mono font-bold">{currentUser.reputation} REP</div>
                </div>
                <Avatar src={currentUser.avatar || DEFAULT_AVATAR} alt={currentUser.username} size="sm" />
            </div>
        </div>
    </header>
);
