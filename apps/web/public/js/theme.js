// Thème auto / clair / sombre. Chargé SANS defer dans le <head> : data-theme est posé avant le premier rendu (pas de flash).
// Le choix explicite est mémorisé dans localStorage ; sans choix ("auto"), le thème suit le système et le suit s'il change.
// Fichier externe (jamais en ligne) : la CSP n'autorise aucun script en ligne.
(() => {
  const KEY = 'theme';
  const root = document.documentElement;
  // JavaScript disponible : posé avant le premier rendu, il permet au CSS de replier le menu mobile sans décalage
  // de mise en page (voir /js/nav.js). Sans JavaScript, la navigation reste dépliée.
  root.classList.add('js');
  const system = matchMedia('(prefers-color-scheme: light)');

  const stored = () => {
    try {
      const value = localStorage.getItem(KEY);
      return value === 'light' || value === 'dark' ? value : 'auto';
    } catch {
      return 'auto'; // stockage indisponible : on suit le système
    }
  };

  const apply = (choice) => {
    const theme = choice === 'auto' ? (system.matches ? 'light' : 'dark') : choice;
    root.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f7f8fa' : '#0a0c0f');
    for (const group of document.querySelectorAll('[data-theme-switch]')) {
      group.hidden = false;
      for (const button of group.querySelectorAll('[data-theme-set]')) {
        button.setAttribute('aria-pressed', String(button.dataset.themeSet === choice));
      }
    }
  };

  apply(stored());
  document.addEventListener('DOMContentLoaded', () => apply(stored()));

  system.addEventListener('change', () => {
    if (stored() === 'auto') apply('auto');
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-theme-set]');
    if (!button) return;
    const choice = button.dataset.themeSet;
    try {
      if (choice === 'auto') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, choice);
    } catch {
      // non bloquant : le choix vaut pour cette visite
    }
    apply(choice);
  });
})();
