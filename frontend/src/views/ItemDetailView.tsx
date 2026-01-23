import React, { useState, useMemo } from 'react';
import { ClothingItem, Review, User, RatingBreakdown } from '../types';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../constants';
import { ChevronLeftIcon, HeartIcon } from '../components/icons/Icons';
import { Button, Badge, Avatar, RatingCircle, CrystalSlider, ProgressBar, ScoreDisplay, Lightbox } from '../components/UI';

interface ItemDetailViewProps {
    item: ClothingItem;
    reviews: Review[];
    onBack: () => void;
    currentUser: User;
    onUserClick: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    isFavorite: boolean;
    onAddReview: (review: Partial<Review>) => Promise<void>;
    onToast: (msg: string) => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({ 
    item, reviews, onBack, currentUser, onUserClick, onToggleFavorite, isFavorite, onAddReview, onToast 
}) => {
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
