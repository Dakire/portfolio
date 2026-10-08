// Navigation : menu mobile (ouverture, Échap, clic extérieur, retour du focus) et surlignage de la section visible.
// Sans JavaScript, le panneau du menu reste affiché en clair et le bouton est masqué (voir index.css).
(() => {
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = toggle && document.getElementById(toggle.getAttribute('aria-controls'));

  if (toggle && panel) {
    const set = (open, { refocus = false } = {}) => {
      panel.dataset.state = open ? 'open' : 'closed';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
      if (!open && refocus) toggle.focus();
    };
    set(false);

    toggle.addEventListener('click', () => set(panel.dataset.state !== 'open'));
    panel.addEventListener('click', (e) => e.target.closest('a') && set(false));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && panel.dataset.state === 'open' && set(false, { refocus: true }));
    document.addEventListener('click', (e) => {
      if (panel.dataset.state === 'open' && !e.target.closest('[data-nav-toggle], #' + panel.id)) set(false);
    });
    matchMedia('(min-width: 48rem)').addEventListener('change', (e) => e.matches && set(false));
  }

  // Section visible : aria-current="location" sur les liens du menu qui pointent vers elle
  const links = [...document.querySelectorAll('a[data-spy]')];
  if (links.length && 'IntersectionObserver' in window) {
    const sections = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
    const mark = (id) => links.forEach((a) => (a.hash === `#${id}` ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && mark(e.target.id)),
      { rootMargin: '-35% 0px -60% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
  }
})();
