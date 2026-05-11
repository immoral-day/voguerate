import React, { useEffect, useMemo, useState } from 'react';
import { UpcomingDrop } from '../types';
import { DEFAULT_ITEM_IMAGE } from '../constants';

interface CalendarViewProps {
    drops: UpcomingDrop[];
    onCop: (id: string) => void;
    currentUserId: string;
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const DROP_PAGE_SIZE = 6;

const formatPrice = (price: number | string) => typeof price === 'number' ? `${price.toLocaleString('ru-RU')} ₽` : price;

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
    const now = new Date();
    const [calendarDate, setCalendarDate] = useState({ year: now.getFullYear(), month: now.getMonth() });
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [page, setPage] = useState(1);

    const filteredDrops = useMemo(() => {
        return drops
            .filter((drop) => filter === 'RELEASED' ? new Date(drop.releaseDate) < new Date() : new Date(drop.releaseDate) >= new Date())
            .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    }, [drops, filter]);

    const daysWithDrops = new Set(
        filteredDrops
            .map((drop) => new Date(drop.releaseDate))
            .filter((date) => date.getFullYear() === calendarDate.year && date.getMonth() === calendarDate.month)
            .map((date) => date.getDate())
    );

    const calendarDays = getCalendarDays(calendarDate.year, calendarDate.month);

    const shiftMonth = (delta: number) => {
        setCalendarDate((prev) => {
            const date = new Date(prev.year, prev.month + delta, 1);
            return { year: date.getFullYear(), month: date.getMonth() };
        });
        setSelectedDay(null);
    };

    const visibleDrops = useMemo(() => {
        if (!selectedDay) return filteredDrops;

        return filteredDrops.filter((drop) => {
            const date = new Date(drop.releaseDate);
            return date.getFullYear() === calendarDate.year
                && date.getMonth() === calendarDate.month
                && date.getDate() === selectedDay;
        });
    }, [calendarDate.month, calendarDate.year, filteredDrops, selectedDay]);
    const totalPages = Math.max(1, Math.ceil(visibleDrops.length / DROP_PAGE_SIZE));
    const pagedDrops = visibleDrops.slice((page - 1) * DROP_PAGE_SIZE, page * DROP_PAGE_SIZE);

    useEffect(() => {
        setPage(1);
    }, [filter, selectedDay, calendarDate.month, calendarDate.year]);

    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    return (
        <div className="animate-fade-in">
            <div className="section-head">
                <div className="section-title"><span className="section-icon">КЛ</span><h1 className="vr-h2">Календарь релизов</h1></div>
                <div className="flex gap-2">
                    <button className={`btn ${filter === 'UPCOMING' ? 'white' : ''}`} onClick={() => { setFilter('UPCOMING'); setSelectedDay(null); }}>Предстоящие</button>
                    <button className={`btn ${filter === 'RELEASED' ? 'white' : ''}`} onClick={() => { setFilter('RELEASED'); setSelectedDay(null); }}>Прошедшие</button>
                </div>
            </div>
            <div className="calendar-layout mt-4">
                <aside className="side-panel calendar-panel">
                    <div>
                        <span className="pill red">{MONTHS[calendarDate.month]} {calendarDate.year}</span>
                        <h2 className="vr-h2 mt-4">Календарь</h2>
                        <p className="muted">Дни с релизами подсвечены. Нажми на день, чтобы увидеть только его релизы.</p>
                    </div>
                    <div className="calendar-grid">
                        {WEEKDAYS.map((day) => <span className="tiny justify-center" key={day}>{day}</span>)}
                        {calendarDays.map((day, idx) => (
                            <button
                                key={idx}
                                className={`calendar-day ${day && daysWithDrops.has(day) ? 'has-drop' : ''} ${day && selectedDay === day ? 'active' : ''}`}
                                disabled={!day}
                                onClick={() => setSelectedDay((current) => current === day ? null : day)}
                            >
                                {day || '—'}
                            </button>
                        ))}
                    </div>
                    {selectedDay && (
                        <button className="btn" type="button" onClick={() => setSelectedDay(null)}>
                            Показать все релизы месяца
                        </button>
                    )}
                    <div className="flex gap-2 mt-2">
                        <button className="btn w-full" onClick={() => shiftMonth(-1)}>Назад</button>
                        <button className="btn w-full" onClick={() => shiftMonth(1)}>Вперёд</button>
                    </div>
                </aside>
                <div className="calendar-drop-area">
                    <div className="section-head !m-0">
                        <div className="section-title">
                            <h2 className="vr-h2">{selectedDay ? `Релизы: ${selectedDay} ${MONTHS[calendarDate.month].toLowerCase()}` : 'Все релизы'}</h2>
                        </div>
                        <span className="pill">{visibleDrops.length}</span>
                    </div>
                    <div className="calendar-drop-grid">
                    {pagedDrops.map((drop) => {
                        const isReleased = new Date(drop.releaseDate) < new Date();
                        const copped = drop.coppedBy?.includes(currentUserId);
                        return (
                            <article className="calendar-drop-card" key={drop.id}>
                                <div className="calendar-drop-cover">
                                    <img src={drop.image || DEFAULT_ITEM_IMAGE} alt={drop.name} loading="lazy" />
                                    <div className="cover-meta">
                                        <span className="tiny">{new Date(drop.releaseDate).toLocaleDateString('ru-RU')}</span>
                                        <span className="tiny">{formatPrice(drop.price)}</span>
                                    </div>
                                </div>
                                <div className="calendar-drop-title">{drop.name}</div>
                                <div className="calendar-drop-brand">{drop.brand}</div>
                                <div className="calendar-drop-meta">
                                    <span>{isReleased ? 'Уже вышло' : 'Ожидается'}</span>
                                    <span>{formatPrice(drop.price)}</span>
                                </div>
                                <div className="rating-pair calendar-drop-stats">
                                    <span>{drop.copCount || 0}</span>
                                    <span>{drop.dropCount || 1}</span>
                                </div>
                                <div className="listen-row calendar-drop-actions">
                                    <button type="button" disabled={isReleased || copped} onClick={() => onCop(drop.id)}>
                                        {isReleased ? 'Вышло' : copped ? 'Ожидаю' : 'Хочу купить'}
                                    </button>
                                    <span>{new Date(drop.releaseDate).toLocaleDateString('ru-RU')}</span>
                                </div>
                            </article>
                        );
                    })}
                    {visibleDrops.length === 0 && <div className="card p-8 muted">В этом разделе пока пусто.</div>}
                    </div>
                    {visibleDrops.length > DROP_PAGE_SIZE && (
                        <div className="compact-pagination">
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
        </div>
    );
};
