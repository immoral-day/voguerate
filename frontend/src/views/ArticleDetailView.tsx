import React from 'react';
import { Article as ArticleType } from '../types';
import { Button } from '../components/UI';

interface ArticleDetailViewProps {
  article: ArticleType;
  onBack: () => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ article, onBack }) => {
  return (
    <div className="animate-fade-in pb-20 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase">Новости</h1>
        <Button variant="outline" onClick={onBack}>
          Назад
        </Button>
      </div>

      <article className="bg-white border-2 border-black p-6 shadow-neo">
        {article.image && (
          <div className="mb-6 aspect-video w-full overflow-hidden border-2 border-black">
            <img
              src={article.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h2 className="text-2xl font-black uppercase mb-2">{article.title}</h2>
        <div className="text-xs font-mono text-gray-500 mb-6">
          {article.createdAt &&
            new Date(article.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
        </div>
        <div
          className="article-body font-mono text-sm text-gray-800 break-words"
          dangerouslySetInnerHTML={{ __html: article.body ?? '' }}
        />
      </article>
    </div>
  );
};
