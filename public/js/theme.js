// Thème clair / sombre. Chargé SANS defer dans le <head> : data-theme est posé avant le premier rendu (pas de flash).
// Choix mémorisé dans localStorage ; sans choix, le thème suit le réglage du système (et le suit s'il change).
// Toute balise portant data-theme-toggle bascule le thème (voir src/components/ui/ThemeToggle.jsx).
(() => {
  const KEY = 'theme';
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: light)');

  const stored = () => {
    try {
      const v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch {
      return null; // stockage indisponible : on suit le système
    }
  };

  const apply = (theme) => {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f8fafc' : '#020617');
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(theme === 'light')));
  };

  root.classList.add('js');
  apply(stored() ?? (system.matches ? 'light' : 'dark'));
  document.addEventListener('DOMContentLoaded', () => apply(root.dataset.theme));

  system.addEventListener('change', (e) => {
    if (!stored()) apply(e.matches ? 'light' : 'dark');
  });

  document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-theme-toggle]');
    if (!button) return;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    const change = () => {
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // non bloquant : le choix vaut pour cette visite
      }
    };

    const animate = document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate) return change();

    // Le nouveau thème se déploie en cercle depuis le bouton
    const { left, top, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(change).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 450, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
  });
})();
