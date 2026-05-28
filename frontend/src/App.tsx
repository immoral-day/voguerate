import React, { useState, useEffect, useMemo } from 'react';
import { ClothingItem, Review, ViewState, User, UpcomingDrop, ReviewReport, UserReport, Article, FeedbackMessage } from './types';
import { ToastContainer, Button } from './components/UI';
import { Sidebar, Header, Footer, SearchResultsOverlay } from './components/layout';
import { EditProfileModal } from './components/modals/EditProfileModal';
import {
    AuthView, 
    ManifestoView, 
    HomeView, 
    CalendarView, 
    TopRatedView, 
    LeaderboardView, 
    FeedbackView, 
    ItemDetailView, 
    ProfileView, 
    AdminPanel,
    AuthorshipView,
    NewsView,
    ArticleDetailView,
    ChatView,
} from './views';
import { apiService } from './services/apiService';

interface BootstrapPayload {
    items: ClothingItem[];
    reviews: Review[];
    users: User[];
    drops: UpcomingDrop[];
    articles: Article[];
}

export const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [viewState, setViewState] = useState<ViewState>({ view: 'HOME' });
    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [drops, setDrops] = useState<UpcomingDrop[]>([]);
    const [reviewReports, setReviewReports] = useState<ReviewReport[]>([]);
    const [userReports, setUserReports] = useState<UserReport[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [articleDetails, setArticleDetails] = useState<Record<string, Article>>({});
    const [articleLoading, setArticleLoading] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [toasts, setToasts] = useState<{ id: string, message: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [likedReviewIds, setLikedReviewIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        let cancelled = false;
        const savedUserId = localStorage.getItem('currentUserId');
        const savedAuthToken = localStorage.getItem('authToken');
        const hasSanctumToken = savedAuthToken?.includes('|');

        if (!savedUserId || !savedAuthToken || !hasSanctumToken) {
            localStorage.removeItem('currentUserId');
            localStorage.removeItem('authToken');
            setIsLoading(false);
            return;
        }

        apiService.get<User>(`/v1/users/${savedUserId}`)
            .then((user) => {
                if (cancelled) return;
                setCurrentUser(user);
                setUsers([user]);
            })
            .catch((error) => {
                console.error('Failed to restore saved user:', error);
                localStorage.removeItem('currentUserId');
                localStorage.removeItem('authToken');
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        let cancelled = false;

        const loadData = async () => {
            try {
                setIsLoading(true);
                const payload = await apiService.get<BootstrapPayload>('/v1/bootstrap');
                if (cancelled) return;

                setClothingItems(payload.items);
                setReviews(payload.reviews);
                setUsers(payload.users);
                setDrops(payload.drops);
                setArticles(payload.articles);

                const refreshedCurrentUser = payload.users.find((user) => user.id === currentUser.id);
                if (refreshedCurrentUser) {
                    setCurrentUser(refreshedCurrentUser);
                }
            } catch (error) {
                console.error('Failed to load bootstrap data:', error);
                if (!cancelled) {
                    addToast('Не удалось загрузить данные приложения');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [currentUser?.id]);

    useEffect(() => {
        if (currentUser?.role !== 'ADMIN') {
            setReviewReports([]);
            setUserReports([]);
            return;
        }

        const loadReports = async () => {
            try {
                const [reviewReportsData, userReportsData, articlesData] = await Promise.all([
                    apiService.get<ReviewReport[]>('/v1/report-reviews'),
                    apiService.get<UserReport[]>('/v1/report-users'),
                    apiService.get<Article[]>('/v1/articles'),
                ]);
                setReviewReports(reviewReportsData);
                setUserReports(userReportsData);
                setArticles(articlesData);
            } catch (error) {
                console.error('Failed to load report data:', error);
                addToast('Не удалось загрузить репорты');
            }
        };

        loadReports();
    }, [currentUser?.id, currentUser?.role]);

    useEffect(() => {
        const articleId = viewState.view === 'ARTICLE_DETAIL' ? viewState.articleId : undefined;
        if (!articleId || articleDetails[articleId]) return;

        let cancelled = false;
        setArticleLoading(true);
        apiService.get<Article>(`/v1/articles/${articleId}`)
            .then((article) => {
                if (cancelled) return;
                setArticleDetails((prev) => ({ ...prev, [article.id]: article }));
            })
            .catch((error) => {
                console.error('Failed to load article detail:', error);
                if (!cancelled) addToast('Не удалось загрузить статью');
            })
            .finally(() => {
                if (!cancelled) setArticleLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [viewState.view, viewState.articleId, articleDetails]);

    useEffect(() => {
        if (!currentUser) {
            setLikedReviewIds(new Set());
            return;
        }

        try {
            const stored = localStorage.getItem(`likedReviews:${currentUser.id}`);
            setLikedReviewIds(new Set(stored ? JSON.parse(stored) as string[] : []));
        } catch {
            localStorage.removeItem(`likedReviews:${currentUser.id}`);
            setLikedReviewIds(new Set());
        }
    }, [currentUser?.id]);

    const rememberLikedReview = (reviewId: string) => {
        if (!currentUser) return;
        setLikedReviewIds((prev) => {
            const next = new Set(prev);
            next.add(reviewId);
            localStorage.setItem(`likedReviews:${currentUser.id}`, JSON.stringify([...next]));
            return next;
        });
    };

    const forgetLikedReview = (reviewId: string) => {
        if (!currentUser) return;
        setLikedReviewIds((prev) => {
            const next = new Set(prev);
            next.delete(reviewId);
            localStorage.setItem(`likedReviews:${currentUser.id}`, JSON.stringify([...next]));
            return next;
        });
    };

    const enrichedReviews = useMemo(
        () =>
            reviews.map(r => ({
                ...r,
                clothing: clothingItems.find(c => c.id === r.clothingId),
                user: users.find(u => u.id === r.userId),
            })),
        [reviews, clothingItems, users]
    );

    const handleLogin = async (usernameOrEmail: string, password: string) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const user = await apiService.post<User>('/v1/login', { username: usernameOrEmail, password });
            setCurrentUser(user);
            localStorage.setItem('currentUserId', user.id);
            if (user.authToken) localStorage.setItem('authToken', user.authToken);
        } catch (err: unknown) {
            const error = err as Error;
            setAuthError(error.message || 'Неверный логин или пароль');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleRegister = async (username: string, email: string, password: string) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const newUser = await apiService.post<User>('/v1/users', { username, email, password });
            setUsers((prev) => [...prev, newUser]);
            setCurrentUser(newUser);
            localStorage.setItem('currentUserId', newUser.id);
            if (newUser.authToken) localStorage.setItem('authToken', newUser.authToken);
        } catch (err: unknown) {
            const error = err as Error;
            setAuthError(error.message || 'Ошибка регистрации.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('authToken');
    };

    const addToast = (message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const navigateTo = (view: ViewState['view'], params: Partial<ViewState> = {}) => {
        setViewState({ ...params, view });
        window.scrollTo(0, 0);
    };

    const handleToggleFollow = async (targetId: string) => {
        if (!currentUser) return;
        const following = currentUser.following || [];
        const wasFollowing = following.includes(targetId);
        const newFollowing = following.includes(targetId) ? following.filter(id => id !== targetId) : [...following, targetId];
        const optimisticUser = { ...currentUser, following: newFollowing };

        setCurrentUser(optimisticUser);
        setUsers(prev => prev.map(user => {
            if (user.id === currentUser.id) return optimisticUser;
            if (user.id === targetId) {
                const followers = user.followers || [];
                return {
                    ...user,
                    followers: wasFollowing
                        ? followers.filter(id => id !== currentUser.id)
                        : followers.includes(currentUser.id)
                            ? followers
                            : [...followers, currentUser.id],
                };
            }
            return user;
        }));
        addToast(wasFollowing ? 'Подписка отменена' : 'Вы подписались');

        try {
            const updatedUser = await apiService.put<User>(`/v1/users/${currentUser.id}`, { following: newFollowing });
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        } catch (error) {
            console.error('Failed to toggle follow:', error);
            setCurrentUser(currentUser);
            setUsers(prev => prev.map(user => {
                if (user.id === currentUser.id) return currentUser;
                if (user.id === targetId) {
                    const followers = user.followers || [];
                    return {
                        ...user,
                        followers: wasFollowing
                            ? followers.includes(currentUser.id)
                                ? followers
                                : [...followers, currentUser.id]
                            : followers.filter(id => id !== currentUser.id),
                    };
                }
                return user;
            }));
            addToast('Ошибка подписки');
        }
    };

    const handleUpdateProfile = async (data: Partial<User>) => {
        if (!currentUser) return;
        try {
            const updatedUser = await apiService.put<User>(`/v1/users/${currentUser.id}`, data);
            setCurrentUser(updatedUser);
            setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
            addToast("Профиль обновлён");
        } catch (error) {
            console.error('Failed to update profile:', error);
            addToast('Ошибка обновления профиля');
            throw error;
        }
    };

    const handleToggleFavorite = async (id: string) => {
    if (!currentUser) return;
        const favorites = currentUser.favorites || [];
        const wasFavorite = favorites.includes(id);
        const newFavorites = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
        const optimisticUser = { ...currentUser, favorites: newFavorites };

        setCurrentUser(optimisticUser);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? optimisticUser : u));

        try {
            const updatedUser = await apiService.put<User>(`/v1/users/${currentUser.id}`, { favorites: newFavorites });
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            setCurrentUser(currentUser);
            setUsers(prev => prev.map(u => u.id === currentUser.id ? currentUser : u));
            addToast(wasFavorite ? 'Не удалось убрать из избранного' : 'Не удалось добавить в избранное');
        }
    };

    const handleAddReview = async (reviewData: Partial<Review>) => {
        try {
            const newReview = await apiService.post<Review>('/v1/reviews', reviewData);
            setReviews(prev => [newReview, ...prev]);
            if (reviewData.clothingId) {
                setClothingItems(prev => prev.map(item => {
                    if (item.id === reviewData.clothingId) {
                        const newCount = item.ratingCount + 1;
                        const newAvg = Math.round(((item.averageRating * item.ratingCount) + (reviewData.rating || 0)) / newCount);
                        return { ...item, ratingCount: newCount, averageRating: newAvg };
                    }
                    return item;
                }));
            }
            if (currentUser) {
                const updatedUser = { ...currentUser, reviewsCount: currentUser.reviewsCount + 1, reputation: currentUser.reputation + 5 };
                setCurrentUser(updatedUser);
                setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
            }
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка публикации отзыва');
            throw error;
        }
    };

    const handleDeleteReview = async (id: string) => {
        try {
            await apiService.delete(`/v1/reviews/${id}`);
            const reviewToRemove = reviews.find(r => r.id === id);
            setReviews(prev => prev.filter(r => r.id !== id));
            if (reviewToRemove?.clothingId) {
                setClothingItems(prev => prev.map(item => {
                    if (item.id === reviewToRemove.clothingId) {
                        const newCount = Math.max(0, item.ratingCount - 1);
                        const newAvg = newCount === 0
                            ? 0
                            : Math.round(((item.averageRating * item.ratingCount) - reviewToRemove.rating) / newCount);
                        return { ...item, ratingCount: newCount, averageRating: newAvg };
                    }
                    return item;
                }));
            }
            if (reviewToRemove?.userId) {
                setUsers(prev => prev.map(user => {
                    if (user.id === reviewToRemove.userId) {
                        return {
                            ...user,
                            reviewsCount: Math.max(0, user.reviewsCount - 1),
                            reputation: Math.max(0, user.reputation - 5),
                        };
                    }
                    return user;
                }));
                if (currentUser?.id === reviewToRemove.userId) {
                    setCurrentUser({
                        ...currentUser,
                        reviewsCount: Math.max(0, currentUser.reviewsCount - 1),
                        reputation: Math.max(0, currentUser.reputation - 5),
                    });
                }
            }
            addToast('Рецензия удалена');
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка удаления рецензии');
        }
    };

    const handleReportReview = async (reviewId: string) => {
        if (!currentUser) return;
        try {
            await apiService.post(`/v1/reviews/${reviewId}/report`, { reporterId: currentUser.id });
            addToast('Рецензия отправлена на модерацию');
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка репорта');
        }
    };

    const handleLikeReview = async (reviewId: string) => {
        if (!currentUser) return;
        if (likedReviewIds.has(reviewId)) {
            addToast('Вы уже лайкнули эту рецензию');
            return;
        }

        const previousReview = reviews.find(review => review.id === reviewId);
        if (!previousReview) return;

        rememberLikedReview(reviewId);
        setReviews(prev => prev.map(review => (
            review.id === reviewId
                ? { ...review, likes: review.likes + 1 }
                : review
        )));
        if (previousReview.userId !== currentUser.id) {
            setUsers(prev => prev.map(user => (
                user.id === previousReview.userId
                    ? { ...user, reputation: user.reputation + 1 }
                    : user
            )));
        }
        addToast('Лайк засчитан');

        try {
            const updatedReview = await apiService.post<Review>(`/v1/reviews/${reviewId}/like`, { userId: currentUser.id });
            setReviews(prev => prev.map(review => review.id === reviewId ? updatedReview : review));
            if (updatedReview.user) {
                setUsers(prev => prev.map(user => user.id === updatedReview.userId ? updatedReview.user! : user));
                if (currentUser?.id === updatedReview.userId) {
                    setCurrentUser(updatedReview.user);
                }
            }
        } catch (err: unknown) {
            const error = err as Error;
            if ((error.message || '').toLowerCase().includes('уже лайкали')) {
                rememberLikedReview(reviewId);
                setReviews(prev => prev.map(review => review.id === reviewId ? { ...review, likes: Math.max(review.likes, previousReview.likes + 1) } : review));
                return;
            }
            forgetLikedReview(reviewId);
            setReviews(prev => prev.map(review => review.id === reviewId ? previousReview : review));
            if (previousReview.userId !== currentUser.id) {
                setUsers(prev => prev.map(user => (
                    user.id === previousReview.userId
                        ? { ...user, reputation: Math.max(0, user.reputation - 1) }
                        : user
                )));
            }
            addToast(error.message || 'Ошибка лайка');
        }
    };

    const handleReportUser = async (userId: string, reason: string) => {
        if (!currentUser) return;
        try {
            await apiService.post(`/v1/users/${userId}/report`, { reporterId: currentUser.id, reason });
            addToast('Пользователь отправлен на модерацию');
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка репорта');
        }
    };

    const handleBanUser = async (userId: string, days: number) => {
        try {
            const bannedUser = await apiService.post<User>(`/v1/users/${userId}/ban`, { days, reporterId: currentUser?.id });
            setUsers(prev => prev.filter(u => u.id !== bannedUser.id));
            setReviews(prev => prev.filter(r => r.userId !== bannedUser.id));
            addToast(`Пользователь забанен на ${days} дн.`);
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка бана');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await apiService.delete(`/v1/users/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
            setReviews(prev => prev.filter(r => r.userId !== userId));
            setReviewReports(prev => prev.filter(report => String(report.reporterId) !== userId));
            setUserReports(prev => prev.filter(report => String(report.reporterId) !== userId && String(report.reportedUserId) !== userId));
            addToast('Пользователь удалён');
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка удаления пользователя');
        }
    };

    const handleVerifyUser = async (userId: string, verified: boolean) => {
        try {
            const updatedUser = await apiService.post<User>(`/v1/users/${userId}/verify`, { verified });
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            if (currentUser?.id === updatedUser.id) {
                setCurrentUser(updatedUser);
            }
            addToast(verified ? 'Пользователь верифицирован' : 'Верификация снята');
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка верификации');
        }
    };

    const handleDeleteReviewReport = async (id: string) => {
        try {
            await apiService.delete(`/v1/report-reviews/${id}`);
            setReviewReports(prev => prev.filter(r => r.id !== id));
            addToast('Репорт удален');
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка удаления репорта');
        }
    };

    const handleDeleteUserReport = async (id: string) => {
        try {
            await apiService.delete(`/v1/report-users/${id}`);
            setUserReports(prev => prev.filter(r => r.id !== id));
            addToast('Репорт удален');
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка удаления репорта');
        }
    };

    const handleDesignerClick = (name: string) => {
        const designerUser = users.find(u => u.username.toLowerCase() === name.toLowerCase());
        if (designerUser) {
            navigateTo('PROFILE', { userId: designerUser.id });
        } else {
            setSearchQuery(name);
        }
    };

    const handleCreateItem = async (itemData: Partial<ClothingItem>) => {
        try {
            const newItem = await apiService.post<ClothingItem>('/v1/items', itemData);
            setClothingItems(prev => [...prev, newItem]);
            addToast('Предмет создан');
        } catch (error) {
            console.error('Failed to create item:', error);
            addToast('Ошибка создания предмета');
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await apiService.delete(`/v1/items/${id}`);
            setClothingItems(prev => prev.filter(i => i.id !== id));
            addToast('Предмет удалён');
        } catch (error) {
            console.error('Failed to delete item:', error);
            addToast('Ошибка удаления');
        }
    };

    const handleCreateDrop = async (dropData: Partial<UpcomingDrop>) => {
        try {
            const newDrop = await apiService.post<UpcomingDrop>('/v1/drops', dropData);
            setDrops(prev => [...prev, newDrop]);
            addToast('Релиз создан');
        } catch (error) {
            console.error('Failed to create drop:', error);
            addToast('Ошибка создания релиза');
        }
    };

    const handleDeleteDrop = async (id: string) => {
        try {
            await apiService.delete(`/v1/drops/${id}`);
            setDrops(prev => prev.filter(d => d.id !== id));
            addToast('Релиз удалён');
        } catch (error) {
            console.error('Failed to delete drop:', error);
            addToast('Ошибка удаления');
        }
    };

    const handleUpdateItem = async (id: string, data: Partial<ClothingItem>) => {
        try {
            const updated = await apiService.put<ClothingItem>(`/v1/items/${id}`, data);
            setClothingItems(prev => prev.map(i => i.id === id ? updated : i));
            addToast('Предмет обновлён');
        } catch (error) {
            console.error('Failed to update item:', error);
            addToast('Ошибка обновления');
        }
    };

    const handleUpdateDrop = async (id: string, data: Partial<UpcomingDrop>) => {
        try {
            const updated = await apiService.put<UpcomingDrop>(`/v1/drops/${id}`, data);
            setDrops(prev => prev.map(d => d.id === id ? updated : d));
            addToast('Релиз обновлён');
        } catch (error) {
            console.error('Failed to update drop:', error);
            addToast('Ошибка обновления');
        }
    };

    const handleCreateArticle = async (data: Partial<Article>) => {
        try {
            const created = await apiService.post<Article>('/v1/articles', data);
            setArticles(prev => [created, ...prev]);
            setArticleDetails(prev => ({ ...prev, [created.id]: created }));
            addToast('Новость создана');
        } catch (error) {
            console.error('Failed to create article:', error);
            addToast('Ошибка создания новости');
        }
    };

    const handleUpdateArticle = async (id: string, data: Partial<Article>) => {
        try {
            const updated = await apiService.put<Article>(`/v1/articles/${id}`, data);
            setArticles(prev => prev.map(a => a.id === id ? updated : a));
            setArticleDetails(prev => ({ ...prev, [updated.id]: updated }));
            addToast('Новость обновлена');
        } catch (error) {
            console.error('Failed to update article:', error);
            addToast('Ошибка обновления');
        }
    };

    const handleDeleteArticle = async (id: string) => {
        try {
            await apiService.delete(`/v1/articles/${id}`);
            setArticles(prev => prev.filter(a => a.id !== id));
            setArticleDetails(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            addToast('Новость удалена');
        } catch (error) {
            console.error('Failed to delete article:', error);
            addToast('Ошибка удаления');
        }
    };

    const handleCopDrop = async (id: string) => {
        if (!currentUser) return;
        const previousDrop = drops.find(drop => drop.id === id);
        if (!previousDrop) return;

        if (previousDrop.coppedBy?.includes(currentUser.id)) {
            addToast('Уже в ожидании');
            return;
        }

        const optimisticDrop: UpcomingDrop = {
            ...previousDrop,
            copCount: (previousDrop.copCount || 0) + 1,
            coppedBy: [...(previousDrop.coppedBy || []), currentUser.id],
        };

        setDrops(prev => prev.map(drop => drop.id === id ? optimisticDrop : drop));
        addToast('Добавлено в ожидание');

        try {
            const updated = await apiService.post<UpcomingDrop>(`/v1/drops/${id}/cop`, { userId: currentUser.id });
            setDrops(prev => prev.map(d => d.id === id ? updated : d));
        } catch (err: unknown) {
            const error = err as Error;
            setDrops(prev => prev.map(drop => drop.id === id ? previousDrop : drop));
            addToast(error.message || 'Ошибка');
        }
    };

    const handleSubmitFeedback = async (message: string) => {
        if (!currentUser) return;
        try {
            await apiService.post<FeedbackMessage>('/v1/feedback', {
                userId: currentUser.id,
                message,
                page: viewState.view,
            });
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка отправки обратной связи');
            throw error;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-[var(--line)] border-t-[var(--lime)] rounded-full animate-spin mb-6"></div>
                    <p className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest animate-pulse">Загрузка системы...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <AuthView onLogin={handleLogin} onRegister={handleRegister} loading={authLoading} error={authError} />;
    }

    let content;
    switch (viewState.view) {
        case 'HOME':
            content = (
                <HomeView
                    items={clothingItems}
                    reviews={enrichedReviews}
                    drops={drops}
                    onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onManifestoClick={() => navigateTo('MANIFESTO')}
                    onCalendarClick={() => navigateTo('EXPLORE')}
                />
            );
            break;
        case 'EXPLORE':
        case 'CALENDAR':
            content = <CalendarView drops={drops} onCop={handleCopDrop} currentUserId={currentUser.id} />;
            break;
        case 'TOP_RATED':
            content = <TopRatedView items={clothingItems} onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })} />;
            break;
        case 'LEADERBOARD':
            content = <LeaderboardView users={users} reviews={enrichedReviews} onUserClick={(id) => navigateTo('PROFILE', { userId: id })} />;
            break;
        case 'FEEDBACK':
            content = <FeedbackView onSubmit={handleSubmitFeedback} onToast={addToast} />;
            break;
        case 'AUTHORSHIP':
            content = (
                <AuthorshipView
                    currentUser={currentUser}
                    onBack={() => navigateTo('PROFILE', { userId: currentUser.id })}
                    onToast={addToast}
                />
            );
            break;
        case 'NEWS':
            content = (
                <NewsView
                    articles={articles}
                    onBack={() => navigateTo('HOME')}
                    onArticleClick={(id) => navigateTo('ARTICLE_DETAIL', { articleId: id })}
                />
            );
            break;
        case 'MESSAGES':
            content = (
                <ChatView
                    currentUser={currentUser}
                    users={users}
                    initialRecipientId={viewState.recipientId}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onToast={addToast}
                />
            );
            break;
        case 'ARTICLE_DETAIL': {
            const summaryArticle = articles.find((a) => a.id === viewState.articleId);
            const article = viewState.articleId ? articleDetails[viewState.articleId] : undefined;
            if (article) {
                content = <ArticleDetailView article={article} onBack={() => navigateTo('NEWS')} />;
            } else if (summaryArticle || articleLoading) {
                content = (
                    <div className="p-12 text-center font-mono">
                        <p className="mb-4">Загрузка статьи...</p>
                        <Button variant="outline" onClick={() => navigateTo('NEWS')}>К статьям</Button>
                    </div>
                );
            } else {
                content = (
                    <div className="p-12 text-center font-mono">
                        <p className="mb-4">Статья не найдена.</p>
                        <Button variant="outline" onClick={() => navigateTo('NEWS')}>К новостям</Button>
                    </div>
                );
            }
            break;
        }
        case 'MANIFESTO':
            content = <ManifestoView />;
            break;
        case 'ADMIN': {
            if (currentUser.role === 'ADMIN') {
                content = <AdminPanel 
                    users={users}
                    currentUser={currentUser}
                    items={clothingItems} 
                    drops={drops} 
                    reviewReports={reviewReports}
                    userReports={userReports}
                    articles={articles}
                    onCreateItem={handleCreateItem} 
                    onCreateDrop={handleCreateDrop} 
                    onDeleteItem={handleDeleteItem} 
                    onDeleteDrop={handleDeleteDrop}
                    onDeleteReview={handleDeleteReview}
                    onDeleteReviewReport={handleDeleteReviewReport}
                    onDeleteUserReport={handleDeleteUserReport}
                    onBanUser={handleBanUser}
                    onDeleteUser={handleDeleteUser}
                    onUpdateItem={handleUpdateItem}
                    onUpdateDrop={handleUpdateDrop}
                    onCreateArticle={handleCreateArticle}
                    onUpdateArticle={handleUpdateArticle}
                    onDeleteArticle={handleDeleteArticle}
                    onBack={() => navigateTo('HOME')} 
                />;
            } else {
                content = <HomeView 
                    items={clothingItems} 
                    reviews={enrichedReviews} 
                    drops={drops}
                    onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onManifestoClick={() => navigateTo('MANIFESTO')}
                    onCalendarClick={() => navigateTo('EXPLORE')}
                />;
            }
            break;
        }
        case 'ITEM_DETAIL': {
            const item = clothingItems.find(i => i.id === viewState.itemId);
            if (item) {
                const itemReviews = reviews
                    .filter(r => r.clothingId === item.id)
                    .map(r => ({ ...r, clothing: item, user: users.find(u => u.id === r.userId) }));
                content = (
                    <ItemDetailView
                        item={item}
                        reviews={itemReviews}
                        currentUser={currentUser}
                        onBack={() => navigateTo('HOME')}
                        onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={currentUser.favorites?.includes(item.id) || false}
                        onAddReview={handleAddReview}
                        onLikeReview={handleLikeReview}
                        likedReviewIds={likedReviewIds}
                        onReportReview={handleReportReview}
                        onToast={addToast}
                    />
                );
            } else {
                content = <div className="p-12 text-center font-mono">Предмет не найден</div>;
            }
            break;
        }
        case 'PROFILE': {
            const targetUser = users.find(u => u.id === (viewState.userId || currentUser.id));
            if (targetUser) {
                content = (
                    <ProfileView
                        user={targetUser}
                        currentUser={currentUser}
                        onEditProfile={() => setIsEditProfileOpen(true)}
                        onToggleFollow={handleToggleFollow}
                        items={clothingItems}
                        reviews={enrichedReviews}
                        onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                        onDesignerClick={handleDesignerClick}
                        onLogout={handleLogout}
                        usersList={users}
                        onReportUser={handleReportUser}
                        onVerifyUser={handleVerifyUser}
                        onMessage={(id) => navigateTo('MESSAGES', { recipientId: id })}
                        onToast={addToast}
                    />
                );
            } else {
                content = <div className="p-12 text-center font-mono">Пользователь не найден</div>;
            }
            break;
        }
        default:
            content = (
                <HomeView
                    items={clothingItems}
                    reviews={enrichedReviews}
                    drops={drops}
                    onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onManifestoClick={() => navigateTo('MANIFESTO')}
                    onCalendarClick={() => navigateTo('EXPLORE')}
                />
            );
    }

      return (
        <div className="app">
            <Sidebar setView={setViewState} activeView={viewState.view} isAdmin={currentUser.role === 'ADMIN'} />
            <div className="page">
                <Header
                    currentUser={currentUser}
                    onSearch={setSearchQuery}
                    onHomeClick={() => navigateTo('HOME')}
                    onProfileClick={() => navigateTo('PROFILE', { userId: currentUser.id })}
                    onFeedbackClick={() => navigateTo('FEEDBACK')}
                    onMessagesClick={() => navigateTo('MESSAGES')}
                />
                <nav className="mobile-nav" aria-label="Мобильная навигация">
                    {[
                        ['HOME', 'Главная'],
                        ['EXPLORE', 'Календарь'],
                        ['TOP_RATED', 'Топ'],
                        ['LEADERBOARD', 'Рейтинг'],
                        ['MESSAGES', 'Чат'],
                    ].map(([view, label]) => (
                        <button
                            key={view}
                            type="button"
                            className={viewState.view === view || (view === 'EXPLORE' && viewState.view === 'CALENDAR') ? 'active' : ''}
                            onClick={() => setViewState({ view: view as ViewState['view'] })}
                        >
                            {label}
                        </button>
                    ))}
                </nav>
                <main className="relative flex-1">
                    {content}
                    <SearchResultsOverlay
                        query={searchQuery}
                        items={clothingItems}
                        users={users}
                        onItemClick={(id) => { navigateTo('ITEM_DETAIL', { itemId: id }); setSearchQuery(''); }}
                        onUserClick={(id) => { navigateTo('PROFILE', { userId: id }); setSearchQuery(''); }}
                        onClose={() => setSearchQuery('')}
                    />
                </main>
                <Footer />
            </div>
            <EditProfileModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                user={currentUser}
                onSave={handleUpdateProfile}
            />
            <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
        </div>
    );
};

export default App;
