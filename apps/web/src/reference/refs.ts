// Section « Cheatsheets » : métadonnées lues dans public/data/reference/index.json (généré par `pnpm reference:build`).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import index from '../../public/data/reference/index.json';
import { withBase } from '../lib/base';
import type { Lang } from '../lib/i18n';

export interface RefMeta {
  id: string;
  lang: Lang;
  title: string;
  h1: string;
  description: string;
  intro: string;
  card: string;
  count: number;
  file: string;
  cats: { id: string; label: string }[];
  fields: { key: string; label: string }[];
  docs?: { label: string; url: string };
  notice?: string;
  generated?: string;
  source?: { name: string; url: string; license: string; licenseUrl: string; note?: string };
  /** Libellé et exemple du champ de recherche, quand « commande » ne convient pas. */
  searchLabel?: string;
  placeholder?: string;
  topAfter?: boolean;
  topTitle?: string;
  top?: { title: string; note?: string; items: { code: string; note?: string }[] }[];
}

export const REFS = index.refs as unknown as RefMeta[];

/** Une référence est publiée dans la langue de ses sources ; les autres langues auront leur propre dossier de sources. */
export const refsFor = (lang: Lang) => REFS.filter((r) => r.lang === lang);
export const REF_HUB: Record<Lang, string> = { fr: '/cheatsheets/', en: '/en/cheatsheets/' };
export const refPath = (ref: RefMeta) => withBase(`${REF_HUB[ref.lang]}${ref.id}/`);
export const hubPath = (lang: Lang) => withBase(REF_HUB[lang]);
export const catalogUrl = () => withBase('/data/reference/index.json');
export const fileUrl = (ref: RefMeta) => withBase(ref.file);

export const REF_UI = {
  fr: {
    hubTitle: 'Cheatsheets IT : GAM, PowerShell, Windows | Guillaume Richard',
    hubDescription:
      'Cheatsheets de commandes pour techniciens : GAM, PowerShell Microsoft 365, Windows 11, Active Directory, réseau, Linux, Proxmox, Git, touches BIOS. Exemples à copier.',
    hubH1: 'Cheatsheets : aide-mémoire de commandes',
    hubIntro:
      'Les commandes qu’on finit toujours par rechercher, rangées par outil. Chacune a sa page, avec sa propre recherche, des exemples à copier et le lien vers la documentation officielle.',
    crumb: 'Cheatsheets',
    home: 'Accueil',
    searchLabel: 'Rechercher une commande',
    searchLabelAll: 'Rechercher dans toutes les références',
    placeholder: 'ex. get-mail, sfc, users…',
    hint: 'Raccourcis : / ou Ctrl+K pour chercher, Échap pour effacer, ↓ ↑ pour parcourir, Entrée pour ouvrir la documentation.',
    categories: 'Filtrer par catégorie',
    all: 'Toutes',
    results: 'Résultats',
    entries: 'entrées',
    open: 'Ouvrir la référence',
    cards: 'Toutes les cheatsheets',
    noscript:
      'La recherche demande JavaScript. La documentation officielle reste accessible depuis les liens de cette page.',
    sourceTitle: 'Source et licence',
    sourceBy: 'Contenu issu de',
    license: 'Licence',
    topTitle: 'Pour commencer',
    allTitle: 'Liste complète',
    allSummary: (n: number) => `Afficher les ${n} entrées`,
    related: 'Pour aller plus loin',
    relatedPosts: 'Articles',
    relatedTools: 'Outils',
    relatedRefs: 'Autres cheatsheets',
    relatedProjects: 'Réalisations liées',
  },
  en: {
    hubTitle: 'IT cheatsheets: BIOS/UEFI keys | Guillaume Richard',
    hubDescription:
      'Cheatsheets for technicians: BIOS/UEFI and boot menu keys by PC brand (Dell, HP, Lenovo, ASUS, Acer, MSI, Surface, Mac).',
    hubH1: 'Cheatsheets: command reference',
    hubIntro:
      'The commands you always end up looking up, sorted by tool. Each one has its own page and search, examples to copy and a link to the official documentation.',
    crumb: 'Cheatsheets',
    home: 'Home',
    searchLabel: 'Search a command',
    searchLabelAll: 'Search all references',
    placeholder: 'e.g. get-mail, sfc, users…',
    hint: 'Shortcuts: / or Ctrl+K to search, Esc to clear, ↓ ↑ to browse, Enter to open the documentation.',
    categories: 'Filter by category',
    all: 'All',
    results: 'Results',
    entries: 'entries',
    open: 'Open the reference',
    cards: 'All cheatsheets',
    noscript:
      'Search requires JavaScript. The official documentation stays reachable from the links on this page.',
    sourceTitle: 'Source and licence',
    sourceBy: 'Content from',
    license: 'Licence',
    topTitle: 'Getting started',
    allTitle: 'Full list',
    allSummary: (n: number) => `Show all ${n} entries`,
    related: 'Going further',
    relatedPosts: 'Articles',
    relatedTools: 'Tools',
    relatedRefs: 'More cheatsheets',
    relatedProjects: 'Related projects',
  },
} as const;

/** Références publiées dans les deux langues sous deux identifiants : sert aux liens hreflang et au sélecteur de langue. */
const TRANSLATIONS: [fr: string, en: string][] = [['bios-uefi', 'bios-uefi-keys']];
export interface RefEntry {
  id: string;
  name: string;
  cat: string;
  syn?: string;
  desc?: string;
  ex?: string[];
}

/** Entrées d'une cheatsheet, lues au build (public/data/reference/<id>.json) pour la liste complète en HTML. */
export const loadEntries = (ref: RefMeta): RefEntry[] =>
  JSON.parse(readFileSync(resolve(process.cwd(), 'public', ref.file.slice(1)), 'utf-8')).entries;

/** Identifiant français d'une cheatsheet (les clés de related.ts) : l'anglais en a un autre (bios-uefi-keys -> bios-uefi). */
export const refFrId = (ref: RefMeta) =>
  TRANSLATIONS.find(([, en]) => en === ref.id)?.[0] ?? ref.id;

/** Identifiant (français) d'une référence -> identifiant dans la langue demandée. */
export const refIdFor = (lang: Lang, frId: string) =>
  lang === 'fr' ? frId : (TRANSLATIONS.find(([fr]) => fr === frId)?.[1] ?? frId);
export const refAlternates = (ref: RefMeta) => {
  const pair = TRANSLATIONS.find(([fr, en]) => (ref.lang === 'fr' ? fr : en) === ref.id);
  return pair
    ? {
        fr: withBase(`${REF_HUB.fr}${pair[0]}/`),
        en: withBase(`${REF_HUB.en}${pair[1]}/`),
      }
    : undefined;
};
export const hubAlternates = () => ({ fr: withBase(REF_HUB.fr), en: withBase(REF_HUB.en) });
