// Icône de chaque outil (clé `icon` du registre src/data/tools/index.js) : partagée par la page « Outils » et l'accueil.
import { Binary, Braces, Calculator, Diff, Globe, KeyRound, Mail, Network, Ruler, Scissors } from 'lucide-react';

export const TOOL_ICONS = { network: Network, scissors: Scissors, diff: Diff, mail: Mail, calculator: Calculator, binary: Binary, key: KeyRound, braces: Braces, ruler: Ruler, globe: Globe };
export const DEFAULT_TOOL_ICON = Network;
