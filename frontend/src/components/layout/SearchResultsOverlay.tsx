import React from 'react';
import { ClothingItem, User } from '../../types';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../../constants';
import { Badge, Avatar } from '../UI';

interface SearchResultsOverlayProps {
    query: string;
    items: ClothingItem[];
    users: User[];
    onItemClick: (id: string) => void;
    onUserClick: (id: string) => void;
    onClose: () => void;
}

export const SearchResultsOverlay: React.FC<SearchResultsOverlayProps> = ({ 
    query, items, users, onItemClick, onUserClick, onClose 
}) => {
    if (!query) return null;
    
    const filteredItems = items.filter(i => 
        i.name.toLowerCase().includes(query.toLowerCase()) || 
        i.brand.toLowerCase().includes(query.toLowerCase())
    );
    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div 
            className="fixed top-24 left-[88px] right-0 bottom-0 bg-black/50 backdrop-blur-md z-30 p-8 overflow-y-auto" 
            onClick={onClose}
        >
            <div className="max-w-4xl mx-auto space-y-8" onClick={e => e.stopPropagation()}>
                <div className="bg-white border-2 border-black p-6 shadow-neo-lg">
                    <h2 className="text-2xl font-black uppercase mb-4 border-b-2 border-black pb-2 flex justify-between">
                        КОЛЛЕКЦИИ & ITEMS <Badge>{filteredItems.length}</Badge>
                    </h2>
                    {filteredItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredItems.slice(0, 6).map(item => (
                                <div 
                                    key={item.id} 
                                    className="flex items-center gap-4 p-2 hover:bg-gray-50 cursor-pointer border border-transparent hover:border-black transition-all" 
                                    onClick={() => { onItemClick(item.id); onClose(); }}
                                >
                                    <img src={item.image || DEFAULT_ITEM_IMAGE} className="w-16 h-16 object-cover border border-black" />
                                    <div>
                                        <div className="text-[10px] font-bold bg-neo-yellow inline-block px-1 uppercase mb-1">{item.brand}</div>
                                        <div className="font-bold text-sm leading-tight">{item.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-400 font-mono text-sm uppercase">Ничего не найдено.</div>
                    )}
                </div>

                <div className="bg-white border-2 border-black p-6 shadow-neo-lg">
                    <h2 className="text-2xl font-black uppercase mb-4 border-b-2 border-black pb-2 flex justify-between">
                        ДИЗАЙНЕРЫ & ЛЮДИ <Badge>{filteredUsers.length}</Badge>
                    </h2>
                    {filteredUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredUsers.slice(0, 6).map(user => (
                                <div 
                                    key={user.id} 
                                    className="flex items-center gap-4 p-2 hover:bg-gray-50 cursor-pointer border border-transparent hover:border-black transition-all" 
                                    onClick={() => { onUserClick(user.id); onClose(); }}
                                >
                                    <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.username} size="sm" />
                                    <div>
                                        <div className="font-bold text-sm uppercase">{user.username}</div>
                                        <div className="text-[10px] text-gray-500 font-mono">{user.role} • {user.reputation} REP</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-400 font-mono text-sm uppercase">Ничего не найдено.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
