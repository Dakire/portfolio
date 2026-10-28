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
  actualites: { fr: 'Actualités', en: 'News' },
};

/** Page de catégorie (indexable) : description pour les résultats de recherche et introduction affichée sous le titre. */
export const CATEGORY_TEXT: Record<string, Record<Lang, { description: string; intro: string }>> = {
  messagerie: {
    fr: {
      description:
        'Articles sur la messagerie professionnelle : SPF, DKIM, DMARC, délivrabilité, lecture des en-têtes et envoi de courrier depuis des équipements.',
      intro:
        'Cette rubrique traite de la messagerie d’entreprise côté administrateur : pourquoi un message part en spam, comment lire ses en-têtes, comment configurer SPF, DKIM et DMARC, et comment faire envoyer du courrier à des scanners ou à des applications. Les articles renvoient vers les outils du site pour vérifier un domaine ou analyser un message.',
    },
    en: {
      description:
        'Articles on business email: SPF, DKIM, DMARC, deliverability, reading headers and sending mail from devices.',
      intro:
        'This section covers business email from the administrator’s side: why a message lands in spam, how to read its headers, how to set up SPF, DKIM and DMARC, and how to let scanners or applications send mail. The articles link to the site’s tools to check a domain or analyze a message.',
    },
  },
  dns: {
    fr: {
      description:
        'Articles sur le DNS et le réseau : enregistrements A, MX, CNAME, TXT, TTL, propagation, dig, nslookup et calcul de sous-réseaux CIDR.',
      intro:
        'Enregistrements A, MX, CNAME ou TXT, TTL et propagation, commandes dig et nslookup, masques de sous-réseau : de quoi comprendre et diagnostiquer le DNS et l’adressage d’un petit réseau. Chaque article renvoie vers l’outil correspondant du site.',
    },
    en: {
      description:
        'Articles on DNS and networking: A, MX, CNAME and TXT records, TTL, propagation, dig, nslookup and CIDR subnet calculation.',
      intro:
        'A, MX, CNAME and TXT records, TTL and propagation, dig and nslookup commands, subnet masks: what you need to understand and troubleshoot DNS and addressing on a small network. Each article links to the matching tool on the site.',
    },
  },
  migration: {
    fr: {
      description:
        'Articles sur les migrations de messagerie entre Google Workspace et Microsoft 365 : préparation, DNS, bascule et vérifications.',
      intro:
        'Passer d’une messagerie à une autre sans perdre de courrier ni de disponibilité : préparation, enregistrements DNS, bascule et vérifications, entre Google Workspace et Microsoft 365.',
    },
    en: {
      description:
        'Articles on email migrations between Google Workspace and Microsoft 365: preparation, DNS, cutover and checks.',
      intro:
        'Moving from one mail system to another without losing mail or availability: preparation, DNS records, cutover and checks, between Google Workspace and Microsoft 365.',
    },
  },
  securite: {
    fr: {
      description:
        'Articles sur la sécurité d’une petite structure : réglages de base, authentification, journaux Windows, vulnérabilités et correctifs.',
      intro:
        'Réglages de sécurité pour une petite structure (comptes, authentification, journaux), et décryptage des vulnérabilités et des correctifs qui comptent : ce qui est exploité, ce qui est urgent, ce qu’il faut faire.',
    },
    en: {
      description:
        'Articles on security for a small organization: baseline settings, authentication, Windows logs, vulnerabilities and patches.',
      intro:
        'Security settings for a small organization (accounts, authentication, logs), and a breakdown of the vulnerabilities and patches that matter: what is exploited, what is urgent, what to do.',
    },
  },
  'poste-de-travail': {
    fr: {
      description:
        'Articles sur le parc de postes et de serveurs Windows : fins de support, migrations, Secure Boot et firmware, déploiement.',
      intro:
        'Postes et serveurs Windows : fins de support et migrations, Secure Boot et firmware, déploiement. Des plans d’action pour une petite structure, avec les échéances à surveiller.',
    },
    en: {
      description:
        'Articles on Windows workstations and servers: end of support, migrations, Secure Boot and firmware, deployment.',
      intro:
        'Windows workstations and servers: end of support and migrations, Secure Boot and firmware, deployment. Action plans for a small organization, with the deadlines to watch.',
    },
  },
  actualites: {
    fr: {
      description:
        'Analyses d’incidents et de failles récents (cyberattaques, pannes, vulnérabilités), recoupées avec les sources officielles, avec les actions à en tirer.',
      intro:
        'Analyses des incidents et des failles du moment (cyberattaques, pannes, vulnérabilités), publiées après coup, quand les faits sont recoupés avec les sources officielles, avec les actions concrètes à en tirer pour une petite structure.',
    },
    en: {
      description:
        'Analyses of recent incidents and flaws (cyberattacks, outages, vulnerabilities), cross-checked against official sources, with the actions to take.',
      intro:
        'Analyses of current incidents and flaws (cyberattacks, outages, vulnerabilities), published after the fact, once the facts are cross-checked against official sources, with the concrete actions a small organization can take.',
    },
  },
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
