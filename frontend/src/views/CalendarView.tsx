import React, { useState } from 'react';
import { UpcomingDrop } from '../types';
import { DEFAULT_ITEM_IMAGE } from '../constants';
import { ChevronLeftIcon } from '../components/icons/Icons';
import { Button } from '../components/UI';

interface CalendarViewProps {
    drops: UpcomingDrop[];
    onDropClick: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ drops }) => {
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
