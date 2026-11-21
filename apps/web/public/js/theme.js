// Réglages de lecture : papier (clair par défaut, sombre ou système) et curseur du site (actif par défaut).
// Chargé SANS defer dans le <head> : data-theme et data-cursor sont posés avant le premier rendu (pas de flash).
// Sans choix mémorisé, le thème est CLAIR (pas celui du système) ; « auto » est un choix explicite qui suit le système.
// Fichier externe (jamais en ligne) : la CSP n'autorise aucun script en ligne.
(() => {
  const THEME = 'theme';
  const CURSOR = 'cursor';
  const root = document.documentElement;
  // JavaScript disponible : posé avant le premier rendu, il permet au CSS de replier le menu mobile sans décalage
  // de mise en page (voir /js/nav.js). Sans JavaScript, la navigation reste dépliée.
  root.classList.add('js');
  const system = matchMedia('(prefers-color-scheme: dark)');

  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null; // stockage indisponible : réglages par défaut
    }
  };
  const write = (key, value) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // non bloquant : le choix vaut pour cette visite
    }
  };

  const choice = () => {
    const value = read(THEME);
    return value === 'dark' || value === 'auto' ? value : 'light';
  };

  const apply = () => {
    const picked = choice();
    const theme = picked === 'auto' ? (system.matches ? 'dark' : 'light') : picked;
    root.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#17130e' : '#f4efe3');
    const cursor = read(CURSOR) === 'off' ? 'off' : 'on';
    if (cursor === 'off') root.dataset.cursor = 'off';
    else root.removeAttribute('data-cursor');
    for (const group of document.querySelectorAll('[data-theme-switch]')) {
      group.hidden = false;
      for (const button of group.querySelectorAll('[data-theme-set]'))
        button.setAttribute('aria-pressed', String(button.dataset.themeSet === picked));
    }
    for (const group of document.querySelectorAll('[data-cursor-switch]')) {
      group.hidden = false;
      for (const button of group.querySelectorAll('[data-cursor-set]'))
        button.setAttribute('aria-pressed', String(button.dataset.cursorSet === cursor));
    }
  };

  apply();
  document.addEventListener('DOMContentLoaded', apply);

  system.addEventListener('change', () => {
    if (choice() === 'auto') apply();
  });

  // Commande « cursor on|off » du terminal
  document.addEventListener('cursor:set', (event) => {
    write(CURSOR, event.detail === 'off' ? 'off' : null);
    apply();
  });

  document.addEventListener('click', (event) => {
    const theme = event.target.closest?.('[data-theme-set]');
    if (theme) {
      // « clair » est le défaut : on n'enregistre rien pour lui, un seul état par défaut.
      write(THEME, theme.dataset.themeSet === 'light' ? null : theme.dataset.themeSet);
      apply();
      return;
    }
    const cursor = event.target.closest?.('[data-cursor-set]');
    if (cursor) {
      write(CURSOR, cursor.dataset.cursorSet === 'off' ? 'off' : null);
      apply();
    }
  });
})();
