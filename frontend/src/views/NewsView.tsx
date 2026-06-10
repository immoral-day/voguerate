import React, { useEffect, useMemo, useState } from 'react';
import { Article as ArticleType } from '../types';
import { Button, SafeImage } from '../components/UI';
import { DEFAULT_ITEM_IMAGE } from '../constants';
import { stripHtmlToPlain } from '../utils/string';

interface NewsViewProps {
  articles: ArticleType[];
  onBack?: () => void;
  onArticleClick?: (articleId: string) => void;
}

const ARTICLE_PAGE_SIZE = 4;

export const NewsView: React.FC<NewsViewProps> = ({ articles, onBack, onArticleClick }) => {
  const [page, setPage] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics = useMemo(() => {
    const allTopics = articles.map(a => a.topic).filter((t): t is string => !!t && t.trim() !== '');
    return Array.from(new Set(allTopics)).sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (!selectedTopic) return articles;
    return articles.filter(a => a.topic === selectedTopic);
  }, [articles, selectedTopic]);

  const sorted = useMemo(
    () => [...filteredArticles].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()),
    [filteredArticles],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / ARTICLE_PAGE_SIZE));
  const pagedArticles = sorted.slice((page - 1) * ARTICLE_PAGE_SIZE, page * ARTICLE_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [sorted.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="animate-fade-in news-page">
      <div className="section-head">
        <div className="section-title"><span className="section-icon">СТ</span><h1 className="vr-h2">Статьи</h1></div>
        <span className="pill">материалов: {sorted.length}</span>
        {onBack && <Button variant="outline" onClick={onBack}>Назад</Button>}
      </div>

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedTopic(null)}
            className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-colors border-2 ${selectedTopic === null ? 'bg-black text-white border-black' : 'bg-transparent text-gray-500 border-gray-400 hover:border-black hover:text-black'}`}
          >
            Все темы
          </button>
          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-1 font-mono text-xs font-bold uppercase transition-colors border-2 ${selectedTopic === topic ? 'bg-black text-white border-black' : 'bg-transparent text-gray-500 border-gray-400 hover:border-black hover:text-black'}`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="card p-8 muted">Пока нет опубликованных статей.</div>
      ) : (
        <>
          <div className="news-grid">
            {pagedArticles.map((article) => (
              <article key={article.id} className="news-card" onClick={() => onArticleClick?.(article.id)}>
                {article.image ? (
                  <div className="news-cover">
                    <SafeImage src={article.image} fallback={DEFAULT_ITEM_IMAGE} alt="" loading="lazy" />
                  </div>
                ) : (
                  <div className="news-cover empty">ВОЯЖ</div>
                )}
                <div className="news-card-body">
                  <span className="pill">{article.topic || 'материал'}</span>
                  <h3>{article.title}</h3>
                  <p>{stripHtmlToPlain(article.body, 210) || 'Короткая заметка без описания.'}</p>
                  <div className="news-card-footer">
                    <span>{article.createdAt ? `Опубликовано ${new Date(article.createdAt).toLocaleDateString('ru-RU')}` : 'Без даты'}</span>
                    <strong>Читать статью</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="compact-pagination news-pagination">
              <button className="btn" type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Назад
              </button>
              <span>Страница {page} из {totalPages}</span>
              <button className="btn" type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
