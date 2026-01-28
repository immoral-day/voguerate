import React, { useEffect, useState } from 'react';
import { ClothingItem, UpcomingDrop, ReviewReport, UserReport, AuthorshipRequest } from '../types';
import { DEFAULT_ITEM_IMAGE } from '../constants';
import { ChevronLeftIcon, PlusIcon, XIcon, EditIcon } from '../components/icons/Icons';
import { Button } from '../components/UI';
import { apiService } from '../services/apiService';

interface AdminPanelProps {
    items: ClothingItem[];
    drops: UpcomingDrop[];
    reviewReports: ReviewReport[];
    userReports: UserReport[];
    onCreateItem: (item: Partial<ClothingItem>) => Promise<void>;
    onCreateDrop: (drop: Partial<UpcomingDrop>) => Promise<void>;
    onDeleteItem: (id: string) => Promise<void>;
    onDeleteDrop: (id: string) => Promise<void>;
    onDeleteReviewReport: (id: string) => Promise<void>;
    onDeleteUserReport: (id: string) => Promise<void>;
    onDeleteReview: (id: string) => Promise<void>;
    onBanUser: (id: string, days: number) => Promise<void>;
    onUpdateItem: (id: string, data: Partial<ClothingItem>) => Promise<void>;
    onUpdateDrop: (id: string, data: Partial<UpcomingDrop>) => Promise<void>;
    onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    items, drops, reviewReports, userReports, onCreateItem, onCreateDrop, onDeleteItem, onDeleteDrop, onDeleteReviewReport, onDeleteUserReport, onDeleteReview, onBanUser, onUpdateItem, onUpdateDrop, onBack 
}) => {
    const [activeTab, setActiveTab] = useState<'items' | 'drops' | 'reports' | 'authorship'>('items');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [formError, setFormError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [itemCategoryFilter, setItemCategoryFilter] = useState<'ALL' | ClothingItem['category']>('ALL');
    const [itemTypeFilter, setItemTypeFilter] = useState<'ALL' | ClothingItem['type']>('ALL');
    const [dropStatusFilter, setDropStatusFilter] = useState<'ALL' | 'UPCOMING' | 'RELEASED'>('ALL');
    const [reportTab, setReportTab] = useState<'review' | 'user'>('review');
    const [reviewBanDays, setReviewBanDays] = useState<Record<string, number>>({});
    const [userBanDays, setUserBanDays] = useState<Record<string, number>>({});
    const [authorshipRequests, setAuthorshipRequests] = useState<AuthorshipRequest[]>([]);
    const [authorshipStatusFilter, setAuthorshipStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [rejectComment, setRejectComment] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        brand: '',
        name: '',
        category: 'Streetwear' as ClothingItem['category'],
        type: 'SINGLE_LOOK' as ClothingItem['type'],
        price: 0,
        releaseDate: new Date().toISOString().split('T')[0],
        tags: '',
        sizes: '',
        colors: '',
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setFormError('');
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setFormData({ brand: '', name: '', category: 'Streetwear', type: 'SINGLE_LOOK', price: 0, releaseDate: new Date().toISOString().split('T')[0], tags: '', sizes: '', colors: '' });
        setImageFile(null);
        setImagePreview('');
        setFormError('');
        setEditingId(null);
        setShowForm(false);
    };

    const startEditItem = (item: ClothingItem) => {
        setFormData({
            brand: item.brand,
            name: item.name,
            category: item.category,
            type: item.type,
            price: item.price,
            releaseDate: item.releaseDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            tags: item.tags?.join(', ') || '',
            sizes: item.sizes?.join(', ') || '',
            colors: item.colors?.join(', ') || '',
        });
        setImagePreview(item.image || '');
        setEditingId(item.id);
        setShowForm(true);
    };

    const startEditDrop = (drop: UpcomingDrop) => {
        setFormData({
            brand: drop.brand,
            name: drop.name,
            category: 'Streetwear',
            type: 'SINGLE_LOOK',
            price: typeof drop.price === 'number' ? drop.price : 0,
            releaseDate: new Date(drop.releaseDate).toISOString().split('T')[0],
            tags: '',
            sizes: '',
            colors: '',
        });
        setImagePreview(drop.image || '');
        setEditingId(drop.id);
        setShowForm(true);
    };

    const handleSubmitItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId && !imageFile) {
            setFormError('Добавьте изображение');
            return;
        }
        setLoading(true);
        try {
            let imageUrl = imagePreview;
            if (imageFile) {
                const upload = await apiService.uploadFile(imageFile, 'item');
                imageUrl = upload.url;
            }
            const data = {
                brand: formData.brand,
                name: formData.name,
                image: imageUrl,
                category: formData.category,
                type: formData.type,
                price: formData.price,
                releaseDate: formData.releaseDate,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
                colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
            };
            if (editingId) {
                await onUpdateItem(editingId, data);
            } else {
                await onCreateItem(data);
            }
            resetForm();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitDrop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId && !imageFile) {
            setFormError('Добавьте изображение');
            return;
        }
        setLoading(true);
        try {
            let imageUrl = imagePreview;
            if (imageFile) {
                const upload = await apiService.uploadFile(imageFile, 'drop');
                imageUrl = upload.url;
            }
            const data = {
                brand: formData.brand,
                name: formData.name,
                image: imageUrl,
                price: formData.price,
                releaseDate: new Date(formData.releaseDate).toISOString(),
            };
            if (editingId) {
                await onUpdateDrop(editingId, data);
            } else {
                await onCreateDrop(data);
            }
            resetForm();
        } finally {
            setLoading(false);
        }
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesQuery = (value: string) => value.toLowerCase().includes(normalizedQuery);

    const filteredItems = items.filter((item) => {
        const matchesText = !normalizedQuery || matchesQuery(`${item.brand} ${item.name}`);
        const matchesCategory = itemCategoryFilter === 'ALL' || item.category === itemCategoryFilter;
        const matchesType = itemTypeFilter === 'ALL' || item.type === itemTypeFilter;
        return matchesText && matchesCategory && matchesType;
    });

    const filteredDrops = drops.filter((drop) => {
        const matchesText = !normalizedQuery || matchesQuery(`${drop.brand} ${drop.name}`);
        const isReleased = new Date(drop.releaseDate) < new Date();
        const matchesStatus = dropStatusFilter === 'ALL'
            || (dropStatusFilter === 'RELEASED' && isReleased)
            || (dropStatusFilter === 'UPCOMING' && !isReleased);
        return matchesText && matchesStatus;
    });

    const filteredReviewReports = reviewReports.filter((report) => {
        const userName = report.reporter?.username || '';
        const itemName = report.review?.clothing?.name || '';
        const text = report.review?.text || '';
        const matchesText = !normalizedQuery || matchesQuery(`${userName} ${itemName} ${text}`);
        return matchesText;
    });

    const filteredUserReports = userReports.filter((report) => {
        const reporterName = report.reporter?.username || '';
        const reportedName = report.reportedUser?.username || '';
        const matchesText = !normalizedQuery || matchesQuery(`${reporterName} ${reportedName}`);
        return matchesText;
    });

    const loadAuthorshipRequests = async () => {
        try {
            const data = await apiService.get<AuthorshipRequest[]>('/v1/authorship-requests');
            setAuthorshipRequests(data);
        } catch (e) {
            console.error('Failed to load authorship requests', e);
        }
    };

    useEffect(() => {
        if (activeTab === 'authorship') {
            loadAuthorshipRequests();
        }
    }, [activeTab]);

    const handleApproveRequest = async (id: string) => {
        try {
            const updated = await apiService.post<AuthorshipRequest>(`/v1/authorship-requests/${id}/approve`, {});
            setAuthorshipRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
            alert('Заявка одобрена. Пользователь стал автором.');
        } catch (e) {
            console.error('Failed to approve authorship request', e);
            alert('Ошибка одобрения заявки');
        }
    };

    const handleRejectRequest = async (id: string) => {
        try {
            const updated = await apiService.post<AuthorshipRequest>(`/v1/authorship-requests/${id}/reject`, {
                adminComment: rejectComment[id] || null,
            });
            setAuthorshipRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
            setRejectComment(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            alert('Заявка отклонена');
        } catch (e) {
            console.error('Failed to reject authorship request', e);
            alert('Ошибка отклонения заявки');
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
                        <ChevronLeftIcon />
                    </button>
                    <h1 className="text-3xl font-black uppercase">АДМИН ПАНЕЛЬ</h1>
                </div>
                {activeTab !== 'reports' && (
                    <Button onClick={() => { resetForm(); setShowForm(true); }}>
                        <PlusIcon className="mr-2" /> СОЗДАТЬ {activeTab === 'items' ? 'ПРЕДМЕТ' : 'РЕЛИЗ'}
                    </Button>
                )}
            </div>

            <div className="flex border-b-2 border-black mb-8 overflow-x-auto">
                {(['items', 'drops', 'reports', 'authorship'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); resetForm(); }}
                        className={`px-8 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 whitespace-nowrap ${activeTab === tab ? 'bg-black text-white border-black' : 'bg-transparent border-transparent text-gray-400 hover:text-black'}`}
                    >
                        {tab === 'items'
                            ? 'ПРЕДМЕТЫ'
                            : tab === 'drops'
                            ? 'РЕЛИЗЫ'
                            : tab === 'reports'
                            ? 'РЕПОРТЫ'
                            : 'АВТОРСТВО'} (
                        {tab === 'items'
                            ? items.length
                            : tab === 'drops'
                            ? drops.length
                            : tab === 'reports'
                            ? reviewReports.length + userReports.length
                            : authorshipRequests.length})
                    </button>
                ))}
            </div>

            <div className="bg-white border-2 border-black p-4 shadow-neo mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-xs font-black uppercase mb-2">ПОИСК</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-black font-mono"
                        placeholder="Бренд, название, текст..."
                    />
                </div>
                {activeTab === 'items' && (
                    <>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">КАТЕГОРИЯ</label>
                            <select
                                value={itemCategoryFilter}
                                onChange={(e) => setItemCategoryFilter(e.target.value as 'ALL' | ClothingItem['category'])}
                                className="w-full px-4 py-3 border-2 border-black font-mono"
                            >
                                <option value="ALL">Все</option>
                                <option value="Streetwear">Streetwear</option>
                                <option value="Luxury">Luxury</option>
                                <option value="Techwear">Techwear</option>
                                <option value="Vintage">Vintage</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">ТИП</label>
                            <select
                                value={itemTypeFilter}
                                onChange={(e) => setItemTypeFilter(e.target.value as 'ALL' | ClothingItem['type'])}
                                className="w-full px-4 py-3 border-2 border-black font-mono"
                            >
                                <option value="ALL">Все</option>
                                <option value="SINGLE_LOOK">Single Look</option>
                                <option value="COLLECTION">Collection</option>
                            </select>
                        </div>
                    </>
                )}
                {activeTab === 'drops' && (
                    <div>
                        <label className="block text-xs font-black uppercase mb-2">СТАТУС</label>
                        <select
                            value={dropStatusFilter}
                            onChange={(e) => setDropStatusFilter(e.target.value as 'ALL' | 'UPCOMING' | 'RELEASED')}
                            className="w-full px-4 py-3 border-2 border-black font-mono"
                        >
                            <option value="ALL">Все</option>
                            <option value="UPCOMING">Предстоящие</option>
                            <option value="RELEASED">Прошедшие</option>
                        </select>
                    </div>
                )}
                {activeTab === 'reports' && (
                    <div>
                        <label className="block text-xs font-black uppercase mb-2">ТИП</label>
                        <select
                            value={reportTab}
                            onChange={(e) => setReportTab(e.target.value as 'review' | 'user')}
                            className="w-full px-4 py-3 border-2 border-black font-mono"
                        >
                            <option value="review">Рецензии</option>
                            <option value="user">Пользователи</option>
                        </select>
                    </div>
                )}
                {activeTab === 'authorship' && (
                    <div>
                        <label className="block text-xs font-black uppercase mb-2">СТАТУС</label>
                        <select
                            value={authorshipStatusFilter}
                            onChange={(e) => setAuthorshipStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')}
                            className="w-full px-4 py-3 border-2 border-black font-mono"
                        >
                            <option value="ALL">Все</option>
                            <option value="PENDING">На рассмотрении</option>
                            <option value="APPROVED">Одобренные</option>
                            <option value="REJECTED">Отклонённые</option>
                        </select>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="bg-white border-2 border-black p-6 shadow-neo mb-8">
                    <h2 className="text-xl font-black uppercase mb-6">
                        {editingId ? 'РЕДАКТИРОВАТЬ' : 'НОВЫЙ'} {activeTab === 'items' ? 'ПРЕДМЕТ' : 'РЕЛИЗ'}
                    </h2>
                    <form onSubmit={activeTab === 'items' ? handleSubmitItem : handleSubmitDrop} className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">БРЕНД</label>
                            <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" required />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">НАЗВАНИЕ</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" required />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">ЦЕНА ($)</label>
                            <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 border-2 border-black font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2">ДАТА РЕЛИЗА</label>
                            <input type="date" value={formData.releaseDate} onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" />
                        </div>
                        {activeTab === 'items' && (
                            <>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">КАТЕГОРИЯ</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as ClothingItem['category'] })} className="w-full px-4 py-3 border-2 border-black font-mono">
                                        <option value="Streetwear">Streetwear</option>
                                        <option value="Luxury">Luxury</option>
                                        <option value="Techwear">Techwear</option>
                                        <option value="Vintage">Vintage</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">ТИП</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as ClothingItem['type'] })} className="w-full px-4 py-3 border-2 border-black font-mono">
                                        <option value="SINGLE_LOOK">Single Look</option>
                                        <option value="COLLECTION">Collection</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">ТЕГИ (через запятую)</label>
                                    <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" placeholder="Hype, Limited, Archive" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">РАЗМЕРЫ (через запятую)</label>
                                    <input type="text" value={formData.sizes} onChange={(e) => setFormData({ ...formData, sizes: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" placeholder="S, M, L, XL" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">ЦВЕТА (через запятую)</label>
                                    <input type="text" value={formData.colors} onChange={(e) => setFormData({ ...formData, colors: e.target.value })} className="w-full px-4 py-3 border-2 border-black font-mono" placeholder="Black, White" />
                                </div>
                            </>
                        )}
                        <div className="col-span-2">
                            <label className="block text-xs font-black uppercase mb-2">ИЗОБРАЖЕНИЕ</label>
                            <div className="flex items-center gap-4">
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                                <label htmlFor="image-upload" className="px-6 py-3 border-2 border-black cursor-pointer hover:bg-black hover:text-white transition-colors font-bold uppercase text-sm">ВЫБРАТЬ ФАЙЛ</label>
                                {imagePreview && (
                                    <div className="w-20 h-20 border-2 border-black overflow-hidden">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {formError && <div className="col-span-2 text-xs font-bold text-red-600 uppercase">{formError}</div>}
                        <div className="col-span-2 flex gap-4 mt-4">
                            <Button type="submit" disabled={loading}>{loading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}</Button>
                            <Button variant="ghost" onClick={resetForm}>ОТМЕНА</Button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'items' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                    {filteredItems.length === 0 ? (
                        <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center">
                            <p className="text-gray-400 font-mono uppercase">Нет предметов. Создайте первый!</p>
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div key={item.id} className="bg-white border-2 border-black p-3 shadow-neo h-full flex flex-col">
                                <div className="aspect-[3/4] bg-gray-100 mb-3 overflow-hidden">
                                    <img src={item.image || DEFAULT_ITEM_IMAGE} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex justify-between items-start flex-1 gap-2">
                                    <div className="pr-1">
                                        <span className="text-[9px] font-black uppercase bg-neo-yellow px-1 border border-black">{item.brand}</span>
                                        <h3 className="font-black text-xs mt-1 line-clamp-2 break-words">{item.name}</h3>
                                        <p className="text-[11px] text-gray-500 font-mono mt-1">${item.price} • {item.category}</p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button onClick={() => startEditItem(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 transition-colors">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 transition-colors">
                                            <XIcon />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'drops' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                    {filteredDrops.length === 0 ? (
                        <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center">
                            <p className="text-gray-400 font-mono uppercase">Нет релизов. Создайте первый!</p>
                        </div>
                    ) : (
                        filteredDrops.map((drop) => (
                            <div key={drop.id} className="bg-white border-2 border-black p-3 shadow-neo h-full flex flex-col">
                                <div className="aspect-[3/4] bg-gray-100 mb-3 overflow-hidden">
                                    <img src={drop.image || DEFAULT_ITEM_IMAGE} alt={drop.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex justify-between items-start flex-1 gap-2">
                                    <div className="pr-1">
                                        <span className="text-[9px] font-black uppercase bg-neo-yellow px-1 border border-black">{drop.brand}</span>
                                        <h3 className="font-black text-xs mt-1 line-clamp-2 break-words">{drop.name}</h3>
                                        <p className="text-[11px] text-gray-500 font-mono mt-1">
                                            {typeof drop.price === 'number' ? `$${drop.price}` : drop.price} • {new Date(drop.releaseDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button onClick={() => startEditDrop(drop)} className="p-1.5 text-blue-500 hover:bg-blue-50 transition-colors">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDeleteDrop(drop.id)} className="p-1.5 text-red-500 hover:bg-red-50 transition-colors">
                                            <XIcon />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}


            {activeTab === 'reports' && (
                <div className="grid grid-cols-1 gap-4">
                    {reportTab === 'review' ? (
                        filteredReviewReports.length === 0 ? (
                            <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center">
                                <p className="text-gray-400 font-mono uppercase">Нет репортов рецензий.</p>
                            </div>
                        ) : (
                            filteredReviewReports.map((report) => (
                                <div key={report.id} className="bg-white border-2 border-black p-4 shadow-neo">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black uppercase bg-neo-yellow px-1 border border-black">
                                                    {report.review?.clothing?.brand || 'Бренд'}
                                                </span>
                                                <span className="text-[10px] font-black uppercase bg-black text-white px-1 border border-black">
                                                    {report.review?.clothing?.name || 'Предмет'}
                                                </span>
                                                <span className="text-[10px] font-mono text-gray-500">
                                                    Репорт от: {report.reporter?.username || report.reporterId}
                                                </span>
                                            </div>
                                            <div className="text-xs font-mono text-gray-500 mb-2">
                                                Рецензия: {report.review?.rating} • {report.review?.date}
                                            </div>
                                            <p className="text-sm font-mono text-black break-words">{report.review?.text || 'Текст недоступен'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {report.review?.userId && (
                                                <select
                                                    value={reviewBanDays[report.id] ?? 7}
                                                    onChange={(e) => setReviewBanDays(prev => ({ ...prev, [report.id]: parseInt(e.target.value, 10) }))}
                                                    className="border-2 border-black text-xs font-mono px-2 py-1"
                                                >
                                                    <option value={1}>1 день</option>
                                                    <option value={7}>7 дней</option>
                                                    <option value={30}>30 дней</option>
                                                    <option value={90}>90 дней</option>
                                                </select>
                                            )}
                                            <button onClick={() => onDeleteReviewReport(report.id)} className="p-2 text-red-500 hover:bg-red-50 transition-colors">
                                                <XIcon />
                                            </button>
                                            {report.review?.id && (
                                                <button
                                                    onClick={() => onDeleteReview(report.review!.id)}
                                                    className="px-2 py-1 border-2 border-black text-xs font-black uppercase hover:bg-black hover:text-white transition-colors"
                                                >
                                                    Удалить рецензию
                                                </button>
                                            )}
                                            {report.review?.userId && (
                                                <button
                                                    onClick={() => onBanUser(report.review!.userId, reviewBanDays[report.id] ?? 7)}
                                                    className="px-2 py-1 border-2 border-black text-xs font-black uppercase hover:bg-black hover:text-white transition-colors"
                                                >
                                                    Забанить
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        filteredUserReports.length === 0 ? (
                            <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center">
                                <p className="text-gray-400 font-mono uppercase">Нет репортов пользователей.</p>
                            </div>
                        ) : (
                            filteredUserReports.map((report) => (
                                <div key={report.id} className="bg-white border-2 border-black p-4 shadow-neo">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black uppercase bg-neo-yellow px-1 border border-black">
                                                    Репорт от: {report.reporter?.username || report.reporterId}
                                                </span>
                                                <span className="text-[10px] font-black uppercase bg-black text-white px-1 border border-black">
                                                    На: {report.reportedUser?.username || report.reportedUserId}
                                                </span>
                                            </div>
                                            {report.reason && (
                                                <p className="text-sm font-mono text-black break-words">{report.reason}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {report.reportedUserId && (
                                                <select
                                                    value={userBanDays[report.id] ?? 7}
                                                    onChange={(e) => setUserBanDays(prev => ({ ...prev, [report.id]: parseInt(e.target.value, 10) }))}
                                                    className="border-2 border-black text-xs font-mono px-2 py-1"
                                                >
                                                    <option value={1}>1 день</option>
                                                    <option value={7}>7 дней</option>
                                                    <option value={30}>30 дней</option>
                                                    <option value={90}>90 дней</option>
                                                </select>
                                            )}
                                            <button onClick={() => onDeleteUserReport(report.id)} className="p-2 text-red-500 hover:bg-red-50 transition-colors">
                                                <XIcon />
                                            </button>
                                            {report.reportedUserId && (
                                                <button
                                                    onClick={() => onBanUser(report.reportedUserId!, userBanDays[report.id] ?? 7)}
                                                    className="px-2 py-1 border-2 border-black text-xs font-black uppercase hover:bg-black hover:text-white transition-colors"
                                                >
                                                    Забанить
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            )}

            {activeTab === 'authorship' && (
                <div className="grid grid-cols-1 gap-4">
                    {authorshipRequests.length === 0 ? (
                        <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center">
                            <p className="text-gray-400 font-mono uppercase">Нет заявок на авторство.</p>
                        </div>
                    ) : (
                        authorshipRequests
                            .filter((req) => {
                                if (authorshipStatusFilter !== 'ALL' && req.status !== authorshipStatusFilter) return false;
                                if (!searchQuery.trim()) return true;
                                const q = searchQuery.toLowerCase();
                                return (
                                    req.user?.username?.toLowerCase().includes(q) ||
                                    req.user?.email?.toLowerCase().includes(q) ||
                                    (req.message || '').toLowerCase().includes(q)
                                );
                            })
                            .map((request) => (
                                <div key={request.id} className="bg-white border-2 border-black p-6 shadow-neo">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <span
                                                    className={`text-[10px] font-black uppercase px-2 py-1 border border-black ${
                                                        request.status === 'PENDING'
                                                            ? 'bg-yellow-100 text-yellow-900'
                                                            : request.status === 'APPROVED'
                                                            ? 'bg-green-100 text-green-900'
                                                            : 'bg-red-100 text-red-900'
                                                    }`}
                                                >
                                                    {request.status === 'PENDING'
                                                        ? 'НА РАССМОТРЕНИИ'
                                                        : request.status === 'APPROVED'
                                                        ? 'ОДОБРЕНО'
                                                        : 'ОТКЛОНЕНО'}
                                                </span>
                                                <span className="text-xs font-black uppercase">
                                                    {request.user?.username || request.userId}
                                                </span>
                                                {request.user && (
                                                    <span className="text-xs font-mono text-gray-500">
                                                        ID: {request.userId}
                                                    </span>
                                                )}
                                            </div>
                                            {request.message && (
                                                <div className="mb-3">
                                                    <h4 className="text-xs font-black uppercase mb-1">Сообщение:</h4>
                                                    <p className="text-sm font-mono text-gray-700 break-words">
                                                        {request.message}
                                                    </p>
                                                </div>
                                            )}
                                            {request.portfolioLink && (
                                                <div className="mb-3">
                                                    <h4 className="text-xs font-black uppercase mb-1">Портфолио:</h4>
                                                    <a
                                                        href={request.portfolioLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-mono text-blue-600 hover:underline break-all"
                                                    >
                                                        {request.portfolioLink}
                                                    </a>
                                                </div>
                                            )}
                                            {request.adminComment && (
                                                <div className="mt-3 pt-3 border-t-2 border-gray-300">
                                                    <h4 className="text-xs font-black uppercase mb-1">
                                                        Комментарий админа:
                                                    </h4>
                                                    <p className="text-sm font-mono text-gray-700 break-words">
                                                        {request.adminComment}
                                                    </p>
                                                </div>
                                            )}
                                            {request.createdAt && (
                                                <p className="text-xs font-mono text-gray-500 mt-3">
                                                    Подана: {new Date(request.createdAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        {request.status === 'PENDING' && (
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                <Button
                                                    onClick={() => handleApproveRequest(request.id)}
                                                    className="text-xs"
                                                >
                                                    ОДОБРИТЬ
                                                </Button>
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        value={rejectComment[request.id] || ''}
                                                        onChange={(e) =>
                                                            setRejectComment(prev => ({
                                                                ...prev,
                                                                [request.id]: e.target.value,
                                                            }))
                                                        }
                                                        className="w-48 px-2 py-1 border-2 border-black font-mono text-xs min-h-[60px]"
                                                        placeholder="Комментарий при отказе (необязательно)"
                                                        maxLength={500}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleRejectRequest(request.id)}
                                                        className="text-xs"
                                                    >
                                                        ОТКЛОНИТЬ
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            )}
        </div>
    );
};
