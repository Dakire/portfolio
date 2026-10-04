// Registre des outils : un identifiant, un segment d'URL par langue et les textes. Une seule liste alimente la page « Outils »,
// le menu, la palette de commandes, le plan du site, llms.txt et les données structurées.
// Pour ajouter un outil : ses textes (src/data/tools/<id>.js), son composant (src/components/tools/registry.jsx),
// son îlot (src/islands/tools/<id>.jsx) et une entrée ci-dessous.
import { DNS_TOOL } from '../dns-tool.js';
import { ICS_COMPARE } from './ics-compare.js';
import { ICS_SPLIT } from './ics-split.js';

export const TOOLS_BASE = { fr: '/outils/', en: '/en/tools/' };

export const TOOLS = [
  { id: 'dns', slug: { fr: 'dns', en: 'dns' }, icon: 'network', text: DNS_TOOL },
  { id: 'ics-split', slug: { fr: 'ics-decouper', en: 'ics-splitter' }, icon: 'scissors', text: ICS_SPLIT },
  { id: 'ics-compare', slug: { fr: 'ics-comparer', en: 'ics-compare' }, icon: 'diff', text: ICS_COMPARE },
];

export const toolPath = (tool, lang) => `${TOOLS_BASE[lang]}${tool.slug[lang]}/`;
export const toolUi = (tool, lang) => tool.text[lang].ui;
export const findTool = (id) => TOOLS.find((t) => t.id === id);
