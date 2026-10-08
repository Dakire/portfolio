/** Assemble des noms de classes en ignorant les valeurs vides. */
export const cx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ');

/** Identifiants des onglets et de leurs panneaux (motif ARIA « tabs »). */
export const tabId = (prefix: string, id: string): string => `${prefix}-tab-${id}`;
export const panelId = (prefix: string, id: string): string => `${prefix}-panel-${id}`;
