import React from 'react';

export const Footer: React.FC = () => (
    <footer className="mt-auto border-t border-[var(--line)] pt-6 text-[12px] text-[var(--muted)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <div className="logo !inline-block !justify-self-auto !text-[24px] mb-3">ВОЯЖ<br />РЕЙТ</div>
                <p className="max-w-xl">
                    Архив модной критики: предмет, оценка, рецензия, автор, репутация и реакция сообщества.
                </p>
            </div>
            <div className="flex flex-wrap gap-3">
                <span className="pill">без рекламы</span>
                <span className="pill">без реферальных ссылок</span>
                <span className="pill red">«ВОЯЖРЕЙТ» © 2024-{new Date().getFullYear()}</span>
            </div>
        </div>
    </footer>
);
