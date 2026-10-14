// Fil d'Ariane : une même liste alimente le composant visible et le JSON-LD BreadcrumbList.
import { ROUTES, UI, type Lang } from './i18n';
import { breadcrumbLd } from './seo';

export interface Trail {
  label: string;
  path: string;
}

/** `trail` : les niveaux intermédiaires ; `current` : la page affichée. L'accueil est ajouté en tête. */
export function crumbs(lang: Lang, trail: Trail[], current: Trail) {
  const all = [{ label: UI[lang].crumbHome, path: ROUTES[lang].home }, ...trail, current];
  return {
    label: UI[lang].breadcrumb,
    items: all.map((c, i) => ({ label: c.label, href: i < all.length - 1 ? c.path : undefined })),
    ld: breadcrumbLd(all.map((c) => ({ name: c.label, path: c.path }))),
  };
}
