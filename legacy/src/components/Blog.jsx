// Pages du blog (FR et EN) : rendues uniquement au build (scripts/prerender.js), sans JavaScript React côté client.
import { Clock } from 'lucide-react';
import { LANGS, PORTFOLIO_DATA, PROFILE } from '../data/content';
import { formatDate } from '../lib/format';
import PostMeta from './PostMeta';
import Shell from './Shell';
import Card from './ui/Card';
import EmptyState from './ui/EmptyState';

export function BlogIndex({ posts, lang }) {
  const b = PORTFOLIO_DATA[lang].blog;
  return (
    <Shell lang={lang} current="blog" switchHref={LANGS[LANGS[lang].other].blog}>
      <h1 className="mb-4 text-title font-extrabold tracking-tight text-ink">Blog</h1>
      <p className="mb-10 text-lg text-body">{b.pageIntro}</p>
      {posts.length === 0 ? (
        <EmptyState title={b.emptyTitle}>{b.emptyText}</EmptyState>
      ) : (
        <ul className="space-y-5">
          {posts.map((p) => (
            <li key={p.slug}>
              <Card as="article" glow solid className="p-6">
                <h2 className="mb-2 text-xl font-bold text-ink">
                  <a href={`${LANGS[lang].blog}${p.slug}/`} className="transition-colors duration-200 hover:text-link">{p.title}</a>
                </h2>
                <p className="mb-4 text-copy text-body">{p.description}</p>
                <PostMeta post={p} blog={b} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

function Breadcrumb({ title, lang }) {
  const b = PORTFOLIO_DATA[lang].blog;
  return (
    <nav aria-label={b.crumbLabel} className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 text-sm text-body">
        <li><a href={LANGS[lang].home} className="tap link">{b.home}</a></li>
        <li aria-hidden="true">/</li>
        <li><a href={LANGS[lang].blog} className="tap link">Blog</a></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="max-w-full truncate">{title}</li>
      </ol>
    </nav>
  );
}

function Toc({ items, lang }) {
  const b = PORTFOLIO_DATA[lang].blog;
  return (
    <details className="card mb-10">
      <summary className="min-h-11 cursor-pointer select-none rounded-card px-5 py-3 font-semibold text-ink">{b.toc}</summary>
      <nav aria-label={b.tocLabel} className="px-5 pb-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {items.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="tap link" dangerouslySetInnerHTML={{ __html: s.text }} />
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}

export function BlogPost({ post, related, lang }) {
  const b = PORTFOLIO_DATA[lang].blog;
  const switchHref = post.translation ? `${LANGS[post.translation.lang].blog}${post.translation.slug}/` : LANGS[LANGS[lang].other].blog;
  return (
    <Shell lang={lang} current="blog" switchHref={switchHref}>
      <Breadcrumb title={post.title} lang={lang} />
      {post.translation && (
        <p className="-mt-3 mb-6 text-sm">
          <a href={switchHref} hrefLang={post.translation.lang} lang={post.translation.lang} className="tap link">{b.otherLang}</a>
        </p>
      )}
      <article>
        <h1 className="mb-4 text-title font-extrabold tracking-tight text-ink">{post.title}</h1>
        <p className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-link">
          <span>{b.by} {PROFILE.name}</span>
          <time dateTime={post.date}>{formatDate(post.date, b.dateLocale)}</time>
          <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" /> {post.readingTime} {b.min}</span>
        </p>
        {post.toc.length >= 4 && <Toc items={post.toc} lang={lang} />}
        <div className="article" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
      {related.length > 0 && (
        <aside aria-labelledby="related-title" className="mt-16 border-t border-line pt-8">
          <h2 id="related-title" className="mb-3 text-xl font-bold text-ink">{b.related}</h2>
          <ul>
            {related.map((p) => (
              <li key={p.slug}>
                <a href={`${LANGS[lang].blog}${p.slug}/`} className="tap link">{p.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </Shell>
  );
}
