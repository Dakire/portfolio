// Références du carnet (ADR 0014) : un numéro de fiche par réalisation (GR-R01…), un numéro de ticket par article (date + rubrique).
// Ce sont des identifiants dérivés de l'ordre et des dates déjà publiés : aucune donnée nouvelle.

/** Référence d'une réalisation d'après son rang dans la liste (0 -> GR-R01). */
export const projectRef = (index: number): string => `GR-R${String(index + 1).padStart(2, '0')}`;

const CODES: Record<string, string> = {
  messagerie: 'MSG',
  dns: 'DNS',
  migration: 'MIG',
  securite: 'SEC',
  'poste-de-travail': 'PDT',
  web: 'WEB',
  actualites: 'ACT',
  ia: 'IA',
};

/** Ticket d'un article : AAAAMMJJ-RUB (ex. 20261120-SEC). */
export const ticketOf = (date: Date, category: string): string => {
  const ymd = date.toISOString().slice(0, 10).replaceAll('-', '');
  return `${ymd}-${CODES[category] ?? category.slice(0, 3).toUpperCase()}`;
};
