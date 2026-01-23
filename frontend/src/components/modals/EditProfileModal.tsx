import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { DEFAULT_AVATAR } from '../../constants';
import { XIcon } from '../icons/Icons';
import { Button, Avatar } from '../UI';
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
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setBio(user.bio || '');
        setFavoriteDesigners(user.favoriteDesigners?.join(', ') || '');
        setAvatarPreview(user.avatar || DEFAULT_AVATAR);
    }, [user]);

    if (!isOpen) return null;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            let avatarUrl = user.avatar;
            if (avatarFile) {
                console.log('Uploading avatar...', avatarFile.name);
                const upload = await apiService.uploadFile(avatarFile, 'avatar');
                console.log('Upload result:', upload);
                avatarUrl = upload.url;
            }
            console.log('Saving profile with avatar:', avatarUrl);
            await onSave({
                bio,
                avatar: avatarUrl,
                favoriteDesigners: favoriteDesigners.split(',').map(d => d.trim()).filter(Boolean),
            });
            onClose();
        } catch (err) {
            console.error('Error saving profile:', err);
            setError(err instanceof Error ? err.message : 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white border-2 border-black shadow-neo-lg w-full max-w-lg relative animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b-2 border-black bg-neo-yellow">
                    <h3 className="font-black uppercase">Edit Profile</h3>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Avatar src={avatarPreview} alt={user.username} size="lg" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                <span className="text-white text-xs font-bold uppercase">ИЗМЕНИТЬ</span>
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        <p className="text-xs text-gray-500 mt-2">Нажмите для загрузки</p>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase mb-2">Bio</label>
                        <textarea 
                            value={bio} 
                            onChange={e => setBio(e.target.value)}
                            className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:shadow-neo transition-shadow bg-bg min-h-[100px]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase mb-2">Любимые бренды (через запятую)</label>
                        <input 
                            value={favoriteDesigners} 
                            onChange={e => setFavoriteDesigners(e.target.value)}
                            className="w-full border-2 border-black p-3 font-mono text-xs focus:outline-none focus:shadow-neo transition-shadow bg-bg"
                            placeholder="Rick Owens, Balenciaga, Acronym"
                        />
                    </div>
                    {error && (
                        <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold">
                            {error}
                        </div>
                    )}
                    <div className="flex gap-4 pt-4">
                        <Button className="flex-1" onClick={handleSave} disabled={saving}>
                            {saving ? 'СОХРАНЕНИЕ...' : 'SAVE CHANGES'}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={onClose}>CANCEL</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
