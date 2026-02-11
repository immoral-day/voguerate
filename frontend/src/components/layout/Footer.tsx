import React from 'react';

export const Footer: React.FC = () => (
    <footer className="bg-black text-white py-12 px-8 border-t-2 border-black mt-auto relative z-10">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
                <div className="font-black text-4xl mb-4">ВР</div>
                <div className="font-mono text-xs text-gray-500 max-w-xs leading-relaxed">
                    Архивируем модную критику, чтобы завтра не стыдно было за сегодняшний «хайп».
                    <br />
                    Все рецензии проходят ручную модерацию и защищены от спама, ботов и копипасты.
                    <br />
                    ВР, {new Date().getFullYear()}.
                </div>
            </div>
            <div className="flex gap-8 font-mono text-[10px] font-bold text-gray-500 uppercase">
                <span>Без рекламы</span>
                <span>Без реферальных ссылок</span>
                <span>Без продаж аккаунтов</span>
            </div>
        </div>
    </footer>
);
