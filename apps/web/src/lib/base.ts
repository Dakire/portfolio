/**
 * Préfixe d'URL du site : « » en production, « /preprod » en préproduction (un seul site chez l'hébergeur : la préproduction
 * vit dans un sous-dossier). Défini au build par SITE_BASE ; sans « / » final.
 */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Ajoute le préfixe aux chemins du site (« /blog/ » -> « /preprod/blog/ ») ; les URL absolues et les ancres sont laissées telles quelles. */
export const withBase = (path: string): string =>
  path.startsWith('/') && !path.startsWith('//') ? BASE + path : path;
