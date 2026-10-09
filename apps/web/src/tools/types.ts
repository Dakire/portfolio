import type { Lang } from '../lib/i18n';

/** Données de référencement communes à tous les outils : titre de page, explications, FAQ. */
export interface ToolSeo {
  whatTitle: string;
  what: string[][];
  howTitle: string;
  how: string;
  faq: string[][];
  privacy?: string;
}

/** Ce que toute page d'outil attend des textes de l'outil (le reste est propre à chaque outil). */
export interface ToolPageUi {
  meta: { title: string; description: string; appDescription: string };
  name: string;
  card: string;
  keywords: string;
  h1: string;
  intro: string;
  seo: ToolSeo;
  related: string;
  /** Slugs d'articles du blog à proposer en fin de page. */
  relatedLinks?: string[];
  privacy?: string;
}

export type ToolTexts = Record<Lang, { ui: ToolPageUi }>;

export type ToolIcon =
  | 'network'
  | 'scissors'
  | 'diff'
  | 'mail'
  | 'calculator'
  | 'binary'
  | 'key'
  | 'braces'
  | 'ruler'
  | 'globe'
  | 'search'
  | 'sitemap';
