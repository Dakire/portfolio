// Icône de chaque outil (clé `icon` du registre) : partagée par la page « Outils » et l'accueil.
import {
  Binary,
  Braces,
  Calculator,
  Diff,
  Globe,
  KeyRound,
  Mail,
  Network,
  Ruler,
  Scissors,
} from 'lucide-preact';
import type { ToolIcon } from './types';

export const TOOL_ICONS = {
  network: Network,
  scissors: Scissors,
  diff: Diff,
  mail: Mail,
  calculator: Calculator,
  binary: Binary,
  key: KeyRound,
  braces: Braces,
  ruler: Ruler,
  globe: Globe,
} as const satisfies Record<ToolIcon, unknown>;
