import React, { useState } from 'react';
import { User, ViewState } from '../../types';
import { DEFAULT_AVATAR } from '../../constants';

interface NavBarProps {
    currentUser: User;
    activeView: string;
    setView: (v: ViewState) => void;
    onSearch: (q: string) => void;
    onProfileClick: () => void;
    isAdmin?: boolean;
}

const LINKS = [
    { id: 'HOME',        label: '/АРХИВ'   },
    { id: 'TOP_RATED',   label: '/ТРЕНДЫ'  },
    { id: 'NEWS',        label: '/НОВОСТИ' },
    { id: 'LEADERBOARD', label: '/РЕЙТИНГ' },
    { id: 'EXPLORE',     label: '/ДРОПЫ'   },
    { id: 'AUTHORSHIP',  label: '/АВТОРЫ'  },
];

export const NavBar: React.FC<NavBarProps> = ({
    currentUser, activeView, setView, onSearch, onProfileClick, isAdmin
}) => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [val, setVal] = useState('');

    const isActive = (id: string) =>
        activeView === id || (id === 'EXPLORE' && activeView === 'CALENDAR');

    const handleSearch = (v: string) => { setVal(v); onSearch(v); };
    const toggleSearch = () => {
        if (searchOpen && val) handleSearch('');
        setSearchOpen(s => !s);
    };

    return (
        <header style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
            background: 'rgba(242,239,232,0.96)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(13,13,13,0.12)',
            height: '52px',
            display: 'flex', alignItems: 'center',
            padding: '0 32px',
            gap: '40px',
        }}>
            {/* Logo */}
            <button
                onClick={() => setView({ view: 'HOME' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
            >
                <span style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: '12px', fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#0D0D0D',
                }}>
                    VOGUERATE
                </span>
            </button>

            {/* Sep */}
            <div style={{ width: '1px', height: '16px', background: 'rgba(13,13,13,0.12)', flexShrink: 0 }} />

            {/* Nav */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0', flex: 1 }}>
                {LINKS.map(link => {
                    const active = isActive(link.id);
                    return (
                        <button
                            key={link.id}
                            onClick={() => setView({ view: link.id as ViewState['view'] })}
                            style={{
                                fontFamily: '"Space Mono", monospace',
                                fontSize: '9px', letterSpacing: '0.08em',
                                padding: '6px 14px', background: 'none',
                                border: 'none', cursor: 'pointer',
                                color: active ? '#0D0D0D' : '#9A9690',
                                transition: 'color 0.15s',
                                textDecoration: active ? 'underline' : 'none',
                                textUnderlineOffset: '3px',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#0D0D0D'; }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#9A9690'; }}
                        >
                            {link.label}
                        </button>
                    );
                })}
                {isAdmin && (
                    <button
                        onClick={() => setView({ view: 'ADMIN' })}
                        style={{
                            fontFamily: '"Space Mono", monospace',
                            fontSize: '9px', letterSpacing: '0.08em',
                            padding: '6px 14px', background: 'none', border: 'none', cursor: 'pointer',
                            color: activeView === 'ADMIN' ? '#0D0D0D' : '#9A9690',
                        }}
                    >
                        /ADMIN
                    </button>
                )}
            </nav>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {searchOpen && (
                        <input
                            autoFocus
                            value={val}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="поиск..."
                            style={{
                                fontFamily: '"Space Mono", monospace', fontSize: '9px',
                                letterSpacing: '0.08em', color: '#0D0D0D',
                                background: 'transparent', border: 'none',
                                borderBottom: '1px solid rgba(13,13,13,0.3)',
                                outline: 'none', width: '140px', paddingBottom: '2px',
                            }}
                        />
                    )}
                    <button
                        onClick={toggleSearch}
                        style={{ fontFamily: '"Space Mono", monospace', fontSize: '9px', letterSpacing: '0.08em', color: '#9A9690', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#0D0D0D'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9A9690'; }}
                    >
                        {searchOpen ? '×' : '/ПОИСК'}
                    </button>
                </div>

                <div style={{ width: '1px', height: '16px', background: 'rgba(13,13,13,0.12)' }} />

                {/* User */}
                <button
                    onClick={onProfileClick}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '9px', letterSpacing: '0.06em', color: '#0D0D0D' }}>
                            {currentUser.username}
                        </div>
                        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '8px', color: '#9A9690', marginTop: '1px' }}>
                            {currentUser.reputation} rep
                        </div>
                    </div>
                    <img
                        src={currentUser.avatar || DEFAULT_AVATAR}
                        alt={currentUser.username}
                        style={{ width: '26px', height: '26px', objectFit: 'cover', filter: 'grayscale(0.3)' }}
                    />
                </button>
            </div>
        </header>
    );
};
