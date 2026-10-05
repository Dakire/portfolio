// Composant de chaque outil (utilisé au rendu serveur de sa page ; le navigateur ne charge que celui de la page visitée,
// via src/islands/tools/<id>.jsx). Une entrée par outil de src/data/tools/index.js.
import DnsChecker from './DnsChecker';
import EmailHeaders from './EmailHeaders';
import EncoderDecoder from './EncoderDecoder';
import IcsCompare from './IcsCompare';
import IcsSplit from './IcsSplit';
import JsonFormatter from './JsonFormatter';
import PasswordGenerator from './PasswordGenerator';
import SubnetCalculator from './SubnetCalculator';
import UnitConverter from './UnitConverter';

export const TOOL_COMPONENTS = {
  dns: DnsChecker,
  'ics-split': IcsSplit,
  'ics-compare': IcsCompare,
  'email-headers': EmailHeaders,
  subnet: SubnetCalculator,
  encoder: EncoderDecoder,
  password: PasswordGenerator,
  json: JsonFormatter,
  units: UnitConverter,
};
