// Index de recherche du site (pages et articles par langue), pour la palette de commandes.
import { getPosts, postPath } from '../lib/blog';
import { LANGS, ROUTES, UI } from '../lib/i18n';

export async function GET() {
  const index: Record<
    string,
    { items: { group: string; title: string; hint?: string; url: string }[] }
  > = {};
  for (const lang of LANGS) {
    const posts = await getPosts(lang);
    const nav = UI[lang].nav;
    index[lang] = {
      items: [
        { group: 'pages', title: UI[lang].crumbHome, url: ROUTES[lang].home },
        ...(['about', 'skills', 'projects', 'blog', 'tools', 'contact'] as const).map((key) => ({
          group: 'pages',
          title: nav[key],
          url: ROUTES[lang][key],
        })),
        ...posts.map((p) => ({
          group: 'articles',
          title: p.data.title,
          hint: p.data.description,
          url: postPath(lang, p.slug),
        })),
      ],
    };
  }
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
