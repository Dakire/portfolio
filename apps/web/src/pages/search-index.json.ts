// Index de recherche du site par langue, lu par /js/search.js (recherche de l'en-tête) jusqu'au lot Pagefind.
// Dérivé du catalogue unique (data/catalog.ts) : pages, articles, outils, cheatsheets, réalisations.
import { catalog } from '../data/catalog';
import { LANGS } from '../lib/i18n';

const GROUPS = {
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
const GROUP_OF = {
  page: 'pages',
  article: 'articles',
  tool: 'tools',
  ref: 'refs',
  project: 'projects',
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
    const items = (await catalog(lang)).flatMap((entry) => {
      const group = GROUP_OF[entry.kind as keyof typeof GROUP_OF];
      return group
        ? [
            {
              group,
              title: entry.title,
              ...(entry.description ? { hint: entry.description } : {}),
              url: entry.url,
            },
          ]
        : [];
    });
    index[lang] = { groups: GROUPS[lang], items };
  }
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
