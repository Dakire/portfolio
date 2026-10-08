import { getCollection, type CollectionEntry } from 'astro:content';
import { ROUTES, type Lang } from './i18n';

export type Post = CollectionEntry<'blog'> & { lang: Lang; slug: string };

/** Catégories : identifiant (front matter) -> libellé par langue. */
export const CATEGORIES: Record<string, Record<Lang, string>> = {
  messagerie: { fr: 'Messagerie', en: 'Email' },
  dns: { fr: 'DNS', en: 'DNS' },
  migration: { fr: 'Migration', en: 'Migration' },
  securite: { fr: 'Sécurité', en: 'Security' },
  'poste-de-travail': { fr: 'Poste de travail', en: 'Workstation' },
};

const CATEGORY_PATH: Record<Lang, string> = { fr: 'categorie', en: 'category' };
const TAG_PATH: Record<Lang, string> = { fr: 'tag', en: 'tag' };

export const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const postPath = (lang: Lang, slug: string) => `${ROUTES[lang].blog}${slug}/`;
export const categoryPath = (lang: Lang, category: string) =>
  `${ROUTES[lang].blog}${CATEGORY_PATH[lang]}/${category}/`;
export const tagPath = (lang: Lang, tag: string) =>
  `${ROUTES[lang].blog}${TAG_PATH[lang]}/${slugify(tag)}/`;

/** Articles d'une langue, du plus récent au plus ancien. L'identifiant « en/<slug> » désigne un article anglais. */
export async function getPosts(lang: Lang): Promise<Post[]> {
  const all = await getCollection('blog');
  return all
    .map((entry): Post => {
      const isEn = entry.id.startsWith('en/');
      return Object.assign(entry, {
        lang: (isEn ? 'en' : 'fr') as Lang,
        slug: isEn ? entry.id.slice(3) : entry.id,
      });
    })
    .filter((post) => post.lang === lang)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Traduction d'un article dans l'autre langue, si elle existe (l'anglais déclare translationOf = slug français). */
export async function getTranslation(post: Post): Promise<Post | undefined> {
  if (post.lang === 'en') {
    const fr = await getPosts('fr');
    return fr.find((p) => p.slug === post.data.translationOf);
  }
  const en = await getPosts('en');
  return en.find((p) => p.data.translationOf === post.slug);
}

export const readingMinutes = (body: string | undefined) =>
  Math.max(1, Math.round((body ?? '').split(/\s+/).filter(Boolean).length / 200));

export const formatDate = (date: Date, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
