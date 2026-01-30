import React from 'react';
import { Article as ArticleType } from '../types';
import { Button } from '../components/UI';
import { stripHtmlToPlain } from '../utils/string';

interface NewsViewProps {
  articles: ArticleType[];
  onBack?: () => void;
  onArticleClick?: (articleId: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ articles, onBack, onArticleClick }) => {
  const sorted = [...articles].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  return (
    <div className="animate-fade-in pb-20 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase">Новости</h1>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Назад
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 p-12 text-center font-mono text-sm text-gray-500 uppercase">
          Пока нет новостей.
        </div>
      ) : (
        <div className="space-y-6">
          {sorted.map((article, idx) => (
            <article
              key={article.id}
              className="bg-white border-2 border-black p-6 shadow-neo opacity-0 animate-slide-up cursor-pointer hover:shadow-neo-lg transition-shadow"
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => onArticleClick?.(article.id)}
              role={onArticleClick ? 'button' : undefined}
            >
              {article.image && (
                <div className="mb-4 aspect-video w-full overflow-hidden border-2 border-black">
                  <img
                    src={article.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h2 className="text-xl font-black uppercase mb-2 hover:underline">
                {article.title}
              </h2>
              <div className="text-xs font-mono text-gray-500 mb-3">
                {article.createdAt &&
                  new Date(article.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
              </div>
              <p className="text-sm font-mono text-gray-700 line-clamp-2">
                {stripHtmlToPlain(article.body, 160)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
