// Constats produits par les analyses : un code (traduit par src/data/dns-tool.js), une gravité et des paramètres.
export const SEVERITIES = ['ok', 'info', 'warn', 'error'] as const;
export type Severity = (typeof SEVERITIES)[number];
const RANK: Record<Severity, number> = { ok: 0, info: 1, warn: 2, error: 3 };

export interface Finding {
  code: string;
  severity: Severity;
  params: Record<string, string | number | boolean | undefined>;
}

export const finding = (
  code: string,
  severity: Severity,
  params: Finding['params'] = {},
): Finding => ({ code, severity, params });

/** Gravité la plus haute d'une liste de constats ('ok' s'il n'y en a aucun). */
export const worst = (findings: Finding[]): Severity =>
  findings.reduce<Severity>((acc, f) => (RANK[f.severity] > RANK[acc] ? f.severity : acc), 'ok');

export const countBySeverity = (findings: Finding[]) =>
  Object.fromEntries(
    SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]),
  ) as Record<Severity, number>;
