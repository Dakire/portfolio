// Page « Outils » (liste des outils) et libellés communs à toutes les pages d'outil (FR/EN).
export const HUB = {
  fr: {
    meta: {
      title:
        'Outils en ligne pour techniciens IT : DNS, SEO, e-mail, calendriers, réseau | Guillaume Richard',
      description:
        "Outils gratuits pour techniciens et administrateurs : DNS Lookup (A, MX, SPF, DKIM, DMARC), propagation DNS, découpeur et comparateur de fichiers ICS, calculatrice réseau, analyseur d'en-têtes d'e-mail, encodeurs, formateur JSON, convertisseurs d'unités.",
    },
    h1: 'Outils pour techniciens IT',
    intro:
      "Des outils pratiques, gratuits et sans inscription, nés de problèmes que j'ai rencontrés en support et en administration.",
    open: "Ouvrir l'outil",
    breadcrumb: { home: 'Accueil', tools: 'Outils' },
    privacyTitle: 'Confidentialité',
    privacy: 'Rien de ce que vous saisissez n’est conservé.',
    privacyLink: 'Le détail, outil par outil',
    schemaName: 'Outils pour techniciens IT',
    groupsLabel: 'Catégories d’outils',
  },
  en: {
    meta: {
      title:
        'Online tools for IT technicians: DNS, email, calendars, networking | Guillaume Richard',
      description:
        'Free tools for technicians and administrators: DNS Lookup (A, MX, SPF, DKIM, DMARC), DNS propagation, ICS file splitter and comparer, subnet calculator, email header analyzer, encoders, JSON formatter, unit converters.',
    },
    h1: 'Tools for IT technicians',
    intro:
      'Practical tools, free and without sign-up, born from problems I ran into in support and administration.',
    open: 'Open the tool',
    breadcrumb: { home: 'Home', tools: 'Tools' },
    privacyTitle: 'Privacy',
    privacy: 'Nothing you type is kept.',
    privacyLink: 'The details, tool by tool',
    schemaName: 'Tools for IT technicians',
    groupsLabel: 'Tool categories',
  },
};

/** Catégories de la page « Outils » : chaque outil du registre figure dans un seul groupe (vérifié par tests/unit/tool-groups.test.ts). */
export const TOOL_GROUPS = [
  {
    id: 'dns-email',
    tools: ['dns', 'propagation', 'email-headers'],
    fr: {
      title: 'DNS et messagerie',
      text: 'Lire une zone, suivre une modification, comprendre pourquoi un e-mail arrive en spam.',
    },
    en: {
      title: 'DNS and email',
      text: 'Read a zone, follow a change, understand why an email lands in spam.',
    },
  },
  {
    id: 'web',
    tools: ['seo', 'sitemap'],
    fr: {
      title: 'Sites web et SEO',
      text: 'Auditer une page ou un sitemap comme le ferait un moteur de recherche.',
    },
    en: {
      title: 'Websites and SEO',
      text: 'Audit a page or a sitemap the way a search engine would.',
    },
  },
  {
    id: 'calendars',
    tools: ['ics-split', 'ics-compare'],
    fr: {
      title: 'Calendriers (ICS)',
      text: 'Découper un export trop lourd pour être importé, vérifier qu’une migration n’a rien perdu.',
    },
    en: {
      title: 'Calendars (ICS)',
      text: 'Split an export too large to import, check that a migration lost nothing.',
    },
  },
  {
    id: 'network-data',
    tools: ['subnet', 'json', 'encoder', 'units', 'password'],
    fr: {
      title: 'Réseau, données et sécurité',
      text: 'Les petits calculs et conversions du quotidien : sous-réseaux, JSON, encodages, unités, mots de passe.',
    },
    en: {
      title: 'Networking, data and security',
      text: 'Everyday calculations and conversions: subnets, JSON, encodings, units, passwords.',
    },
  },
] as const;
