// Pages du blog (FR et EN) : rendues uniquement au build (scripts/prerender.js), sans JavaScript côté client.
import { Clock } from 'lucide-react';
import { LANGS, PORTFOLIO_DATA, PROFILE } from '../data/content';
import { formatDate } from '../lib/format';
import PostMeta from './PostMeta';
import Shell from './Shell';

const crumbLink = 'text-emerald-300 hover:text-emerald-200 underline underline-offset-2 rounded';

export function BlogIndex({ posts, lang }) {
  const b = PORTFOLIO_DATA[lang].blog;
  return (
    <Shell lang={lang}>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Blog</h1>
      <p className="text-lg text-slate-300 mb-10">{b.pageIntro}</p>
      <ul className="space-y-6">
        {posts.map((p) => (
          <li key={p.slug}>
            <article className="card-lift bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-2">
                <a href={`${LANGS[lang].blog}${p.slug}/`} className="hover:text-emerald-300 transition-colors">{p.title}</a>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">{p.description}</p>
              <PostMeta post={p} blog={b} />
            </article>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function Breadcrumb({ title, lang }) {
  const b = PORTFOLIO_DATA[lang].blog;
  return (
    <nav aria-label={b.crumbLabel} className="mb-8">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-300">
        <li><a href={LANGS[lang].home} className={crumbLink}>{b.home}</a></li>
        <li aria-hidden="true">/</li>
        <li><a href={LANGS[lang].blog} className={crumbLink}>Blog</a></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="truncate max-w-full">{title}</li>
      </ol>
    </nav>
  );
}

function Toc({ items, lang }) {
  const b = PORTFOLIO_DATA[lang].blog;
  return (
    <details className="mb-10 bg-slate-900/60 border border-slate-800 rounded-2xl">
      <summary className="cursor-pointer select-none px-5 py-3 font-semibold text-white rounded-2xl">{b.toc}</summary>
      <nav aria-label={b.tocLabel} className="px-5 pb-4">
        <ol className="list-decimal pl-5 space-y-1.5 text-sm">
          {items.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2" dangerouslySetInnerHTML={{ __html: s.text }} />
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}

export function BlogPost({ post, related, lang }) {
  const b = PORTFOLIO_DATA[lang].blog;
  return (
    <Shell lang={lang}>
      <Breadcrumb title={post.title} lang={lang} />
      {post.translation && (
        <p className="-mt-4 mb-8 text-sm">
          <a
            href={`${LANGS[post.translation.lang].blog}${post.translation.slug}/`}
            hrefLang={post.translation.lang}
            lang={post.translation.lang}
            className={crumbLink}
          >
            {b.otherLang}
          </a>
        </p>
      )}
      <article>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">{post.title}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-mono text-emerald-300 mb-10">
          <span>{b.by} {PROFILE.name}</span>
          <time dateTime={post.date}>{formatDate(post.date, b.dateLocale)}</time>
          <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" aria-hidden="true" /> {post.readingTime} {b.min}</span>
        </p>
        {post.toc.length >= 4 && <Toc items={post.toc} lang={lang} />}
        <div className="article" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
      {related.length > 0 && (
        <aside aria-labelledby="related-title" className="mt-16 pt-8 border-t border-slate-800">
          <h2 id="related-title" className="text-xl font-bold text-white mb-4">{b.related}</h2>
          <ul className="space-y-2">
            {related.map((p) => (
              <li key={p.slug}>
                <a href={`${LANGS[lang].blog}${p.slug}/`} className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2">{p.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </Shell>
  );
}
