// Données structurées (schema.org) des pages portfolio et des cheatsheets, et images de partage par page.
// Les nœuds Person et WebSite sont définis dans seo.ts ; ici on les relie aux pages (mainEntity, about, author…).
import { PROFILE } from '../data/content';
import { withBase } from './base';
import { SITE, type Lang } from './i18n';
import { SITE_PERSON_REF, SITE_WEBSITE_REF, personNode } from './seo';

const inLang = (lang: Lang) => (lang === 'fr' ? 'fr-FR' : 'en');

/** Image de partage d'une page : générée au build (scripts/postbuild.mjs, liste fournie par pages/og-cards.json.ts). */
export const ogImage = (slug: string, alt: string) => ({
  url: `${SITE}${withBase(`/og/${slug}.png`)}`,
  width: 1200,
  height: 630,
  alt,
});

interface PageInput {
  lang: Lang;
  path: string;
  name: string;
  description: string;
  /** BreadcrumbList déjà construit (lib/crumbs.ts). */
  crumbs: object;
}

const pageNode = (type: string, p: PageInput, extra: object = {}) => ({
  '@type': type,
  '@id': `${SITE}${p.path}#page`,
  url: `${SITE}${p.path}`,
  name: p.name,
  description: p.description,
  inLanguage: inLang(p.lang),
  isPartOf: SITE_WEBSITE_REF,
  ...extra,
});

/** À propos : une page qui parle de la personne. */
export const aboutLd = (p: PageInput, role: string) => ({
  '@context': 'https://schema.org',
  '@graph': [
    pageNode('AboutPage', p, { mainEntity: SITE_PERSON_REF }),
    personNode(p.lang, role),
    p.crumbs,
  ],
});

export interface RoleInput {
  role: string;
  company: string;
  location: string;
  start: string;
  end?: string;
}

/** Parcours : le profil et chaque poste (rôle, employeur, dates ; sans date de fin, le poste est en cours). */
export const careerLd = (p: PageInput, role: string, jobs: RoleInput[], education: string[]) => ({
  '@context': 'https://schema.org',
  '@graph': [
    pageNode('ProfilePage', p, { mainEntity: SITE_PERSON_REF }),
    {
      ...personNode(p.lang, role),
      hasOccupation: jobs.map((job) => ({
        '@type': 'Role',
        roleName: job.role,
        startDate: job.start,
        ...(job.end && { endDate: job.end }),
        memberOf: {
          '@type': 'Organization',
          name: job.company,
          address: { '@type': 'PostalAddress', addressCountry: 'FR' },
        },
      })),
      hasCredential: education.map((name) => ({
        '@type': 'EducationalOccupationalCredential',
        name,
      })),
    },
    p.crumbs,
  ],
});

/** Compétences : chaque domaine est un terme défini, avec son ancre sur la page. */
export const skillsLd = (
  p: PageInput,
  skills: { id: string; category: string; items: string }[],
) => ({
  '@context': 'https://schema.org',
  '@graph': [
    pageNode('CollectionPage', p, {
      about: SITE_PERSON_REF,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: skills.map((skill, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'DefinedTerm',
            name: skill.category,
            description: skill.items,
            url: `${SITE}${p.path}#${skill.id}`,
          },
        })),
      },
    }),
    p.crumbs,
  ],
});

/** Réalisations, ressources : une liste de pages. */
export const collectionLd = (p: PageInput, items: { title: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@graph': [
    pageNode('CollectionPage', p, {
      about: SITE_PERSON_REF,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE}${item.path}`,
          name: item.title,
        })),
      },
    }),
    p.crumbs,
  ],
});

/** Page de détail d'une réalisation : œuvre (ou code source si un dépôt est public) créée par la personne. */
export const projectLd = (p: {
  lang: Lang;
  path: string;
  title: string;
  description: string;
  tags: string[];
  domain?: string;
  listPath: string;
  repository?: string;
  crumbs: object;
}) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': p.repository ? ['CreativeWork', 'SoftwareSourceCode'] : 'CreativeWork',
      '@id': `${SITE}${p.path}#project`,
      name: p.title,
      description: p.description,
      url: `${SITE}${p.path}`,
      mainEntityOfPage: `${SITE}${p.path}`,
      inLanguage: inLang(p.lang),
      keywords: p.tags.join(', '),
      ...(p.domain && { genre: p.domain }),
      about: p.tags.map((name) => ({ '@type': 'Thing', name })),
      creator: SITE_PERSON_REF,
      author: SITE_PERSON_REF,
      isPartOf: { '@id': `${SITE}${p.listPath}#page` },
      ...(p.repository && { codeRepository: p.repository }),
    },
    { '@type': 'Person', '@id': SITE_PERSON_REF['@id'], name: PROFILE.name, url: `${SITE}/` },
    p.crumbs,
  ],
});

/** Cheatsheet : article technique signé, avec ses catégories comme sujets et sa source éventuelle. */
export const cheatsheetLd = (p: {
  lang: Lang;
  path: string;
  title: string;
  description: string;
  topics: string[];
  count: number;
  hubPath: string;
  source?: { name: string; url: string };
  crumbs: object;
}) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      '@id': `${SITE}${p.path}#article`,
      headline: p.title,
      description: p.description,
      url: `${SITE}${p.path}`,
      mainEntityOfPage: `${SITE}${p.path}`,
      inLanguage: inLang(p.lang),
      isAccessibleForFree: true,
      about: p.topics.map((name) => ({ '@type': 'Thing', name })),
      keywords: p.topics.join(', '),
      author: SITE_PERSON_REF,
      publisher: SITE_PERSON_REF,
      isPartOf: { '@id': `${SITE}${p.hubPath}#page` },
      ...(p.source && {
        citation: { '@type': 'CreativeWork', name: p.source.name, url: p.source.url },
      }),
    },
    { '@type': 'Person', '@id': SITE_PERSON_REF['@id'], name: PROFILE.name, url: `${SITE}/` },
    p.crumbs,
  ],
});

/** Accueil des cheatsheets : liste des cheatsheets, avec leur description. */
export const cheatsheetsHubLd = (
  p: PageInput,
  items: { title: string; path: string; description: string }[],
) => ({
  '@context': 'https://schema.org',
  '@graph': [
    pageNode('CollectionPage', p, {
      about: SITE_PERSON_REF,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE}${item.path}`,
          name: item.title,
          description: item.description,
        })),
      },
    }),
    p.crumbs,
  ],
});
