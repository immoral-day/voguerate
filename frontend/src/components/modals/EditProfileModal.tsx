import React, { useEffect, useRef, useState } from 'react';
import { User } from '../../types';
import { DEFAULT_AVATAR } from '../../constants';
import { XIcon } from '../icons/Icons';
import { Avatar, Button } from '../UI';
import { apiService } from '../../services/apiService';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSave: (data: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [bio, setBio] = useState(user.bio || '');
    const [favoriteDesigners, setFavoriteDesigners] = useState(user.favoriteDesigners?.join(', ') || '');
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
        setFavoriteDesigners(user.favoriteDesigners?.join(', ') || '');
        setAvatarPreview(user.avatar || DEFAULT_AVATAR);
        setBackgroundPreview(user.profileBackground || '');
    }, [user]);

    useEffect(() => {
        if (!isOpen) {
            revokePreviewUrls();
        }

        return revokePreviewUrls;
    }, [isOpen]);

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
                favoriteDesigners: favoriteDesigners.split(',').map((item) => item.trim()).filter(Boolean),
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
                        {backgroundPreview ? <img src={backgroundPreview} alt="Фон профиля" /> : <span className="empty-box !min-h-full">Фон не выбран</span>}
                    </div>
                    <Button type="button" variant="ghost" onClick={() => backgroundInputRef.current?.click()}>Выбрать фон</Button>
                    <input ref={backgroundInputRef} type="file" accept="image/*" onChange={handleBackgroundChange} className="hidden" />
                </label>

                <label>
                    О себе
                    <textarea value={bio} onChange={(event) => setBio(event.target.value)} className="vr-input" />
                </label>

                <label>
                    Любимые бренды через запятую
                    <input value={favoriteDesigners} onChange={(event) => setFavoriteDesigners(event.target.value)} className="vr-input" placeholder="Rick Owens, Balenciaga, Acronym" />
                </label>

                {error && <div className="pill red">{error}</div>}

                <div className="actions justify-start">
                    <Button type="button" onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
                    <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
                </div>
            </div>
        </div>
    );
};
