import { ClothingItem } from '../types';

export const CATEGORY_LABELS: Record<ClothingItem['category'], string> = {
    Streetwear: 'Стритвир',
    Luxury: 'Люкс',
    Techwear: 'Теквир',
    Vintage: 'Винтаж',
};

export const TYPE_LABELS: Record<ClothingItem['type'], string> = {
    SINGLE_LOOK: 'Образ',
    COLLECTION: 'Коллекция',
};

export const categoryLabel = (category?: ClothingItem['category'] | string | null) => {
    if (!category) return '';
    return CATEGORY_LABELS[category as ClothingItem['category']] || category;
};

export const typeLabel = (type?: ClothingItem['type'] | string | null) => {
    if (!type) return '';
    return TYPE_LABELS[type as ClothingItem['type']] || type;
};

export const badgeLabel = (badge?: string | null) => {
    if (!badge) return '';
    const normalized = badge.toUpperCase();
    if (normalized === 'ADMIN') return 'Админ';
    if (normalized === 'DESIGNER') return 'Автор';
    if (normalized === 'VERIFIED' || normalized === 'ВЕРИФИЦИРОВАН') return 'Верифицирован';
    return badge;
};
