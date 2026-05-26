import React, { useEffect, useMemo, useState } from 'react';
import { ClothingItem } from '../types';
import { DEFAULT_ITEM_IMAGE } from '../constants';
import { categoryLabel } from '../utils/labels';
import { SafeImage } from '../components/UI';

interface TopRatedViewProps {
    items: ClothingItem[];
    onItemClick: (id: string) => void;
}

type SortMode = 'VALUE' | 'RATING' | 'COUNT' | 'PRICE';

const categories: ClothingItem['category'][] = ['Streetwear', 'Luxury', 'Techwear', 'Vintage'];
const VALUE_MAX = 25;
const PAGE_SIZE = 10;

const getValueParts = (item: ClothingItem) => {
    const rating = Math.min(15, Math.max(0, (item.averageRating / 90) * 15));
    const confidence = Math.min(5, Math.log2(item.ratingCount + 1) * 1.55);
    const price = item.price > 0 ? Math.max(0, 5 - Math.log10((item.price / 1000) + 1) * 1.35) : 2.5;
    const total = Math.min(VALUE_MAX, Math.round((rating + confidence + price) * 10) / 10);

    return {
        rating: Math.round(rating * 10) / 10,
        confidence: Math.round(confidence * 10) / 10,
        price: Math.round(price * 10) / 10,
        total,
    };
};

const formatValue = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

const getValueTier = (score: number) => {
    if (score >= 22) return { tone: 'gold', label: 'S' };
    if (score >= 18) return { tone: 'blue', label: 'A' };
    if (score >= 13) return { tone: 'green', label: 'B' };
    return { tone: 'dim', label: 'C' };
};

export const TopRatedView: React.FC<TopRatedViewProps> = ({ items, onItemClick }) => {
    const [activeCategory, setActiveCategory] = useState<ClothingItem['category'] | 'ALL'>('ALL');
    const [sortMode, setSortMode] = useState<SortMode>('VALUE');
    const [page, setPage] = useState(1);

    const sorted = useMemo(() => {
        return [...items]
            .filter((item) => activeCategory === 'ALL' || item.category === activeCategory)
            .sort((a, b) => {
                if (sortMode === 'RATING') return b.averageRating - a.averageRating;
                if (sortMode === 'COUNT') return b.ratingCount - a.ratingCount;
                if (sortMode === 'PRICE') return a.price - b.price;
                return getValueParts(b).total - getValueParts(a).total;
            });
    }, [items, activeCategory, sortMode]);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const visibleItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        setPage(1);
    }, [activeCategory, sortMode]);

    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    return (
        <div className="animate-fade-in">
            <div className="section-head">
                <div className="section-title"><h1 className="vr-h1">Ценность вещей</h1></div>
                <span className="pill">индекс из рейтинга, оценок и цены</span>
            </div>

            <div className="value-layout">
                <aside className="value-filter">
                    <span className="info-button">Индекс ценности показывает, насколько вещь сильна по оценкам, стабильности мнения сообщества и доступности цены.</span>
                    <label>
                        Сортировать по
                        <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                            <option value="VALUE">Индекс ценности /25</option>
                            <option value="RATING">Средний рейтинг</option>
                            <option value="COUNT">Количество оценок</option>
                            <option value="PRICE">Цена: дешевле сначала</option>
                        </select>
                    </label>
                    <div className="filter-list">
                        <strong>Фильтры</strong>
                        <button className={activeCategory === 'ALL' ? 'active' : ''} type="button" onClick={() => setActiveCategory('ALL')}>Все вещи</button>
                        {categories.map((category) => (
                            <button
                                className={activeCategory === category ? 'active' : ''}
                                type="button"
                                key={category}
                                onClick={() => setActiveCategory(category)}
                            >
                                {categoryLabel(category)}
                            </button>
                        ))}
                    </div>
                </aside>

                {sorted.length > 0 ? (
                    <div className="value-grid">
                        {visibleItems.map((item) => {
                            const valueParts = getValueParts(item);
                            const valueTier = getValueTier(valueParts.total);
                            return (
                                <article className="value-card" key={item.id} onClick={() => onItemClick(item.id)}>
                                    <div className="value-cover">
                                        <SafeImage src={item.image || DEFAULT_ITEM_IMAGE} fallback={DEFAULT_ITEM_IMAGE} alt={item.name} loading="lazy" />
                                    </div>
                                    <h2>{item.name}</h2>
                                    <span>{item.brand}</span>
                                    <div className={`value-score ${valueTier.tone}`}>
                                        <i aria-hidden="true" />
                                        <strong>{formatValue(valueParts.total)}<small>/{VALUE_MAX}</small></strong>
                                        <em>{valueTier.label}</em>
                                    </div>
                                    <div className="value-breakdown">
                                        <span>рейтинг {formatValue(valueParts.rating)}</span>
                                        <span>доверие {formatValue(valueParts.confidence)}</span>
                                        <span>цена {formatValue(valueParts.price)}</span>
                                    </div>
                                    <div className="review-actions">
                                        <span>{item.averageRating}/90</span>
                                        <span>{item.ratingCount} оценок</span>
                                    </div>
                                    <div className="review-actions">
                                        <span>{categoryLabel(item.category)}</span>
                                        <span>{item.price.toLocaleString('ru-RU')} руб.</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="card p-8 text-center muted">Нет предметов для отображения.</div>
                )}
                {sorted.length > PAGE_SIZE && (
                    <div className="pagination value-pagination">
                        <button className="btn" type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                            Назад
                        </button>
                        <span>{page} / {totalPages}</span>
                        <button className="btn" type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                            Вперёд
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
