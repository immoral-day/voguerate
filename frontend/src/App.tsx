import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { ClothingItem, Review, ViewState, User, UpcomingDrop, ReviewReport, UserReport, Article, FeedbackMessage } from './types';
import { ToastContainer, Button } from './components/UI';
import { Sidebar, Header, Footer } from './components/layout';
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
    AuthorshipView,
    NewsView,
    ArticleDetailView,
    ChatView,
} from './views';
import { apiService } from './services/apiService';

const AdminPanel = lazy(() => import('./views/AdminPanel').then((module) => ({
    default: module.AdminPanel,
})));

interface BootstrapPayload {
    items: ClothingItem[];
    reviews: Review[];
    users: User[];
    drops: UpcomingDrop[];
    articles: Article[];
}

interface ProfilePayload {
    user: User;
    reviews: Review[];
}

const GUEST_USER: User = {
    id: '__guest__',
    username: 'Гость',
    reputation: 0,
    reviewsCount: 0,
    role: 'USER',
    wardrobe: { owned: [], wanted: [], sold: [] },
    badges: [],
    following: [],
    followers: [],
    favorites: [],
};

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
    const [toasts, setToasts] = useState<{ id: string, message: string }[]>([]);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataLoadError, setDataLoadError] = useState('');
    const [dataLoadAttempt, setDataLoadAttempt] = useState(0);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [likedReviewIds, setLikedReviewIds] = useState<Set<string>>(new Set());
    const [authOpen, setAuthOpen] = useState(false);
    const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
    const [profileLoadingId, setProfileLoadingId] = useState<string | null>(null);
    const [profileErrorId, setProfileErrorId] = useState<string | null>(null);
    const [searchRequest, setSearchRequest] = useState<{ value: string; id: number } | null>(null);

    useEffect(() => {
        const handleUnauthorized = () => {
            setCurrentUser(null);
            setReviewReports([]);
            setUserReports([]);
            setViewState({ view: 'HOME' });
            addToast('Сессия устарела. Войдите заново.');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const savedUserId = localStorage.getItem('currentUserId');
        const savedAuthToken = localStorage.getItem('authToken');
        const hasSanctumToken = savedAuthToken?.includes('|');

        if (!savedUserId || !savedAuthToken || !hasSanctumToken) {
            localStorage.removeItem('currentUserId');
            localStorage.removeItem('authToken');
            setSessionLoading(false);
            return;
        }

        apiService.get<User>('/v1/me')
            .then((user) => {
                if (cancelled) return;
                localStorage.setItem('currentUserId', user.id);
                setCurrentUser(user);
                setUsers((current) => current.some((entry) => entry.id === user.id)
                    ? current.map((entry) => entry.id === user.id ? user : entry)
                    : [...current, user]);
            })
            .catch((error) => {
                console.error('Failed to restore saved user:', error);
                if ((error as { status?: number }).status === 401) {
                    localStorage.removeItem('currentUserId');
                    localStorage.removeItem('authToken');
                }
            })
            .finally(() => {
                if (!cancelled) setSessionLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            setDataLoading(true);
            setDataLoadError('');
            try {
                const payload = await apiService.get<BootstrapPayload>('/v1/bootstrap');
                if (cancelled) return;

                setClothingItems(payload.items);
                setReviews(payload.reviews);
                setUsers((existingUsers) => payload.users.map((summary) => {
                    const existing = existingUsers.find((user) => user.id === summary.id);
                    return existing && !existing.isSummary ? existing : summary;
                }));
                setDrops(payload.drops);
                setArticles(payload.articles);
            } catch (error) {
                console.error('Failed to load bootstrap data:', error);
                if (!cancelled) setDataLoadError('Не удалось загрузить данные сайта.');
            } finally {
                if (!cancelled) {
                    setDataLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [dataLoadAttempt]);

    useEffect(() => {
        if (currentUser?.role !== 'ADMIN' || viewState.view !== 'ADMIN') {
            setReviewReports([]);
            setUserReports([]);
            setFeedbackMessages([]);
            return;
        }

        const loadReports = async () => {
            try {
                const [reviewReportsData, userReportsData, articlesData, feedbackData] = await Promise.all([
                    apiService.get<ReviewReport[]>('/v1/report-reviews'),
                    apiService.get<UserReport[]>('/v1/report-users'),
                    apiService.get<Article[]>('/v1/articles'),
                    apiService.get<FeedbackMessage[]>('/v1/feedback'),
                ]);
                setReviewReports(reviewReportsData);
                setUserReports(userReportsData);
                setArticles(articlesData);
                setFeedbackMessages(feedbackData);
            } catch (error) {
                console.error('Failed to load report data:', error);
                addToast('Не удалось загрузить репорты');
            }
        };

        loadReports();
    }, [currentUser?.id, currentUser?.role, viewState.view]);

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
        if (viewState.view !== 'PROFILE') return;
        const userId = viewState.userId || currentUser?.id;
        if (!userId) return;

        let cancelled = false;
        setProfileLoadingId(userId);
        setProfileErrorId(null);

        apiService.get<ProfilePayload>(`/v1/profiles/${userId}`)
            .then((payload) => {
                if (cancelled) return;
                setUsers((current) => current.some((entry) => entry.id === payload.user.id)
                    ? current.map((entry) => entry.id === payload.user.id ? payload.user : entry)
                    : [...current, payload.user]);
                setReviews((current) => {
                    const incomingIds = new Set(payload.reviews.map((review) => review.id));
                    return [
                        ...payload.reviews,
                        ...current.filter((review) => !incomingIds.has(review.id)),
                    ];
                });
                if (currentUser?.id === payload.user.id) setCurrentUser(payload.user);
            })
            .catch((error) => {
                console.error('Failed to load full profile:', error);
                if (!cancelled) setProfileErrorId(userId);
            })
            .finally(() => {
                if (!cancelled) setProfileLoadingId(null);
            });

        return () => {
            cancelled = true;
        };
    }, [currentUser?.id, viewState.userId, viewState.view]);

    useEffect(() => {
        if (viewState.view !== 'ITEM_DETAIL' || !viewState.itemId) return;

        let cancelled = false;
        apiService.get<Review[]>(`/v1/reviews?compact=1&clothingId=${viewState.itemId}&limit=500`)
            .then((itemReviews) => {
                if (cancelled) return;
                setReviews((current) => {
                    const incomingIds = new Set(itemReviews.map((review) => review.id));
                    return [...itemReviews, ...current.filter((review) => !incomingIds.has(review.id))];
                });
            })
            .catch((error) => console.error('Failed to load item reviews:', error));

        return () => {
            cancelled = true;
        };
    }, [viewState.itemId, viewState.view]);

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

    const enrichedReviews = useMemo(() => {
        const itemsById = new Map(clothingItems.map((item) => [item.id, item]));
        const usersById = new Map(users.map((user) => [user.id, user]));

        return reviews.map(r => ({
                ...r,
                clothing: itemsById.get(r.clothingId),
                user: usersById.get(r.userId),
            }));
    }, [reviews, clothingItems, users]);

    const handleLogin = async (usernameOrEmail: string, password: string) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const user = await apiService.post<User>('/v1/login', { username: usernameOrEmail, password });
            setCurrentUser(user);
            setAuthOpen(false);
            localStorage.setItem('currentUserId', user.id);
            if (user.authToken) localStorage.setItem('authToken', user.authToken);
        } catch (err: unknown) {
            const error = err as Error;
            setAuthError(error.message || 'Неверный логин или пароль');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleRegister = async (username: string, email: string, password: string, passwordConfirmation: string) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const newUser = await apiService.post<User>('/v1/users', {
                username,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            setUsers((prev) => [...prev, newUser]);
            setCurrentUser(newUser);
            setAuthOpen(false);
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

    const requestAuth = () => {
        setAuthError('');
        setAuthOpen(true);
    };

    const requireAuth = () => {
        if (currentUser) return true;
        requestAuth();
        return false;
    };

    const navigateTo = (view: ViewState['view'], params: Partial<ViewState> = {}) => {
        setViewState({ ...params, view });
        window.scrollTo(0, 0);
    };

    const handleToggleFollow = async (targetId: string) => {
        if (!requireAuth() || !currentUser) return;
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
        if (!requireAuth() || !currentUser) return;
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
        if (!requireAuth() || !currentUser) return;
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
        if (!requireAuth() || !currentUser) return;
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
        if (!requireAuth() || !currentUser) return;
        try {
            await apiService.post(`/v1/reviews/${reviewId}/report`, { reporterId: currentUser.id });
            addToast('Рецензия отправлена на модерацию');
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка репорта');
        }
    };

    const handleLikeReview = async (reviewId: string) => {
        if (!requireAuth() || !currentUser) return;

        const previousReview = reviews.find(review => review.id === reviewId);
        if (!previousReview) return;
        const wasLiked = likedReviewIds.has(reviewId);

        if (wasLiked) forgetLikedReview(reviewId);
        else rememberLikedReview(reviewId);
        setReviews(prev => prev.map(review => (
            review.id === reviewId
                ? { ...review, likes: Math.max(0, review.likes + (wasLiked ? -1 : 1)) }
                : review
        )));
        if (previousReview.userId !== currentUser.id) {
            setUsers(prev => prev.map(user => (
                user.id === previousReview.userId
                    ? { ...user, reputation: Math.max(0, user.reputation + (wasLiked ? -1 : 1)) }
                    : user
            )));
        }
        addToast(wasLiked ? 'Лайк убран' : 'Лайк засчитан');

        try {
            const updatedReview = wasLiked
                ? await apiService.delete<Review>(`/v1/reviews/${reviewId}/like`)
                : await apiService.post<Review>(`/v1/reviews/${reviewId}/like`, {});
            setReviews(prev => prev.map(review => review.id === reviewId ? updatedReview : review));
            if (updatedReview.user) {
                setUsers(prev => prev.map(user => user.id === updatedReview.userId ? updatedReview.user! : user));
                if (currentUser?.id === updatedReview.userId) {
                    setCurrentUser(updatedReview.user);
                }
            }
        } catch (err: unknown) {
            const error = err as Error;
            if (wasLiked) rememberLikedReview(reviewId);
            else forgetLikedReview(reviewId);
            setReviews(prev => prev.map(review => review.id === reviewId ? previousReview : review));
            if (previousReview.userId !== currentUser.id) {
                setUsers(prev => prev.map(user => (
                    user.id === previousReview.userId
                        ? { ...user, reputation: Math.max(0, user.reputation + (wasLiked ? 1 : -1)) }
                        : user
                )));
            }
            addToast(error.message || 'Ошибка лайка');
        }
    };

    const handleReportUser = async (userId: string, reason: string) => {
        if (!requireAuth() || !currentUser) return;
        try {
            await apiService.post(`/v1/users/${userId}/report`, { reporterId: currentUser.id, reason });
            addToast('Пользователь отправлен на модерацию');
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка репорта');
        }
    };

    const handleBanUser = async (userId: string, days: number, reason: string) => {
        try {
            const permanent = days === 0;
            const bannedUser = await apiService.post<User>(`/v1/users/${userId}/ban`, {
                days: permanent ? null : days,
                permanent,
                reason,
                reporterId: currentUser?.id,
            });
            setUsers(prev => prev.filter(u => u.id !== bannedUser.id));
            setReviews(prev => prev.filter(r => r.userId !== bannedUser.id));
            addToast(permanent ? 'Пользователь заблокирован навсегда' : `Пользователь заблокирован на ${days} дн.`);
            return bannedUser;
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

    const handleUpdateUserRole = async (userId: string, role: User['role']) => {
        try {
            const updatedUser = await apiService.put<User>(`/v1/users/${userId}`, { role });
            setUsers(prev => prev.map(user => user.id === updatedUser.id ? updatedUser : user));
            if (currentUser?.id === updatedUser.id) {
                setCurrentUser(updatedUser);
            }
            addToast('Роль пользователя обновлена');
            return updatedUser;
        } catch (err: unknown) {
            const error = err as Error;
            addToast(error.message || 'Ошибка изменения роли');
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
            setSearchRequest({ value: name, id: Date.now() });
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
        if (!requireAuth() || !currentUser) return;
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
        if (!requireAuth() || !currentUser) return;
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

    if (sessionLoading || dataLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-[var(--line)] border-t-[var(--lime)] rounded-full animate-spin mb-6"></div>
                    <p className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest animate-pulse">Загрузка системы...</p>
                </div>
            </div>
        );
    }

    if (dataLoadError) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center p-6">
                <div className="card p-8 text-center max-w-md">
                    <h1 className="vr-h2 mb-3">Не удалось загрузить сайт</h1>
                    <p className="muted mb-6">{dataLoadError} Проверьте соединение и повторите попытку.</p>
                    <Button onClick={() => setDataLoadAttempt((attempt) => attempt + 1)}>
                        Повторить
                    </Button>
                </div>
            </div>
        );
    }

    if (!currentUser && authOpen) {
        return (
            <AuthView
                onLogin={handleLogin}
                onRegister={handleRegister}
                loading={authLoading}
                error={authError}
                onContinueAsGuest={() => setAuthOpen(false)}
            />
        );
    }

    const viewer = currentUser || GUEST_USER;
    const authRequired = (
        <div className="card p-8 text-center">
            <h2 className="vr-h2">Требуется регистрация</h2>
            <p className="muted my-4">Просматривать сайт можно без аккаунта. Для этого действия войдите или зарегистрируйтесь.</p>
            <Button onClick={requestAuth}>Войти или зарегистрироваться</Button>
        </div>
    );

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
            content = <CalendarView drops={drops} onCop={handleCopDrop} currentUserId={currentUser?.id} />;
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
            content = currentUser ? (
                <AuthorshipView
                    currentUser={currentUser}
                    items={clothingItems}
                    drops={drops}
                    onItemCreated={(item) => setClothingItems((current) => [item, ...current])}
                    onDropCreated={(drop) => setDrops((current) => [drop, ...current])}
                    onBack={() => navigateTo('PROFILE', { userId: currentUser.id })}
                    onToast={addToast}
                />
            ) : authRequired;
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
            content = currentUser ? (
                <ChatView
                    currentUser={currentUser}
                    users={users}
                    initialRecipientId={viewState.recipientId}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onToast={addToast}
                />
            ) : authRequired;
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
            if (currentUser?.role === 'ADMIN') {
                content = <AdminPanel 
                    users={users}
                    currentUser={currentUser}
                    items={clothingItems} 
                    drops={drops} 
                    reviewReports={reviewReports}
                    userReports={userReports}
                    feedbackMessages={feedbackMessages}
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
                    onUpdateUserRole={handleUpdateUserRole}
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
                        currentUser={viewer}
                        onBack={() => navigateTo('HOME')}
                        onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={currentUser?.favorites?.includes(item.id) || false}
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
            const targetUserId = viewState.userId || currentUser?.id;
            const targetUser = users.find(u => u.id === targetUserId);
            if (targetUser) {
                content = (
                    <ProfileView
                        user={targetUser}
                        currentUser={viewer}
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
                        onMessage={(id) => currentUser ? navigateTo('MESSAGES', { recipientId: id }) : requestAuth()}
                        onToast={addToast}
                    />
                );
            } else if (targetUserId && (profileLoadingId === targetUserId || profileErrorId !== targetUserId)) {
                content = <div className="p-12 text-center font-mono">Загрузка профиля...</div>;
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
            <Sidebar setView={setViewState} activeView={viewState.view} isAdmin={currentUser?.role === 'ADMIN'} />
            <div className="page">
                <Header
                    currentUser={currentUser}
                    items={clothingItems}
                    users={users}
                    searchRequest={searchRequest}
                    onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onHomeClick={() => navigateTo('HOME')}
                    onProfileClick={() => currentUser ? navigateTo('PROFILE', { userId: currentUser.id }) : requestAuth()}
                    onFeedbackClick={() => navigateTo('FEEDBACK')}
                    onMessagesClick={() => currentUser ? navigateTo('MESSAGES') : requestAuth()}
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
                            onClick={() => view === 'MESSAGES' && !currentUser
                                ? requestAuth()
                                : setViewState({ view: view as ViewState['view'] })}
                        >
                            {label}
                        </button>
                    ))}
                </nav>
                <main className="relative flex-1">
                    <Suspense fallback={<div className="p-12 text-center font-mono">Загрузка раздела...</div>}>
                        {content}
                    </Suspense>
                </main>
                <Footer />
            </div>
            {currentUser && (
                <EditProfileModal
                    isOpen={isEditProfileOpen}
                    onClose={() => setIsEditProfileOpen(false)}
                    user={currentUser}
                    users={users}
                    items={clothingItems}
                    onSave={handleUpdateProfile}
                />
            )}
            <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
        </div>
    );
};

export default App;
