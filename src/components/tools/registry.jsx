// Composant de chaque outil (utilisé au rendu serveur de sa page ; le navigateur ne charge que celui de la page visitée,
// via src/islands/tools/<id>.jsx). Une entrée par outil de src/data/tools/index.js.
import DnsChecker from './DnsChecker';
import IcsCompare from './IcsCompare';
import IcsSplit from './IcsSplit';

export const TOOL_COMPONENTS = {
  dns: DnsChecker,
  'ics-split': IcsSplit,
  'ics-compare': IcsCompare,
};
