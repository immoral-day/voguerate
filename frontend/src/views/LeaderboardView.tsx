import React, { useMemo } from 'react';
import { Review, User } from '../types';
import { DEFAULT_AVATAR } from '../constants';
import { Avatar } from '../components/UI';

interface LeaderboardViewProps {
    users: User[];
    reviews: Review[];
    onUserClick: (id: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ users, reviews, onUserClick }) => {
    const userReviewCounts = useMemo(() => reviews.reduce<Record<string, number>>((acc, review) => {
        acc[review.userId] = (acc[review.userId] || 0) + 1;
        return acc;
    }, {}), [reviews]);
    const getReviewCount = (user: User) => Math.max(user.reviewsCount || 0, userReviewCounts[user.id] || 0);
    const sortedUsers = useMemo(() => [...users].sort((a, b) => (
        (b.reputation || 0) - (a.reputation || 0)
        || getReviewCount(b) - getReviewCount(a)
        || a.username.localeCompare(b.username, 'ru')
    )), [users, userReviewCounts]);
    const totalReviews = reviews.length;
    const totalReviewLikes = reviews.reduce((sum, review) => sum + review.likes, 0);
    const totalReputation = users.reduce((sum, user) => sum + user.reputation, 0);
    const userReviewLikes = useMemo(() => reviews.reduce<Record<string, number>>((acc, review) => {
        acc[review.userId] = (acc[review.userId] || 0) + review.likes;
        return acc;
    }, {}), [reviews]);
    const podiumUsers = sortedUsers.slice(0, 3);
    const rankedUsers = sortedUsers.slice(3);

    return (
        <div className="animate-fade-in">
            <div className="section-head">
                <div className="section-title"><h1 className="vr-h1">ТОП-90 пользователей по баллам сообщества</h1></div>
                <span className="pill">по реальным данным</span>
            </div>

            {sortedUsers.length > 0 ? (
                <>
                <section className="leaderboard-showcase">
                    <div className="leaderboard-podium">
                        <div className="section-head !m-0">
                            <div className="section-title"><span className="section-icon">TOP</span><h2 className="vr-h2">Лидеры сообщества</h2></div>
                            <span className="pill">Весь топ</span>
                        </div>
                        <div className="podium-grid">
                            {podiumUsers.map((user, index) => (
                                <button
                                    className={`podium-user rank-${index + 1}`}
                                    key={user.id}
                                    type="button"
                                    onClick={() => onUserClick(user.id)}
                                >
                                    <span className="podium-place">{index + 1}</span>
                                    <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.username} />
                                    <strong>{user.username}</strong>
                                    <span className="podium-score">РП {user.reputation}</span>
                                    <small>{userReviewLikes[user.id] || 0} лайков · {getReviewCount(user)} рецензий</small>
                                </button>
                            ))}
                        </div>
                    </div>
                    <aside className="leaderboard-stats">
                        <div className="section-head !m-0">
                            <div className="section-title"><h2 className="vr-h2">Статистика</h2></div>
                            <span className="pill">всё время</span>
                        </div>
                        <div className="stat-line"><span>Всего пользователей</span><strong>{users.length}</strong></div>
                        <div className="stat-line"><span>Пользователей в рейтинге</span><strong>{sortedUsers.length}</strong></div>
                        <div className="stat-line"><span>Репутация сообщества</span><strong>{totalReputation}</strong></div>
                        <div className="stat-line"><span>Рецензий</span><strong>{totalReviews}</strong></div>
                        <div className="stat-line"><span>Лайков рецензий</span><strong>{totalReviewLikes}</strong></div>
                    </aside>
                </section>

                <div className="leaderboard-list">
                    {rankedUsers.map((user, index) => (
                        <button className="leaderboard-row" key={user.id} type="button" onClick={() => onUserClick(user.id)}>
                            <span className="leaderboard-index">{index + 4}</span>
                            <span className="leaderboard-user">
                                <Avatar src={user.avatar || DEFAULT_AVATAR} alt={user.username} />
                                <b>{user.username}</b>
                            </span>
                            <span className="leaderboard-score">РП {user.reputation}</span>
                            <span className="leaderboard-metric">{userReviewLikes[user.id] || 0} лайков</span>
                            <span className="leaderboard-metric">{getReviewCount(user)} рецензий</span>
                        </button>
                    ))}
                </div>
                </>
            ) : (
                <div className="card p-8 text-center muted">Пока нет данных для рейтинга пользователей.</div>
            )}
        </div>
    );
};
