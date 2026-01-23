import React from 'react';
import { ClothingItem } from '../types';
import { DEFAULT_ITEM_IMAGE } from '../constants';
import { StarIcon } from '../components/icons/Icons';
import { UnifiedCard } from '../components/UI';

interface TopRatedViewProps {
    items: ClothingItem[];
    onItemClick: (id: string) => void;
}

export const TopRatedView: React.FC<TopRatedViewProps> = ({ items, onItemClick }) => (
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
