import React from 'react';
import { Article as ArticleType } from '../types';
import { Button } from '../components/UI';

interface ArticleDetailViewProps {
  article: ArticleType;
  onBack: () => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ article, onBack }) => (
  <div className="animate-fade-in">
    <div className="section-head">
      <div className="section-title"><span className="section-icon">СТ</span><h1 className="vr-h2">Статья</h1></div>
      <Button variant="outline" onClick={onBack}>К статьям</Button>
    </div>
    <article className="article-shell article-body">
      {article.image && <div className="article-cover"><img src={article.image} alt="" /></div>}
      <span className="pill red">материал</span>
      <h1 className="vr-h1 mt-4">{article.title}</h1>
      {article.createdAt && <p className="muted">Опубликовано {new Date(article.createdAt).toLocaleDateString('ru-RU')}</p>}
      <div dangerouslySetInnerHTML={{ __html: article.body ?? '' }} />
    </article>
  </div>
);
