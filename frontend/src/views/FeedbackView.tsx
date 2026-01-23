import React, { useState } from 'react';
import { Button } from '../components/UI';

interface FeedbackViewProps {
    onToast: (msg: string) => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ onToast }) => {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (text.trim()) {
            onToast('Спасибо за фидбек!');
            setText('');
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-2xl mx-auto">
            <h1 className="text-5xl font-black mb-8 text-black uppercase">Feedback</h1>
            <div className="bg-white border-2 border-black p-8 shadow-neo">
                <p className="font-mono font-bold mb-6">Нашли баг или есть идея? Пишите.</p>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-bg border-2 border-black p-4 min-h-[200px] mb-6 font-mono text-sm focus:outline-none focus:shadow-neo transition-shadow" 
                    placeholder="Ваше сообщение..."
                />
                <Button className="w-full" onClick={handleSubmit}>ОТПРАВИТЬ</Button>
            </div>
        </div>
    );
};
