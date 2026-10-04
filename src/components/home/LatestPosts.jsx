import { Newspaper } from 'lucide-react';
import { LANGS } from '../../data/content';
import PostMeta from '../PostMeta';
import SectionHeading from '../SectionHeading';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export default function LatestPosts({ t, lang, posts }) {
  return (
    <section id="blog" aria-labelledby="blog-title" className="reveal">
      <SectionHeading id="blog-title" icon={Newspaper}>{t.blog.title}</SectionHeading>
      <p className="mb-6 max-w-3xl text-body">{t.blog.intro}</p>
      {posts.length === 0 ? (
        <EmptyState title={t.blog.emptyTitle}>{t.blog.emptyText}</EmptyState>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {posts.slice(0, 3).map((p) => (
              <li key={p.slug}>
                <Card as="article" glow solid className="flex h-full flex-col p-6">
                  <h3 className="mb-2 text-lg font-bold text-ink">
                    <a href={`${LANGS[lang].blog}${p.slug}/`} className="transition-colors duration-200 hover:text-link">{p.title}</a>
                  </h3>
                  <p className="mb-4 flex-1 text-copy text-body">{p.description}</p>
                  <PostMeta post={p} blog={t.blog} />
                </Card>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <a href={LANGS[lang].blog} className="tap link">{t.blog.all}</a>
          </p>
        </>
      )}
    </section>
  );
}
