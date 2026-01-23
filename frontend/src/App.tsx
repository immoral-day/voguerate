import React, { useState, useEffect } from 'react';
import { ClothingItem, Review, ViewState, User, UpcomingDrop } from './types';
import { ToastContainer } from './components/UI';
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
    AdminPanel 
} from './views';
import { apiService } from './services/apiService';

export const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [viewState, setViewState] = useState<ViewState>({ view: 'HOME' });
    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [drops, setDrops] = useState<UpcomingDrop[]>([]);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [toasts, setToasts] = useState<{ id: string, message: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [itemsData, reviewsData, usersData, dropsData] = await Promise.all([
                    apiService.get<ClothingItem[]>('/v1/items'),
                    apiService.get<Review[]>('/v1/reviews'),
                    apiService.get<User[]>('/v1/users'),
                    apiService.get<UpcomingDrop[]>('/v1/drops'),
                ]);
                setClothingItems(itemsData);
                setReviews(reviewsData);
                setUsers(usersData);
                setDrops(dropsData);
            } catch (error) {
                console.error('Failed to load data from API:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const savedUserId = localStorage.getItem('currentUserId');
        if (savedUserId && users.length > 0) {
            const user = users.find((u) => u.id === savedUserId);
            if (user) setCurrentUser(user);
        }
    }, [users]);

    const refreshData = async () => {
        try {
            const [itemsData, reviewsData, usersData, dropsData] = await Promise.all([
                apiService.get<ClothingItem[]>('/v1/items'),
                apiService.get<Review[]>('/v1/reviews'),
                apiService.get<User[]>('/v1/users'),
                apiService.get<UpcomingDrop[]>('/v1/drops'),
            ]);
            setClothingItems(itemsData);
            setReviews(reviewsData);
            setUsers(usersData);
            setDrops(dropsData);
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    };

    const handleLogin = async (usernameOrEmail: string, password: string) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const allUsers = await apiService.get<User[]>('/v1/users');
            const user = allUsers.find((u) => 
                u.username.toLowerCase() === usernameOrEmail.toLowerCase()
            );
            if (user) {
                setCurrentUser(user);
                setUsers(allUsers);
                localStorage.setItem('currentUserId', user.id);
            } else {
                setAuthError('Пользователь не найден. Попробуйте зарегистрироваться.');
            }
        } catch {
            setAuthError('Ошибка входа. Попробуйте снова.');
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
    };

    const addToast = (message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const navigateTo = (view: ViewState['view'], params: Partial<ViewState> = {}) => {
        setViewState({ ...params, view });
        window.scrollTo(0,0);
    };

    const handleToggleFollow = async (targetId: string) => {
        if (!currentUser) return;
        const following = currentUser.following || [];
        const newFollowing = following.includes(targetId) ? following.filter(id => id !== targetId) : [...following, targetId];
        try {
            const updatedUser = await apiService.put<User>(`/v1/users/${currentUser.id}`, { following: newFollowing });
            setCurrentUser(updatedUser);
            setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
            addToast(newFollowing.includes(targetId) ? "Followed" : "Unfollowed");
        } catch (error) {
            console.error('Failed to toggle follow:', error);
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
        const newFavorites = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
        try {
            const updatedUser = await apiService.put<User>(`/v1/users/${currentUser.id}`, { favorites: newFavorites });
            setCurrentUser(updatedUser);
            setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const handleAddReview = async (reviewData: Partial<Review>) => {
        try {
            const newReview = await apiService.post<Review>('/v1/reviews', reviewData);
            setReviews(prev => [newReview, ...prev]);
            await refreshData();
        } catch (error) {
            console.error('Failed to add review:', error);
            addToast('Ошибка публикации отзыва');
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block font-black text-4xl tracking-tighter text-black bg-neo-yellow px-4 py-2 border-2 border-black shadow-neo mb-4 animate-pulse">VR</div>
                    <p className="text-sm font-mono text-gray-500 uppercase">Загрузка...</p>
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
            content = <HomeView 
                items={clothingItems} 
                reviews={reviews.map(r => ({ ...r, clothing: clothingItems.find(c => c.id === r.clothingId), user: users.find(u => u.id === r.userId) }))} 
                drops={drops}
                onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                onManifestoClick={() => navigateTo('MANIFESTO')}
            />;
            break;
        case 'EXPLORE':
        case 'CALENDAR':
            content = <CalendarView drops={drops} onDropClick={(id) => console.log(id)} />;
            break;
        case 'TOP_RATED':
            content = <TopRatedView items={clothingItems} onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })} />;
            break;
        case 'LEADERBOARD':
            content = <LeaderboardView users={users} onUserClick={(id) => navigateTo('PROFILE', { userId: id })} />;
            break;
        case 'FEEDBACK':
            content = <FeedbackView onToast={addToast} />;
            break;
        case 'MANIFESTO':
            content = <ManifestoView />;
            break;
        case 'ADMIN':
            if (currentUser.role === 'ADMIN') {
                content = <AdminPanel 
                    items={clothingItems} 
                    drops={drops} 
                    onCreateItem={handleCreateItem} 
                    onCreateDrop={handleCreateDrop} 
                    onDeleteItem={handleDeleteItem} 
                    onDeleteDrop={handleDeleteDrop} 
                    onBack={() => navigateTo('HOME')} 
                />;
            } else {
                content = <HomeView 
                    items={clothingItems} 
                    reviews={reviews.map(r => ({ ...r, clothing: clothingItems.find(c => c.id === r.clothingId), user: users.find(u => u.id === r.userId) }))} 
                    drops={drops}
                    onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onManifestoClick={() => navigateTo('MANIFESTO')}
                />;
            }
            break;
        case 'ITEM_DETAIL':
            const item = clothingItems.find(i => i.id === viewState.itemId);
            if (item) {
                const itemReviews = reviews.filter(r => r.clothingId === item.id).map(r => ({ ...r, clothing: item, user: users.find(u => u.id === r.userId) }));
                content = <ItemDetailView 
                    item={item} 
                    reviews={itemReviews} 
                    currentUser={currentUser}
                    onBack={() => navigateTo('HOME')}
                    onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={currentUser.favorites?.includes(item.id) || false}
                    onAddReview={handleAddReview}
                    onToast={addToast}
                />;
            } else {
                content = <div className="p-12 text-center font-mono">Item not found</div>;
            }
            break;
        case 'PROFILE':
            const targetUser = users.find(u => u.id === (viewState.userId || currentUser.id));
            if (targetUser) {
                content = <ProfileView 
                    user={targetUser} 
                    currentUser={currentUser} 
                    onEditProfile={() => setIsEditProfileOpen(true)}
                    onToggleFollow={handleToggleFollow}
                    items={clothingItems}
                    reviews={reviews.map(r => ({ ...r, clothing: clothingItems.find(c => c.id === r.clothingId), user: users.find(u => u.id === r.userId) }))}
                    onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                    onDesignerClick={handleDesignerClick}
                    onLogout={handleLogout}
                    usersList={users}
                />;
            } else {
                content = <div className="p-12 text-center font-mono">User not found</div>;
            }
            break;
        default:
            content = <HomeView 
                items={clothingItems} 
                reviews={reviews.map(r => ({ ...r, clothing: clothingItems.find(c => c.id === r.clothingId), user: users.find(u => u.id === r.userId) }))} 
                drops={drops}
                onItemClick={(id) => navigateTo('ITEM_DETAIL', { itemId: id })}
                onUserClick={(id) => navigateTo('PROFILE', { userId: id })}
                onManifestoClick={() => navigateTo('MANIFESTO')}
            />;
    }

    return (
        <div className="flex min-h-screen bg-bg font-sans text-black">
            <Sidebar setView={setViewState} activeView={viewState.view} isAdmin={currentUser.role === 'ADMIN'} />
            <div className="flex-1 ml-[88px]">
                <Header 
                    currentUser={currentUser} 
                    onSearch={setSearchQuery} 
                    onProfileClick={() => navigateTo('PROFILE', { userId: currentUser.id })}
                    onFeedbackClick={() => navigateTo('FEEDBACK')}
                />
                <main className="mt-24 p-8 relative">
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
