// Données structurées schema.org (JSON-LD) des différentes pages.
import { SITE, OG_IMAGE } from './page.js';
import { toIso } from './dates.js';

const CONTEXT = 'https://schema.org';

export const person = (profile) => ({ '@type': 'Person', '@id': `${SITE}/#person`, name: profile.name, url: `${SITE}/` });

const KNOWS_ABOUT = ['Administration Système', 'Réseaux informatiques', 'Google Workspace', 'Microsoft 365', 'Active Directory', 'Windows Server', 'DNS, SPF, DKIM, DMARC', 'Développement C#', 'Python', 'Java', 'PowerShell', 'Stormshield'];

const PERSON_DESCRIPTION = {
  fr: 'Technicien Informatique et Systèmes Numériques basé à Laval. Expert en infrastructure IT, migrations Cloud (Google Workspace, M365) et automatisation.',
  en: 'IT and Digital Systems Technician based in Laval, France. Expert in IT infrastructure, Cloud migrations (Google Workspace, M365) and automation.',
};

export const homeLd = ({ lang, path, t, profile, dateModified }) => ({
  '@context': CONTEXT,
  '@graph': [
    {
      '@type': 'ProfilePage',
      '@id': `${SITE}${path}#profilepage`,
      url: `${SITE}${path}`,
      name: t.meta.title,
      inLanguage: lang === 'fr' ? 'fr-FR' : 'en',
      dateModified,
      mainEntity: { '@id': `${SITE}/#person` },
    },
    {
      ...person(profile),
      givenName: 'Guillaume',
      familyName: 'Richard',
      jobTitle: t.hero.role,
      description: PERSON_DESCRIPTION[lang],
      homeLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Laval', postalCode: '53000', addressRegion: 'Pays de la Loire', addressCountry: 'FR' } },
      knowsLanguage: ['fr', 'en'],
      sameAs: [profile.linkedin, profile.github],
      worksFor: { '@type': 'Organization', name: 'TIXIA Services numériques', address: { '@type': 'PostalAddress', addressLocality: 'Laval', addressCountry: 'FR' } },
      alumniOf: { '@type': 'CollegeOrUniversity', name: 'Le Mans Université', address: { '@type': 'PostalAddress', addressLocality: 'Le Mans', addressCountry: 'FR' } },
      knowsAbout: KNOWS_ABOUT,
    },
  ],
});

export const blogLd = ({ blogRoot, name, inLanguage, author, posts, postUrl }) => ({
  '@context': CONTEXT,
  '@type': 'Blog',
  '@id': `${SITE}${blogRoot}#blog`,
  url: `${SITE}${blogRoot}`,
  name,
  inLanguage,
  author,
  blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}${postUrl(p)}`, datePublished: toIso(p.date) })),
});

export const postLd = ({ post, path, blogRoot, homePath, inLanguage, author, labels }) => {
  const modified = post.updated ?? post.date;
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        url: `${SITE}${path}`,
        mainEntityOfPage: `${SITE}${path}`,
        image: OG_IMAGE.url,
        datePublished: toIso(post.date),
        dateModified: toIso(modified),
        inLanguage,
        author,
        publisher: author,
        isPartOf: { '@id': `${SITE}${blogRoot}#blog` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: labels.home, item: `${SITE}${homePath}` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}${blogRoot}` },
          { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE}${path}` },
        ],
      },
    ],
  };
};
