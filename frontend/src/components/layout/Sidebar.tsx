import React from 'react';
import { ViewState } from '../../types';
import { HomeIcon, CalendarIcon, StarIcon, TrendingIcon, SettingsIcon, AuthorIcon, NewsIcon } from '../icons/Icons';

interface SidebarProps {
    setView: (v: ViewState) => void;
    activeView: string;
    isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ setView, activeView, isAdmin }) => {
    const navItems = [
        { id: 'HOME', icon: <HomeIcon />, label: 'Главная' },
        { id: 'EXPLORE', icon: <CalendarIcon />, label: 'Календарь' },
        { id: 'TOP_RATED', icon: <StarIcon />, label: 'Топ' },
        { id: 'LEADERBOARD', icon: <TrendingIcon />, label: 'Рейтинг' },
        { id: 'AUTHORSHIP', icon: <AuthorIcon />, label: 'Авторство' },
        { id: 'NEWS', icon: <NewsIcon />, label: 'Новости' },
    ];
    
    if (isAdmin) {
        navItems.push({ id: 'ADMIN', icon: <SettingsIcon />, label: 'Админ' });
    }
    
    return (
        <div className="fixed left-0 top-0 h-full w-[88px] flex flex-col items-center py-8 bg-white border-r-2 border-black z-50">
            <div 
                className="mb-12 font-black text-3xl tracking-tighter cursor-pointer text-black bg-neo-yellow w-14 h-14 flex items-center justify-center border-2 border-black shadow-neo" 
                onClick={() => setView({ view: 'HOME' })}
            >
                VR
            </div>
            <div className="flex flex-col gap-4 w-full px-4">
                {navItems.map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => setView({ view: item.id as ViewState['view'] })}
                        className={`w-14 h-14 rounded-none transition-all flex items-center justify-center border-2 ${
                            activeView === item.id 
                                ? 'bg-black text-white border-black shadow-neo-sm' 
                                : 'bg-white text-black border-transparent hover:border-black hover:bg-gray-100'
                        }`}
                        title={item.label}
                    >
                        {item.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};
