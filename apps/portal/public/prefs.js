// Réglages de lecture de grichard.eu (thème et curseur, voir apps/web/public/js/theme.js) appliqués à l'espace client.
// Même origine, donc même localStorage : l'espace suit le choix fait sur le site, sans réglage propre. Chargé sans defer dans
// le <head> pour que data-theme soit posé avant le premier rendu (pas de flash). Fichier externe : la CSP refuse tout script en
// ligne. Sans JavaScript, l'espace reste en thème clair, le défaut du site.
(() => {
  const root = document.documentElement;
  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null; // stockage indisponible : réglages par défaut
    }
  };
  const theme = read('theme');
  const dark =
    theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  if (read('cursor') === 'off') root.dataset.cursor = 'off';
})();
