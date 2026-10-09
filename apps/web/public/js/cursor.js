// Curseur « collaboratif » façon Figma : une flèche étiquetée « Guillaume » suit la souris avec un léger retard (lerp).
// Amélioration progressive, purement décorative :
// - le curseur natif n'est jamais masqué ; l'élément est aria-hidden et pointer-events: none ;
// - actif seulement avec un pointeur fin qui survole (souris, pavé tactile), jamais si l'utilisateur réduit les animations ;
// - désactivable (bouton du pied de page, commande « cursor off » du terminal), choix mémorisé ;
// - une seule boucle requestAnimationFrame, arrêtée dès que la flèche a rejoint la souris ; seul transform est modifié.
(() => {
  const KEY = 'cursor';
  const LERP = 0.22;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const preference = () => {
    try {
      return localStorage.getItem(KEY) === 'off' ? 'off' : 'on';
    } catch {
      return 'on';
    }
  };
  const remember = (value) => {
    try {
      if (value === 'off') localStorage.setItem(KEY, 'off');
      else localStorage.removeItem(KEY);
    } catch {
      // stockage indisponible : le choix vaut pour cette visite
    }
  };

  let el;
  let frame = 0;
  let visible = false;
  const target = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };

  const build = () => {
    el = document.createElement('div');
    el.className = 'figma-cursor';
    el.setAttribute('aria-hidden', 'true');
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 16 20');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '20');
    svg.setAttribute('class', 'figma-cursor-arrow');
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', 'M1 1 L1 16 L5 12 L8 19 L11 17.5 L8 11 L14 11 Z');
    svg.append(path);
    const bar = document.createElement('span');
    bar.className = 'figma-cursor-bar';
    const name = document.createElement('span');
    name.className = 'figma-cursor-label';
    name.textContent = 'Guillaume';
    el.append(svg, bar, name);
    document.body.append(el);
  };

  const render = () => {
    pos.x += (target.x - pos.x) * LERP;
    pos.y += (target.y - pos.y) * LERP;
    const settled = Math.abs(target.x - pos.x) < 0.1 && Math.abs(target.y - pos.y) < 0.1;
    if (settled) {
      pos.x = target.x;
      pos.y = target.y;
    }
    el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    frame = settled ? 0 : requestAnimationFrame(render);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  const show = (on) => {
    if (visible === on) return;
    visible = on;
    el.classList.toggle('is-visible', on);
  };

  const onMove = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    target.x = event.clientX;
    target.y = event.clientY;
    if (!visible) {
      // première apparition : directement à la position de la souris, sans glisser depuis le coin
      pos.x = target.x;
      pos.y = target.y;
      show(true);
    }
    schedule();
  };
  const onOver = (event) => {
    const node = event.target instanceof Element ? event.target : null;
    const text = node?.closest(
      'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, [contenteditable=""], [contenteditable="true"]',
    );
    const interactive =
      !text && node?.closest('a[href], button, [role="button"], label, summary, select');
    el.dataset.state = text ? 'text' : interactive ? 'link' : '';
  };
  // Pulsation au clic : Web Animations sur la flèche seule (transform), sans toucher à la mise en page.
  const onDown = () => {
    el.firstElementChild.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(0.8)' }, { transform: 'scale(1)' }],
      { duration: 260, easing: 'ease-out' },
    );
  };
  const onLeave = (event) => {
    if (!event.relatedTarget) show(false);
  };

  let active = false;
  const start = () => {
    if (active) return;
    active = true;
    if (!el) build();
    addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('mouseout', onLeave, { passive: true });
  };
  const stop = () => {
    if (!active) return;
    active = false;
    removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerover', onOver);
    document.removeEventListener('pointerdown', onDown);
    document.removeEventListener('mouseout', onLeave);
    cancelAnimationFrame(frame);
    frame = 0;
    show(false);
  };

  const supported = () => fine.matches && !reduced.matches;
  const update = () => (supported() && preference() === 'on' ? start() : stop());

  // Interrupteur du pied de page : visible seulement là où le curseur peut exister.
  const syncToggles = () => {
    for (const button of document.querySelectorAll('[data-cursor-toggle]')) {
      button.hidden = !supported();
      button.setAttribute('aria-checked', String(preference() === 'on'));
    }
  };
  const set = (value) => {
    remember(value);
    update();
    syncToggles();
  };
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('[data-cursor-toggle]')) set(preference() === 'on' ? 'off' : 'on');
  });
  document.addEventListener('cursor:set', (event) => set(event.detail === 'off' ? 'off' : 'on'));

  for (const query of [fine, reduced])
    query.addEventListener('change', () => {
      update();
      syncToggles();
    });
  update();
  syncToggles();
})();
