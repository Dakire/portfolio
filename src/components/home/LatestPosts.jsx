import { Newspaper } from 'lucide-react';
import { LANGS } from '../../data/content';
import PostMeta from '../PostMeta';
import SectionHeading from '../SectionHeading';

export default function LatestPosts({ t, lang, posts }) {
  if (posts.length === 0) return null;
  return (
    <section id="blog" aria-labelledby="blog-title" className="reveal scroll-mt-32">
      <SectionHeading id="blog-title" icon={Newspaper}>{t.blog.title}</SectionHeading>
      <p className="text-slate-300 mb-6 max-w-3xl">{t.blog.intro}</p>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.slice(0, 3).map((p) => (
          <li key={p.slug} className="h-full">
            <article className="card-lift bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg h-full flex flex-col">
              <h3 className="text-white font-bold text-lg mb-2">
                <a href={`${LANGS[lang].blog}${p.slug}/`} className="hover:text-emerald-300 transition-colors">{p.title}</a>
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 flex-1">{p.description}</p>
              <PostMeta post={p} blog={t.blog} />
            </article>
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <a href={LANGS[lang].blog} className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2 rounded">{t.blog.all}</a>
      </p>
    </section>
  );
}
