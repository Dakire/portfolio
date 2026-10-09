// Registre des outils : un identifiant, un segment d'URL par langue, une icône et les textes. Une seule liste alimente la page « Outils »,
// l'accueil, le sitemap, llms.txt et l'index de recherche.
// Pour ajouter un outil : un dossier src/tools/<id>/ (text.ts, Tool.tsx), une entrée ci-dessous et son composant dans components.ts.
import { withBase } from '../lib/base';
import type { Lang } from '../lib/i18n';
import { DNS_TOOL } from './dns/text';
import { EMAIL_HEADERS } from './email-headers/text';
import { ENCODER } from './encoder/text';
import { ICS_COMPARE } from './ics-compare/text';
import { ICS_SPLIT } from './ics-split/text';
import { JSON_TOOL } from './json/text';
import { PASSWORD } from './password/text';
import { PROPAGATION } from './propagation/text';
import { SUBNET } from './subnet/text';
import type { ToolIcon, ToolTexts } from './types';
import { SEO_TOOL } from './seo/text';
import { UNITS_TOOL } from './units/text';

export const TOOLS_BASE: Record<Lang, string> = {
  fr: withBase('/outils/'),
  en: withBase('/en/tools/'),
};

export interface ToolDef {
  id: string;
  slug: Record<Lang, string>;
  icon: ToolIcon;
  text: ToolTexts;
}

// Les URL (slugs) sont figées par tests/contract/contract.json : ne jamais les modifier sans redirection 301.
export const TOOLS = [
  { id: 'dns', slug: { fr: 'dns', en: 'dns' }, icon: 'network', text: DNS_TOOL },
  {
    id: 'propagation',
    slug: { fr: 'propagation-dns', en: 'dns-propagation' },
    icon: 'globe',
    text: PROPAGATION,
  },
  {
    id: 'ics-split',
    slug: { fr: 'ics-decouper', en: 'ics-splitter' },
    icon: 'scissors',
    text: ICS_SPLIT,
  },
  {
    id: 'ics-compare',
    slug: { fr: 'ics-comparer', en: 'ics-compare' },
    icon: 'diff',
    text: ICS_COMPARE,
  },
  {
    id: 'email-headers',
    slug: { fr: 'en-tetes-email', en: 'email-headers' },
    icon: 'mail',
    text: EMAIL_HEADERS,
  },
  {
    id: 'subnet',
    slug: { fr: 'calculateur-reseau', en: 'subnet-calculator' },
    icon: 'calculator',
    text: SUBNET,
  },
  {
    id: 'encoder',
    slug: { fr: 'encodeur-decodeur', en: 'encoder-decoder' },
    icon: 'binary',
    text: ENCODER,
  },
  {
    id: 'password',
    slug: { fr: 'generateur-mot-de-passe', en: 'password-generator' },
    icon: 'key',
    text: PASSWORD,
  },
  {
    id: 'json',
    slug: { fr: 'formateur-json', en: 'json-formatter' },
    icon: 'braces',
    text: JSON_TOOL,
  },
  {
    id: 'units',
    slug: { fr: 'convertisseur-unites', en: 'unit-converter' },
    icon: 'ruler',
    text: UNITS_TOOL,
  },
  { id: 'seo', slug: { fr: 'seo', en: 'seo' }, icon: 'search', text: SEO_TOOL },
] as const satisfies readonly ToolDef[];

export type ToolId = (typeof TOOLS)[number]['id'];

export const toolPath = (tool: ToolDef, lang: Lang): string =>
  `${TOOLS_BASE[lang]}${tool.slug[lang]}/`;
export const toolUi = (tool: ToolDef, lang: Lang) => tool.text[lang].ui;
export const findTool = (id: string): ToolDef | undefined => TOOLS.find((t) => t.id === id);
