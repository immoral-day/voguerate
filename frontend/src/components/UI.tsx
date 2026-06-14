import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_AVATAR, DEFAULT_ITEM_IMAGE } from '../constants';

const failedImageSources = new Set<string>();

const resolveImageSource = (src: string | undefined, fallback?: string | null) =>
    src && !failedImageSources.has(src) ? src : (fallback || undefined);

export const getRatingColor = (score: number, max: number = 90) => {
    const percentage = (score / max) * 100;
    if (percentage <= 50) return 'red';
    if (percentage <= 82) return 'lime';
    return '';
};

export const getRatingColorHex = (score: number) => {
    if (score <= 45) return '#b75d5d';
    if (score <= 74) return '#d5bd63';
    return '#87b86f';
};

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'magic';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }> = ({
    children,
    variant = 'primary',
    className = '',
    ...props
}) => {
    const variantClass =
        variant === 'secondary' ? 'lime' :
        variant === 'magic' ? 'red' :
        variant === 'ghost' || variant === 'outline' || variant === 'primary' ? '' : '';

    return (
        <button className={`btn ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
};

export const SafeImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { fallback?: string | null }> = ({
    src,
    fallback = DEFAULT_ITEM_IMAGE,
    loading = 'lazy',
    decoding = 'async',
    ...props
}) => {
    const [currentSrc, setCurrentSrc] = useState<string | undefined>(resolveImageSource(src, fallback));

    useEffect(() => {
        setCurrentSrc(resolveImageSource(src, fallback));
    }, [src, fallback]);

    if (!currentSrc) return null;

    return (
        <img
            {...props}
            src={currentSrc}
            loading={loading}
            decoding={decoding}
            onError={() => {
                failedImageSources.add(currentSrc);
                setCurrentSrc(fallback || undefined);
            }}
        />
    );
};

export const Avatar: React.FC<{ src: string; alt: string; size?: 'sm' | 'md' | 'lg' | 'xl'; onClick?: (e?: React.MouseEvent) => void }> = ({
    src,
    alt,
    size = 'md',
    onClick,
}) => {
    const sizes = { sm: 28, md: 30, lg: 72, xl: 86 };
    const px = sizes[size];

    return (
        <span className="avatar" onClick={onClick} style={{ width: px, height: px, cursor: onClick ? 'pointer' : 'default' }}>
            <SafeImage src={src} alt={alt} fallback={DEFAULT_AVATAR} />
        </span>
    );
};

export const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <span className={`pill ${className}`}>{children}</span>
);

export const RatingCircle: React.FC<{ rating: number; size?: 'sm' | 'lg'; showMax?: boolean }> = ({
    rating,
    size = 'sm',
    showMax = false,
}) => (
    <span className={`score-badge ${getRatingColor(rating)} ${size === 'lg' ? 'min-w-[58px] h-[42px] text-xl' : ''}`}>
        {rating}{showMax ? <small className="text-[10px] text-white/60">/90</small> : null}
    </span>
);

export const ScoreDisplay: React.FC<{ score: number; max?: number }> = ({ score, max = 90 }) => {
    const percentage = Math.min(100, Math.max(0, (score / max) * 100));

    return (
        <div className="card p-3">
            <div className="review-actions mb-2">
                <span>Итог</span>
                <strong>{score}/{max}</strong>
            </div>
            <div className="bar"><span style={{ width: `${percentage}%` }} /></div>
        </div>
    );
};

export const ProgressBar: React.FC<{ value: number; max: number; label?: string; showValue?: boolean }> = ({
    value,
    max,
    label,
    showValue,
}) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="break-row" style={{ gridTemplateColumns: label ? undefined : '1fr 38px' }}>
            {label && <span>{label}</span>}
            <div className="bar"><span style={{ width: `${percentage}%` }} /></div>
            {(showValue || !label) && <b>{value}</b>}
        </div>
    );
};

export const UnifiedCard: React.FC<{
    image: string;
    title: string;
    subtitle?: string;
    badge?: string;
    metrics?: { value: number | string; type: 'filled' | 'dim' | 'outline'; label?: string }[];
    onClick?: () => void;
    onAction?: () => void;
    actionLabel?: string;
    secondaryIcon?: React.ReactNode;
}> = ({ image, title, subtitle, badge, metrics, onClick, onAction, actionLabel }) => (
    <article className="item-card" onClick={onClick}>
        <div className="item-cover">
            <SafeImage src={image} alt={title} fallback={DEFAULT_ITEM_IMAGE} />
            <div className="cover-meta">
                {badge && <span className="tiny">{badge}</span>}
                {metrics?.[1] && <span className="tiny">{metrics[1].value}</span>}
            </div>
        </div>
        <div className="item-body">
            <div className="item-title">{title}</div>
            <div className="item-meta">{subtitle}</div>
            <div className="item-bottom">
                <button
                    className="item-btn"
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        (onAction || onClick)?.();
                    }}
                >
                    {actionLabel || 'Открыть'}
                </button>
                {metrics?.[0] && <span className="score-badge">{metrics[0].value}</span>}
            </div>
        </div>
    </article>
);

export const CrystalSlider: React.FC<{
    label: string;
    value: number;
    max?: number;
    onChange: (val: number) => void;
    multiplier?: number;
}> = ({ label, value, onChange, max = 10, multiplier = 1 }) => (
    <div className="break-row" style={{ gridTemplateColumns: '150px 1fr 34px' }}>
        <span>{label} x{multiplier}</span>
        <input
            type="range"
            min={1}
            max={max}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            style={{ width: '100%', accentColor: '#6f92c9' }}
        />
        <b>{value}</b>
    </div>
);

export const Lightbox: React.FC<{
    src?: string;
    images?: string[];
    alt: string;
    initialIndex?: number;
    onClose: () => void;
}> = ({ src, images, alt, initialIndex = 0, onClose }) => {
    const gallery = useMemo(() => {
        const list = images?.length ? images : (src ? [src] : []);
        return Array.from(new Set(list.filter(Boolean))).slice(0, 3);
    }, [images, src]);
    const [index, setIndex] = useState(() => Math.min(initialIndex, Math.max(0, gallery.length - 1)));
    const current = gallery[index] || src || '';
    const canBrowse = gallery.length > 1;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (!canBrowse) return;
            if (event.key === 'ArrowLeft') setIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
            if (event.key === 'ArrowRight') setIndex((prev) => (prev + 1) % gallery.length);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [canBrowse, gallery.length, onClose]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    if (!current) return null;

    return createPortal(
        <div className="lightbox" onClick={onClose}>
            <button className="btn lightbox-close" type="button" onClick={onClose}>Закрыть</button>
            <div className="lightbox-frame" onClick={(event) => event.stopPropagation()}>
                {canBrowse && (
                    <button
                        className="lightbox-arrow left"
                        type="button"
                        aria-label="Предыдущее фото"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
                        }}
                    >
                        ‹
                    </button>
                )}
                <SafeImage
                    className="lightbox-image"
                    src={current}
                    fallback={DEFAULT_ITEM_IMAGE}
                    alt={alt}
                    loading="eager"
                />
                {canBrowse && <div className="lightbox-counter">{index + 1} / {gallery.length}</div>}
                {canBrowse && (
                    <button
                        className="lightbox-arrow right"
                        type="button"
                        aria-label="Следующее фото"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIndex((prev) => (prev + 1) % gallery.length);
                        }}
                    >
                        ›
                    </button>
                )}
            </div>
            {canBrowse && (
                <div className="lightbox-thumbs" onClick={(event) => event.stopPropagation()}>
                    {gallery.map((image, imageIndex) => (
                        <button
                            className={imageIndex === index ? 'active' : ''}
                            type="button"
                            key={image}
                            onClick={() => setIndex(imageIndex)}
                        >
                            <SafeImage src={image} fallback={DEFAULT_ITEM_IMAGE} alt={`${alt} ${imageIndex + 1}`} />
                        </button>
                    ))}
                </div>
            )}
        </div>,
        document.body,
    );
};

export const ToastContainer: React.FC<{ toasts: { id: string; message: string }[]; onRemove?: (id: string) => void }> = ({ toasts }) => {
    if (!toasts?.length) return null;

    return (
        <div className="toast-stack">
            {toasts.map((toast) => (
                <div key={toast.id} className="toast">{toast.message}</div>
            ))}
        </div>
    );
};
