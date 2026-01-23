import React from 'react';

export const Footer: React.FC = () => (
    <footer className="bg-black text-white py-12 px-8 border-t-2 border-black mt-auto relative z-10">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
                <div className="font-black text-4xl mb-4">VR</div>
                <div className="font-mono text-xs text-gray-500 max-w-xs">
                    ARCHIVING FASHION CULTURE ONE REVIEW AT A TIME. 
                    <br/>EST. 2024.
                </div>
            </div>
            <div className="flex gap-8 font-mono text-xs font-bold text-gray-400">
                <a href="#" className="hover:text-white uppercase">Instagram</a>
                <a href="#" className="hover:text-white uppercase">Twitter</a>
                <a href="#" className="hover:text-white uppercase">Discord</a>
                <a href="#" className="hover:text-white uppercase">Manifesto</a>
            </div>
        </div>
    </footer>
);
