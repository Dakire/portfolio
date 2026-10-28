// Index de recherche du site par langue (pages, articles, outils, cheatsheets, réalisations), lu par /js/search.js (recherche globale de l'en-tête).
import { getPosts, postPath } from '../lib/blog';
import { PORTFOLIO_DATA } from '../data/content';
import { LANGS, ROUTES, UI, projectPath } from '../lib/i18n';
import { refPath, refsFor } from '../reference/refs';
import { TOOLS, toolPath, toolUi } from '../tools/registry';

const GROUP_LABELS = {
  fr: {
    pages: 'Pages',
    articles: 'Articles',
    tools: 'Outils',
    refs: 'Cheatsheets',
    projects: 'Réalisations',
  },
  en: {
    pages: 'Pages',
    articles: 'Articles',
    tools: 'Tools',
    refs: 'Cheatsheets',
    projects: 'Projects',
  },
} as const;

export async function GET() {
  const index: Record<
    string,
    {
      groups: Record<string, string>;
      items: { group: string; title: string; hint?: string; url: string }[];
    }
  > = {};
  for (const lang of LANGS) {
    const posts = await getPosts(lang);
    const nav = UI[lang].nav;
    index[lang] = {
      groups: GROUP_LABELS[lang],
      items: [
        { group: 'pages', title: UI[lang].crumbHome, url: ROUTES[lang].home },
        ...(
          [
            'about',
            'career',
            'skills',
            'projects',
            'resources',
            'blog',
            'tools',
            'contact',
          ] as const
        ).map((key) => ({
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
        ...TOOLS.map((tool) => ({
          group: 'tools',
          title: toolUi(tool, lang).name,
          hint: toolUi(tool, lang).meta.description,
          url: toolPath(tool, lang),
        })),
        ...refsFor(lang).map((ref) => ({
          group: 'refs',
          title: ref.h1,
          hint: ref.description,
          url: refPath(ref),
        })),
        ...PORTFOLIO_DATA[lang].projects.map((project) => ({
          group: 'projects',
          title: project.title,
          hint: project.desc,
          url: projectPath(lang, project.slug),
        })),
      ],
    };
  }
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
