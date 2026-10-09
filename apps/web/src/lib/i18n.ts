// Langues et URL du site. Les URL françaises et anglaises existantes sont figées par tests/contract/contract.json :
// ne jamais en modifier une sans redirection 301 et mise à jour du contrat.

import { withBase } from './base';

export type Lang = 'fr' | 'en';
export const LANGS: Lang[] = ['fr', 'en'];
export const SITE = 'https://grichard.eu';

export type RouteKey =
  | 'home'
  | 'about'
  | 'skills'
  | 'projects'
  | 'contact'
  | 'blog'
  | 'tools'
  | 'legal'
  | 'privacy'
  | 'accessibility'
  | 'rss';

const mapRoutes = (routes: Record<RouteKey, string>): Record<RouteKey, string> =>
  Object.fromEntries(Object.entries(routes).map(([key, path]) => [key, withBase(path)])) as Record<
    RouteKey,
    string
  >;

const RAW_ROUTES: Record<Lang, Record<RouteKey, string>> = {
  fr: {
    home: '/',
    about: '/a-propos/',
    skills: '/competences/',
    projects: '/projets/',
    contact: '/contact/',
    blog: '/blog/',
    tools: '/outils/',
    legal: '/mentions-legales/',
    privacy: '/confidentialite/',
    accessibility: '/accessibilite/',
    rss: '/rss.xml',
  },
  en: {
    home: '/en/',
    about: '/en/about/',
    skills: '/en/skills/',
    projects: '/en/projects/',
    contact: '/en/contact/',
    blog: '/en/blog/',
    tools: '/en/tools/',
    legal: '/en/legal-notice/',
    privacy: '/en/privacy/',
    accessibility: '/en/accessibility/',
    rss: '/en/rss.xml',
  },
};

/** Routes publiques, préfixées par la base du site (vide en production). */
export const ROUTES: Record<Lang, Record<RouteKey, string>> = {
  fr: mapRoutes(RAW_ROUTES.fr),
  en: mapRoutes(RAW_ROUTES.en),
};

export const otherLang = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');

/** Tout ce qui varie d'une langue à l'autre et n'est pas du contenu éditorial. */
export const UI = {
  fr: {
    locale: 'fr-FR',
    ogLocale: 'fr_FR',
    skip: 'Aller au contenu',
    home: "Retour à l'accueil",
    mainNav: 'Navigation principale',
    menu: 'Menu',
    langSwitch: 'Read this site in English',
    langName: 'English',
    theme: 'Thème',
    themeLabels: { auto: 'auto', light: 'clair', dark: 'sombre' },
    nav: {
      about: 'À propos',
      skills: 'Compétences',
      projects: 'Projets',
      blog: 'Blog',
      tools: 'Outils',
      contact: 'Contact',
    },
    footerLinks: {
      legal: 'Mentions légales',
      privacy: 'Confidentialité',
      accessibility: 'Accessibilité',
      rss: 'Flux RSS',
    },
    cookies: 'Gérer les cookies',
    rights: 'Tous droits réservés.',
    breadcrumb: "Fil d'Ariane",
    crumbHome: 'Accueil',
    external: '(nouvelle fenêtre)',
  },
  en: {
    locale: 'en-GB',
    ogLocale: 'en_US',
    skip: 'Skip to content',
    home: 'Back to home',
    mainNav: 'Main navigation',
    menu: 'Menu',
    langSwitch: 'Lire ce site en français',
    langName: 'Français',
    theme: 'Theme',
    themeLabels: { auto: 'auto', light: 'light', dark: 'dark' },
    nav: {
      about: 'About',
      skills: 'Skills',
      projects: 'Projects',
      blog: 'Blog',
      tools: 'Tools',
      contact: 'Contact',
    },
    footerLinks: {
      legal: 'Legal notice',
      privacy: 'Privacy',
      accessibility: 'Accessibility',
      rss: 'RSS feed',
    },
    cookies: 'Cookie settings',
    rights: 'All rights reserved.',
    breadcrumb: 'Breadcrumb',
    crumbHome: 'Home',
    external: '(opens in a new window)',
  },
} as const;

/** Page équivalente dans l'autre langue (hreflang et sélecteur de langue). */
export interface Alternates {
  fr: string;
  en: string;
}

export const routeAlternates = (key: RouteKey): Alternates => ({
  fr: ROUTES.fr[key],
  en: ROUTES.en[key],
});
