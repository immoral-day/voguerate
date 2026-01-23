import React, { useState, useRef } from 'react';
import { ClothingItem, Review, User } from '../types';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../constants';
import { EditIcon, HeartIcon, BookmarkIcon, PlusIcon } from '../components/icons/Icons';
import { Button, Badge, Avatar, RatingCircle, UnifiedCard } from '../components/UI';

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
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
    user, currentUser, onEditProfile, onToggleFollow, items, reviews, onItemClick, onDesignerClick, onLogout, usersList = [] 
}) => {
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
