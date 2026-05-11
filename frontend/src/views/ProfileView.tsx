import React, { useEffect, useMemo, useState } from 'react';
import { ClothingItem, Review, User } from '../types';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../constants';
import { BookmarkIcon, HeartIcon, PlusIcon } from '../components/icons/Icons';
import { Avatar, Badge, Button, RatingCircle, UnifiedCard } from '../components/UI';
import { apiService } from '../services/apiService';
import { badgeLabel, categoryLabel, typeLabel } from '../utils/labels';

interface ProfileViewProps {
    user: User;
    currentUser: User;
    onEditProfile: () => void;
    onToggleFollow: (id: string) => void;
    items: ClothingItem[];
    reviews: Review[];
    onItemClick: (id: string) => void;
    onDesignerClick: (name: string) => void;
    onLogout?: () => void;
    usersList?: User[];
    onReportUser: (userId: string, reason: string) => void;
    onVerifyUser: (userId: string, verified: boolean) => void;
    onToast: (msg: string) => void;
}

type ProfileTab = 'OVERVIEW' | 'REVIEWS' | 'SAVED' | 'PORTFOLIO';

const portfolioCategoryOptions: ClothingItem['category'][] = ['Streetwear', 'Luxury', 'Techwear', 'Vintage'];
const PROFILE_REVIEW_PAGE_SIZE = 6;

