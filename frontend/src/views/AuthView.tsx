import React, { useState } from 'react';

interface AuthViewProps {
    onLogin: (email: string, password: string) => void;
    onRegister: (username: string, email: string, password: string, passwordConfirmation: string) => void;
    loading: boolean;
    error: string;
    onContinueAsGuest?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, loading, error, onContinueAsGuest }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (isLogin) {
            setLocalError('');
            onLogin(email.trim(), password);
            return;
        }
        if (password !== passwordConfirmation) {
            setLocalError('Пароли не совпадают.');
            return;
        }
        setLocalError('');
        onRegister(username.trim(), email.trim(), password, passwordConfirmation);
    };

    return (
        <div className="auth-shell">
            {isLogin ? (
                <section className="auth-card-login">
                    <h1>Вход</h1>
                    <form onSubmit={handleSubmit} className="auth-compact-form">
                        {(localError || error) && <div className="auth-error">{localError || error}</div>}
                        <label>
                            Имя пользователя или email
                            <input
                                type="text"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="admin или email@example.com"
                                autoComplete="username"
                                required
                            />
                        </label>
                        <label>
                            Пароль
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </label>
                        <button className="auth-submit" type="submit" disabled={loading}>
                            {loading ? 'Проверка...' : 'Войти'}
                        </button>
                    </form>
                    <button className="auth-inline-link" type="button" onClick={() => {
                        setLocalError('');
                        setIsLogin(false);
                    }}>
                        Создать аккаунт
                    </button>
                    <p className="auth-policy-note">
                        Если вас заблокировали по ошибке навсегда, это ваша проблема.
                    </p>
                    {onContinueAsGuest && (
                        <button className="auth-inline-link" type="button" onClick={onContinueAsGuest}>
                            Продолжить как гость
                        </button>
                    )}
                </section>
            ) : (
                <section className="auth-split">
                    <div className="auth-form-pane">
                        <h1>Создать аккаунт</h1>
                        <form onSubmit={handleSubmit} className="auth-compact-form">
                            {(localError || error) && <div className="auth-error">{localError || error}</div>}
                            <label>
                                Email
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="mail@example.com"
                                    autoComplete="email"
                                    required
                                />
                            </label>
                            <label>
                                Отображаемое имя
                                <input
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    placeholder="Ваш никнейм"
                                    autoComplete="username"
                                    required
                                />
                            </label>
                            <label>
                                Пароль
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                            </label>
                            <label>
                                Подтвердите пароль
                                <input
                                    type="password"
                                    value={passwordConfirmation}
                                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                            </label>
                            <button className="auth-submit" type="submit" disabled={loading}>
                                {loading ? 'Создание...' : 'Создать аккаунт'}
                            </button>
                        </form>
                        <button className="auth-inline-link" type="button" onClick={() => {
                            setLocalError('');
                            setIsLogin(true);
                        }}>
                            Уже есть аккаунт? Войти
                        </button>
                        {onContinueAsGuest && (
                            <button className="auth-inline-link" type="button" onClick={onContinueAsGuest}>
                                Продолжить как гость
                            </button>
                        )}
                    </div>
                    <div className="auth-side-pane">
                        <div className="auth-side-logo">ВОЯЖ<br />РЕЙТ</div>
                        <div>
                            <strong>Архив оценок и рецензий.</strong>
                            <span>Предмет, оценка, рецензия, автор, репутация и реакция сообщества.</span>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
