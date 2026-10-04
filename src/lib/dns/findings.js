// Constats produits par les analyses : un code (traduit par src/data/dns-tool.js), une gravité et des paramètres.
export const SEVERITIES = ['ok', 'info', 'warn', 'error'];
const RANK = { ok: 0, info: 1, warn: 2, error: 3 };

export const finding = (code, severity, params = {}) => ({ code, severity, params });

/** Gravité la plus haute d'une liste de constats ('ok' s'il n'y en a aucun). */
export const worst = (findings) => findings.reduce((acc, f) => (RANK[f.severity] > RANK[acc] ? f.severity : acc), 'ok');

export const countBySeverity = (findings) => Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]));
