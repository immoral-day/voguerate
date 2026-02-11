import React, { useState, useMemo, useEffect } from 'react';
import { UpcomingDrop } from '../types';
import { DEFAULT_ITEM_IMAGE } from '../constants';
import { HeartIcon } from '../components/icons/Icons';
import { Button } from '../components/UI';

interface CalendarViewProps {
    drops: UpcomingDrop[];
    onCop: (id: string) => void;
    currentUserId: string;
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getCountdown(date: Date): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '';
    if (diff === 0) return 'сегодня';
    if (diff === 1) return 'завтра';
    if (diff < 7) return `через ${diff} дн.`;
    if (diff < 30) return `через ${Math.floor(diff / 7)} нед.`;
    return `через ${Math.floor(diff / 30)} мес.`;
}

function getCalendarDays(year: number, month: number) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = (first.getDay() + 6) % 7;
    const days: (number | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    return days;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ drops, onCop, currentUserId }) => {
    const [filter, setFilter] = useState<'UPCOMING' | 'RELEASED'>('UPCOMING');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [calendarDate, setCalendarDate] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const filteredDrops = useMemo(() => {
        const list = drops.filter(d => {
            const isReleased = new Date(d.releaseDate) < new Date();
            return filter === 'RELEASED' ? isReleased : !isReleased;
        });
        return [...list].sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    }, [drops, filter]);

    const dropsByDate = useMemo(() => {
        const map = new Map<string, UpcomingDrop[]>();
        filteredDrops.forEach(d => {
            const key = new Date(d.releaseDate).toDateString();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(d);
        });
        return map;
    }, [filteredDrops]);

    const daysWithDrops = useMemo(() => {
        const set = new Set<number>();
        filteredDrops.forEach(d => {
            const rd = new Date(d.releaseDate);
            if (rd.getFullYear() === calendarDate.year && rd.getMonth() === calendarDate.month) {
                set.add(rd.getDate());
            }
        });
        return set;
    }, [filteredDrops, calendarDate.year, calendarDate.month]);

    const displayDrops = useMemo(() => {
        if (selectedDay === null) return filteredDrops;
        const key = new Date(calendarDate.year, calendarDate.month, selectedDay).toDateString();
        return dropsByDate.get(key) ?? [];
    }, [filteredDrops, dropsByDate, selectedDay, calendarDate.year, calendarDate.month]);

    const groupedByMonth = useMemo(() => {
        const groups = new Map<string, UpcomingDrop[]>();
        displayDrops.forEach(d => {
            const d2 = new Date(d.releaseDate);
            const key = `${MONTHS[d2.getMonth()]} ${d2.getFullYear()}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(d);
        });
        return Array.from(groups.entries());
    }, [displayDrops]);

    useEffect(() => {
        if (filteredDrops.length === 0) return;
        const date = filter === 'UPCOMING'
            ? new Date(filteredDrops[0].releaseDate)
            : new Date(filteredDrops[filteredDrops.length - 1].releaseDate);
        setCalendarDate({ year: date.getFullYear(), month: date.getMonth() });
        setSelectedDay(null);
    }, [filter, filteredDrops]);

    const handlePrevMonth = () => {
        setCalendarDate(prev => {
            if (prev.month === 0) return { year: prev.year - 1, month: 11 };
            return { year: prev.year, month: prev.month - 1 };
        });
        setSelectedDay(null);
    };

    const handleNextMonth = () => {
        setCalendarDate(prev => {
            if (prev.month === 11) return { year: prev.year + 1, month: 0 };
            return { year: prev.year, month: prev.month + 1 };
        });
        setSelectedDay(null);
    };

    const handleCop = async (id: string) => {
        setLoadingId(id);
        await onCop(id);
        setLoadingId(null);
    };

    const hasUserCopped = (drop: UpcomingDrop) => drop.coppedBy?.includes(currentUserId) ?? false;

    const calendarDays = getCalendarDays(calendarDate.year, calendarDate.month);

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 order-2 lg:order-1">
                    <div className="bg-white border-2 border-black p-4 mb-6 sticky top-24">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black uppercase text-sm">{MONTHS[calendarDate.month]} {calendarDate.year}</h3>
                            <div className="flex gap-1">
                                <button 
                                    onClick={handlePrevMonth}
                                    className="w-8 h-8 border-2 border-black font-black text-sm hover:bg-black hover:text-white transition-all"
                                >‹</button>
                                <button 
                                    onClick={handleNextMonth}
                                    className="w-8 h-8 border-2 border-black font-black text-sm hover:bg-black hover:text-white transition-all"
                                >›</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {WEEKDAYS.map(w => (
                                <div key={w} className="text-[10px] font-bold text-gray-500 uppercase">{w}</div>
                            ))}
                            {calendarDays.map((day, i) => (
                                <button
                                    key={i}
                                    onClick={() => day !== null && setSelectedDay(prev => prev === day ? null : day)}
                                    className={`relative aspect-square text-xs font-bold border transition-all ${
                                        day === null ? 'invisible' : 
                                        selectedDay === day 
                                            ? 'bg-black text-white border-black' 
                                            : daysWithDrops.has(day)
                                                ? 'border-neo-blue bg-neo-blue/10 hover:bg-neo-blue/20'
                                                : 'border-gray-200 hover:border-black'
                                    }`}
                                >
                                    {day ?? ''}
                                    {day !== null && daysWithDrops.has(day) && selectedDay !== day && (
                                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neo-blue" />
                                    )}
                                </button>
                            ))}
                        </div>
                        {selectedDay !== null && (
                            <button 
                                onClick={() => setSelectedDay(null)}
                                className="mt-3 w-full text-xs font-bold uppercase text-gray-500 hover:text-black"
                            >
                                Сбросить дату
                            </button>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 order-1 lg:order-2 space-y-8">
                    {groupedByMonth.length > 0 ? groupedByMonth.map(([monthLabel, monthDrops]) => (
                        <div key={monthLabel}>
                            <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2 inline-block">{monthLabel}</h3>
                            <div className="space-y-4">
                                {monthDrops.map((drop, idx) => {
                                    const date = new Date(drop.releaseDate);
                                    const isReleased = date < new Date();
                                    const countdown = !isReleased ? getCountdown(date) : '';

                                    return (
                                        <div key={drop.id} className="group bg-white border-2 border-black p-4 flex flex-col md:flex-row gap-6 hover:shadow-neo transition-all hover:-translate-y-1 relative overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-neo-yellow group-hover:w-4 transition-all"></div>
                                            
                                            <div className="w-full md:w-32 h-32 border-2 border-black flex-shrink-0">
                                                <img src={drop.image || DEFAULT_ITEM_IMAGE} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col justify-center pl-4">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-xs font-bold bg-black text-white px-2 py-0.5 uppercase">{drop.brand}</span>
                                                    <span className="text-xs font-mono font-bold text-gray-500">{date.toLocaleDateString('ru-RU')}</span>
                                                    {countdown && (
                                                        <span className="text-xs font-bold text-neo-blue uppercase">{countdown}</span>
                                                    )}
                                                </div>
                                                <h3 className="text-2xl font-black uppercase mb-2">{drop.name}</h3>
                                                <div className="flex gap-4 text-xs font-bold uppercase text-gray-600">
                                                    <span>Цена: {drop.price === 'TBA' ? 'TBA' : `${drop.price} ₽`}</span>
                                                    <span>•</span>
                                                    <span>{isReleased ? 'Владельцы' : 'Ждут'}: {drop.copCount || 0}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center pr-4">
                                                {!isReleased && (
                                                    hasUserCopped(drop) ? (
                                                        <span className="px-4 py-2 bg-neo-yellow border-2 border-black font-black text-sm flex items-center gap-2">
                                                            <HeartIcon filled />
                                                            ОЖИДАЮ
                                                        </span>
                                                    ) : (
                                                        <Button 
                                                            onClick={() => handleCop(drop.id)}
                                                            disabled={loadingId === drop.id}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <HeartIcon />
                                                            {loadingId === drop.id ? 'ДОБАВЛЯЮ...' : 'ЖДУ'}
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )) : (
                        <div className="p-12 border-2 border-dashed border-black text-center font-mono font-bold text-gray-500 uppercase">
                            {selectedDay !== null ? 'В выбранный день релизов нет.' : 'В этом разделе пока пусто.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
