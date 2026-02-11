import React, { useEffect, useState } from 'react';
import { AuthorshipRequest, ClothingItem, UpcomingDrop, User } from '../types';
import { apiService } from '../services/apiService';
import { Button } from '../components/UI';

interface AuthorshipViewProps {
  currentUser: User;
  onBack?: () => void;
  onToast?: (msg: string) => void;
}

export const AuthorshipView: React.FC<AuthorshipViewProps> = ({ currentUser, onBack, onToast }) => {
  const [existingRequest, setExistingRequest] = useState<AuthorshipRequest | null>(null);

  // Детализированная форма заявки (3 блока текста)
  const [experience, setExperience] = useState('');
  const [styles, setStyles] = useState('');
  const [motivation, setMotivation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Панель автора: анонсы и предметы
  const [authorItems, setAuthorItems] = useState<ClothingItem[]>([]);
  const [authorDrops, setAuthorDrops] = useState<UpcomingDrop[]>([]);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [dropFormOpen, setDropFormOpen] = useState(false);

  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState('');

  const [dropImageFile, setDropImageFile] = useState<File | null>(null);
  const [dropImagePreview, setDropImagePreview] = useState('');

  const [itemSaving, setItemSaving] = useState(false);
  const [dropSaving, setDropSaving] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  const [itemForm, setItemForm] = useState({
    name: '',
    price: 0,
    releaseDate: new Date().toISOString().split('T')[0],
    category: 'Streetwear' as ClothingItem['category'],
    type: 'SINGLE_LOOK' as ClothingItem['type'],
    tags: '',
    sizes: '',
    colors: '',
  });

  const [dropForm, setDropForm] = useState({
    name: '',
    price: '' as string | number,
    releaseDate: new Date().toISOString().split('T')[0],
  });

  const loadMyRequest = async () => {
    try {
      setError(null);
      // Берём заявки конкретного пользователя (любой статус)
      const mine = await apiService.get<AuthorshipRequest[]>(
        `/v1/authorship-requests?userId=${currentUser.id}`,
      );
      setExistingRequest(mine[0] || null);
    } catch (e) {
      console.error('Failed to load authorship requests', e);
    }
  };

  useEffect(() => {
    loadMyRequest();
  }, []);

  // Загрузка текущих вещей/дропов автора (по бренду = ник)
  const loadAuthorContent = async () => {
    try {
      const [items, drops] = await Promise.all([
        apiService.get<ClothingItem[]>('/v1/items'),
        apiService.get<UpcomingDrop[]>('/v1/drops'),
      ]);
      const brand = currentUser.username;
      setAuthorItems(items.filter(i => i.brand === brand));
      setAuthorDrops(drops.filter(d => d.brand === brand));
    } catch (e) {
      console.error('Failed to load author content', e);
    }
  };

  useEffect(() => {
    if (existingRequest && existingRequest.status === 'APPROVED') {
      loadAuthorContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRequest?.status]);

  const handleItemImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setItemImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setItemImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setDashboardError('');
    }
  };

  const handleDropImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDropImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setDropImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setDashboardError('');
    }
  };

  const resetItemForm = () => {
    setItemForm({
      name: '',
      price: 0,
      releaseDate: new Date().toISOString().split('T')[0],
      category: 'Streetwear',
      type: 'SINGLE_LOOK',
      tags: '',
      sizes: '',
      colors: '',
    });
    setItemImageFile(null);
    setItemImagePreview('');
    setDashboardError('');
    setItemFormOpen(false);
  };

  const resetDropForm = () => {
    setDropForm({
      name: '',
      price: '',
      releaseDate: new Date().toISOString().split('T')[0],
    });
    setDropImageFile(null);
    setDropImagePreview('');
    setDashboardError('');
    setDropFormOpen(false);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemImageFile) {
      setDashboardError('Добавь изображение предмета.');
      return;
    }
    if (!itemForm.name.trim()) {
      setDashboardError('Укажи название предмета.');
      return;
    }
    setItemSaving(true);
    setDashboardError('');
    try {
      const upload = await apiService.uploadFile(itemImageFile, 'item');
      const payload = {
        brand: currentUser.username,
        name: itemForm.name.trim(),
        image: upload.url,
        releaseDate: itemForm.releaseDate,
        type: itemForm.type,
        category: itemForm.category,
        price: itemForm.price || 0,
        tags: itemForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        sizes: itemForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: itemForm.colors.split(',').map(c => c.trim()).filter(Boolean),
      };
      const created = await apiService.post<ClothingItem>('/v1/items', payload);
      setAuthorItems(prev => [created, ...prev]);
      onToast?.('Предмет опубликован');
      resetItemForm();
    } catch (e) {
      const err = e as Error;
      setDashboardError(err.message || 'Ошибка публикации предмета.');
    } finally {
      setItemSaving(false);
    }
  };

  const handleCreateDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropImageFile) {
      setDashboardError('Добавь изображение анонса.');
      return;
    }
    if (!dropForm.name.trim()) {
      setDashboardError('Укажи название анонса.');
      return;
    }
    setDropSaving(true);
    setDashboardError('');
    try {
      const upload = await apiService.uploadFile(dropImageFile, 'drop');
      const payload = {
        brand: currentUser.username,
        name: dropForm.name.trim(),
        image: upload.url,
        releaseDate: dropForm.releaseDate,
        price: dropForm.price || undefined,
      };
      const created = await apiService.post<UpcomingDrop>('/v1/drops', payload);
      setAuthorDrops(prev => [created, ...prev]);
      onToast?.('Анонс опубликован');
      resetDropForm();
    } catch (e) {
      const err = e as Error;
      setDashboardError(err.message || 'Ошибка публикации анонса.');
    } finally {
      setDropSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingRequest && existingRequest.status === 'PENDING') {
      setError('У вас уже есть активная заявка или вы уже являетесь автором.');
      return;
    }

    const experienceTrimmed = experience.trim();
    const stylesTrimmed = styles.trim();
    const motivationTrimmed = motivation.trim();

    if (!experienceTrimmed || !stylesTrimmed || !motivationTrimmed) {
      setError('Заполни все поля: опыт, стиль и мотивацию (минимум 80 символов суммарно).');
      return;
    }

    const totalLength =
      experienceTrimmed.length +
      stylesTrimmed.length +
      motivationTrimmed.length;

    if (totalLength < 80) {
      setError('Напиши подробнее — минимум 80 символов суммарно по всем полям.');
      return;
    }

    setLoading(true);
    setError(null);

    // Собираем подробный текст заявки для администратора
    const lines: string[] = [
      'Опыт и бэкграунд:',
      experienceTrimmed,
      '',
      'Стиль / направления:',
      stylesTrimmed,
      '',
      'Почему хочу стать автором:',
      motivationTrimmed,
    ];

    const message = lines.join('\n');

    try {
      const created = await apiService.post<AuthorshipRequest>('/v1/authorship-requests', {
        userId: currentUser.id,
        message,
      });
      setExistingRequest(created);
      if (onToast) onToast('Заявка на авторство отправлена');
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Ошибка отправки заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pb-20 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase">
          {existingRequest && existingRequest.status === 'APPROVED'
            ? 'Кабинет автора'
            : 'Заявка на авторство'}
        </h1>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Назад
          </Button>
        )}
      </div>

      {existingRequest && (
        <div className="mb-8 border-2 border-black p-4 shadow-neo bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase">
              Текущий статус:{' '}
              {existingRequest.status === 'PENDING'
                ? 'На рассмотрении'
                : existingRequest.status === 'APPROVED'
                ? 'Одобрена'
                : 'Отклонена'}
            </span>
            {existingRequest.createdAt && (
              <span className="text-xs font-mono text-gray-500">
                от {new Date(existingRequest.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {existingRequest.adminComment && (
            <div className="mt-2">
              <div className="text-xs font-black uppercase mb-1">Комментарий администратора:</div>
              <p className="text-sm font-mono text-gray-800 whitespace-pre-wrap">{existingRequest.adminComment}</p>
            </div>
          )}
        </div>
      )}

      {existingRequest && existingRequest.status === 'PENDING' && (
        <p className="text-sm font-mono text-gray-600">
          Ваша заявка уже отправлена. Дождитесь решения администратора.
        </p>
      )}

      {!existingRequest && (
        <form
          onSubmit={handleSubmit}
          className="border-2 border-black p-6 bg-white shadow-neo space-y-4"
        >
          <div>
            <label className="block text-xs font-black uppercase mb-1">Опыт и бэкграунд</label>
            <p className="text-[10px] font-mono text-gray-500 mb-2">
              Обязательно. Опиши опыт, бренды, обучение. Рекомендуем до 1000 символов.
            </p>
            <textarea
              value={experience}
              onChange={e => setExperience(e.target.value)}
              className="w-full border-2 border-black p-3 font-mono text-sm min-h-[120px]"
              placeholder="Расскажи, чем занимался(ась), с кем работал(а), образование и т.п."
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Стиль / направления</label>
            <p className="text-[10px] font-mono text-gray-500 mb-2">
              Обязательно. Какие стили и темы раскрываешь. Рекомендуем до 600 символов.
            </p>
            <textarea
              value={styles}
              onChange={e => setStyles(e.target.value)}
              className="w-full border-2 border-black p-3 font-mono text-sm min-h-[80px]"
              placeholder="Какие стили, жанры, форматы тебе ближе?"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">
              Почему ты хочешь стать автором ВР
            </label>
            <p className="text-[10px] font-mono text-gray-500 mb-2">
              Обязательно. Зачем тебе авторство и что хочешь привнести. Рекомендуем до 800 символов.
            </p>
            <textarea
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              className="w-full border-2 border-black p-3 font-mono text-sm min-h-[100px]"
              placeholder="Что хочешь привнести в архив, какая у тебя философия и цели?"
            />
          </div>

          {error && (
            <p className="text-[11px] font-mono text-red-600 mt-2">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ ЗАЯВКУ'}
            </Button>
          </div>
        </form>
      )}

      {existingRequest && existingRequest.status === 'APPROVED' && (
        <div className="space-y-10">
          <p className="text-sm font-mono text-gray-600">
            Ты автор. Ниже — инструменты для анонсов и вещей.
          </p>

          {/* Блок анонсов */}
          <div className="border-2 border-black bg-white shadow-neo p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black uppercase">Анонс релиза</h2>
              <Button
                variant={dropFormOpen ? 'ghost' : 'primary'}
                onClick={() => setDropFormOpen(v => !v)}
                className="text-xs"
              >
                {dropFormOpen ? 'Скрыть форму' : 'Создать анонс'}
              </Button>
            </div>
            {dropFormOpen && (
              <form onSubmit={handleCreateDrop} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Название релиза</label>
                  <input
                    type="text"
                    value={dropForm.name}
                    onChange={e => setDropForm({ ...dropForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                    placeholder="Название капсулы / дропа"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Цена (опционально)</label>
                  <input
                    type="text"
                    value={dropForm.price}
                    onChange={e => setDropForm({ ...dropForm, price: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                    placeholder="Например 250 или TBA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Дата релиза</label>
                  <input
                    type="date"
                    value={dropForm.releaseDate}
                    onChange={e => setDropForm({ ...dropForm, releaseDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase mb-2">Постер</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      id="author-drop-image"
                      className="hidden"
                      onChange={handleDropImageChange}
                    />
                    <label
                      htmlFor="author-drop-image"
                      className="px-6 py-3 border-2 border-black cursor-pointer hover:bg-black hover:text-white transition-colors font-bold uppercase text-xs"
                    >
                      Выбрать файл
                    </label>
                    {dropImagePreview && (
                      <div className="w-16 h-16 border-2 border-black overflow-hidden">
                        <img src={dropImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-3 mt-2">
                  <Button type="submit" disabled={dropSaving} className="text-xs">
                    {dropSaving ? 'ПУБЛИКУЕМ...' : 'ОПУБЛИКОВАТЬ АНОНС'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetDropForm}
                    className="text-xs"
                  >
                    ОТМЕНА
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {authorDrops.length === 0 ? (
                <div className="col-span-full p-6 border-2 border-dashed border-gray-300 text-center text-xs font-mono text-gray-500 uppercase">
                  Пока нет анонсов.
                </div>
              ) : (
                authorDrops.map(drop => (
                  <div key={drop.id} className="border-2 border-black p-3 flex gap-3 items-center">
                    <div className="w-16 h-16 border-2 border-black overflow-hidden flex-shrink-0">
                      <img src={drop.image} alt={drop.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-black uppercase bg-neo-yellow px-1 border border-black inline-block mb-1">
                        {drop.brand}
                      </div>
                      <div className="font-black text-xs uppercase truncate">{drop.name}</div>
                      <div className="text-[11px] font-mono text-gray-500 mt-1">
                        {typeof drop.price === 'number' ? `${drop.price} ₽` : drop.price}{' '}
                        • {new Date(drop.releaseDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Блок предметов */}
          <div className="border-2 border-black bg-white shadow-neo p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black uppercase">Предметы</h2>
              <Button
                variant={itemFormOpen ? 'ghost' : 'primary'}
                onClick={() => setItemFormOpen(v => !v)}
                className="text-xs"
              >
                {itemFormOpen ? 'Скрыть форму' : 'Создать предмет'}
              </Button>
            </div>
            {itemFormOpen && (
              <form onSubmit={handleCreateItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Название</label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                    placeholder="Название вещи"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Цена (₽)</label>
                  <input
                    type="number"
                    value={itemForm.price}
                    onChange={e =>
                      setItemForm({
                        ...itemForm,
                        price: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Дата релиза</label>
                  <input
                    type="date"
                    value={itemForm.releaseDate}
                    onChange={e => setItemForm({ ...itemForm, releaseDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Категория</label>
                  <select
                    value={itemForm.category}
                    onChange={e =>
                      setItemForm({ ...itemForm, category: e.target.value as ClothingItem['category'] })
                    }
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                  >
                    <option value="Streetwear">Streetwear</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Techwear">Techwear</option>
                    <option value="Vintage">Vintage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Тип</label>
                  <select
                    value={itemForm.type}
                    onChange={e =>
                      setItemForm({ ...itemForm, type: e.target.value as ClothingItem['type'] })
                    }
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                  >
                    <option value="SINGLE_LOOK">Single Look</option>
                    <option value="COLLECTION">Collection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Теги (через запятую)</label>
                  <input
                    type="text"
                    value={itemForm.tags}
                    onChange={e => setItemForm({ ...itemForm, tags: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                    placeholder="Runway, Archive, Limited"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Размеры (через запятую)</label>
                  <input
                    type="text"
                    value={itemForm.sizes}
                    onChange={e => setItemForm({ ...itemForm, sizes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                    placeholder="S, M, L, XL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Цвета (через запятую)</label>
                  <input
                    type="text"
                    value={itemForm.colors}
                    onChange={e => setItemForm({ ...itemForm, colors: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black font-mono text-sm"
                    placeholder="Black, White"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase mb-2">Изображение</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      id="author-item-image"
                      className="hidden"
                      onChange={handleItemImageChange}
                    />
                    <label
                      htmlFor="author-item-image"
                      className="px-6 py-3 border-2 border-black cursor-pointer hover:bg-black hover:text-white transition-colors font-bold uppercase text-xs"
                    >
                      Выбрать файл
                    </label>
                    {itemImagePreview && (
                      <div className="w-16 h-16 border-2 border-black overflow-hidden">
                        <img src={itemImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-3 mt-2">
                  <Button type="submit" disabled={itemSaving} className="text-xs">
                    {itemSaving ? 'ПУБЛИКУЕМ...' : 'ОПУБЛИКОВАТЬ ПРЕДМЕТ'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetItemForm}
                    className="text-xs"
                  >
                    ОТМЕНА
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {authorItems.length === 0 ? (
                <div className="col-span-full p-6 border-2 border-dashed border-gray-300 text-center text-xs font-mono text-gray-500 uppercase">
                  Пока нет предметов.
                </div>
              ) : (
                authorItems.map(item => (
                  <div key={item.id} className="border-2 border-black p-3 flex gap-3 items-center">
                    <div className="w-16 h-16 border-2 border-black overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-black uppercase bg-neo-yellow px-1 border border-black inline-block mb-1">
                        {item.brand}
                      </div>
                      <div className="font-black text-xs uppercase truncate">{item.name}</div>
                      <div className="text-[11px] font-mono text-gray-500 mt-1">
                        {item.price} ₽ • {item.category}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {dashboardError && (
            <p className="text-[11px] font-mono text-red-600 mt-2">{dashboardError}</p>
          )}
        </div>
      )}
    </div>
  );
};

