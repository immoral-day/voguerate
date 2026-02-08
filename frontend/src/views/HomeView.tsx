import React from 'react';
import { ClothingItem, Review, UpcomingDrop } from '../types';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../constants';
import { CalendarIcon, TrendingIcon, MessageSquareIcon, HeartIcon } from '../components/icons/Icons';
import { Button, Badge, UnifiedCard, Avatar, RatingCircle } from '../components/UI';

interface HomeViewProps {
    items: ClothingItem[];
    reviews: Review[];
    drops: UpcomingDrop[];
    onItemClick: (id: string) => void;
    onUserClick: (id: string) => void;
    onManifestoClick: () => void;
    onCalendarClick?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ items, reviews, drops, onItemClick, onManifestoClick, onUserClick, onCalendarClick }) => {
    const trendingItems = [...items].sort((a,b) => b.averageRating - a.averageRating).slice(0, 5);
    const freshReleases = [...items].sort((a,b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).slice(0, 5);
    const liveReviews = [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
    const upcomingDrops = drops.filter(d => new Date(d.releaseDate) >= new Date()).sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()).slice(0, 5);

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
                        <div className="font-mono text-xs text-gray-300">ПРЕДСТОЯЩИЕ РЕЛИЗЫ</div>
                    </div>
                </div>
            </div>

            {upcomingDrops.length > 0 && (
                <div>
                    <div className="mb-8 border-b-2 border-black pb-2">
                        <h2 className="text-3xl font-black text-black flex items-center gap-3 uppercase tracking-tighter"><CalendarIcon className="text-neo-blue" /> ПРЕДСТОЯЩИЕ РЕЛИЗЫ</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {upcomingDrops.map((drop, idx) => (
                            <div key={drop.id} onClick={onCalendarClick} className="bg-white border-2 border-black shadow-neo hover:-translate-y-1 transition-transform cursor-pointer opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
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
