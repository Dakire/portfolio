// Section « Cheatsheets » : métadonnées lues dans public/data/reference/index.json (généré par `pnpm reference:build`).
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
    hubTitle:
      'Cheatsheets IT : commandes GAM, PowerShell, Windows, Active Directory | Guillaume Richard',
    hubDescription:
      'Aide-mémoire de commandes pour techniciens et administrateurs : GAM (Google Workspace), PowerShell Microsoft 365, Windows 11, Active Directory, réseau, Linux, Proxmox, Git. Recherche instantanée.',
    hubH1: 'Cheatsheets : aide-mémoire de commandes',
    hubIntro:
      'Des aide-mémoire de commandes, avec recherche instantanée (fautes de frappe tolérées), exemples à copier et lien vers la documentation officielle.',
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
    cards: 'Les références',
    noscript:
      'La recherche demande JavaScript. La documentation officielle reste accessible depuis les liens de cette page.',
    sourceTitle: 'Source et licence',
    sourceBy: 'Contenu issu de',
    license: 'Licence',
    privacy:
      'La recherche s’exécute dans votre navigateur : aucune saisie n’est envoyée au serveur.',
    topTitle: 'Pour commencer',
  },
  en: {
    hubTitle: 'IT cheatsheets: GAM, PowerShell, Windows, Active Directory | Guillaume Richard',
    hubDescription:
      'Command cheat sheets for technicians and administrators: GAM (Google Workspace), Microsoft 365 PowerShell, Windows 11, Active Directory, networking, Linux, Proxmox, Git. Instant search.',
    hubH1: 'Cheatsheets: command reference',
    hubIntro:
      'Command cheat sheets with instant search (typos tolerated), copyable examples and a link to the official documentation.',
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
    cards: 'References',
    noscript:
      'Search requires JavaScript. The official documentation stays reachable from the links on this page.',
    sourceTitle: 'Source and licence',
    sourceBy: 'Content from',
    license: 'Licence',
    privacy: 'Search runs in your browser: nothing you type is sent to the server.',
    topTitle: 'Getting started',
  },
} as const;
