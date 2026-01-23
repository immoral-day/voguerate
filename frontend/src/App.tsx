import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from './constants';
import { ClothingItem, Review, ViewState, User, RatingBreakdown, UpcomingDrop } from './types';
import { Button, Avatar, RatingCircle, Badge, UnifiedCard, CrystalSlider, ProgressBar, ScoreDisplay, Lightbox, ToastContainer } from './components/UI';
import { apiService } from './services/apiService';

const IconWrapper = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
    <div className={`${className} stroke-[2px]`}>{children}</div>
);

const HomeIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></IconWrapper>;
const SearchIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></IconWrapper>;
const HeartIcon = ({ filled, className }: { filled?: boolean, className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></IconWrapper>;
const MessageSquareIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></IconWrapper>;
const TrendingIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></IconWrapper>;
const EditIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></IconWrapper>;
const StarIcon = ({ filled, className }: { filled?: boolean; className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></IconWrapper>;
const CalendarIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg></IconWrapper>;
const ChevronLeftIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><path d="m15 18-6-6 6-6"/></svg></IconWrapper>;
const PlusIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></IconWrapper>;
const XIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></IconWrapper>;
const BookmarkIcon = ({ className, filled }: { className?: string, filled?: boolean }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></IconWrapper>;
const SettingsIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></IconWrapper>;

const Sidebar: React.FC<{ setView: (v: ViewState) => void, activeView: string, isAdmin?: boolean }> = ({ setView, activeView, isAdmin }) => {
    const navItems = [
        { id: 'HOME', icon: <HomeIcon />, label: 'Главная' },
        { id: 'EXPLORE', icon: <CalendarIcon />, label: 'Календарь' },
        { id: 'TOP_RATED', icon: <StarIcon />, label: 'Топ' },
        { id: 'LEADERBOARD', icon: <TrendingIcon />, label: 'Рейтинг' },
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
                        className={`w-14 h-14 rounded-none transition-all flex items-center justify-center border-2 ${activeView === item.id ? 'bg-black text-white border-black shadow-neo-sm' : 'bg-white text-black border-transparent hover:border-black hover:bg-gray-100'}`}
                        title={item.label}
                    >
                        {item.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};

const Header: React.FC<{ currentUser: User, onSearch: (q: string) => void, onProfileClick: () => void, onFeedbackClick: () => void }> = ({ currentUser, onSearch, onProfileClick, onFeedbackClick }) => (
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
            <Button variant="ghost" onClick={onFeedbackClick} className="hidden md:flex text-xs font-black tracking-widest border-2 border-transparent hover:border-black text-black">ФИДБЕК</Button>
            <div onClick={onProfileClick} className="cursor-pointer hover:-translate-y-1 transition-transform flex items-center gap-4 bg-white border-2 border-black px-4 py-2 shadow-neo">
                <div className="text-right hidden sm:block">
                    <div className="text-xs font-black text-black uppercase tracking-wider">{currentUser.username}</div>
                    <div className="text-[10px] text-gray-500 font-mono font-bold">{currentUser.reputation} REP</div>
                </div>
                <Avatar src={currentUser.avatar || DEFAULT_AVATAR} alt={currentUser.username} size="sm" />
            </div>
        </div>
    </header>
);

const SearchResultsOverlay: React.FC<{ query: string, items: ClothingItem[], users: User[], onItemClick: (id: string) => void, onUserClick: (id: string) => void, onClose: () => void }> = ({ query, items, users, onItemClick, onUserClick, onClose }) => {
    if (!query) return null;
    const filteredItems = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()) || i.brand.toLowerCase().includes(query.toLowerCase()));
    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="fixed top-24 left-[88px] right-0 bottom-0 bg-black/50 backdrop-blur-md z-30 p-8 overflow-y-auto" onClick={onClose}>
             <div className="max-w-4xl mx-auto space-y-8" onClick={e => e.stopPropagation()}>
                <div className="bg-white border-2 border-black p-6 shadow-neo-lg">
                    <h2 className="text-2xl font-black uppercase mb-4 border-b-2 border-black pb-2 flex justify-between">
                        КОЛЛЕКЦИИ & ITEMS <Badge>{filteredItems.length}</Badge>
                    </h2>
                    {filteredItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredItems.slice(0, 6).map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-2 hover:bg-gray-50 cursor-pointer border border-transparent hover:border-black transition-all" onClick={() => { onItemClick(item.id); onClose(); }}>
                                    <img src={item.image || DEFAULT_ITEM_IMAGE} className="w-16 h-16 object-cover border border-black" />
                                    <div>
                                        <div className="text-[10px] font-bold bg-neo-yellow inline-block px-1 uppercase mb-1">{item.brand}</div>
                                        <div className="font-bold text-sm leading-tight">{item.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <div className="text-gray-400 font-mono text-sm uppercase">Ничего не найдено.</div>}
                </div>

                <div className="bg-white border-2 border-black p-6 shadow-neo-lg">
                    <h2 className="text-2xl font-black uppercase mb-4 border-b-2 border-black pb-2 flex justify-between">
                        ДИЗАЙНЕРЫ & ЛЮДИ <Badge>{filteredUsers.length}</Badge>
                    </h2>
                     {filteredUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredUsers.slice(0, 6).map(user => (
                                <div key={user.id} className="flex items-center gap-4 p-2 hover:bg-gray-50 cursor-pointer border border-transparent hover:border-black transition-all" onClick={() => { onUserClick(user.id); onClose(); }}>
                                    <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.username} size="sm" />
                                    <div>
                                        <div className="font-bold text-sm uppercase">{user.username}</div>
                                        <div className="text-[10px] text-gray-500 font-mono">{user.role} • {user.reputation} REP</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <div className="text-gray-400 font-mono text-sm uppercase">Ничего не найдено.</div>}
                </div>
             </div>
        </div>
    );
};

const Footer: React.FC = () => (
    <footer className="bg-black text-white py-12 px-8 border-t-2 border-black mt-auto relative z-10">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
                <div className="font-black text-4xl mb-4">VR</div>
                <div className="font-mono text-xs text-gray-500 max-w-xs">
                    ARCHIVING FASHION CULTURE ONE REVIEW AT A TIME. 
                    <br/>EST. 2024.
                </div>
            </div>
            <div className="flex gap-8 font-mono text-xs font-bold text-gray-400">
                <a href="#" className="hover:text-white uppercase">Instagram</a>
                <a href="#" className="hover:text-white uppercase">Twitter</a>
                <a href="#" className="hover:text-white uppercase">Discord</a>
                <a href="#" className="hover:text-white uppercase">Manifesto</a>
            </div>
        </div>
    </footer>
);

const AuthView: React.FC<{ onLogin: (email: string, password: string) => void; onRegister: (username: string, email: string, password: string) => void; loading: boolean; error: string }> = ({ onLogin, onRegister, loading, error }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            onLogin(email, password);
        } else {
            onRegister(username, email, password);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="z-10 bg-white border-2 border-black p-12 shadow-neo-lg max-w-md w-full text-center relative">
                 <div className="bg-neo-yellow border-2 border-black w-20 h-20 flex items-center justify-center text-4xl font-black mx-auto mb-8 shadow-neo absolute -top-10 left-1/2 -translate-x-1/2">
                     VR
                 </div>
                 <h1 className="text-4xl font-black uppercase mb-2 mt-8">Vogue Rate</h1>
                 <p className="font-mono text-sm text-gray-500 mb-8 uppercase">
                     {isLogin ? 'Войти в аккаунт' : 'Создать аккаунт'}
                 </p>
                 
                 {error && (
                    <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold uppercase">
                        {error}
                    </div>
                 )}
                 
                 <form onSubmit={handleSubmit} className="space-y-4 text-left">
                     {!isLogin && (
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">USERNAME</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:shadow-neo transition-shadow font-mono"
                                required
                            />
                        </div>
                     )}
                     <div>
                        <label className="block text-xs font-black uppercase mb-2">EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:shadow-neo transition-shadow font-mono"
                            required
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-black uppercase mb-2">ПАРОЛЬ</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:shadow-neo transition-shadow font-mono"
                            required
                        />
                     </div>
                     <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
                         {loading ? 'ЗАГРУЗКА...' : isLogin ? 'ВОЙТИ' : 'СОЗДАТЬ АККАУНТ'}
                     </Button>
                 </form>
                 
                 <div className="mt-6">
                     <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-bold text-gray-500 hover:text-black transition-colors">
                         {isLogin ? '→ Нет аккаунта? Создать' : '← Уже есть аккаунт? Войти'}
                     </button>
                 </div>
                 
                 <div className="mt-8 text-[10px] font-mono text-gray-400">
                     BY ENTERING, YOU AGREE TO THE MANIFESTO.
                 </div>
            </div>
        </div>
    );
};

const ManifestoView: React.FC = () => (
    <div className="animate-fade-in max-w-4xl mx-auto pb-20 pt-10">
        <h1 className="text-8xl font-black mb-12 text-black uppercase leading-[0.8] tracking-tighter">
            МАНИФЕСТ<br/><span className="text-neo-pink">VOGUE RATE</span>
        </h1>
        <div className="border-l-4 border-black pl-8 space-y-8">
            <p className="text-2xl font-bold text-black uppercase leading-tight animate-slide-up delay-100 opacity-0">
                МОДА — ЭТО НЕ ТО, ЧТО ВАМ ПРОДАЮТ.<br/>
                МОДА — ЭТО ТО, КАК ВЫ ЭТО ОЦЕНИВАЕТЕ.
            </p>
            <p className="text-lg font-mono font-bold text-gray-700 max-w-2xl animate-slide-up delay-200 opacity-0">
                Мы отвергаем алгоритмы. Мы отвергаем проплаченные обзоры. 
                VogueRate — это зона боевых действий для вашего вкуса. 
                Каждая оценка имеет вес. Каждая рецензия — это выстрел в пустоту консьюмеризма.
            </p>
            <div className="bg-neo-yellow border-2 border-black p-6 shadow-neo inline-block rotate-1 animate-slide-up delay-300 opacity-0">
                <p className="font-black text-xl uppercase">
                    ЦИФРЫ НЕ ЛГУТ. <br/>ХАЙП УМИРАЕТ. <br/>СТИЛЬ ВЕЧЕН.
                </p>
            </div>
            <p className="text-lg font-mono font-bold text-gray-700 max-w-2xl animate-slide-up delay-400 opacity-0">
                Присоединяйтесь к архиву. Оставьте свой след. Или оставайтесь невидимым.
            </p>
        </div>
    </div>
);

const HomeView: React.FC<{ items: ClothingItem[], reviews: Review[], drops: UpcomingDrop[], onItemClick: (id: string) => void, onUserClick: (id: string) => void, onManifestoClick: () => void }> = ({ items, reviews, drops, onItemClick, onManifestoClick, onUserClick }) => {
    const trendingItems = [...items].sort((a,b) => b.averageRating - a.averageRating).slice(0, 5);
    const freshReleases = [...items].sort((a,b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).slice(0, 5);
    const liveReviews = [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

    return (
        <div className="animate-fade-in pb-12 space-y-20">
            <div className="bg-white border-2 border-black shadow-neo-lg relative overflow-hidden flex flex-col md:flex-row h-auto md:h-[500px]">
                <div className="p-12 md:w-2/3 flex flex-col justify-center relative z-10">
                    <Badge className="bg-neo-green text-black self-start mb-6">V3.0 LIVE</Badge>
                    <h1 className="text-7xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter mb-6">
                        ОЦЕНИ<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neo-blue to-neo-pink">КУЛЬТУРУ</span>
                    </h1>
                    <p className="font-mono font-bold text-sm md:text-base mb-10 max-w-md uppercase text-gray-600 leading-relaxed">
                        Глобальный архив модной критики. Твой голос против машины хайпа.
                    </p>
                    <div className="flex gap-4">
                        <Button variant="primary" className="px-8 py-4 text-base" onClick={() => document.getElementById('trends-section')?.scrollIntoView({ behavior: 'smooth' })}>
                            ОЦЕНИТЬ ДРОП
                        </Button>
                        <Button variant="outline" className="px-8 py-4 text-base" onClick={onManifestoClick}>
                            МАНИФЕСТ
                        </Button>
                    </div>
                </div>
                <div className="md:w-1/3 bg-black relative overflow-hidden">
                     <img 
                        src="https://images.unsplash.com/photo-1537832816519-689ad163238b?q=80&w=1000&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700 scale-105 hover:scale-110" 
                        alt="Hero"
                     />
                     <div className="absolute bottom-6 left-6 text-white">
                         <div className="text-neo-yellow font-black text-3xl uppercase mb-1">ГОРЯЧЕЕ</div>
                         <div className="font-mono text-xs text-gray-400">ПОСЛЕДНИЕ РЕЛИЗЫ НЕДЕЛИ →</div>
                     </div>
                </div>
            </div>

            {drops.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-2">
                        <h2 className="text-3xl font-black text-black flex items-center gap-3 uppercase tracking-tighter"><CalendarIcon className="text-neo-blue" /> ПОСЛЕДНИЕ РЕЛИЗЫ</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {drops.slice(0, 5).map((drop, idx) => (
                            <div key={drop.id} className="bg-white border-2 border-black shadow-neo hover:-translate-y-1 transition-transform cursor-pointer opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="aspect-square overflow-hidden border-b-2 border-black">
                                    <img src={drop.image || DEFAULT_ITEM_IMAGE} alt={drop.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                </div>
                                <div className="p-4">
                                    <div className="text-[10px] font-bold bg-neo-yellow inline-block px-1 uppercase mb-1 border border-black">{drop.brand}</div>
                                    <div className="font-bold text-sm leading-tight">{drop.name}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-1">{typeof drop.price === 'number' ? `$${drop.price}` : drop.price}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div id="trends-section">
                <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-2">
                    <h2 className="text-3xl font-black text-black flex items-center gap-3 uppercase tracking-tighter"><TrendingIcon className="text-neo-red" /> ТРЕНДЫ СЕЙЧАС</h2>
                    <Badge className="bg-black text-white">LIVE FEED</Badge>
                </div>
                {trendingItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {trendingItems.map((item, idx) => (
                            <div key={item.id} className="opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                <UnifiedCard
                                    image={item.image || DEFAULT_ITEM_IMAGE}
                                    title={item.name}
                                    subtitle={item.brand}
                                    metrics={[
                                        { value: item.averageRating, type: 'filled', label: 'РЕЙТИНГ' },
                                        { value: item.ratingCount, type: 'dim', label: 'ОТЗЫВЫ' }
                                    ]}
                                    onClick={() => onItemClick(item.id)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 border-2 border-dashed border-black text-center font-mono font-bold text-gray-500 uppercase">
                        Нет предметов для отображения.
                    </div>
                )}
            </div>

            {freshReleases.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-2">
                        <h2 className="text-3xl font-black text-black flex items-center gap-3 uppercase tracking-tighter"><CalendarIcon className="text-neo-blue" /> СВЕЖИЕ РЕЛИЗЫ</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {freshReleases.map((item, idx) => (
                            <div key={item.id} className="opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                <UnifiedCard
                                    image={item.image || DEFAULT_ITEM_IMAGE}
                                    title={item.name}
                                    subtitle={item.brand}
                                    badge="NEW"
                                    onClick={() => onItemClick(item.id)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {liveReviews.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-2">
                        <h2 className="text-3xl font-black text-black flex items-center gap-3 uppercase tracking-tighter"><MessageSquareIcon className="text-neo-green" /> LIVE РЕЦЕНЗИИ</h2>
                        <div className="animate-pulse flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs font-mono font-bold text-red-500 uppercase">Live</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {liveReviews.map((review, idx) => (
                            <div key={review.id} className="bg-white border-2 border-black p-4 shadow-neo hover:-translate-y-1 transition-transform cursor-pointer flex flex-col h-full opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 100 + 200}ms` }} onClick={() => onItemClick(review.clothingId)}>
                                 <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-100">
                                     <div className="flex items-center gap-3">
                                         <Avatar src={review.user?.avatar || DEFAULT_AVATAR} alt={review.user?.username || 'User'} size="sm" onClick={(e) => { e?.stopPropagation(); if (review.userId) onUserClick(review.userId); }} />
                                         <div className="text-xs font-bold uppercase truncate max-w-[100px]">{review.user?.username}</div>
                                     </div>
                                     <RatingCircle rating={review.rating} />
                                 </div>
                                 
                                 <div className="flex gap-4 mb-4 flex-1">
                                     <div className="w-16 h-16 border border-black flex-shrink-0">
                                         <img src={review.clothing?.image || DEFAULT_ITEM_IMAGE} className="w-full h-full object-cover" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="text-[10px] font-bold bg-gray-100 px-1 inline-block mb-1">{review.clothing?.brand}</div>
                                         <div className="font-bold text-sm leading-tight line-clamp-2">{review.clothing?.name}</div>
                                     </div>
                                 </div>

                                 <p className="text-xs font-mono text-gray-600 line-clamp-3 mb-4 flex-1 bg-bg p-2 border border-transparent hover:border-black transition-colors break-words">
                                     "{review.text}"
                                 </p>
                                 
                                 <div className="text-[10px] font-bold text-gray-400 uppercase flex justify-between mt-auto pt-2 border-t border-gray-100">
                                     <span>{new Date(review.date).toLocaleDateString()}</span>
                                     <span className="flex items-center gap-1 text-neo-pink"><HeartIcon filled className="w-3 h-3"/> {review.likes}</span>
                                 </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CalendarView: React.FC<{ drops: UpcomingDrop[], onDropClick: (id: string) => void }> = ({ drops }) => {
    const [filter, setFilter] = useState<'UPCOMING' | 'RELEASED'>('UPCOMING');
    
    const filteredDrops = drops.filter(d => {
        const isReleased = new Date(d.releaseDate) < new Date();
        return filter === 'RELEASED' ? isReleased : !isReleased;
    });

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b-2 border-black pb-6 gap-6">
                <h1 className="text-6xl font-black text-black uppercase tracking-tighter leading-none">
                    КАЛЕНДАРЬ<br/><span className="text-neo-blue">РЕЛИЗОВ</span>
                </h1>
                <div className="flex gap-0">
                    <button 
                        onClick={() => setFilter('UPCOMING')}
                        className={`px-6 py-3 font-black text-sm uppercase border-2 border-black transition-all ${filter === 'UPCOMING' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                    >
                        ПРЕДСТОЯЩИЕ
                    </button>
                    <button 
                        onClick={() => setFilter('RELEASED')}
                        className={`px-6 py-3 font-black text-sm uppercase border-2 border-black border-l-0 transition-all ${filter === 'RELEASED' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                    >
                        ПРОШЕДШИЕ
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredDrops.length > 0 ? filteredDrops.map((drop, idx) => {
                    const date = new Date(drop.releaseDate);
                    const isReleased = date < new Date();

                    return (
                        <div key={drop.id} className="group bg-white border-2 border-black p-4 flex flex-col md:flex-row gap-6 hover:shadow-neo transition-all hover:-translate-y-1 cursor-pointer relative overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-neo-yellow group-hover:w-4 transition-all"></div>
                             
                             <div className="w-full md:w-32 h-32 border-2 border-black flex-shrink-0">
                                 <img src={drop.image || DEFAULT_ITEM_IMAGE} className="w-full h-full object-cover" />
                             </div>
                             
                             <div className="flex-1 flex flex-col justify-center pl-4">
                                 <div className="flex items-center gap-2 mb-1">
                                     <span className="text-xs font-bold bg-black text-white px-2 py-0.5 uppercase">{drop.brand}</span>
                                     <span className="text-xs font-mono font-bold text-gray-500">{date.toLocaleDateString()}</span>
                                 </div>
                                 <h3 className="text-2xl font-black uppercase mb-2 group-hover:underline decoration-neo-blue underline-offset-4">{drop.name}</h3>
                                 <div className="flex gap-4 text-xs font-bold uppercase text-gray-600">
                                     <span>Цена: {drop.price === 'TBA' ? 'TBA' : `$${drop.price}`}</span>
                                     <span>•</span>
                                     <span>{isReleased ? 'Владельцы: ' : 'Ждут: '}{drop.copCount}</span>
                                 </div>
                             </div>

                             <div className="flex items-center justify-center pr-4">
                                 <Button variant="outline" className="h-12 w-12 p-0 rounded-full border-black hover:bg-black hover:text-white">
                                     <ChevronLeftIcon className="rotate-180" />
                                 </Button>
                             </div>
                        </div>
                    );
                }) : (
                    <div className="p-12 border-2 border-dashed border-black text-center font-mono font-bold text-gray-500 uppercase">
                        В этом разделе пока пусто.
                    </div>
                )}
            </div>
        </div>
    );
};

const TopRatedView: React.FC<{ items: ClothingItem[], onItemClick: (id: string) => void }> = ({ items, onItemClick }) => (
    <div className="animate-fade-in pb-12">
        <h1 className="text-5xl font-black mb-12 flex items-center gap-4 text-black uppercase tracking-tighter bg-neo-pink inline-block px-4 border-2 border-black shadow-neo transform rotate-1">
            Зал Славы
        </h1>
        {items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                 {items.sort((a,b) => b.averageRating - a.averageRating).map((item, idx) => (
                    <div key={item.id} className="opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                        <UnifiedCard
                            image={item.image || DEFAULT_ITEM_IMAGE}
                            title={item.name}
                            subtitle={item.brand}
                            badge={`#${idx + 1}`}
                            metrics={[
                                { value: item.averageRating, type: 'filled', label: 'ОЦЕНКА' },
                                { value: item.ratingCount, type: 'dim', label: 'ВСЕГО' }
                            ]}
                            onClick={() => onItemClick(item.id)}
                            onAction={() => onItemClick(item.id)}
                            secondaryIcon={<StarIcon />}
                        />
                    </div>
                 ))}
            </div>
        ) : (
            <div className="p-12 border-2 border-dashed border-black text-center font-mono font-bold text-gray-500 uppercase">
                Нет предметов для отображения.
            </div>
        )}
    </div>
);

const LeaderboardView: React.FC<{ users: User[], onUserClick: (id: string) => void }> = ({ users, onUserClick }) => {
    const sortedUsers = [...users].sort((a, b) => b.reputation - a.reputation);
    
    return (
        <div className="animate-fade-in pb-12 max-w-4xl mx-auto">
             <h1 className="text-6xl font-black mb-12 text-black uppercase tracking-tighter">
                ТОП <span className="text-neo-green">КРИТИКОВ</span>
            </h1>
            
            {sortedUsers.length > 0 ? (
                <div className="bg-white border-2 border-black shadow-neo">
                    {sortedUsers.map((user, idx) => (
                        <div 
                            key={user.id} 
                            className="flex items-center p-4 border-b-2 border-black last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors group"
                            onClick={() => onUserClick(user.id)}
                        >
                            <div className="w-16 text-center font-black text-2xl text-gray-300 group-hover:text-black">
                                #{idx + 1}
                            </div>
                            <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.username} size="md" />
                            <div className="ml-4 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg uppercase">{user.username}</span>
                                    {user.badges?.map(b => (
                                        <Badge key={b} className="bg-neo-yellow text-black scale-75 origin-left">{b}</Badge>
                                    ))}
                                </div>
                                <div className="text-xs font-mono text-gray-500">{user.reviewsCount} REVIEWS</div>
                            </div>
                            <div className="text-right">
                                 <div className="font-black text-2xl">{user.reputation}</div>
                                 <div className="text-[10px] uppercase font-bold text-gray-400">REP</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 border-2 border-dashed border-black text-center font-mono font-bold text-gray-500 uppercase">
                    Нет пользователей.
                </div>
            )}
        </div>
    );
};

const FeedbackView: React.FC<{ onToast: (msg: string) => void }> = ({ onToast }) => {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (text.trim()) {
            onToast('Спасибо за фидбек!');
            setText('');
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-2xl mx-auto">
            <h1 className="text-5xl font-black mb-8 text-black uppercase">Feedback</h1>
            <div className="bg-white border-2 border-black p-8 shadow-neo">
                <p className="font-mono font-bold mb-6">Нашли баг или есть идея? Пишите.</p>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-bg border-2 border-black p-4 min-h-[200px] mb-6 font-mono text-sm focus:outline-none focus:shadow-neo transition-shadow" 
                    placeholder="Ваше сообщение..."
                />
                <Button className="w-full" onClick={handleSubmit}>ОТПРАВИТЬ</Button>
            </div>
        </div>
    );
};

const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; user: User; onSave: (data: Partial<User>) => void }> = ({ isOpen, onClose, user, onSave }) => {
    const [bio, setBio] = useState(user.bio || '');
    const [favoriteDesigners, setFavoriteDesigners] = useState(user.favoriteDesigners?.join(', ') || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState(user.avatar || DEFAULT_AVATAR);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setBio(user.bio || '');
        setFavoriteDesigners(user.favoriteDesigners?.join(', ') || '');
        setAvatarPreview(user.avatar || DEFAULT_AVATAR);
    }, [user]);

    if (!isOpen) return null;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let avatarUrl = user.avatar;
            if (avatarFile) {
                const upload = await apiService.uploadFile(avatarFile, 'avatar');
                avatarUrl = upload.url;
            }
            onSave({
                bio,
                avatar: avatarUrl,
                favoriteDesigners: favoriteDesigners.split(',').map(d => d.trim()).filter(Boolean),
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white border-2 border-black shadow-neo-lg w-full max-w-lg relative animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b-2 border-black bg-neo-yellow">
                    <h3 className="font-black uppercase">Edit Profile</h3>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Avatar src={avatarPreview} alt={user.username} size="lg" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                <span className="text-white text-xs font-bold uppercase">ИЗМЕНИТЬ</span>
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        <p className="text-xs text-gray-500 mt-2">Нажмите для загрузки</p>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase mb-2">Bio</label>
                        <textarea 
                            value={bio} 
                            onChange={e => setBio(e.target.value)}
                            className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:shadow-neo transition-shadow bg-bg min-h-[100px]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase mb-2">Любимые бренды (через запятую)</label>
                        <input 
                            value={favoriteDesigners} 
                            onChange={e => setFavoriteDesigners(e.target.value)}
                            className="w-full border-2 border-black p-3 font-mono text-xs focus:outline-none focus:shadow-neo transition-shadow bg-bg"
                            placeholder="Rick Owens, Balenciaga, Acronym"
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button className="flex-1" onClick={handleSave} disabled={saving}>
                            {saving ? 'СОХРАНЕНИЕ...' : 'SAVE CHANGES'}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={onClose}>CANCEL</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ItemDetailView: React.FC<{ 
    item: ClothingItem, 
    reviews: Review[], 
    onBack: () => void, 
    currentUser: User, 
    onUserClick: (id: string) => void,
    onToggleFavorite: (id: string) => void,
    isFavorite: boolean,
    onAddReview: (review: Partial<Review>) => Promise<void>,
    onToast: (msg: string) => void
}> = ({ item, reviews, onBack, currentUser, onUserClick, onToggleFavorite, isFavorite, onAddReview, onToast }) => {
    const [ratings, setRatings] = useState<RatingBreakdown>({ 
        concept: 5,
        execution: 5,
        dna: 5,
        relevance: 3,
        vibe: 3
    });
    const [newReviewText, setNewReviewText] = useState("");
    const [activeTab, setActiveTab] = useState<'REVIEWS' | 'DISCUSSIONS'>('REVIEWS');
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const totalScore = useMemo(() => {
        return (ratings.concept * 2) + (ratings.execution * 2) + (ratings.dna * 2) + (ratings.relevance * 3) + (ratings.vibe * 3);
    }, [ratings]);

    const handleAddReview = async () => {
        if (newReviewText.length < 100) {
            onToast("Минимум 100 символов!");
            return;
        }
        setSubmitting(true);
        try {
            await onAddReview({
                userId: currentUser.id,
                clothingId: item.id,
                rating: totalScore,
                ratingBreakdown: ratings,
                text: newReviewText,
            });
            onToast("Отзыв опубликован!");
            setNewReviewText("");
        } finally {
            setSubmitting(false);
        }
    };

    const sortedReviews = [...reviews].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="animate-fade-in pb-20 max-w-6xl mx-auto">
            {lightboxImage && <Lightbox src={lightboxImage} alt={item.name} onClose={() => setLightboxImage(null)} />}
            
            <div className="flex justify-between items-center mb-8">
                <Button variant="ghost" onClick={onBack} className="pl-0 hover:bg-transparent flex items-center gap-2 text-black border-b-2 border-transparent hover:border-black rounded-none px-0">
                    <ChevronLeftIcon /> НАЗАД В АРХИВ
                </Button>
                <button 
                    onClick={() => { onToggleFavorite(item.id); onToast(isFavorite ? "Удалено из избранного" : "Добавлено в избранное"); }}
                    className={`border-2 border-black p-3 transition-all shadow-neo hover:translate-y-1 hover:shadow-none ${isFavorite ? 'bg-neo-pink text-black' : 'bg-white text-black hover:bg-gray-100'}`}
                >
                    <HeartIcon filled={isFavorite} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
                <div className="md:col-span-5 bg-white border-2 border-black p-2 shadow-neo-lg rotate-1 h-fit sticky top-32 animate-slide-up">
                    <div className="aspect-[3/4] overflow-hidden border-2 border-black relative cursor-zoom-in" onClick={() => setLightboxImage(item.image || DEFAULT_ITEM_IMAGE)}>
                        <img src={item.image || DEFAULT_ITEM_IMAGE} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 bg-neo-yellow text-black border-2 border-black px-3 py-1 text-sm font-black uppercase shadow-neo-sm">
                            {item.category}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-7 flex flex-col animate-slide-up delay-100 opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <div className="mb-8 border-b-4 border-black pb-8">
                        <div className="text-black bg-neo-blue inline-block px-2 border-2 border-black font-mono font-bold text-sm uppercase mb-2 shadow-neo-sm transform -rotate-1">{item.brand}</div>
                        <h1 className="text-5xl md:text-7xl font-black text-black leading-[0.9] mb-6 uppercase tracking-tight">{item.name}</h1>
                        
                        <div className="bg-white border-2 border-black p-4 mt-6 shadow-neo">
                             <div className="flex justify-between items-end mb-2">
                                 <span className="font-black text-sm uppercase">Рейтинг Сообщества</span>
                                 <span className="font-black text-4xl">{item.averageRating}<span className="text-lg text-gray-400">/90</span></span>
                             </div>
                             <ProgressBar value={item.averageRating} max={90} />
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-6">
                            <Badge>РЕЛИЗ: {new Date(item.releaseDate).getFullYear()}</Badge>
                            <Badge>ЦЕНА: ${item.price}</Badge>
                            <Badge>ТИП: {item.type || 'SINGLE LOOK'}</Badge>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-black shadow-neo relative overflow-hidden">
                        <div className="bg-black text-white p-4 border-b-2 border-black flex justify-between items-center">
                            <h3 className="font-black uppercase text-xl">RZT STYLE MATH</h3>
                            <div className="text-neo-yellow text-xs font-mono">VOGUE_RATE_ALGO_V1</div>
                        </div>

                        <div className="p-8">
                            <div className="flex items-start md:items-center gap-8 mb-8 flex-col md:flex-row">
                                <ScoreDisplay score={totalScore} />
                                <div className="flex-1 space-y-1 pt-4 md:pt-0">
                                    <p className="font-bold text-sm uppercase">КАЛЬКУЛЯТОР ОЦЕНКИ:</p>
                                    <p className="font-mono text-xs text-gray-600 leading-relaxed">
                                        Система автоматически считает итог на основе весов критериев. Максимум 90 баллов.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-1 mb-8">
                                <CrystalSlider label="КОНЦЕПЦИЯ / ИДЕЯ" multiplier={2} max={10} value={ratings.concept} onChange={(v) => setRatings({...ratings, concept: v})} />
                                <CrystalSlider label="ИСПОЛНЕНИЕ / КРОЙ" multiplier={2} max={10} value={ratings.execution} onChange={(v) => setRatings({...ratings, execution: v})} />
                                <CrystalSlider label="УЗНАВАЕМОСТЬ / ДНК" multiplier={2} max={10} value={ratings.dna} onChange={(v) => setRatings({...ratings, dna: v})} />
                                <CrystalSlider label="АКТУАЛЬНОСТЬ" multiplier={3} max={5} value={ratings.relevance} onChange={(v) => setRatings({...ratings, relevance: v})} />
                                <CrystalSlider label="ВАЙБ / АТМОСФЕРА" multiplier={3} max={5} value={ratings.vibe} onChange={(v) => setRatings({...ratings, vibe: v})} />
                            </div>

                            <div className="relative">
                                <textarea 
                                    value={newReviewText}
                                    onChange={(e) => setNewReviewText(e.target.value)}
                                    className="w-full bg-bg border-2 border-black p-4 text-black text-sm font-mono mb-4 focus:outline-none focus:bg-white min-h-[120px]"
                                    placeholder="Минимум 100 символов для фиксации оценки..."
                                />
                                <div className={`text-right text-xs font-mono font-bold mb-4 ${newReviewText.length < 100 ? 'text-neo-red' : 'text-neo-green'}`}>
                                    {newReviewText.length} / 100 chars
                                    {newReviewText.length < 100 && " (TYPE MORE)"}
                                </div>
                            </div>
                            
                            <Button 
                                variant="primary" 
                                className={`w-full py-4 text-lg ${newReviewText.length < 100 ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                onClick={handleAddReview}
                                disabled={newReviewText.length < 100 || submitting}
                            >
                                {submitting ? 'ОТПРАВКА...' : newReviewText.length < 100 ? 'ENTER AT LEAST 100 CHARS' : 'ЗАФИКСИРОВАТЬ ОЦЕНКУ'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t-4 border-black pt-12 animate-slide-up delay-200 opacity-0" style={{ animationFillMode: 'forwards' }}>
                <div className="flex gap-4 mb-8">
                     <button 
                        onClick={() => setActiveTab('REVIEWS')}
                        className={`text-2xl font-black uppercase flex items-center gap-4 px-4 py-2 border-2 ${activeTab === 'REVIEWS' ? 'bg-black text-white border-black' : 'bg-transparent text-gray-400 border-transparent'}`}
                     >
                        РЕЦЕНЗИИ <Badge className="text-lg bg-neo-yellow text-black">{sortedReviews.length}</Badge>
                     </button>
                     <button 
                        onClick={() => setActiveTab('DISCUSSIONS')}
                        className={`text-2xl font-black uppercase flex items-center gap-4 px-4 py-2 border-2 ${activeTab === 'DISCUSSIONS' ? 'bg-black text-white border-black' : 'bg-transparent text-gray-400 border-transparent'}`}
                     >
                        ОБСУЖДЕНИЕ <Badge className="text-lg bg-white text-black">0</Badge>
                     </button>
                </div>

                {activeTab === 'REVIEWS' ? (
                    <div className="grid grid-cols-1 gap-6">
                        {sortedReviews.length > 0 ? sortedReviews.map((review, idx) => (
                            <div key={review.id} className="bg-white border-2 border-black p-6 shadow-neo hover:shadow-neo-lg transition-all flex flex-col md:flex-row gap-6 animate-slide-up opacity-0" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'forwards' }}>
                                <div className="flex md:flex-col items-center md:items-start gap-4 md:w-48 border-b-2 md:border-b-0 md:border-r-2 border-dashed border-gray-300 pb-4 md:pb-0 md:pr-4">
                                    <Avatar src={review.user?.avatar || DEFAULT_AVATAR} alt={review.user?.username || 'User'} size="md" />
                                    <div>
                                        <div className="font-bold text-black uppercase text-sm cursor-pointer hover:underline" onClick={() => onUserClick(review.userId)}>{review.user?.username}</div>
                                        <div className="text-[10px] text-gray-500 font-mono mt-1">{new Date(review.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-4">
                                        <RatingCircle rating={review.rating} showMax />
                                        <div className="flex items-center gap-1 border border-gray-200 px-3 py-1">
                                            <HeartIcon />
                                            <span className="text-xs font-bold">{review.likes}</span>
                                        </div>
                                    </div>
                                    <p className="text-black font-mono text-base leading-relaxed bg-bg p-4 border-l-2 border-black break-words">
                                        "{review.text}"
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 border-2 border-dashed border-black text-center bg-gray-50">
                                <div className="text-gray-400 font-black text-xl uppercase mb-2">ТИШИНА</div>
                                <p className="text-gray-500 font-mono text-sm">Никто еще не высказался. Ваш выход.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-12 border-2 border-dashed border-black text-center bg-gray-50">
                        <p className="text-gray-500 font-mono text-sm">Комментарии скоро будут доступны.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProfileView: React.FC<{ 
    user: User, 
    currentUser: User, 
    onEditProfile: () => void, 
    onToggleFollow: (id: string) => void, 
    items: ClothingItem[], 
    reviews: Review[], 
    onItemClick: (id: string) => void, 
    onDesignerClick: (name: string) => void,
    onLogout?: () => void,
    usersList?: User[]
}> = ({ user, currentUser, onEditProfile, onToggleFollow, items, reviews, onItemClick, onDesignerClick, onLogout, usersList = [] }) => {
    const isCurrentUser = user.id === currentUser.id;
    const isFollowing = currentUser.following?.includes(user.id) || false;
    const userReviews = reviews.filter(r => r.userId === user.id);
    
    const sortedUsers = [...usersList].sort((a, b) => b.reputation - a.reputation);
    const rank = sortedUsers.findIndex(u => u.id === user.id) + 1;
    const isVerified = user.badges?.includes('VERIFIED');
    
    const avgScoreGiven = userReviews.length > 0 
        ? Math.round(userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length) 
        : 0;

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REVIEWS' | 'PORTFOLIO' | 'SAVED'>('OVERVIEW');
    const isDesigner = user.role === 'DESIGNER' || user.badges?.includes('VERIFIED');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleAvatarClick = () => {
        if (isCurrentUser) {
            fileInputRef.current?.click();
        }
    };

    const savedItems = items.filter(i => user.favorites?.includes(i.id) || user.wardrobe?.wanted?.includes(i.id));

    return (
        <div className="animate-fade-in pb-20">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    <div className="bg-white border-2 border-black p-6 shadow-neo mb-6 sticky top-32">
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex gap-2">
                                {isVerified && <Badge className="bg-black text-white border-black">VERIFIED</Badge>}
                                {rank > 0 && <Badge className="bg-neo-blue text-white border-black">RANK #{rank}</Badge>}
                            </div>
                            {isCurrentUser && (
                                <button onClick={onLogout} className="text-[10px] font-bold text-red-500 hover:underline uppercase">Logout</button>
                            )}
                         </div>

                         <div className="flex flex-col items-center text-center mb-6 relative group">
                             <div className="w-32 h-32 border-2 border-black p-1 mb-4 rounded-full overflow-hidden relative bg-gray-100">
                                 <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.username} size="xl" onClick={handleAvatarClick} />
                                 {isCurrentUser && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-opacity pointer-events-none">CHANGE</div>}
                             </div>
                             <h1 className="text-3xl font-black uppercase leading-none mb-2 break-all">{user.username}</h1>
                             <div className="flex gap-2 justify-center mb-4 flex-wrap">
                                {user.badges?.filter(b => b !== 'VERIFIED').map(b => (
                                     <Badge key={b} className="bg-neo-yellow text-black">{b}</Badge>
                                 ))}
                             </div>
                             <p className="text-sm font-mono text-gray-600 leading-relaxed mb-6 px-4">
                                 {user.bio || "No bio established."}
                             </p>

                             {isCurrentUser ? (
                                 <Button variant="outline" onClick={onEditProfile} className="w-full text-xs gap-2"><EditIcon /> EDIT PROFILE</Button>
                             ) : (
                                 <Button variant={isFollowing ? 'outline' : 'primary'} onClick={() => onToggleFollow(user.id)} className="w-full text-xs">
                                     {isFollowing ? 'UNFOLLOW' : 'FOLLOW'}
                                 </Button>
                             )}
                         </div>

                         <div className="grid grid-cols-3 gap-2 text-center border-t-2 border-black pt-6">
                             <div>
                                 <div className="text-2xl font-black">{user.reputation}</div>
                                 <div className="text-[9px] uppercase font-bold text-gray-500">Rep</div>
                             </div>
                             <div>
                                 <div className="text-2xl font-black">{user.reviewsCount}</div>
                                 <div className="text-[9px] uppercase font-bold text-gray-500">Reviews</div>
                             </div>
                             <div>
                                 <div className="text-2xl font-black">{avgScoreGiven}</div>
                                 <div className="text-[9px] uppercase font-bold text-gray-500">Strictness</div>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                     <div className="flex border-b-2 border-black mb-8 overflow-x-auto no-scrollbar">
                         {['OVERVIEW', 'REVIEWS', 'SAVED'].map((tab) => (
                             <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as 'OVERVIEW' | 'REVIEWS' | 'SAVED')}
                                className={`px-8 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 flex-shrink-0 ${activeTab === tab ? 'bg-black text-white border-black' : 'bg-transparent border-transparent text-gray-400 hover:text-black'}`}
                             >
                                 {tab}
                             </button>
                         ))}
                         {isDesigner && (
                            <button 
                                onClick={() => setActiveTab('PORTFOLIO')}
                                className={`px-8 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 flex-shrink-0 ${activeTab === 'PORTFOLIO' ? 'bg-black text-white border-black' : 'bg-transparent border-transparent text-gray-400 hover:text-black'}`}
                            >
                                Portfolio
                            </button>
                         )}
                     </div>

                     {activeTab === 'OVERVIEW' && (
                        <div className="space-y-12 animate-fade-in">
                            <div className="mb-8">
                                <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2 flex justify-between items-end">
                                    <span>FAVORITE DESIGNERS</span>
                                    <span className="text-xs font-mono text-gray-500">{user.favoriteDesigners?.length || 0} BRANDS</span>
                                </h3>
                                {user.favoriteDesigners && user.favoriteDesigners.length > 0 ? (
                                    <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x">
                                        {user.favoriteDesigners.map(brand => (
                                            <div 
                                                key={brand} 
                                                onClick={() => onDesignerClick(brand)}
                                                className="flex-shrink-0 w-32 h-32 rounded-full border-2 border-black bg-white flex flex-col items-center justify-center p-2 shadow-neo hover:scale-105 transition-transform cursor-pointer group snap-start"
                                            >
                                                <div className="w-full text-center font-black text-xs uppercase break-words group-hover:text-neo-blue transition-colors">{brand}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-300 text-center text-xs font-mono text-gray-400 uppercase">No brands selected.</div>
                                )}
                            </div>
                        </div>
                     )}
                     
                     {activeTab === 'REVIEWS' && (
                         <div className="space-y-4 animate-fade-in">
                             {userReviews.length > 0 ? userReviews.map((review, idx) => (
                                 <div key={review.id} className="bg-white border-2 border-black p-6 shadow-neo hover:-translate-y-1 transition-transform cursor-pointer opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }} onClick={() => onItemClick(review.clothingId)}>
                                     <div className="flex justify-between items-start mb-4">
                                         <div className="flex items-center gap-4">
                                             <div className="w-12 h-12 bg-gray-100 border border-black overflow-hidden">
                                                 <img src={review.clothing?.image || DEFAULT_ITEM_IMAGE} className="w-full h-full object-cover" />
                                             </div>
                                             <div>
                                                 <span className="text-[10px] font-black uppercase bg-neo-yellow text-black px-1 border border-black">{review.clothing?.brand}</span>
                                                 <h3 className="font-black text-lg leading-tight mt-1 group-hover:underline">{review.clothing?.name}</h3>
                                             </div>
                                         </div>
                                         <RatingCircle rating={review.rating} />
                                     </div>
                                     <p className="text-sm font-mono text-gray-700 break-words">"{review.text}"</p>
                                     <div className="mt-3 text-[10px] font-bold text-gray-400 uppercase flex gap-4 items-center">
                                         <span>{new Date(review.date).toLocaleDateString()}</span>
                                         <span className="flex items-center gap-1"><HeartIcon className="w-3 h-3"/> {review.likes}</span>
                                     </div>
                                 </div>
                             )) : (
                                <div className="p-12 border-2 border-dashed border-gray-300 text-center font-mono text-sm text-gray-400 uppercase">
                                    No reviews filed yet.
                                </div>
                             )}
                         </div>
                     )}

                     {activeTab === 'SAVED' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
                             {savedItems.length > 0 ? savedItems.map((item, idx) => (
                                 <div key={item.id} className="opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                     <UnifiedCard
                                        image={item.image || DEFAULT_ITEM_IMAGE}
                                        title={item.name}
                                        subtitle={item.brand}
                                        metrics={[{ value: item.averageRating, type: 'filled', label: 'AVG' }]}
                                        onClick={() => onItemClick(item.id)}
                                        secondaryIcon={<BookmarkIcon filled />}
                                     />
                                 </div>
                             )) : (
                                <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center font-mono text-sm text-gray-400 uppercase">
                                    No saved items.
                                </div>
                             )}
                        </div>
                     )}
                     
                     {activeTab === 'PORTFOLIO' && (
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
                             {isCurrentUser && (
                                <div className="border-2 border-dashed border-black flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-gray-50 transition-colors group">
                                     <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                         <PlusIcon />
                                     </div>
                                     <div className="font-black uppercase text-sm">CREATE DROP</div>
                                </div>
                             )}
                             <div className="col-span-full p-12 border-2 border-dashed border-gray-200 text-center font-mono font-bold text-gray-400 uppercase">
                                 {isCurrentUser ? "Upload your first collection above." : "This designer hasn't released any drops yet."}
                             </div>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

const AdminPanel: React.FC<{
    items: ClothingItem[];
    drops: UpcomingDrop[];
    onCreateItem: (item: Partial<ClothingItem>) => Promise<void>;
    onCreateDrop: (drop: Partial<UpcomingDrop>) => Promise<void>;
    onDeleteItem: (id: string) => Promise<void>;
    onDeleteDrop: (id: string) => Promise<void>;
    onBack: () => void;
}> = ({ items, drops, onCreateItem, onCreateDrop, onDeleteItem, onDeleteDrop, onBack }) => {
    const [activeTab, setActiveTab] = useState<'items' | 'drops'>('items');
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [formError, setFormError] = useState('');

    const [formData, setFormData] = useState({
        brand: '',
        name: '',
        category: 'Streetwear' as ClothingItem['category'],
        type: 'SINGLE_LOOK' as ClothingItem['type'],
        price: 0,
        releaseDate: new Date().toISOString().split('T')[0],
        tags: '',
        sizes: '',
        colors: '',
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setFormError('');
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            setFormError('Добавьте изображение');
            return;
        }
        setLoading(true);
        try {
            const upload = await apiService.uploadFile(imageFile, 'item');
            await onCreateItem({
                brand: formData.brand,
                name: formData.name,
                image: upload.url,
                category: formData.category,
                type: formData.type,
                price: formData.price,
                releaseDate: formData.releaseDate,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
                colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
            });
            setShowForm(false);
            setFormData({ brand: '', name: '', category: 'Streetwear', type: 'SINGLE_LOOK', price: 0, releaseDate: new Date().toISOString().split('T')[0], tags: '', sizes: '', colors: '' });
            setImageFile(null);
            setImagePreview('');
            setFormError('');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitDrop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            setFormError('Добавьте изображение');
            return;
        }
        setLoading(true);
        try {
            const upload = await apiService.uploadFile(imageFile, 'drop');
            await onCreateDrop({
                brand: formData.brand,
                name: formData.name,
                image: upload.url,
                price: formData.price,
                releaseDate: new Date(formData.releaseDate).toISOString(),
            });
            setShowForm(false);
            setFormData({ brand: '', name: '', category: 'Streetwear', type: 'SINGLE_LOOK', price: 0, releaseDate: new Date().toISOString().split('T')[0], tags: '', sizes: '', colors: '' });
            setImageFile(null);
            setImagePreview('');
            setFormError('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
                        <ChevronLeftIcon />
                    </button>
                    <h1 className="text-3xl font-black uppercase">АДМИН ПАНЕЛЬ</h1>
                </div>
                <Button onClick={() => { setShowForm(true); setFormError(''); setImageFile(null); setImagePreview(''); }}>
                    <PlusIcon className="mr-2" /> СОЗДАТЬ {activeTab === 'items' ? 'ПРЕДМЕТ' : 'РЕЛИЗ'}
                </Button>
            </div>

            <div className="flex border-b-2 border-black mb-8">
                {['items', 'drops'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab as 'items' | 'drops'); setShowForm(false); setFormError(''); }}
                        className={`px-8 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 ${activeTab === tab ? 'bg-black text-white border-black' : 'bg-transparent border-transparent text-gray-400 hover:text-black'}`}
                    >
                        {tab === 'items' ? 'ПРЕДМЕТЫ' : 'РЕЛИЗЫ'} ({tab === 'items' ? items.length : drops.length})
                    </button>
                ))}
            </div>

            {showForm && (
                <div className="bg-white border-2 border-black p-6 shadow-neo mb-8">
                    <h2 className="text-xl font-black uppercase mb-6">{activeTab === 'items' ? 'НОВЫЙ ПРЕДМЕТ' : 'НОВЫЙ РЕЛИЗ'}</h2>
                    <form onSubmit={activeTab === 'items' ? handleSubmitItem : handleSubmitDrop} className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">БРЕНД</label>
                            <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" required />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">НАЗВАНИЕ</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" required />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">ЦЕНА ($)</label>
                            <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 border-2 border-black font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">ДАТА РЕЛИЗА</label>
                            <input type="date" value={formData.releaseDate} onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" />
                        </div>
                        {activeTab === 'items' && (
                            <>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">КАТЕГОРИЯ</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as ClothingItem['category'] })} className="w-full px-4 py-3 border-2 border-black font-mono">
                                        <option value="Streetwear">Streetwear</option>
                                        <option value="Luxury">Luxury</option>
                                        <option value="Techwear">Techwear</option>
                                        <option value="Vintage">Vintage</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">ТИП</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as ClothingItem['type'] })} className="w-full px-4 py-3 border-2 border-black font-mono">
                                        <option value="SINGLE_LOOK">Single Look</option>
                                        <option value="COLLECTION">Collection</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">ТЕГИ (через запятую)</label>
                                    <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" placeholder="Hype, Limited, Archive" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">РАЗМЕРЫ (через запятую)</label>
                                    <input type="text" value={formData.sizes} onChange={(e) => setFormData({ ...formData, sizes: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" placeholder="S, M, L, XL" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">ЦВЕТА (через запятую)</label>
                                    <input type="text" value={formData.colors} onChange={(e) => setFormData({ ...formData, colors: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" placeholder="Black, White" />
                                </div>
                            </>
                        )}
                        <div className="col-span-2">
                            <label className="block text-xs font-black uppercase mb-2">ИЗОБРАЖЕНИЕ</label>
                            <div className="flex items-center gap-4">
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                                <label htmlFor="image-upload" className="px-6 py-3 border-2 border-black cursor-pointer hover:bg-black hover:text-white transition-colors font-bold uppercase text-sm">ВЫБРАТЬ ФАЙЛ</label>
                                {imagePreview && (
                                    <div className="w-20 h-20 border-2 border-black overflow-hidden">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {formError && <div className="col-span-2 text-xs font-bold text-red-600 uppercase">{formError}</div>}
                        <div className="col-span-2 flex gap-4 mt-4">
                            <Button type="submit" disabled={loading}>{loading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}</Button>
                            <Button variant="ghost" onClick={() => setShowForm(false)}>ОТМЕНА</Button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'items' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.length === 0 ? (
                        <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center">
                            <p className="text-gray-400 font-mono uppercase">Нет предметов. Создайте первый!</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="bg-white border-2 border-black p-4 shadow-neo">
                                <div className="aspect-[4/5] bg-gray-100 mb-4 overflow-hidden">
                                    <img src={item.image || DEFAULT_ITEM_IMAGE} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black uppercase bg-neo-yellow px-1 border border-black">{item.brand}</span>
                                        <h3 className="font-black text-sm mt-1">{item.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">${item.price} • {item.category}</p>
                                    </div>
                                    <button onClick={() => onDeleteItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 transition-colors">
                                        <XIcon />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'drops' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drops.length === 0 ? (
                        <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center">
                            <p className="text-gray-400 font-mono uppercase">Нет релизов. Создайте первый!</p>
                        </div>
                    ) : (
                        drops.map((drop) => (
                            <div key={drop.id} className="bg-white border-2 border-black p-4 shadow-neo">
                                <div className="aspect-square bg-gray-100 mb-4 overflow-hidden">
                                    <img src={drop.image || DEFAULT_ITEM_IMAGE} alt={drop.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black uppercase bg-neo-yellow px-1 border border-black">{drop.brand}</span>
                                        <h3 className="font-black text-sm mt-1">{drop.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">{typeof drop.price === 'number' ? `$${drop.price}` : drop.price} • {new Date(drop.releaseDate).toLocaleDateString()}</p>
                                    </div>
                                    <button onClick={() => onDeleteDrop(drop.id)} className="p-2 text-red-500 hover:bg-red-50 transition-colors">
                                        <XIcon />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [viewState, setViewState] = useState<ViewState>({ view: 'HOME' });
    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [drops, setDrops] = useState<UpcomingDrop[]>([]);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [toasts, setToasts] = useState<{ id: string, message: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [itemsData, reviewsData, usersData, dropsData] = await Promise.all([
                    apiService.get<ClothingItem[]>('/v1/items'),
                    apiService.get<Review[]>('/v1/reviews'),
                    apiService.get<User[]>('/v1/users'),
                    apiService.get<UpcomingDrop[]>('/v1/drops'),
                ]);
                setClothingItems(itemsData);
                setReviews(reviewsData);
                setUsers(usersData);
                setDrops(dropsData);
            } catch (error) {
                console.error('Failed to load data from API:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const savedUserId = localStorage.getItem('currentUserId');
        if (savedUserId && users.length > 0) {
            const user = users.find((u) => u.id === savedUserId);
            if (user) setCurrentUser(user);
        }
    }, [users]);

    const refreshData = async () => {
        try {
            const [itemsData, reviewsData, usersData, dropsData] = await Promise.all([
                apiService.get<ClothingItem[]>('/v1/items'),
                apiService.get<Review[]>('/v1/reviews'),
                apiService.get<User[]>('/v1/users'),
                apiService.get<UpcomingDrop[]>('/v1/drops'),
            ]);
            setClothingItems(itemsData);
            setReviews(reviewsData);
            setUsers(usersData);
            setDrops(dropsData);
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    };

    const handleLogin = async (email: string, password: string) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const user = users.find((u) => u.username.toLowerCase() === email.toLowerCase() || email.includes(u.username.toLowerCase()));
            if (user) {
                setCurrentUser(user);
                localStorage.setItem('currentUserId', user.id);
            } else {
                setAuthError('Пользователь не найден. Попробуйте зарегистрироваться.');
            }
        } catch {
            setAuthError('Ошибка входа. Попробуйте снова.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleRegister = async (username: string, email: string, password: string) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const newUser = await apiService.post<User>('/v1/users', { username, email, password });
            setUsers((prev) => [...prev, newUser]);
            setCurrentUser(newUser);
            localStorage.setItem('currentUserId', newUser.id);
        } catch (err: unknown) {
            const error = err as Error;
            setAuthError(error.message || 'Ошибка регистрации.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUserId');
    };

    const addToast = (message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const navigateTo = (view: ViewState['view'], params: Partial<ViewState> = {}) => {
        setViewState({ ...params, view });
        window.scrollTo(0,0);
    };

    const handleToggleFollow = async (targetId: string) => {
        if (!currentUser) return;
        const following = currentUser.following || [];
        const newFollowing = following.includes(targetId) ? following.filter(id => id !== targetId) : [...following, targetId];
        try {
            const updatedUser = await apiService.put<User>(`/v1/users/${currentUser.id}`, { following: newFollowing });
            setCurrentUser(updatedUser);
            setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
            addToast(newFollowing.includes(targetId) ? "Followed" : "Unfollowed");
        } catch (error) {
            console.error('Failed to toggle follow:', error);
        }
    };

    const handleUpdateProfile = async (data: Partial<User>) => {
        if (!currentUser) return;
        try {
            const updatedUser = await apiService.put<User>(`/v1/users/${currentUser.id}`, data);
            setCurrentUser(updatedUser);
            setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
            addToast("Профиль обновлён");
        } catch (error) {
            console.error('Failed to update profile:', error);
            addToast('Ошибка обновления профиля');
        }
    };

    const handleToggleFavorite = async (id: string) => {
        if (!currentUser) return;
        const favorites = currentUser.favorites || [];
        const newFavorites = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
        try {
            const updatedUser = await apiService.put<User>(`/v1/users/${currentUser.id}`, { favorites: newFavorites });
            setCurrentUser(updatedUser);
            setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const handleAddReview = async (reviewData: Partial<Review>) => {
        try {
            const newReview = await apiService.post<Review>('/v1/reviews', reviewData);
            setReviews(prev => [newReview, ...prev]);
            await refreshData();
        } catch (error) {
            console.error('Failed to add review:', error);
            addToast('Ошибка публикации отзыва');
        }
    };

    const handleDesignerClick = (name: string) => {
        const designerUser = users.find(u => u.username.toLowerCase() === name.toLowerCase());
        if (designerUser) {
            navigateTo('PROFILE', { userId: designerUser.id });
        } else {
            setSearchQuery(name);
        }
    };

    const handleCreateItem = async (itemData: Partial<ClothingItem>) => {
        try {
            const newItem = await apiService.post<ClothingItem>('/v1/items', itemData);
            setClothingItems(prev => [...prev, newItem]);
            addToast('Предмет создан');
        } catch (error) {
            console.error('Failed to create item:', error);
            addToast('Ошибка создания предмета');
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await apiService.delete(`/v1/items/${id}`);
            setClothingItems(prev => prev.filter(i => i.id !== id));
            addToast('Предмет удалён');
        } catch (error) {
            console.error('Failed to delete item:', error);
            addToast('Ошибка удаления');
        }
    };

    const handleCreateDrop = async (dropData: Partial<UpcomingDrop>) => {
        try {
            const newDrop = await apiService.post<UpcomingDrop>('/v1/drops', dropData);
            setDrops(prev => [...prev, newDrop]);
            addToast('Релиз создан');
        } catch (error) {
            console.error('Failed to create drop:', error);
            addToast('Ошибка создания релиза');
        }
    };

    const handleDeleteDrop = async (id: string) => {
        try {
            await apiService.delete(`/v1/drops/${id}`);
            setDrops(prev => prev.filter(d => d.id !== id));
            addToast('Релиз удалён');
        } catch (error) {
            console.error('Failed to delete drop:', error);
            addToast('Ошибка удаления');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block font-black text-4xl tracking-tighter text-black bg-neo-yellow px-4 py-2 border-2 border-black shadow-neo mb-4 animate-pulse">VR</div>
                    <p className="text-sm font-mono text-gray-500 uppercase">Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <AuthView onLogin={handleLogin} onRegister={handleRegister} loading={authLoading} error={authError} />;
    }

    let content;
    switch (viewState.view) {
        case 'HOME':
            content = <HomeView 
                items={clothingItems} 
                reviews={reviews.map(r => ({ ...r, clothing: clothingItems.find(c => c.id === r.clothingId), user: users.find(u => u.id === r.userId) }))} 
                drops={drops}
                onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                onManifestoClick={() => navigateTo('MANIFESTO')}
            />;
            break;
        case 'EXPLORE':
        case 'CALENDAR':
            content = <CalendarView drops={drops} onDropClick={(id) => console.log(id)} />;
            break;
        case 'TOP_RATED':
            content = <TopRatedView items={clothingItems} onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })} />;
            break;
        case 'LEADERBOARD':
            content = <LeaderboardView users={users} onUserClick={(id) => navigateTo('PROFILE', { userId: id })} />;
            break;
        case 'FEEDBACK':
            content = <FeedbackView onToast={addToast} />;
            break;
        case 'MANIFESTO':
            content = <ManifestoView />;
            break;
        case 'ADMIN':
            if (currentUser.role === 'ADMIN') {
                content = <AdminPanel 
                    items={clothingItems} 
                    drops={drops} 
                    onCreateItem={handleCreateItem} 
                    onCreateDrop={handleCreateDrop} 
                    onDeleteItem={handleDeleteItem} 
                    onDeleteDrop={handleDeleteDrop} 
                    onBack={() => navigateTo('HOME')} 
                />;
            } else {
                content = <HomeView 
                    items={clothingItems} 
                    reviews={reviews.map(r => ({ ...r, clothing: clothingItems.find(c => c.id === r.clothingId), user: users.find(u => u.id === r.userId) }))} 
                    drops={drops}
                    onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onManifestoClick={() => navigateTo('MANIFESTO')}
                />;
            }
            break;
        case 'ITEM_DETAIL':
            const item = clothingItems.find(i => i.id === viewState.itemId);
            if (item) {
                const itemReviews = reviews.filter(r => r.clothingId === item.id).map(r => ({ ...r, clothing: item, user: users.find(u => u.id === r.userId) }));
                content = <ItemDetailView 
                    item={item} 
                    reviews={itemReviews} 
                    currentUser={currentUser}
                    onBack={() => navigateTo('HOME')}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={currentUser.favorites?.includes(item.id) || false}
                    onAddReview={handleAddReview}
                    onToast={addToast}
                />;
            } else {
                content = <div className="p-12 text-center font-mono">Item not found</div>;
            }
            break;
        case 'PROFILE':
            const targetUser = users.find(u => u.id === (viewState.userId || currentUser.id));
            if (targetUser) {
                content = <ProfileView 
                    user={targetUser} 
                    currentUser={currentUser} 
                    onEditProfile={() => setIsEditProfileOpen(true)}
                    onToggleFollow={handleToggleFollow}
                    items={clothingItems}
                    reviews={reviews.map(r => ({ ...r, clothing: clothingItems.find(c => c.id === r.clothingId), user: users.find(u => u.id === r.userId) }))}
                    onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                    onDesignerClick={handleDesignerClick}
                    onLogout={handleLogout}
                    usersList={users}
                />;
            } else {
                content = <div className="p-12 text-center font-mono">User not found</div>;
            }
            break;
        default:
            content = <HomeView 
                items={clothingItems} 
                reviews={reviews.map(r => ({ ...r, clothing: clothingItems.find(c => c.id === r.clothingId), user: users.find(u => u.id === r.userId) }))} 
                drops={drops}
                onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                onManifestoClick={() => navigateTo('MANIFESTO')}
            />;
    }

    return (
        <div className="flex min-h-screen bg-bg font-sans text-black">
            <Sidebar setView={setViewState} activeView={viewState.view} isAdmin={currentUser.role === 'ADMIN'} />
            <div className="flex-1 ml-[88px]">
                <Header 
                    currentUser={currentUser} 
                    onSearch={setSearchQuery} 
                    onProfileClick={() => navigateTo('PROFILE', { userId: currentUser.id })}
                    onFeedbackClick={() => navigateTo('FEEDBACK')}
                />
                <main className="mt-24 p-8 relative">
                    {content}
                    <SearchResultsOverlay 
                        query={searchQuery} 
                        items={clothingItems} 
                        users={users} 
                        onItemClick={(id) => { navigateTo('ITEM_DETAIL', { itemId: id }); setSearchQuery(''); }}
                        onUserClick={(id) => { navigateTo('PROFILE', { userId: id }); setSearchQuery(''); }}
                        onClose={() => setSearchQuery('')}
                    />
                </main>
                <Footer />
            </div>
            <EditProfileModal 
                isOpen={isEditProfileOpen} 
                onClose={() => setIsEditProfileOpen(false)} 
                user={currentUser} 
                onSave={handleUpdateProfile} 
            />
            <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
        </div>
    );
};

export default App;
