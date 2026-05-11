import React from 'react';
import { ViewState } from '../../types';
import {
    AuthorIcon,
    CalendarIcon,
    HomeIcon,
    NewsIcon,
    SettingsIcon,
    StarIcon,
    TrendingIcon,
} from '../icons/Icons';

interface SidebarProps {
    setView: (v: ViewState) => void;
    activeView: string;
    isAdmin?: boolean;
}

const navItems = [
    { id: 'HOME', icon: HomeIcon, label: '', title: 'Главная' },
    { id: 'EXPLORE', icon: CalendarIcon, label: '', title: 'Календарь' },
    { id: 'TOP_RATED', icon: StarIcon, label: '', title: 'Топ' },
    { id: 'LEADERBOARD', icon: null, label: '90', title: 'Рейтинг' },
    { id: 'AUTHORSHIP', icon: AuthorIcon, label: '', title: 'Авторство' },
    { id: 'NEWS', icon: NewsIcon, label: '', title: 'Новости' },
];

export const Sidebar: React.FC<SidebarProps> = ({ setView, activeView, isAdmin }) => {
    const items = isAdmin ? [...navItems, { id: 'ADMIN', icon: SettingsIcon, label: '', title: 'Админ' }] : navItems;

    return (
        <aside className="rail" aria-label="Навигация">
            {items.map((item, index) => {
                const Icon = item.icon || TrendingIcon;
                const isActive = activeView === item.id || (item.id === 'EXPLORE' && activeView === 'CALENDAR');

                return (
                    <React.Fragment key={item.id}>
                        {index === 3 && <span className="rail-sep" />}
                        <button
                            className={isActive ? 'active' : ''}
                            type="button"
                            title={item.title}
                            aria-label={item.title}
                            onClick={() => setView({ view: item.id as ViewState['view'] })}
                        >
                            {item.label ? <span className="rail-number">{item.label}</span> : <Icon className="rail-icon" />}
                        </button>
                    </React.Fragment>
                );
            })}
        </aside>
    );
};
