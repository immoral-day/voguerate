import React, { useMemo, useState } from 'react';
import { ClothingItem, Review, UpcomingDrop } from '../types';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../constants';
import { Avatar } from '../components/UI';
import { categoryLabel } from '../utils/labels';

interface HomeViewProps {
    items: ClothingItem[];
    reviews: Review[];
    drops: UpcomingDrop[];
    onItemClick: (id: string) => void;
    onUserClick: (id: string) => void;
    onManifestoClick: () => void;
    onCalendarClick?: () => void;
}

const formatPrice = (price: number | string) => (
    typeof price === 'number' ? `${price.toLocaleString('ru-RU')} руб.` : price
);

const uniqueItems = (items: ClothingItem[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

type ReleaseFilter = 'ALL' | 'RECENT' | 'TOP' | ClothingItem['category'];

export const HomeView: React.FC<HomeViewProps> = ({
    items,
    reviews,
    drops,
    onItemClick,
    onManifestoClick,
    onUserClick,
    onCalendarClick,
}) => {
    const [discussedIndex, setDiscussedIndex] = useState(0);
    const [discussedDirection, setDiscussedDirection] = useState<1 | -1>(1);
    const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('RECENT');
    const topItems = useMemo(() => [...items].sort((a, b) => b.averageRating - a.averageRating).slice(0, 12), [items]);
    const recentItems = useMemo(() => [...items].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()).slice(0, 12), [items]);
    const discussedItems = useMemo(() => [...items].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 8), [items]);
    const releaseDeck = useMemo(() => uniqueItems([...recentItems, ...topItems]).slice(0, 12), [recentItems, topItems]);
    const releaseCategories = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);
    const releaseFilters: Array<{ id: ReleaseFilter; label: string }> = useMemo(() => [
        { id: 'RECENT', label: 'Новые' },
        { id: 'TOP', label: 'Топ' },
        { id: 'ALL', label: 'Все' },
        ...releaseCategories.map((category) => ({ id: category, label: categoryLabel(category) })),
    ], [releaseCategories]);
    const filteredReleaseDeck = useMemo(() => (
        releaseFilter === 'RECENT'
            ? recentItems
            : releaseFilter === 'TOP'
                ? topItems
                : releaseFilter === 'ALL'
                    ? releaseDeck
                    : [...items]
                        .filter((item) => item.category === releaseFilter)
                        .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    ).slice(0, 12), [items, recentItems, releaseDeck, releaseFilter, topItems]);
    const liveReviews = useMemo(() => [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6), [reviews]);
    const upcomingDrops = useMemo(() => drops
        .filter((drop) => new Date(drop.releaseDate) >= new Date())
        .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())
        .slice(0, 6), [drops]);

    const averageScore = useMemo(() => (
        items.length
            ? Math.round(items.reduce((sum, item) => sum + item.averageRating, 0) / items.length)
            : 0
    ), [items]);
    const topPodium = topItems.slice(0, 3);
    const topRows = topItems.slice(3, 10);
    const normalizedDiscussedIndex = discussedItems.length
        ? ((discussedIndex % discussedItems.length) + discussedItems.length) % discussedItems.length
        : 0;
    const discussedVisibleCount = Math.min(5, discussedItems.length);
    const discussedHalf = Math.floor(discussedVisibleCount / 2);
    const discussedOffsets = Array.from({ length: discussedVisibleCount }, (_, index) => index - discussedHalf);

    const getDiscussedItem = (offset: number) => {
        if (!discussedItems.length) return null;
        return discussedItems[(normalizedDiscussedIndex + offset + discussedItems.length) % discussedItems.length];
    };

    const shiftDiscussed = (direction: -1 | 1) => {
        if (!discussedItems.length) return;
        setDiscussedDirection(direction);
        setDiscussedIndex((current) => current + direction);
    };

    const renderReleaseCard = (item: ClothingItem, index: number) => (
        <article className="release-card" key={`${item.id}-${index}`} onClick={() => onItemClick(item.id)}>
            <div className="release-cover">
                <img src={item.image || DEFAULT_ITEM_IMAGE} alt={item.name} loading="lazy" />
                <div className="cover-meta">
                    <span className="tiny">{item.ratingCount}</span>
                    <span className="tiny">#{index + 1}</span>
                </div>
            </div>
            <div className="release-title">{item.name}</div>
            <div className="release-meta">{item.brand}</div>
            <div className="rating-pair">
                <span>{item.averageRating}</span>
                <span>{item.ratingCount}</span>
            </div>
            <div className="listen-row">
                <button type="button" onClick={(event) => { event.stopPropagation(); onItemClick(item.id); }}>Открыть</button>
                <span>{categoryLabel(item.category)}</span>
            </div>
        </article>
    );

    return (
        <div className="animate-fade-in">
            <div className="top-strip-wrap">
                <span className="top-strip-label">топ по оценкам и рецензиям сообщества</span>
                <div className="top-strip">
                    {topItems.map((item) => (
                        <button className="round-release" type="button" key={item.id} onClick={() => onItemClick(item.id)}>
                            <span className="round-cover"><img src={item.image || DEFAULT_ITEM_IMAGE} alt={item.name} loading="lazy" /></span>
                            <span>{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <section className="summary-line">
                <button className="logo summary-logo" type="button" onClick={onManifestoClick}>ВОЯЖРЕЙТ</button>
                <span>Архив оценок, рецензий и релизов. Контент важнее оболочки.</span>
                <strong>{averageScore}/90</strong>
            </section>

            <section>
                <div className="section-head">
                    <div className="section-title"><span className="section-icon">HOT</span><h2 className="vr-h2">Самые обсуждаемые</h2></div>
                    <span className="pill">по количеству оценок · {discussedItems.reduce((sum, item) => sum + item.ratingCount, 0)}</span>
                </div>
                {discussedItems.length > 0 ? (
                    <div className={`hot-carousel ${discussedDirection === 1 ? 'next' : 'prev'}`}>
                        <button className="hot-arrow" type="button" aria-label="Предыдущий" onClick={() => shiftDiscussed(-1)}>‹</button>
                        <div className="hot-carousel-track">
                            {discussedOffsets.map((offset) => {
                                const item = getDiscussedItem(offset);
                                if (!item) return null;
                                const originalIndex = discussedItems.findIndex((entry) => entry.id === item.id);
                                const tone = offset === 0 ? 'active' : Math.abs(offset) === 1 ? 'side' : 'edge';

                                return (
                                    <article
                                        className={`hot-card ${tone}`}
                                        key={`${item.id}-${offset}`}
                                        onClick={() => {
                                            if (offset === 0) {
                                                onItemClick(item.id);
                                                return;
                                            }
                                            setDiscussedDirection(offset > 0 ? 1 : -1);
                                            setDiscussedIndex((current) => current + offset);
                                        }}
                                    >
                                        <div className="hot-cover">
                                            <img src={item.image || DEFAULT_ITEM_IMAGE} alt={item.name} />
                                            <span>#{originalIndex + 1}</span>
                                        </div>
                                        <div className="hot-copy">
                                            <strong>{item.name}</strong>
                                            <span>{item.brand}</span>
                                            <small>{categoryLabel(item.category)}</small>
                                        </div>
                                        <div className="hot-stats">
                                            <b>{item.averageRating}</b>
                                            <span>{item.ratingCount} оценок</span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        <button className="hot-arrow" type="button" aria-label="Следующий" onClick={() => shiftDiscussed(1)}>›</button>
                    </div>
                ) : (
                    <div className="card p-8 muted">Пока нет обсуждаемых вещей.</div>
                )}
            </section>

            <section>
                <div className="section-head">
                    <div className="section-title"><span className="section-icon">REV</span><h2 className="vr-h2">Последние рецензии</h2></div>
                    <span className="pill">всего рецензий · {reviews.length}</span>
                </div>
                <div className="grid cards-3">
                    {liveReviews.map((review) => (
                        <article className="comment-card" key={review.id} onClick={() => onItemClick(review.clothingId)}>
                            <div className="comment-head">
                                <Avatar src={review.user?.avatar || DEFAULT_AVATAR} alt={review.user?.username || 'Автор'} onClick={(event) => { event?.stopPropagation(); onUserClick(review.userId); }} />
                                <div className="min-w-0">
                                    <strong>{review.user?.username || 'Автор'}</strong>
                                    <span>{review.clothing?.name || 'Рецензия'}</span>
                                </div>
                                <img src={review.clothing?.image || DEFAULT_ITEM_IMAGE} alt={review.clothing?.name || 'Предмет'} loading="lazy" />
                            </div>
                            <h3>{review.clothing?.name || 'Новая рецензия'}</h3>
                            <p>{review.text}</p>
                            <div className="review-actions">
                                <span>{review.likes} лайков</span>
                                <span>{review.rating}/90</span>
                            </div>
                        </article>
                    ))}
                    {liveReviews.length === 0 && <div className="card p-8 muted">Рецензий пока нет.</div>}
                </div>
            </section>

            <section>
                <div className="section-head">
                    <div className="section-title"><h2 className="vr-h2">Добавленные релизы</h2></div>
                    <span className="pill">всего релизов · {items.length}</span>
                </div>
                <div className="release-filter-row" aria-label="Фильтры релизов">
                    {releaseFilters.map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            className={releaseFilter === filter.id ? 'active' : ''}
                            onClick={() => setReleaseFilter(filter.id)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
                <div className="release-grid release-row">
                    {filteredReleaseDeck.map(renderReleaseCard)}
                </div>
            </section>

            <div className="dashboard-grid mt-4">
                <section className="card top-board">
                    <div className="section-head !m-0 px-3 py-2">
                        <div className="section-title"><span className="section-icon">TOP</span><h2 className="vr-h2">Рейтинг вещей</h2></div>
                        <span className="pill">{topItems.length}</span>
                    </div>
                    <div className="top-board-podium">
                        {topPodium.map((item, index) => (
                            <button className={`top-release-card place-${index + 1}`} key={item.id} type="button" onClick={() => onItemClick(item.id)}>
                                <span className="top-release-cover">
                                    <img src={item.image || DEFAULT_ITEM_IMAGE} alt={item.name} loading="lazy" />
                                    <span className="cover-meta">
                                        <span className="tiny">{item.ratingCount}</span>
                                        <span className="tiny">#{index + 1}</span>
                                    </span>
                                </span>
                                <strong className="top-release-title">{item.name}</strong>
                                <span className="top-release-brand">{item.brand}</span>
                                <span className="rating-pair top-release-rating">
                                    <span>{item.averageRating}</span>
                                    <span>{item.ratingCount}</span>
                                </span>
                                <span className="listen-row top-release-actions">
                                    <span>Открыть</span>
                                    <span>{categoryLabel(item.category)}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="top-board-list">
                        {topRows.map((item, index) => (
                            <button className="top-board-row" key={item.id} type="button" onClick={() => onItemClick(item.id)}>
                                <span>{index + 4}</span>
                                <strong>{item.name}</strong>
                                <small>{item.brand} · {item.ratingCount} оценок</small>
                                <b>{item.averageRating}</b>
                            </button>
                        ))}
                    </div>
                </section>

                <aside className="grid gap-2">
                    <section className="card p-3">
                        <div className="section-title mb-3"><span className="section-icon">NOW</span><h2 className="vr-h2">Срез сообщества</h2></div>
                        <div className="grid gap-2">
                            <div className="review-actions"><span>Средняя оценка</span><strong>{averageScore}/90</strong></div>
                            <div className="review-actions"><span>Последний отзыв</span><strong>{liveReviews[0] ? new Date(liveReviews[0].date).toLocaleDateString('ru-RU') : 'нет'}</strong></div>
                            <div className="review-actions"><span>Следующий релиз</span><strong>{upcomingDrops[0] ? new Date(upcomingDrops[0].releaseDate).toLocaleDateString('ru-RU') : 'нет'}</strong></div>
                        </div>
                    </section>
                    <section className="card p-3">
                        <div className="section-title mb-3"><span className="section-icon">DROP</span><h2 className="vr-h2">Ближайшие</h2></div>
                        <div className="feed-list">
                            {upcomingDrops.slice(0, 4).map((drop) => (
                                <button key={drop.id} className="data-row !grid-cols-[1fr_auto] !min-h-[46px] text-left" onClick={onCalendarClick}>
                                    <span className="min-w-0 flex flex-col justify-center">
                                        <span className="row-title leading-tight">{drop.name}</span>
                                        <span className="row-meta mt-1 leading-tight">{drop.brand} · {new Date(drop.releaseDate).toLocaleDateString('ru-RU')} · {formatPrice(drop.price)}</span>
                                    </span>
                                    <span className="score-badge lime">{drop.copCount || 0}</span>
                                </button>
                            ))}
                            {upcomingDrops.length === 0 && <div className="data-row !grid-cols-[1fr] muted">Ближайших релизов нет.</div>}
                        </div>
                    </section>
                </aside>
            </div>

        </div>
    );
};
