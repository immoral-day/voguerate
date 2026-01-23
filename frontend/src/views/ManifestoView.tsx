import React from 'react';

export const ManifestoView: React.FC = () => (
    <div className="animate-fade-in max-w-4xl mx-auto pb-20 pt-10">
        <h1 className="text-8xl font-black mb-12 text-black uppercase leading-[0.8] tracking-tighter">
            МАНИФЕСТ<br/><span className="text-neo-pink">VOGUE RATE</span>
        </h1>
        <div className="border-l-4 border-black pl-8 space-y-8">
            <p className="text-2xl font-bold text-black uppercase leading-tight animate-slide-up delay-100 opacity-0">
                МОДА — ЭТО НЕ ТО, ЧТО ВАМ ПРОДАЮТ.<br/>
                МОДА — ЭТО ТО, КАК ВЫ ЭТО ОЦЕНИВАЕТЕ.
            </p>
            <p className="text-lg font-mono font-bold text-gray-700 max-w-2xl animate-slide-up delay-200 opacity-0">
                Мы отвергаем алгоритмы. Мы отвергаем проплаченные обзоры. 
                VogueRate — это зона боевых действий для вашего вкуса. 
                Каждая оценка имеет вес. Каждая рецензия — это выстрел в пустоту консьюмеризма.
            </p>
            <div className="bg-neo-yellow border-2 border-black p-6 shadow-neo inline-block rotate-1 animate-slide-up delay-300 opacity-0">
                <p className="font-black text-xl uppercase">
                    ЦИФРЫ НЕ ЛГУТ. <br/>ХАЙП УМИРАЕТ. <br/>СТИЛЬ ВЕЧЕН.
                </p>
            </div>
            <p className="text-lg font-mono font-bold text-gray-700 max-w-2xl animate-slide-up delay-400 opacity-0">
                Присоединяйтесь к архиву. Оставьте свой след. Или оставайтесь невидимым.
            </p>
        </div>
    </div>
);