export const ProfileView: React.FC<ProfileViewProps> = ({
    user,
    currentUser,
    onEditProfile,
    onToggleFollow,
    items,
    reviews,
    onItemClick,
    onDesignerClick,
    onLogout,
    usersList = [],
    onReportUser,
    onVerifyUser,
    onToast,
}) => {
    const isCurrentUser = user.id === currentUser.id;
    const isFollowing = currentUser.following?.includes(user.id) || false;
    const userReviews = reviews.filter((review) => review.userId === user.id);
    const sortedUsers = [...usersList].sort((a, b) => b.reputation - a.reputation);
    const rank = sortedUsers.findIndex((entry) => entry.id === user.id) + 1;
    const isVerified = !!(user.badges?.includes('ВЕРИФИЦИРОВАН') || user.badges?.includes('VERIFIED'));
    const isAdmin = currentUser.role === 'ADMIN';
    const isDesigner = user.role === 'DESIGNER' || user.badges?.includes('ДИЗАЙНЕР') || user.badges?.includes('DESIGNER');
    const avgScoreGiven = userReviews.length
        ? Math.round(userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length)
        : 0;
    const savedItems = items.filter((item) => user.favorites?.includes(item.id) || user.wardrobe?.wanted?.includes(item.id));

    const [activeTab, setActiveTab] = useState<ProfileTab>('OVERVIEW');
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [authorItems, setAuthorItems] = useState<ClothingItem[]>([]);
    const [portfolioFormOpen, setPortfolioFormOpen] = useState(false);
    const [portfolioImageFiles, setPortfolioImageFiles] = useState<File[]>([]);
    const [portfolioImagePreviews, setPortfolioImagePreviews] = useState<string[]>([]);
    const [portfolioSaving, setPortfolioSaving] = useState(false);
    const [portfolioError, setPortfolioError] = useState('');
    const [reviewPage, setReviewPage] = useState(1);
    const [portfolioForm, setPortfolioForm] = useState({
        name: '',
        price: 0,
        releaseDate: new Date().toISOString().split('T')[0],
        category: 'Streetwear' as ClothingItem['category'],
        type: 'SINGLE_LOOK' as ClothingItem['type'],
        tags: '',
        sizes: '',
        colors: '',
    });

    useEffect(() => {
        setAuthorItems(items.filter((item) => item.brand === user.username));
    }, [items, user.username]);

    const sortedUserReviews = useMemo(
        () => [...userReviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [userReviews],
    );
    const reviewTotalPages = Math.max(1, Math.ceil(sortedUserReviews.length / PROFILE_REVIEW_PAGE_SIZE));
    const visibleUserReviews = sortedUserReviews.slice(
        (reviewPage - 1) * PROFILE_REVIEW_PAGE_SIZE,
        reviewPage * PROFILE_REVIEW_PAGE_SIZE,
    );

    useEffect(() => {
        setReviewPage(1);
    }, [user.id, activeTab]);

    useEffect(() => {
        setReviewPage((current) => Math.min(current, reviewTotalPages));
    }, [reviewTotalPages]);

    const resetPortfolioForm = () => {
        setPortfolioForm({
            name: '',
            price: 0,
            releaseDate: new Date().toISOString().split('T')[0],
            category: 'Streetwear',
            type: 'SINGLE_LOOK',
            tags: '',
            sizes: '',
            colors: '',
        });
        setPortfolioImageFiles([]);
        setPortfolioImagePreviews([]);
        setPortfolioError('');
        setPortfolioFormOpen(false);
    };

    const handlePortfolioImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []).slice(0, 3);
        if (files.length === 0) return;
        setPortfolioImageFiles(files);
        Promise.all(files.map((file) => new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        }))).then(setPortfolioImagePreviews);
        setPortfolioError('');
    };

    const handleCreatePortfolioItem = async (event: React.FormEvent) => {
        event.preventDefault();
        if (portfolioImageFiles.length === 0) {
            setPortfolioError('Добавьте изображение вещи.');
            return;
        }
        if (!portfolioForm.name.trim()) {
            setPortfolioError('Укажите название вещи.');
            return;
        }

        setPortfolioSaving(true);
        setPortfolioError('');
        try {
            const uploads = await Promise.all(portfolioImageFiles.map((file) => apiService.uploadFile(file, 'item')));
            const imageUrls = uploads.map((upload) => upload.url);
            const payload = {
                brand: user.username,
                name: portfolioForm.name.trim(),
                image: imageUrls[0],
                images: imageUrls,
                releaseDate: portfolioForm.releaseDate,
                type: portfolioForm.type,
                category: portfolioForm.category,
                price: portfolioForm.price || 0,
                tags: portfolioForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
                sizes: portfolioForm.sizes.split(',').map((size) => size.trim()).filter(Boolean),
                colors: portfolioForm.colors.split(',').map((color) => color.trim()).filter(Boolean),
            };
            const created = await apiService.post<ClothingItem>('/v1/items', payload);
            setAuthorItems((prev) => [created, ...prev]);
            onToast('Предмет добавлен в портфолио');
            resetPortfolioForm();
        } catch (error) {
            const err = error as Error;
            setPortfolioError(err.message || 'Ошибка сохранения предмета.');
        } finally {
            setPortfolioSaving(false);
        }
    };

    const submitReport = () => {
        if (reportReason.trim().length < 3) {
            onToast('Укажите причину: минимум 3 символа');
            return;
        }
        onReportUser(user.id, reportReason.trim());
        setIsReportOpen(false);
    };

    const visibleBadges = (user.badges || [])
        .filter((badge) => badge && !['ADMIN', 'DESIGNER', 'USER'].includes(badge.toUpperCase()))
        .map(badgeLabel);

    return (
        <div className="animate-fade-in pb-20">
            {isReportOpen && (
                <div className="modal-backdrop" onClick={() => setIsReportOpen(false)}>
                    <div className="form-box modal-card" onClick={(event) => event.stopPropagation()}>
                        <h3 className="vr-h3">Жалоба на пользователя</h3>
                        <textarea
                            value={reportReason}
                            onChange={(event) => setReportReason(event.target.value)}
                            className="vr-input"
                            placeholder="Опишите причину жалобы..."
                        />
                        <div className="actions justify-start">
                            <Button type="button" onClick={submitReport}>Отправить</Button>
                            <Button type="button" variant="ghost" onClick={() => setIsReportOpen(false)}>Отмена</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="profile-layout">
                <aside className="grid gap-2">
                    <section className="profile-card profile-hero-card">
                        <div className="profile-bg">
                            {user.profileBackground && <img src={user.profileBackground} alt="Фон профиля" />}
                        </div>
                        <div className="profile-inner">
                            <div className="profile-avatar">
                                <img src={user.avatar || DEFAULT_AVATAR} alt={user.username} />
                            </div>
                            <h1 className="profile-name">{user.username}</h1>
                            <div className="profile-badges">
                                {isVerified && <Badge>Верифицирован</Badge>}
                                {rank > 0 && <Badge>Ранг #{rank}</Badge>}
                                {visibleBadges.map((badge) => <Badge key={badge}>{badge}</Badge>)}
                            </div>
                            <p className="muted text-center">{user.bio || 'Описание пока не заполнено.'}</p>
                            <div className="profile-actions">
                                {isCurrentUser ? (
                                    <>
                                        <Button type="button" onClick={onEditProfile}>Редактировать профиль</Button>
                                        {onLogout && <Button type="button" variant="ghost" onClick={onLogout}>Выйти</Button>}
                                    </>
                                ) : (
                                    <>
                                        <Button type="button" onClick={() => onToggleFollow(user.id)}>
                                            {isFollowing ? 'Отписаться' : 'Подписаться'}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => { setReportReason(''); setIsReportOpen(true); }}>
                                            Пожаловаться
                                        </Button>
                                        {isAdmin && (
                                            <Button type="button" variant="ghost" onClick={() => onVerifyUser(user.id, !isVerified)}>
                                                {isVerified ? 'Снять верификацию' : 'Верифицировать'}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="profile-card profile-inner">
                        <h2 className="vr-h3">Статистика</h2>
                        <div className="profile-stats">
                            <span><strong>{user.reputation}</strong><small>репутация</small></span>
                            <span><strong>{user.reviewsCount}</strong><small>рецензии</small></span>
                            <span><strong>{avgScoreGiven}</strong><small>средняя</small></span>
                        </div>
                    </section>
                </aside>

                <main className="profile-main">
                    <div className="tabs profile-tabs">
                        {(['OVERVIEW', 'REVIEWS', 'SAVED'] as const).map((tab) => (
                            <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                                {tab === 'OVERVIEW' ? 'Обзор' : tab === 'REVIEWS' ? 'Рецензии' : 'Сохранённое'}
                            </button>
                        ))}
                        {isDesigner && (
                            <button type="button" className={activeTab === 'PORTFOLIO' ? 'active' : ''} onClick={() => setActiveTab('PORTFOLIO')}>
                                Портфолио
                            </button>
                        )}
                    </div>

                    {activeTab === 'OVERVIEW' && (
                        <section className="profile-section">
                            <div className="section-head">
                                <div className="section-title"><h2 className="vr-h2">Любимые бренды</h2></div>
                                <span className="pill">{user.favoriteDesigners?.length || 0} брендов</span>
                            </div>
                            {user.favoriteDesigners?.length ? (
                                <div className="brand-list">
                                    {user.favoriteDesigners.map((brand) => (
                                        <button className="brand-pill" type="button" key={brand} onClick={() => onDesignerClick(brand)}>
                                            {brand}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-box">Нет выбранных брендов.</div>
                            )}
                        </section>
                    )}

                    {activeTab === 'REVIEWS' && (
                        <section className="profile-section">
                            <div className="section-head">
                                <div className="section-title"><h2 className="vr-h2">Рецензии пользователя</h2></div>
                                <span className="pill">{userReviews.length}</span>
                            </div>
                            {userReviews.length ? (
                                <div className="profile-review-list">
                                    {visibleUserReviews.map((review) => (
                                        <article className="review-card" key={review.id} onClick={() => onItemClick(review.clothingId)}>
                                            <div className="review-top">
                                                <img src={review.clothing?.image || DEFAULT_ITEM_IMAGE} alt={review.clothing?.name || 'Вещь'} />
                                                <strong>{review.clothing?.name || 'Вещь'}</strong>
                                                <RatingCircle rating={review.rating} />
                                            </div>
                                            <p>{review.text}</p>
                                            <div className="review-actions">
                                                <span>{new Date(review.date).toLocaleDateString('ru-RU')}</span>
                                                <span className="review-like-chip"><HeartIcon filled /> {review.likes}</span>
                                            </div>
                                        </article>
                                    ))}
                                    {sortedUserReviews.length > PROFILE_REVIEW_PAGE_SIZE && (
                                        <div className="compact-pagination profile-pagination">
                                            <button className="btn" type="button" disabled={reviewPage === 1} onClick={() => setReviewPage((current) => Math.max(1, current - 1))}>
                                                Назад
                                            </button>
                                            <span>{reviewPage} / {reviewTotalPages}</span>
                                            <button className="btn" type="button" disabled={reviewPage === reviewTotalPages} onClick={() => setReviewPage((current) => Math.min(reviewTotalPages, current + 1))}>
                                                Вперёд
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="empty-box">Пока нет рецензий.</div>
                            )}
                        </section>
                    )}

                    {activeTab === 'SAVED' && (
                        <section className="profile-section">
                            <div className="section-head">
                                <div className="section-title"><h2 className="vr-h2">Сохранённое</h2></div>
                                <span className="pill">{savedItems.length}</span>
                            </div>
                            {savedItems.length ? (
                                <div className="grid cards-3">
                                    {savedItems.map((item) => (
                                        <UnifiedCard
                                            key={item.id}
                                            image={item.image || DEFAULT_ITEM_IMAGE}
                                            title={item.name}
                                            subtitle={item.brand}
                                            metrics={[{ value: item.averageRating, type: 'filled' }]}
                                            onClick={() => onItemClick(item.id)}
                                            secondaryIcon={<BookmarkIcon filled />}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-box">Сохранённых вещей пока нет.</div>
                            )}
                        </section>
                    )}

                    {activeTab === 'PORTFOLIO' && (
                        <section className="profile-section">
                            {isDesigner && isCurrentUser && (
                                <div className="form-box mb-4">
                                    <div className="section-head !m-0 !border-0">
                                        <div className="section-title"><h2 className="vr-h2">Создать предмет</h2></div>
                                        <Button type="button" onClick={() => setPortfolioFormOpen((open) => !open)}>
                                            <PlusIcon /> {portfolioFormOpen ? 'Скрыть форму' : 'Новый предмет'}
                                        </Button>
                                    </div>
                                    {portfolioFormOpen && (
                                        <form className="portfolio-form-grid" onSubmit={handleCreatePortfolioItem}>
                                            <label>Название<input className="vr-input" value={portfolioForm.name} onChange={(event) => setPortfolioForm({ ...portfolioForm, name: event.target.value })} placeholder="Название вещи" /></label>
                                            <label>Цена, ₽<input className="vr-input" type="number" value={portfolioForm.price} onChange={(event) => setPortfolioForm({ ...portfolioForm, price: parseInt(event.target.value, 10) || 0 })} /></label>
                                            <label>Дата релиза<input className="vr-input" type="date" value={portfolioForm.releaseDate} onChange={(event) => setPortfolioForm({ ...portfolioForm, releaseDate: event.target.value })} /></label>
                                            <label>
                                                Категория
                                                <select className="vr-input" value={portfolioForm.category} onChange={(event) => setPortfolioForm({ ...portfolioForm, category: event.target.value as ClothingItem['category'] })}>
                                                    {portfolioCategoryOptions.map((category) => <option value={category} key={category}>{categoryLabel(category)}</option>)}
                                                </select>
                                            </label>
                                            <label>
                                                Тип
                                                <select className="vr-input" value={portfolioForm.type} onChange={(event) => setPortfolioForm({ ...portfolioForm, type: event.target.value as ClothingItem['type'] })}>
                                                    <option value="SINGLE_LOOK">{typeLabel('SINGLE_LOOK')}</option>
                                                    <option value="COLLECTION">{typeLabel('COLLECTION')}</option>
                                                </select>
                                            </label>
                                            <label>Теги<input className="vr-input" value={portfolioForm.tags} onChange={(event) => setPortfolioForm({ ...portfolioForm, tags: event.target.value })} placeholder="Архив, лимит, показ" /></label>
                                            <label>Размеры<input className="vr-input" value={portfolioForm.sizes} onChange={(event) => setPortfolioForm({ ...portfolioForm, sizes: event.target.value })} placeholder="S, M, L" /></label>
                                            <label>Цвета<input className="vr-input" value={portfolioForm.colors} onChange={(event) => setPortfolioForm({ ...portfolioForm, colors: event.target.value })} placeholder="Чёрный, белый" /></label>
                                            <label className="portfolio-file">
                                                Изображение
                                                <input type="file" accept="image/*" multiple onChange={handlePortfolioImageChange} />
                                                <div className="portfolio-preview-row">
                                                    {portfolioImagePreviews.map((preview, index) => (
                                                        <img src={preview} alt={`Превью ${index + 1}`} key={preview} />
                                                    ))}
                                                </div>
                                            </label>
                                            {portfolioError && <div className="pill red">{portfolioError}</div>}
                                            <div className="actions justify-start">
                                                <Button type="submit" disabled={portfolioSaving}>{portfolioSaving ? 'Сохранение...' : 'Сохранить'}</Button>
                                                <Button type="button" variant="ghost" onClick={resetPortfolioForm}>Отмена</Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {authorItems.length ? (
                                <div className="release-grid">
                                    {authorItems.map((item, index) => (
                                        <article className="release-card" key={item.id} onClick={() => onItemClick(item.id)}>
                                            <div className="release-cover">
                                                <img src={item.image || DEFAULT_ITEM_IMAGE} alt={item.name} />
                                                <div className="cover-meta"><span className="tiny">#{index + 1}</span></div>
                                            </div>
                                            <div className="release-title">{item.name}</div>
                                            <div className="release-meta">{item.brand}</div>
                                            <div className="review-actions">
                                                <span>{item.price.toLocaleString('ru-RU')} ₽</span>
                                                <span>{categoryLabel(item.category)}</span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-box">У автора пока нет предметов.</div>
                            )}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};
