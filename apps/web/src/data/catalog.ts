// Catalogue unique du contenu du site (ADR 0016) : pages, projets, compétences, expériences, articles, catégories, tags, outils
// et cheatsheets, avec les mêmes champs partout. Source de l'index de recherche global (/search-index.json), des suggestions
// de la palette et du terminal. Rien n'est saisi ici : tout est dérivé des données existantes (profile, blog, outils, références).
import { getPosts, postPath, categoryPath, tagPath, CATEGORIES } from '../lib/blog';
import { LANGS, ROUTES, UI, projectPath, type Lang } from '../lib/i18n';
import { refPath, refsFor } from '../reference/refs';
import { TOOLS, toolPath, toolUi } from '../tools/registry';
import { PORTFOLIO_DATA } from './content';

export type CatalogKind =
  'page' | 'project' | 'skill' | 'experience' | 'article' | 'category' | 'tag' | 'tool' | 'ref';

export interface CatalogEntry {
  kind: CatalogKind;
  title: string;
  /** Description courte (résultat de recherche, terminal). */
  description?: string;
  url: string;
  /** Catégorie lisible (rubrique d'article, domaine de compétence d'un projet). */
  category?: string;
  /** Étiquettes et technologies. */
  tags?: string[];
  /** Date ISO (articles). */
  date?: string;
}

export const KIND_LABELS: Record<Lang, Record<CatalogKind, string>> = {
  fr: {
    page: 'Pages',
    project: 'Projets',
    skill: 'Compétences',
    experience: 'Expériences',
    article: 'Articles',
    category: 'Catégories',
    tag: 'Tags',
    tool: 'Outils',
    ref: 'Cheatsheets',
  },
  en: {
    page: 'Pages',
    project: 'Projects',
    skill: 'Skills',
    experience: 'Experience',
    article: 'Articles',
    category: 'Categories',
    tag: 'Tags',
    tool: 'Tools',
    ref: 'Cheatsheets',
  },
};

const PAGE_KEYS = [
  'about',
  'career',
  'skills',
  'projects',
  'resources',
  'blog',
  'tools',
  'contact',
] as const;

export async function catalog(lang: Lang): Promise<CatalogEntry[]> {
  const t = PORTFOLIO_DATA[lang];
  const nav = UI[lang].nav;
  const posts = await getPosts(lang);
  const skillName = (id: string) => t.skills.find((s) => s.id === id)?.category;

  const categories = [...new Set(posts.map((p) => p.data.category))];
  const tags = [...new Set(posts.flatMap((p) => p.data.tags ?? []))];

  return [
    { kind: 'page', title: UI[lang].crumbHome, url: ROUTES[lang].home },
    ...PAGE_KEYS.map((key) => ({
      kind: 'page' as const,
      title: nav[key],
      url: ROUTES[lang][key],
    })),
    ...t.projects.map((p) => {
      const category = skillName(p.skill);
      return {
        kind: 'project' as const,
        title: p.title,
        description: p.desc,
        url: projectPath(lang, p.slug),
        tags: p.tags,
        ...(category ? { category } : {}),
      };
    }),
    ...t.skills.map((s) => ({
      kind: 'skill' as const,
      title: s.category,
      description: s.short,
      url: `${ROUTES[lang].skills}#${s.id}`,
      tags: s.items.split(/\s*[,·]\s*/).filter(Boolean),
    })),
    ...t.experiences.map((e) => ({
      kind: 'experience' as const,
      title: `${e.role}, ${e.company}`,
      description: e.date,
      url: ROUTES[lang].career,
      ...(e.skills ? { tags: e.skills } : {}),
    })),
    ...posts.map((p) => ({
      kind: 'article' as const,
      title: p.data.title,
      description: p.data.description,
      url: postPath(lang, p.slug),
      category: CATEGORIES[p.data.category]?.[lang] ?? p.data.category,
      tags: p.data.tags ?? [],
      date: p.data.date.toISOString().slice(0, 10),
    })),
    ...categories.map((c) => ({
      kind: 'category' as const,
      title: CATEGORIES[c]?.[lang] ?? c,
      url: categoryPath(lang, c),
    })),
    ...tags.map((tag) => ({ kind: 'tag' as const, title: tag, url: tagPath(lang, tag) })),
    ...TOOLS.map((tool) => ({
      kind: 'tool' as const,
      title: toolUi(tool, lang).name,
      description: toolUi(tool, lang).meta.description,
      url: toolPath(tool, lang),
    })),
    ...refsFor(lang).map((ref) => ({
      kind: 'ref' as const,
      title: ref.h1,
      description: ref.description,
      url: refPath(ref),
    })),
  ];
}

/** Index de recherche par langue, sérialisé dans /search-index.json (suggestions de la palette). */
export async function searchIndex() {
  const out: Record<string, { kinds: Record<CatalogKind, string>; items: CatalogEntry[] }> = {};
  for (const lang of LANGS) out[lang] = { kinds: KIND_LABELS[lang], items: await catalog(lang) };
  return out;
}
