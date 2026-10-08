// Identifiants des onglets et de leurs panneaux (motif ARIA « tabs ») : à poser sur les panneaux (role="tabpanel" aria-labelledby).
export const tabId = (prefix, id) => `${prefix}-tab-${id}`;
export const panelId = (prefix, id) => `${prefix}-panel-${id}`;
