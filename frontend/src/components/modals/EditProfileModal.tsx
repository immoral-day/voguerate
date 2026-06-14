import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClothingItem, User } from '../../types';
import { DEFAULT_AVATAR } from '../../constants';
import { XIcon } from '../icons/Icons';
import { Avatar, Button, SafeImage } from '../UI';
import { apiService } from '../../services/apiService';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    users: User[];
    items: ClothingItem[];
    onSave: (data: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, users, items, onSave }) => {
    const [bio, setBio] = useState(user.bio || '');
    const [favoriteDesigners, setFavoriteDesigners] = useState<string[]>(user.favoriteDesigners || []);
    const [designerPickerOpen, setDesignerPickerOpen] = useState(false);
    const [designerQuery, setDesignerQuery] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState(user.avatar || DEFAULT_AVATAR);
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [backgroundPreview, setBackgroundPreview] = useState(user.profileBackground || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const backgroundInputRef = useRef<HTMLInputElement>(null);
    const avatarPreviewUrl = useRef<string | null>(null);
    const backgroundPreviewUrl = useRef<string | null>(null);

    const revokePreviewUrls = () => {
        if (avatarPreviewUrl.current) {
            URL.revokeObjectURL(avatarPreviewUrl.current);
            avatarPreviewUrl.current = null;
        }
        if (backgroundPreviewUrl.current) {
            URL.revokeObjectURL(backgroundPreviewUrl.current);
            backgroundPreviewUrl.current = null;
        }
    };

    useEffect(() => {
        revokePreviewUrls();
        setBio(user.bio || '');
        setFavoriteDesigners(user.favoriteDesigners || []);
        setDesignerPickerOpen(false);
        setDesignerQuery('');
        setAvatarPreview(user.avatar || DEFAULT_AVATAR);
        setBackgroundPreview(user.profileBackground || '');
    }, [user]);

    useEffect(() => {
        if (!isOpen) {
            revokePreviewUrls();
        }

        return revokePreviewUrls;
    }, [isOpen]);

    const knownDesigners = useMemo(() => {
        const names = new Map<string, { name: string; source: string; popularity: number }>();

        users
            .filter((entry) => entry.role === 'DESIGNER')
            .forEach((entry) => {
                const designerName = entry.brandName || entry.username;
                names.set(designerName.toLowerCase(), {
                    name: designerName,
                    source: 'Автор на сайте',
                    popularity: entry.reputation,
                });
            });

        items.forEach((item) => {
            const key = item.brand.trim().toLowerCase();
            if (!key) return;
            const existing = names.get(key);
            names.set(key, {
                name: existing?.name || item.brand.trim(),
                source: existing ? existing.source : 'Работы представлены на сайте',
                popularity: (existing?.popularity || 0) + item.ratingCount + 1,
            });
        });

        return [...names.values()].sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name, 'ru'));
    }, [items, users]);

    const normalizedDesignerQuery = designerQuery.trim().toLowerCase();
    const designerSuggestions = knownDesigners
        .filter((entry) => !favoriteDesigners.some((name) => name.toLowerCase() === entry.name.toLowerCase()))
        .filter((entry) => !normalizedDesignerQuery || entry.name.toLowerCase().includes(normalizedDesignerQuery))
        .slice(0, 8);
    const hasExactKnownDesigner = knownDesigners.some((entry) => entry.name.toLowerCase() === normalizedDesignerQuery);

    const addDesigner = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed || favoriteDesigners.some((entry) => entry.toLowerCase() === trimmed.toLowerCase())) return;
        setFavoriteDesigners((current) => [...current, trimmed]);
        setDesignerQuery('');
    };

    if (!isOpen) return null;

    const previewFile = (file: File, onLoad: (value: string) => void, previewRef: React.MutableRefObject<string | null>) => {
        if (previewRef.current) {
            URL.revokeObjectURL(previewRef.current);
        }
        const url = URL.createObjectURL(file);
        previewRef.current = url;
        onLoad(url);
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        previewFile(file, setAvatarPreview, avatarPreviewUrl);
    };

    const handleBackgroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setBackgroundFile(file);
        previewFile(file, setBackgroundPreview, backgroundPreviewUrl);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            let avatarUrl = user.avatar;
            let backgroundUrl = user.profileBackground || '';

            if (avatarFile) {
                const upload = await apiService.uploadFile(avatarFile, 'avatar');
                avatarUrl = upload.url;
            }

            if (backgroundFile) {
                const upload = await apiService.uploadFile(backgroundFile, 'profile');
                backgroundUrl = upload.url;
            }

            await onSave({
                bio,
                avatar: avatarUrl,
                profileBackground: backgroundUrl,
                favoriteDesigners,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="form-box modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="section-head !m-0">
                    <div className="section-title"><h3 className="vr-h2">Редактировать профиль</h3></div>
                    <button className="item-btn" type="button" onClick={onClose} aria-label="Закрыть"><XIcon /></button>
                </div>

                <div className="grid justify-items-center gap-2">
                    <button className="profile-avatar !m-0 !border-[var(--line)]" type="button" onClick={() => fileInputRef.current?.click()}>
                        <Avatar src={avatarPreview} alt={user.username} size="xl" />
                    </button>
                    <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>Изменить аватар</Button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>

                <label>
                    Фон профиля
                    <div className="profile-bg rounded-[6px] overflow-hidden">
                        {backgroundPreview ? <SafeImage src={backgroundPreview} fallback={null} alt="Фон профиля" /> : <span className="empty-box !min-h-full">Фон не выбран</span>}
                    </div>
                    <Button type="button" variant="ghost" onClick={() => backgroundInputRef.current?.click()}>Выбрать фон</Button>
                    <input ref={backgroundInputRef} type="file" accept="image/*" onChange={handleBackgroundChange} className="hidden" />
                </label>

                <label>
                    О себе
                    <textarea value={bio} onChange={(event) => setBio(event.target.value)} className="vr-input" />
                </label>

                <div className="designer-picker">
                    <div className="designer-picker-head">
                        <span>Любимые дизайнеры</span>
                        <button
                            className="designer-add-button"
                            type="button"
                            onClick={() => setDesignerPickerOpen((current) => !current)}
                            aria-label="Добавить дизайнера"
                        >
                            +
                        </button>
                    </div>

                    <div className="designer-selected">
                        {favoriteDesigners.map((designer) => (
                            <span className="designer-chip" key={designer}>
                                {designer}
                                <button
                                    type="button"
                                    onClick={() => setFavoriteDesigners((current) => current.filter((entry) => entry !== designer))}
                                    aria-label={`Удалить ${designer}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        {favoriteDesigners.length === 0 && <span className="muted">Дизайнеры пока не добавлены.</span>}
                    </div>

                    {designerPickerOpen && (
                        <div className="designer-picker-panel">
                            <input
                                value={designerQuery}
                                onChange={(event) => setDesignerQuery(event.target.value)}
                                className="vr-input"
                                placeholder="Найти дизайнера или бренд"
                                autoFocus
                            />
                            <div className="designer-suggestions">
                                {designerSuggestions.map((entry) => (
                                    <button type="button" key={entry.name} onClick={() => addDesigner(entry.name)}>
                                        <strong>{entry.name}</strong>
                                        <small>{entry.source}</small>
                                    </button>
                                ))}
                            </div>
                            {normalizedDesignerQuery && !hasExactKnownDesigner && (
                                <button className="designer-custom-add" type="button" onClick={() => addDesigner(designerQuery)}>
                                    Добавить «{designerQuery.trim()}» вручную
                                </button>
                            )}
                            {!normalizedDesignerQuery && designerSuggestions.length > 0 && (
                                <p className="muted">Сначала показаны популярные авторы и бренды с работами на сайте.</p>
                            )}
                        </div>
                    )}
                </div>

                {error && <div className="pill red">{error}</div>}

                <div className="actions justify-start">
                    <Button type="button" onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
                    <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
                </div>
            </div>
        </div>
    );
};
