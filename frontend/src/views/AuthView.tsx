import React, { useState } from 'react';
import { Button } from '../components/UI';

interface AuthViewProps {
    onLogin: (email: string, password: string) => void;
    onRegister: (username: string, email: string, password: string) => void;
    loading: boolean;
    error: string;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, loading, error }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            onLogin(email, password);
        } else {
            onRegister(username, email, password);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="z-10 bg-white border-2 border-black p-12 shadow-neo-lg max-w-md w-full text-center relative">
                <div className="bg-neo-yellow border-2 border-black w-20 h-20 flex items-center justify-center text-4xl font-black mx-auto mb-8 shadow-neo absolute -top-10 left-1/2 -translate-x-1/2">
                    VR
                </div>
                <h1 className="text-4xl font-black uppercase mb-2 mt-8">Vogue Rate</h1>
                <p className="font-mono text-sm text-gray-500 mb-8 uppercase">
                    {isLogin ? 'Войти в аккаунт' : 'Создать аккаунт'}
                </p>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold uppercase">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">USERNAME</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:shadow-neo transition-shadow font-mono"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-black uppercase mb-2">{isLogin ? 'USERNAME ИЛИ EMAIL' : 'EMAIL'}</label>
                        <input
                            type={isLogin ? 'text' : 'email'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:shadow-neo transition-shadow font-mono"
                            required
                            placeholder={isLogin ? 'admin' : 'email@example.com'}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase mb-2">ПАРОЛЬ</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:shadow-neo transition-shadow font-mono"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
                        {loading ? 'ЗАГРУЗКА...' : isLogin ? 'ВОЙТИ' : 'СОЗДАТЬ АККАУНТ'}
                    </Button>
                </form>
                
                <div className="mt-6">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-bold text-gray-500 hover:text-black transition-colors">
                        {isLogin ? '→ Нет аккаунта? Создать' : '← Уже есть аккаунт? Войти'}
                    </button>
                </div>
                
            </div>
        </div>
    );
};
