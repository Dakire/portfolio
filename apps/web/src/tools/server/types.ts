// Outils serveur (tools.php) : forme commune des rapports et des textes d'interface.

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';
export type CheckSeverity = 'critical' | 'important' | 'info';

export interface ServerCheck {
  id: string;
  category: string;
  severity: CheckSeverity;
  status: CheckStatus;
  data: Record<string, unknown>;
}

export interface ServerReport {
  url: string;
  finalUrl?: string;
  score: number;
  summary: { critical: number; important: number; info: number; passed: number };
  checks: ServerCheck[];
}

/** Titre, explication et correction d'un contrôle, rédigés côté site à partir des valeurs mesurées. */
export interface Described {
  title: string;
  detail: string;
  fix: string;
}

export interface ServerToolTexts {
  form: {
    url: string;
    urlHint: string;
    urlPlaceholder: string;
    submit: string;
    running: string;
    captchaLabel: string;
    captchaLoading: string;
    retryCaptcha: string;
  };
  results: {
    title: string;
    score: string;
    scoreOf: string;
    analysed: string;
    finalUrl: string;
    toFix: string;
    passed: string;
    none: string;
    fix: string;
    exportJson: string;
    print: string;
    again: string;
    announce: (score: number, toFix: number) => string;
    summary: (critical: number, important: number, minor: number) => string;
  };
  severity: Record<CheckSeverity, string>;
  status: Record<CheckStatus, string>;
  errors: Record<string, string>;
}

// Lecture prudente des valeurs (le JSON vient du réseau)
export const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
export const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
export const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
