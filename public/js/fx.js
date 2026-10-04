// Halo des cartes (.card-glow) : la lueur suit le pointeur. Purement décoratif, aucun effet au clavier ni au toucher,
// et rien n'est installé si l'utilisateur demande moins de mouvement.
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.card-glow');
    if (!card || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const { left, top } = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - left}px`);
      card.style.setProperty('--my', `${e.clientY - top}px`);
    });
  });
})();
