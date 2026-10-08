// Données structurées schema.org (JSON-LD) et petits utilitaires de balisage.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROFILE } from '../data/content';
import { withBase } from './base';
import { ROUTES, SITE, type Lang } from './i18n';

export const OG_DEFAULT = {
  url: `${SITE}${withBase('/og-image.png')}`,
  width: 1200,
  height: 630,
  alt: 'Guillaume Richard, Technicien Informatique & Systèmes Numériques',
};

/** JSON embarqué dans une balise <script> : « < » échappé pour qu'aucune donnée ne puisse la refermer. */
export const jsonForScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/** Ajoute ?v=<empreinte> à un script de public/ : un script modifié n'est jamais servi depuis un ancien cache. */
export const versioned = (src: string) => {
  try {
    const hash = createHash('sha1')
      .update(readFileSync(resolve(process.cwd(), 'public', src.slice(1))))
      .digest('hex')
      .slice(0, 8);
    return `${withBase(src)}?v=${hash}`;
  } catch {
    return withBase(src);
  }
};

const person = { '@type': 'Person', '@id': `${SITE}/#person`, name: PROFILE.name, url: `${SITE}/` };

const KNOWS_ABOUT = [
  'Administration Système',
  'Réseaux informatiques',
  'Google Workspace',
  'Microsoft 365',
  'Active Directory',
  'Windows Server',
  'DNS, SPF, DKIM, DMARC',
  'Développement C#',
  'Python',
  'Java',
  'PowerShell',
  'Stormshield',
];

const PERSON_DESCRIPTION: Record<Lang, string> = {
  fr: 'Technicien Informatique et Systèmes Numériques basé à Laval. Expert en infrastructure IT, migrations Cloud (Google Workspace, M365) et automatisation.',
  en: 'IT and Digital Systems Technician based in Laval, France. Expert in IT infrastructure, Cloud migrations (Google Workspace, M365) and automation.',
};

export function homeLd(lang: Lang, title: string, role: string) {
  const path = ROUTES[lang].home;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${SITE}${path}#profilepage`,
        url: `${SITE}${path}`,
        name: title,
        inLanguage: lang === 'fr' ? 'fr-FR' : 'en',
        mainEntity: { '@id': `${SITE}/#person` },
      },
      {
        ...person,
        givenName: 'Guillaume',
        familyName: 'Richard',
        jobTitle: role,
        description: PERSON_DESCRIPTION[lang],
        homeLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Laval',
            postalCode: '53000',
            addressRegion: 'Pays de la Loire',
            addressCountry: 'FR',
          },
        },
        knowsLanguage: ['fr', 'en'],
        sameAs: [PROFILE.linkedin, PROFILE.github],
        worksFor: {
          '@type': 'Organization',
          name: 'TIXIA Services numériques',
          address: { '@type': 'PostalAddress', addressLocality: 'Laval', addressCountry: 'FR' },
        },
        alumniOf: {
          '@type': 'CollegeOrUniversity',
          name: 'Le Mans Université',
          address: { '@type': 'PostalAddress', addressLocality: 'Le Mans', addressCountry: 'FR' },
        },
        knowsAbout: KNOWS_ABOUT,
      },
    ],
  };
}

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `${SITE}${item.path}`,
  })),
});

export interface PostLdInput {
  lang: Lang;
  path: string;
  title: string;
  description: string;
  published: Date;
  modified?: Date;
  image: string;
  keywords: string[];
  crumbs: { name: string; path: string }[];
}

export const postLd = (p: PostLdInput) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      url: `${SITE}${p.path}`,
      mainEntityOfPage: `${SITE}${p.path}`,
      inLanguage: p.lang === 'fr' ? 'fr-FR' : 'en',
      datePublished: p.published.toISOString(),
      dateModified: (p.modified ?? p.published).toISOString(),
      image: p.image,
      keywords: p.keywords.join(', '),
      author: person,
      publisher: person,
    },
    breadcrumbLd(p.crumbs),
  ],
});

export const blogLd = (
  lang: Lang,
  name: string,
  posts: { title: string; path: string; date: Date }[],
) => ({
  '@context': 'https://schema.org',
  '@type': 'Blog',
  '@id': `${SITE}${ROUTES[lang].blog}#blog`,
  url: `${SITE}${ROUTES[lang].blog}`,
  name,
  inLanguage: lang === 'fr' ? 'fr-FR' : 'en',
  author: person,
  blogPost: posts.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: `${SITE}${p.path}`,
    datePublished: p.date.toISOString(),
  })),
});
