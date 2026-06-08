import React, { useMemo, useState } from 'react';
import { ClothingItem, RatingBreakdown, Review, User } from '../types';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../constants';
import { Avatar, Lightbox } from '../components/UI';
import { HeartIcon } from '../components/icons/Icons';
import { categoryLabel, typeLabel } from '../utils/labels';

interface ItemDetailViewProps {
    item: ClothingItem;
    reviews: Review[];
    onBack: () => void;
    currentUser: User;
    onUserClick: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    isFavorite: boolean;
    onAddReview: (review: Partial<Review>) => Promise<void>;
    onLikeReview: (reviewId: string) => Promise<void>;
    likedReviewIds: Set<string>;
    onReportReview: (reviewId: string) => void;
    onToast: (msg: string) => void;
}

const MIN_REVIEW_LENGTH = 10;

const breakdownKeys: Array<keyof RatingBreakdown> = ['concept', 'execution', 'dna', 'relevance', 'vibe'];

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
    item,
    reviews,
    onBack,
    currentUser,
    onUserClick,
    onToggleFavorite,
    isFavorite,
    onAddReview,
    onLikeReview,
    likedReviewIds,
    onReportReview,
    onToast,
}) => {
    const [ratings, setRatings] = useState<RatingBreakdown>({
        concept: 5,
        execution: 5,
        dna: 5,
        relevance: 3,
        vibe: 3,
    });
    const [newReviewText, setNewReviewText] = useState('');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [likingReviewId, setLikingReviewId] = useState<string | null>(null);

    const totalScore = useMemo(() => (
        ratings.concept * 2 +
        ratings.execution * 2 +
        ratings.dna * 2 +
        ratings.relevance * 3 +
        ratings.vibe * 3
    ), [ratings]);

    const sortedReviews = useMemo(
        () => [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [reviews],
    );
    const hasUserReviewed = useMemo(
        () => reviews.some((review) => review.userId === currentUser.id),
        [currentUser.id, reviews],
    );
    const galleryImages = useMemo(() => {
        const images = [item.image, ...(item.images || [])].filter(Boolean);
        return Array.from(new Set(images)).slice(0, 3);
    }, [item.image, item.images]);
    const image = galleryImages[0] || DEFAULT_ITEM_IMAGE;

    const averageBreakdown = useMemo(() => {
        const breakdownReviews = reviews.filter((review) => review.ratingBreakdown);
        if (breakdownReviews.length === 0) return null;

        return breakdownKeys.reduce((acc, key) => {
            const sum = breakdownReviews.reduce((total, review) => total + (review.ratingBreakdown?.[key] || 0), 0);
            acc[key] = Math.round((sum / breakdownReviews.length) * 10) / 10;
            return acc;
        }, {} as RatingBreakdown);
    }, [reviews]);

    const ratingRows = [
        { key: 'concept', label: 'Идея вещи', multiplier: 2, max: 10, value: ratings.concept },
        { key: 'execution', label: 'Качество исполнения', multiplier: 2, max: 10, value: ratings.execution },
        { key: 'dna', label: 'Индивидуальность', multiplier: 2, max: 10, value: ratings.dna },
        { key: 'relevance', label: 'Актуальность', multiplier: 3, max: 5, value: ratings.relevance },
        { key: 'vibe', label: 'Общее впечатление', multiplier: 3, max: 5, value: ratings.vibe },
    ] as const;

    const breakdownRows = [
        { key: 'concept', label: 'идея', max: 10 },
        { key: 'execution', label: 'качество', max: 10 },
        { key: 'dna', label: 'индивидуальность', max: 10 },
        { key: 'relevance', label: 'актуальность', max: 5 },
        { key: 'vibe', label: 'впечатление', max: 5 },
    ] as const;

    const submitReview = async () => {
        const trimmedText = newReviewText.trim();
        if (trimmedText.length < MIN_REVIEW_LENGTH) {
            onToast(`Минимум ${MIN_REVIEW_LENGTH} символов`);
            return;
        }

        setSubmitting(true);
        try {
            await onAddReview({
                userId: currentUser.id,
                clothingId: item.id,
                rating: totalScore,
                ratingBreakdown: ratings,
                text: trimmedText,
            });
            setNewReviewText('');
            onToast('Рецензия опубликована');
        } finally {
            setSubmitting(false);
        }
    };

    const likeReview = async (reviewId: string) => {
        setLikingReviewId(reviewId);
        try {
            await onLikeReview(reviewId);
        } finally {
            setLikingReviewId(null);
        }
    };

    return (
        <div className="animate-fade-in">
            {lightboxIndex !== null && (
                <Lightbox
                    images={galleryImages.length ? galleryImages : [image]}
                    initialIndex={lightboxIndex}
                    alt={item.name}
                    onClose={() => setLightboxIndex(null)}
                />
            )}

            <div className="section-head">
                <div className="section-title"><span className="section-icon">ВЩ</span><h1 className="vr-h2">Карточка вещи</h1></div>
                <button className="btn" type="button" onClick={onBack}>Назад</button>
            </div>

            <div className="item-detail-hero">
                <article className="item-detail-main">
                    <button className="detail-cover" type="button" onClick={() => setLightboxIndex(0)}>
                        <img src={image} alt={item.name} />
                    </button>
                    {galleryImages.length > 1 && (
                        <div className="detail-gallery-strip">
                            {galleryImages.map((galleryImage, index) => (
                                <button
                                    type="button"
                                    key={galleryImage}
                                    className={index === 0 ? 'active' : ''}
                                    onClick={() => setLightboxIndex(index)}
                                >
                                    <img src={galleryImage} alt={`${item.name} ${index + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="detail-copy">
                        <div className="detail-tags">
                            <span className="pill blue">{typeLabel(item.type)}</span>
                            <span className="pill lime">Релиз {new Date(item.releaseDate).getFullYear()}</span>
                        </div>
                        <h1 className="detail-title">{item.name}</h1>
                        <p className="lead">{item.brand} · {categoryLabel(item.category)} · {item.price.toLocaleString('ru-RU')} ₽</p>
                        <button
                            className={`btn ${isFavorite ? 'red' : ''}`}
                            type="button"
                            onClick={() => {
                                onToggleFavorite(item.id);
                                onToast(isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное');
                            }}
                        >
                            {isFavorite ? 'В избранном' : 'Добавить в избранное'}
                        </button>
                    </div>
                </article>

                <aside className="side-panel">
                    <div>
                        <span className="pill red">Средний рейтинг</span>
                        <div className="big-score">{item.averageRating}<span className="text-2xl text-[var(--muted)] tracking-normal">/90</span></div>
                        <p className="muted">{item.ratingCount} оценок сообщества</p>
                    </div>
                    <div className="breakdown">
                        {averageBreakdown ? (
                            breakdownRows.map((row) => {
                                const value = averageBreakdown[row.key];
                                return (
                                    <div className="break-row" key={row.key}>
                                        <span>{row.label}</span>
                                        <div className="bar"><span style={{ width: `${Math.min(100, (value / row.max) * 100)}%` }} /></div>
                                        <b>{value}</b>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="muted">Детализация появится после рецензий со слайдерами.</p>
                        )}
                    </div>
                </aside>
            </div>

            <div className="section-head">
                <div className="section-title"><span className="section-icon">90</span><h2 className="vr-h2">Оценить вещь</h2></div>
                <span className="pill">максимум 90</span>
            </div>

            {hasUserReviewed ? (
                <div className="card p-6 text-center">
                    <h3 className="vr-h3">Вы уже оценили</h3>
                    <p className="muted">Можно написать только одну рецензию на предмет.</p>
                </div>
            ) : (
                <div className="rating-studio">
                    <div className="rating-grid-panel">
                        {ratingRows.map((row) => (
                            <label className={`rating-row-card ${row.key === 'vibe' ? 'wide purple' : ''}`} key={row.key}>
                                <span className="rating-row-title">{row.label} <small>x{row.multiplier}</small></span>
                                <strong>{row.value}</strong>
                                <input
                                    type="range"
                                    min={1}
                                    max={row.max}
                                    value={row.value}
                                    onChange={(event) => setRatings({ ...ratings, [row.key]: Number(event.target.value) })}
                                />
                            </label>
                        ))}
                    </div>

                    <div className="rating-review-box">
                        <div className="rating-total liquid-total">
                            <span>✓</span>
                            <strong>{totalScore}</strong>
                            <em>/90</em>
                        </div>
                        <label>
                            Рецензия
                            <textarea value={newReviewText} onChange={(event) => setNewReviewText(event.target.value)} placeholder={`Минимум ${MIN_REVIEW_LENGTH} символов. Коротко объясните оценку.`} />
                        </label>
                        <div className="review-actions">
                            <span>{newReviewText.trim().length} / {MIN_REVIEW_LENGTH}</span>
                            <button className="btn rating-submit" type="button" disabled={newReviewText.trim().length < MIN_REVIEW_LENGTH || submitting} onClick={submitReview}>
                                {submitting ? 'Отправка...' : 'Зафиксировать оценку'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="section-head">
                <div className="section-title"><span className="section-icon">РЦ</span><h2 className="vr-h2">Рецензии</h2></div>
                <span className="pill">{sortedReviews.length}</span>
            </div>

            <div className="item-review-list">
                {sortedReviews.map((review) => {
                    const isLikedByCurrentUser = likedReviewIds.has(review.id);

                    return (
                    <article className="review-card" key={review.id}>
                        <div className="review-top">
                            <Avatar src={review.user?.avatar || DEFAULT_AVATAR} alt={review.user?.username || 'User'} onClick={() => onUserClick(review.userId)} />
                            <strong>{review.user?.username || 'Автор'}</strong>
                            <span className="score-badge">{review.rating}</span>
                        </div>
                        <h3 className="vr-h3">{new Date(review.date).toLocaleDateString('ru-RU')}</h3>
                        <p>{review.text}</p>
                        <div className="review-actions">
                            {review.userId === currentUser.id ? (
                                <span className="review-like-chip"><HeartIcon filled /> {review.likes}</span>
                            ) : (
                                <button
                                    className={`review-like-button ${isLikedByCurrentUser ? 'liked' : ''}`}
                                    type="button"
                                    disabled={likingReviewId === review.id}
                                    onClick={() => likeReview(review.id)}
                                    title={isLikedByCurrentUser ? 'Лайк уже учтён' : 'Поддержать рецензию'}
                                >
                                    <HeartIcon filled={isLikedByCurrentUser} />
                                    <span>{review.likes}</span>
                                </button>
                            )}
                            {review.userId !== currentUser.id && <button className="item-btn" type="button" onClick={() => onReportReview(review.id)}>Пожаловаться</button>}
                        </div>
                    </article>
                    );
                })}
                {sortedReviews.length === 0 && <div className="card p-8 muted">Никто ещё не высказался. Ваш выход.</div>}
            </div>
        </div>
    );
};
