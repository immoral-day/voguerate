import React, { useEffect, useState } from 'react';
import { ClothingItem, Review, User } from '../types';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../constants';
import { EditIcon, HeartIcon, BookmarkIcon, PlusIcon } from '../components/icons/Icons';
import { Button, Badge, Avatar, RatingCircle, UnifiedCard } from '../components/UI';
import { apiService } from '../services/apiService';

interface ProfileViewProps {
    user: User;
    currentUser: User;
    onEditProfile: () => void;
    onToggleFollow: (id: string) => void;
    items: ClothingItem[];
    reviews: Review[];
    onItemClick: (id: string) => void;
    onDesignerClick: (name: string) => void;
    onLogout?: () => void;
    usersList?: User[];
    onReportUser: (userId: string, reason: string) => void;
    onVerifyUser: (userId: string, verified: boolean) => void;
    onToast: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
    user, currentUser, onEditProfile, onToggleFollow, items, reviews, onItemClick, onDesignerClick, onLogout, usersList = [], onReportUser, onVerifyUser, onToast 
}) => {
    const isCurrentUser = user.id === currentUser.id;
    const isFollowing = currentUser.following?.includes(user.id) || false;
    const userReviews = reviews.filter(r => r.userId === user.id);
    
    const sortedUsers = [...usersList].sort((a, b) => b.reputation - a.reputation);
    const rank = sortedUsers.findIndex(u => u.id === user.id) + 1;
    const isVerified = !!(user.badges?.includes('ВЕРИФИЦИРОВАН') || user.badges?.includes('VERIFIED'));
    const isAdmin = currentUser.role === 'ADMIN';
    
    const avgScoreGiven = userReviews.length > 0 
        ? Math.round(userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length) 
        : 0;

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REVIEWS' | 'PORTFOLIO' | 'SAVED'>('OVERVIEW');
    // Автор — только роль/бейдж дизайнера, а не просто верификация
    const isDesigner = user.role === 'DESIGNER' || user.badges?.includes('ДИЗАЙНЕР') || user.badges?.includes('DESIGNER');
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const savedItems = items.filter(i => user.favorites?.includes(i.id) || user.wardrobe?.wanted?.includes(i.id));

    // Портфолио автора (вещи, созданные под его брендом)
    const [authorItems, setAuthorItems] = useState<ClothingItem[]>([]);
    const [portfolioFormOpen, setPortfolioFormOpen] = useState(false);
    const [portfolioImageFile, setPortfolioImageFile] = useState<File | null>(null);
    const [portfolioImagePreview, setPortfolioImagePreview] = useState('');
    const [portfolioSaving, setPortfolioSaving] = useState(false);
    const [portfolioError, setPortfolioError] = useState('');
    const [portfolioForm, setPortfolioForm] = useState({
        name: '',
        price: 0,
        releaseDate: new Date().toISOString().split('T')[0],
        category: 'Streetwear' as ClothingItem['category'],
        type: 'SINGLE_LOOK' as ClothingItem['type'],
        tags: '',
        sizes: '',
        colors: '',
    });

    useEffect(() => {
        // Фильтруем глобальные предметы по бренду = ник автора
        const mine = items.filter(i => i.brand === user.username);
        setAuthorItems(mine);
    }, [items, user.username]);

    const handlePortfolioImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPortfolioImageFile(file);
            const reader = new FileReader();
            reader.onload = () => setPortfolioImagePreview(reader.result as string);
            reader.readAsDataURL(file);
            setPortfolioError('');
        }
    };

    const resetPortfolioForm = () => {
        setPortfolioForm({
            name: '',
            price: 0,
            releaseDate: new Date().toISOString().split('T')[0],
            category: 'Streetwear',
            type: 'SINGLE_LOOK',
            tags: '',
            sizes: '',
            colors: '',
        });
        setPortfolioImageFile(null);
        setPortfolioImagePreview('');
        setPortfolioError('');
        setPortfolioFormOpen(false);
    };

    const handleCreatePortfolioItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!portfolioImageFile) {
            setPortfolioError('Добавь изображение вещи.');
            return;
        }
        if (!portfolioForm.name.trim()) {
            setPortfolioError('Укажи название вещи.');
            return;
        }
        setPortfolioSaving(true);
        setPortfolioError('');
        try {
            const upload = await apiService.uploadFile(portfolioImageFile, 'item');
            const payload = {
                brand: user.username,
                name: portfolioForm.name.trim(),
                image: upload.url,
                releaseDate: portfolioForm.releaseDate,
                type: portfolioForm.type,
                category: portfolioForm.category,
                price: portfolioForm.price || 0,
                tags: portfolioForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                sizes: portfolioForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
                colors: portfolioForm.colors.split(',').map(c => c.trim()).filter(Boolean),
            };
            const created = await apiService.post<ClothingItem>('/v1/items', payload);
            setAuthorItems(prev => [created, ...prev]);
            onToast('Предмет добавлен в портфолио');
            resetPortfolioForm();
        } catch (e) {
            const err = e as Error;
            setPortfolioError(err.message || 'Ошибка сохранения предмета.');
        } finally {
            setPortfolioSaving(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            {isReportOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white border-2 border-black shadow-neo p-6 w-full max-w-lg">
                        <h3 className="text-lg font-black uppercase mb-4">Жалоба на пользователя</h3>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="w-full border-2 border-black p-3 font-mono text-sm min-h-[120px]"
                            placeholder="Опиши причину жалобы..."
                        />
                        <div className="flex gap-3 mt-4">
                            <Button
                                onClick={() => {
                                    if (reportReason.trim().length < 3) {
                                        onToast('Укажи причину (минимум 3 символа)');
                                        return;
                                    }
                                    onReportUser(user.id, reportReason.trim());
                                    setIsReportOpen(false);
                                }}
                            >
                                ОТПРАВИТЬ
                            </Button>
                            <Button variant="ghost" onClick={() => setIsReportOpen(false)}>ОТМЕНА</Button>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    <div className="border-2 border-black bg-white shadow-neo mb-6 overflow-hidden">
                        {user.profileBackground ? (
                            <div className="h-40 w-full">
                                <img src={user.profileBackground} alt="Profile background" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="h-40 w-full bg-bg" />
                        )}
                    </div>
                    <div className="bg-white border-2 border-black p-6 shadow-neo mb-6 sticky top-32">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex gap-0.5 flex-wrap">
                                {isVerified && <Badge className="bg-neo-yellow text-black border-black">ВЕРИФИЦИРОВАН</Badge>}
                                <Badge className="!bg-[#23a0ff] !text-black border-black">{rank > 0 ? `РАНГ #${rank}` : 'РАНГ —'}</Badge>
                            </div>
                            {isCurrentUser && (
                                <button onClick={onLogout} className="text-[10px] font-bold text-red-500 hover:underline uppercase">Выйти</button>
                            )}
                        </div>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-32 h-32 mb-4 overflow-hidden relative">
                                <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.username} size="xl" />
                            </div>
                            <h1 className="text-3xl font-black uppercase leading-none mb-2 break-all">{user.username}</h1>
                            <div className="flex gap-0.5 justify-center mb-4 flex-wrap">
                                {user.badges?.filter(b => b && b !== 'ВЕРИФИЦИРОВАН' && b !== 'VERIFIED').map(b => (
                                    <Badge key={b} className="bg-neo-yellow text-black">{b === 'ADMIN' ? 'АДМИН' : b === 'DESIGNER' ? 'ДИЗАЙНЕР' : b}</Badge>
                                ))}
                            </div>
                            <p className="text-sm font-mono text-gray-600 leading-relaxed mb-6 px-4">
                                {user.bio || "Нет описания."}
                            </p>

                            {isCurrentUser ? (
                                <Button variant="outline" onClick={onEditProfile} className="w-full text-xs gap-2"><EditIcon /> РЕДАКТИРОВАТЬ ПРОФИЛЬ</Button>
                            ) : (
                                <div className="w-full flex flex-col gap-2">
                                    <Button variant={isFollowing ? 'outline' : 'primary'} onClick={() => onToggleFollow(user.id)} className="w-full text-xs">
                                        {isFollowing ? 'ОТПИСАТЬСЯ' : 'ПОДПИСАТЬСЯ'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => { setReportReason(''); setIsReportOpen(true); }} className="w-full text-xs">
                                        ПОЖАЛОВАТЬСЯ
                                    </Button>
                                    {isAdmin && (
                                        <Button
                                            variant="outline"
                                            onClick={() => onVerifyUser(user.id, !isVerified)}
                                            className="w-full text-xs"
                                        >
                                            {isVerified ? 'СНЯТЬ ВЕРИФИКАЦИЮ' : 'ВЕРИФИЦИРОВАТЬ'}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center border-t-2 border-black pt-6">
                            <div>
                                <div className="text-2xl font-black">{user.reputation}</div>
                                <div className="text-[9px] uppercase font-bold text-gray-500">Репутация</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black">{user.reviewsCount}</div>
                                <div className="text-[9px] uppercase font-bold text-gray-500">Отзывы</div>
                            </div>
                            <div>
                                <div className="text-2xl font-black">{avgScoreGiven}</div>
                                <div className="text-[9px] uppercase font-bold text-gray-500">Строгость</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="flex border-b-2 border-black mb-8 overflow-x-auto no-scrollbar">
                        {(['OVERVIEW', 'REVIEWS', 'SAVED'] as const).map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 flex-shrink-0 ${activeTab === tab ? 'bg-black text-white border-black' : 'bg-transparent border-transparent text-gray-400 hover:text-black'}`}
                            >
                                {tab === 'OVERVIEW' ? 'ОБЗОР' : tab === 'REVIEWS' ? 'ОТЗЫВЫ' : 'СОХРАНЁННОЕ'}
                            </button>
                        ))}
                        {isDesigner && (
                            <button 
                                onClick={() => setActiveTab('PORTFOLIO')}
                                className={`px-8 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 flex-shrink-0 ${activeTab === 'PORTFOLIO' ? 'bg-black text-white border-black' : 'bg-transparent border-transparent text-gray-400 hover:text-black'}`}
                            >
                                Портфолио
                            </button>
                        )}
                    </div>

                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-12 animate-fade-in">
                            <div className="mb-8">
                                <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2 flex justify-between items-end">
                                    <span>ЛЮБИМЫЕ ДИЗАЙНЕРЫ</span>
                                    <span className="text-xs font-mono text-gray-500">{user.favoriteDesigners?.length || 0} брендов</span>
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
                                    <div className="p-8 border-2 border-dashed border-gray-300 text-center text-xs font-mono text-gray-400 uppercase">Нет выбранных брендов.</div>
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
                                    Пока нет отзывов.
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
                        <div className="space-y-8 animate-fade-in">
                            {isDesigner && isCurrentUser && (
                                <div className="bg-white border-2 border-black p-6 shadow-neo">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-black uppercase">Создать предмет</h3>
                                        <Button
                                            variant={portfolioFormOpen ? 'ghost' : 'primary'}
                                            onClick={() => setPortfolioFormOpen(v => !v)}
                                            className="text-xs"
                                        >
                                            <PlusIcon className="mr-2" /> {portfolioFormOpen ? 'Скрыть форму' : 'Новый предмет'}
                                        </Button>
                                    </div>
                                    {portfolioFormOpen && (
                                        <form onSubmit={handleCreatePortfolioItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2">Название</label>
                                                <input
                                                    type="text"
                                                    value={portfolioForm.name}
                                                    onChange={(e) => setPortfolioForm({ ...portfolioForm, name: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                                                    placeholder="Название вещи"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2">Цена (₽)</label>
                                                <input
                                                    type="number"
                                                    value={portfolioForm.price}
                                                    onChange={(e) => setPortfolioForm({ ...portfolioForm, price: parseInt(e.target.value, 10) || 0 })}
                                                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2">Дата релиза</label>
                                                <input
                                                    type="date"
                                                    value={portfolioForm.releaseDate}
                                                    onChange={(e) => setPortfolioForm({ ...portfolioForm, releaseDate: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2">Категория</label>
                                                <select
                                                    value={portfolioForm.category}
                                                    onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value as ClothingItem['category'] })}
                                                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                                                >
                                                    <option value="Streetwear">Streetwear</option>
                                                    <option value="Luxury">Luxury</option>
                                                    <option value="Techwear">Techwear</option>
                                                    <option value="Vintage">Vintage</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2">Тип</label>
                                                <select
                                                    value={portfolioForm.type}
                                                    onChange={(e) => setPortfolioForm({ ...portfolioForm, type: e.target.value as ClothingItem['type'] })}
                                                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                                                >
                                                    <option value="SINGLE_LOOK">Single Look</option>
                                                    <option value="COLLECTION">Collection</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2">Теги (через запятую)</label>
                                                <input
                                                    type="text"
                                                    value={portfolioForm.tags}
                                                    onChange={(e) => setPortfolioForm({ ...portfolioForm, tags: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                                                    placeholder="Runway, Archive, Limited"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2">Размеры (через запятую)</label>
                                                <input
                                                    type="text"
                                                    value={portfolioForm.sizes}
                                                    onChange={(e) => setPortfolioForm({ ...portfolioForm, sizes: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                                                    placeholder="S, M, L, XL"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2">Цвета (через запятую)</label>
                                                <input
                                                    type="text"
                                                    value={portfolioForm.colors}
                                                    onChange={(e) => setPortfolioForm({ ...portfolioForm, colors: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                                                    placeholder="Black, White"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-black uppercase mb-2">Изображение</label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        id="portfolio-image-upload"
                                                        className="hidden"
                                                        onChange={handlePortfolioImageChange}
                                                    />
                                                    <label
                                                        htmlFor="portfolio-image-upload"
                                                        className="px-6 py-3 border-2 border-black cursor-pointer hover:bg-black hover:text-white transition-colors font-bold uppercase text-xs"
                                                    >
                                                        Выбрать файл
                                                    </label>
                                                    {portfolioImagePreview && (
                                                        <div className="w-16 h-16 border-2 border-black overflow-hidden">
                                                            <img src={portfolioImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {portfolioError && (
                                                <div className="md:col-span-2 text-[11px] font-mono text-red-600">
                                                    {portfolioError}
                                                </div>
                                            )}
                                            <div className="md:col-span-2 flex gap-3 mt-2">
                                                <Button type="submit" disabled={portfolioSaving} className="text-xs">
                                                    {portfolioSaving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ В ПОРТФОЛИО'}
                                                </Button>
                                                <Button variant="ghost" type="button" onClick={resetPortfolioForm} className="text-xs">
                                                    ОТМЕНА
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {authorItems.length === 0 ? (
                                    <div className="col-span-full p-12 border-2 border-dashed border-gray-200 text-center font-mono font-bold text-gray-400 uppercase">
                                        {isDesigner
                                            ? 'У этого автора ещё нет предметов.'
                                            : "This designer hasn't released any drops yet."}
                                    </div>
                                ) : (
                                    authorItems.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            className="bg-white border-2 border-black p-3 shadow-neo opacity-0 animate-slide-up cursor-pointer"
                                            style={{ animationDelay: `${idx * 40}ms` }}
                                            onClick={() => onItemClick(item.id)}
                                        >
                                            <div className="aspect-[3/4] bg-gray-100 mb-3 overflow-hidden">
                                                <img
                                                    src={item.image || DEFAULT_ITEM_IMAGE}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="text-[9px] font-black uppercase bg-neo-yellow px-1 border border-black">
                                                {item.brand}
                                            </span>
                                            <h3 className="font-black text-xs mt-1 line-clamp-2 break-words">
                                                {item.name}
                                            </h3>
                                            <p className="text-[11px] text-gray-500 font-mono mt-1">
                                                {item.price} ₽ • {item.category}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
