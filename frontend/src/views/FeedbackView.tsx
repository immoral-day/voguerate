import React, { useState } from 'react';
import { Button } from '../components/UI';

interface FeedbackViewProps {
    onSubmit: (message: string) => Promise<void>;
    onToast: (msg: string) => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ onSubmit, onToast }) => {
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        const message = text.trim();
        if (message.length < 3) {
            onToast('Опишите сообщение минимум в 3 символа');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(message);
            setText('');
            onToast('Фидбек сохранён');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in feedback-page">
            <div className="section-head">
                <div className="section-title"><span className="section-icon">ОС</span><h1 className="vr-h2">Обратная связь</h1></div>
            </div>
            <div className="form-box feedback-form">
                <label>
                    Сообщение
                    <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Опишите проблему или идею" />
                </label>
                <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Отправка...' : 'Отправить'}</Button>
            </div>
        </div>
    );
};
