// Curseur personnalisé discret (inspiré de Figma) : un petit point remplace le curseur du système.
// Amélioration progressive :
// - le point est calé exactement sur le pointeur (aucun retard : un clic tombe toujours où on le voit) ;
// - états : défaut (point), cliquable (disque qui grandit), texte (barre fine), pressé (léger retrait) ;
//   un élément peut forcer son état avec data-cursor="link|text|<nom>" ;
// - le curseur du système n'est masqué (classe has-custom-cursor) que pendant que le point est affiché : sans
//   JavaScript, sur écran tactile, en mouvement réduit, en contraste élevé (forced-colors) ou une fois désactivé,
//   c'est le curseur normal ; dans une iframe (Turnstile), celle-ci garde son propre curseur ;
// - élément aria-hidden et pointer-events: none : aucune incidence sur le clavier ni les lecteurs d'écran ;
// - désactivable (interrupteur du pied de page, commande « cursor off » du terminal), choix mémorisé ;
// - états détectés par délégation (un seul écouteur pointerover), position écrite une fois par image
//   (requestAnimationFrame) ; seuls transform et opacity changent, sans reflow.
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
  const target = { x: 0, y: 0 };

  const build = () => {
    el = document.createElement('div');
    el.className = 'cursor';
    el.setAttribute('aria-hidden', 'true');
    const dot = document.createElement('span');
    dot.className = 'cursor-dot';
    const bar = document.createElement('span');
    bar.className = 'cursor-bar';
    el.append(dot, bar);
    document.body.append(el);
  };

  const render = () => {
    frame = 0;
    el.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
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
    if (!visible) show(true);
    if (!frame) frame = requestAnimationFrame(render);
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
  // Sortie de la fenêtre, ou entrée dans une iframe (qui affiche son propre curseur) : le point disparaît.
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
