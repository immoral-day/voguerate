import React, { useState } from 'react';
import { ClothingItem, UpcomingDrop } from '../types';
import { DEFAULT_ITEM_IMAGE } from '../constants';
import { ChevronLeftIcon, PlusIcon, XIcon, EditIcon } from '../components/icons/Icons';
import { Button } from '../components/UI';
import { apiService } from '../services/apiService';

interface AdminPanelProps {
    items: ClothingItem[];
    drops: UpcomingDrop[];
    onCreateItem: (item: Partial<ClothingItem>) => Promise<void>;
    onCreateDrop: (drop: Partial<UpcomingDrop>) => Promise<void>;
    onDeleteItem: (id: string) => Promise<void>;
    onDeleteDrop: (id: string) => Promise<void>;
    onUpdateItem: (id: string, data: Partial<ClothingItem>) => Promise<void>;
    onUpdateDrop: (id: string, data: Partial<UpcomingDrop>) => Promise<void>;
    onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    items, drops, onCreateItem, onCreateDrop, onDeleteItem, onDeleteDrop, onUpdateItem, onUpdateDrop, onBack 
}) => {
    const [activeTab, setActiveTab] = useState<'items' | 'drops'>('items');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [formError, setFormError] = useState('');

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

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
                        <ChevronLeftIcon />
                    </button>
                    <h1 className="text-3xl font-black uppercase">АДМИН ПАНЕЛЬ</h1>
                </div>
                <Button onClick={() => { resetForm(); setShowForm(true); }}>
                    <PlusIcon className="mr-2" /> СОЗДАТЬ {activeTab === 'items' ? 'ПРЕДМЕТ' : 'РЕЛИЗ'}
                </Button>
            </div>

            <div className="flex border-b-2 border-black mb-8">
                {['items', 'drops'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab as 'items' | 'drops'); resetForm(); }}
                        className={`px-8 py-3 font-black text-sm uppercase border-t-2 border-l-2 border-r-2 ${activeTab === tab ? 'bg-black text-white border-black' : 'bg-transparent border-transparent text-gray-400 hover:text-black'}`}
                    >
                        {tab === 'items' ? 'ПРЕДМЕТЫ' : 'РЕЛИЗЫ'} ({tab === 'items' ? items.length : drops.length})
                    </button>
                ))}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.length === 0 ? (
                        <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center">
                            <p className="text-gray-400 font-mono uppercase">Нет предметов. Создайте первый!</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="bg-white border-2 border-black p-4 shadow-neo">
                                <div className="aspect-[4/5] bg-gray-100 mb-4 overflow-hidden">
                                    <img src={item.image || DEFAULT_ITEM_IMAGE} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black uppercase bg-neo-yellow px-1 border border-black">{item.brand}</span>
                                        <h3 className="font-black text-sm mt-1">{item.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">${item.price} • {item.category}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => startEditItem(item)} className="p-2 text-blue-500 hover:bg-blue-50 transition-colors">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDeleteItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 transition-colors">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drops.length === 0 ? (
                        <div className="col-span-full p-12 border-2 border-dashed border-gray-300 text-center">
                            <p className="text-gray-400 font-mono uppercase">Нет релизов. Создайте первый!</p>
                        </div>
                    ) : (
                        drops.map((drop) => (
                            <div key={drop.id} className="bg-white border-2 border-black p-4 shadow-neo">
                                <div className="aspect-square bg-gray-100 mb-4 overflow-hidden">
                                    <img src={drop.image || DEFAULT_ITEM_IMAGE} alt={drop.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black uppercase bg-neo-yellow px-1 border border-black">{drop.brand}</span>
                                        <h3 className="font-black text-sm mt-1">{drop.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">{typeof drop.price === 'number' ? `$${drop.price}` : drop.price} • {new Date(drop.releaseDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => startEditDrop(drop)} className="p-2 text-blue-500 hover:bg-blue-50 transition-colors">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDeleteDrop(drop.id)} className="p-2 text-red-500 hover:bg-red-50 transition-colors">
                                            <XIcon />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
