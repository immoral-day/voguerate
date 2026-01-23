import React from 'react';
import { User } from '../types';
import { DEFAULT_AVATAR } from '../constants';
import { Avatar, Badge } from '../components/UI';

interface LeaderboardViewProps {
    users: User[];
    onUserClick: (id: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ users, onUserClick }) => {
    const sortedUsers = [...users].sort((a, b) => b.reputation - a.reputation);
    
    return (
        <div className="animate-fade-in pb-12 max-w-4xl mx-auto">
            <h1 className="text-6xl font-black mb-12 text-black uppercase tracking-tighter">
                ТОП <span className="text-neo-green">КРИТИКОВ</span>
            </h1>
            
            {sortedUsers.length > 0 ? (
                <div className="bg-white border-2 border-black shadow-neo">
                    {sortedUsers.map((user, idx) => (
                        <div 
                            key={user.id} 
                            className="flex items-center p-4 border-b-2 border-black last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors group"
                            onClick={() => onUserClick(user.id)}
                        >
                            <div className="w-16 text-center font-black text-2xl text-gray-300 group-hover:text-black">
                                #{idx + 1}
                            </div>
                            <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.username} size="md" />
                            <div className="ml-4 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg uppercase">{user.username}</span>
                                    {user.badges?.map(b => (
                                        <Badge key={b} className="bg-neo-yellow text-black scale-75 origin-left">{b}</Badge>
                                    ))}
                                </div>
                                <div className="text-xs font-mono text-gray-500">{user.reviewsCount} REVIEWS</div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-2xl">{user.reputation}</div>
                                <div className="text-[10px] uppercase font-bold text-gray-400">REP</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 border-2 border-dashed border-black text-center font-mono font-bold text-gray-500 uppercase">
                    Нет пользователей.
                </div>
            )}
        </div>
    );
};
