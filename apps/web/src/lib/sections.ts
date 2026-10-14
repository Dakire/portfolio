// Sections du site : « Ressources » regroupe le blog, les outils et les cheatsheets (sous-navigation visible sur ces pages).
import { hubPath, refsFor } from '../reference/refs';
import { ROUTES, UI, type Lang } from './i18n';

export interface SectionLink {
  key: 'resources' | 'blog' | 'tools' | 'cheatsheets';
  label: string;
  href: string;
}

/** Les pages de la section Ressources, dans la langue demandée (les cheatsheets n'existent qu'en français pour l'instant). */
export function resourceLinks(lang: Lang): SectionLink[] {
  const nav = UI[lang].nav;
  const links: SectionLink[] = [
    { key: 'resources', label: nav.resources, href: ROUTES[lang].resources },
    { key: 'blog', label: nav.blog, href: ROUTES[lang].blog },
    { key: 'tools', label: nav.tools, href: ROUTES[lang].tools },
  ];
  if (refsFor(lang).length > 0)
    links.push({ key: 'cheatsheets', label: nav.cheatsheets, href: hubPath(lang) });
  return links;
}

/** La page appartient-elle à la section Ressources (y compris ses sous-pages : articles, outils, cheatsheets) ? */
export const inResources = (lang: Lang, path: string) =>
  resourceLinks(lang).some((link) => path === link.href || path.startsWith(link.href));
