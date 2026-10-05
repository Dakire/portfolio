// Registre des outils : un identifiant, un segment d'URL par langue et les textes. Une seule liste alimente la page « Outils »,
// le menu, la palette de commandes, le plan du site, llms.txt et les données structurées.
// Pour ajouter un outil : ses textes (src/data/tools/<id>.js), son composant (src/components/tools/registry.jsx),
// son îlot (src/islands/tools/<id>.jsx) et une entrée ci-dessous.
import { DNS_TOOL } from '../dns-tool.js';
import { EMAIL_HEADERS } from './email-headers.js';
import { ENCODER } from './encoder.js';
import { ICS_COMPARE } from './ics-compare.js';
import { ICS_SPLIT } from './ics-split.js';
import { JSON_TOOL } from './json.js';
import { PASSWORD } from './password.js';
import { SUBNET } from './subnet.js';
import { UNITS_TOOL } from './units.js';

export const TOOLS_BASE = { fr: '/outils/', en: '/en/tools/' };

export const TOOLS = [
  { id: 'dns', slug: { fr: 'dns', en: 'dns' }, icon: 'network', text: DNS_TOOL },
  { id: 'ics-split', slug: { fr: 'ics-decouper', en: 'ics-splitter' }, icon: 'scissors', text: ICS_SPLIT },
  { id: 'ics-compare', slug: { fr: 'ics-comparer', en: 'ics-compare' }, icon: 'diff', text: ICS_COMPARE },
  { id: 'email-headers', slug: { fr: 'en-tetes-email', en: 'email-headers' }, icon: 'mail', text: EMAIL_HEADERS },
  { id: 'subnet', slug: { fr: 'calculateur-reseau', en: 'subnet-calculator' }, icon: 'calculator', text: SUBNET },
  { id: 'encoder', slug: { fr: 'encodeur-decodeur', en: 'encoder-decoder' }, icon: 'binary', text: ENCODER },
  { id: 'password', slug: { fr: 'generateur-mot-de-passe', en: 'password-generator' }, icon: 'key', text: PASSWORD },
  { id: 'json', slug: { fr: 'formateur-json', en: 'json-formatter' }, icon: 'braces', text: JSON_TOOL },
  { id: 'units', slug: { fr: 'convertisseur-unites', en: 'unit-converter' }, icon: 'ruler', text: UNITS_TOOL },
];

export const toolPath = (tool, lang) => `${TOOLS_BASE[lang]}${tool.slug[lang]}/`;
export const toolUi = (tool, lang) => tool.text[lang].ui;
export const findTool = (id) => TOOLS.find((t) => t.id === id);
