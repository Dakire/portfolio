// Curseur personnalisé (inspiré de Figma) : une flèche remplace le curseur du système, entourée d'un halo qui la suit
// avec un léger retard. Amélioration progressive :
// - la flèche est calée exactement sur le pointeur (aucun retard : un clic tombe toujours où on le voit) ;
// - états : défaut (flèche, halo discret), cliquable (halo qui s'élargit), texte (barre en I), pressé (retrait) ;
//   un élément peut forcer son état avec data-cursor="link|text|<nom>" ;
// - le curseur du système n'est masqué (classe has-custom-cursor) que pendant que le point est affiché : sans
//   JavaScript, sur écran tactile, en mouvement réduit, en contraste élevé (forced-colors) ou une fois désactivé,
//   c'est le curseur normal ; dans une iframe (Turnstile), celle-ci garde son propre curseur ;
// - élément aria-hidden et pointer-events: none : aucune incidence sur le clavier ni les lecteurs d'écran ;
// - désactivable (interrupteur du pied de page, commande « cursor off » du terminal), choix mémorisé ;
// - états détectés par délégation (un seul écouteur pointerover), position écrite une fois par image
//   (requestAnimationFrame, arrêtée dès que le halo a rejoint la flèche) ; seuls transform et opacity changent.
(() => {
  const KEY = 'cursor';
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const root = document.documentElement;
  const TEXT =
    'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]), textarea, [contenteditable=""], [contenteditable="true"]';
  const LINK = 'a[href], button, [role="button"], input, select, summary, label, [data-cursor]';

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
  let halo;
  const LERP = 0.2;
  const MAX_LAG = 24; // le halo ne s'éloigne jamais de la flèche de plus de 24 px, même souris très rapide
  const target = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };

  const build = () => {
    el = document.createElement('div');
    el.className = 'cursor';
    el.setAttribute('aria-hidden', 'true');
    const svgNs = 'http://www.w3.org/2000/svg';
    const icon = (cls, w, h, box, d) => {
      const svg = document.createElementNS(svgNs, 'svg');
      svg.setAttribute('viewBox', box);
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.setAttribute('class', cls);
      const path = document.createElementNS(svgNs, 'path');
      path.setAttribute('d', d);
      svg.append(path);
      return svg;
    };
    halo = document.createElement('span');
    halo.className = 'cursor-halo';
    const ring = document.createElement('span');
    ring.className = 'cursor-ring';
    halo.append(ring);
    el.append(
      halo,
      icon('cursor-arrow', 16, 20, '0 0 16 20', 'M1 1 L1 16 L5 12 L8 19 L11 17.5 L8 11 L14 11 Z'),
      icon(
        'cursor-beam',
        10,
        20,
        '0 0 10 20',
        'M1 1 H4 Q5 1 5 3 Q5 1 6 1 H9 V3 H6.5 V17 H9 V19 H6 Q5 19 5 17 Q5 19 4 19 H1 V17 H3.5 V3 H1 Z',
      ),
    );
    document.body.append(el);
  };

  // La flèche est toujours exactement sur le pointeur (target) ; le halo (pos) la rattrape.
  const render = () => {
    pos.x += (target.x - pos.x) * LERP;
    pos.y += (target.y - pos.y) * LERP;
    const settled = Math.abs(target.x - pos.x) < 0.1 && Math.abs(target.y - pos.y) < 0.1;
    if (settled) {
      pos.x = target.x;
      pos.y = target.y;
    }
    const lag = Math.hypot(pos.x - target.x, pos.y - target.y);
    if (lag > MAX_LAG) {
      pos.x = target.x + ((pos.x - target.x) * MAX_LAG) / lag;
      pos.y = target.y + ((pos.y - target.y) * MAX_LAG) / lag;
    }
    el.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
    halo.style.transform = `translate3d(${pos.x - target.x}px, ${pos.y - target.y}px, 0)`;
    frame = settled ? 0 : requestAnimationFrame(render);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  const show = (on) => {
    if (visible === on) return;
    visible = on;
    el.classList.toggle('is-visible', on);
    root.classList.toggle('has-custom-cursor', on);
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
    const forcedState = node?.closest('[data-cursor]')?.getAttribute('data-cursor');
    let state = '';
    if (forcedState) state = forcedState;
    else if (node?.closest(TEXT)) state = 'text';
    else if (node?.closest(LINK) && !node.closest(':disabled, [aria-disabled="true"]'))
      state = 'link';
    el.dataset.state = state;
  };
  const onDown = () => {
    el.dataset.pressed = '';
  };
  const onUp = () => {
    delete el.dataset.pressed;
  };
  // Sortie de la fenêtre, ou entrée dans une iframe (qui affiche son propre curseur) : la flèche disparaît.
  const onLeave = (event) => {
    if (!event.relatedTarget || event.relatedTarget.tagName === 'IFRAME') show(false);
  };

  let active = false;
  const start = () => {
    if (active) return;
    active = true;
    if (!el) build();
    addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseout', onLeave, { passive: true });
  };
  const stop = () => {
    if (!active) return;
    active = false;
    removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerover', onOver);
    document.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('mouseout', onLeave);
    cancelAnimationFrame(frame);
    frame = 0;
    show(false);
  };

  const supported = () => fine.matches && !reduced.matches && !forced.matches;
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

  for (const query of [fine, reduced, forced])
    query.addEventListener('change', () => {
      update();
      syncToggles();
    });
  update();
  syncToggles();
})();
