// Menu de navigation sur petit écran : un bouton « Menu » (aria-expanded) déplie la navigation sous l'en-tête.
// Panneau dans le flux, pas une surimpression modale : le focus n'a pas à être piégé. Échap ferme et rend le focus au bouton.
// Sans JavaScript, la navigation reste toujours dépliée (la classe « js » n'est posée que par /js/theme.js).
(() => {
  const button = document.querySelector('[data-nav-toggle]');
  const menu = button && document.getElementById(button.getAttribute('aria-controls'));
  if (!button || !menu) return;
  const wide = matchMedia('(min-width: 76rem)');

  const set = (open, { focusButton = false } = {}) => {
    button.setAttribute('aria-expanded', String(open));
    menu.toggleAttribute('data-open', open);
    if (!open && focusButton) button.focus();
  };

  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true' && !wide.matches)
      set(false, { focusButton: menu.contains(document.activeElement) });
  });

  // Menu au survol : Échap le ferme sans bouger le pointeur (WCAG 1.4.13) ; il se rouvre au prochain survol ou focus.
  document.querySelectorAll('.has-sub').forEach((item) => {
    const reopen = () => item.removeAttribute('data-closed');
    item.addEventListener('mouseleave', reopen);
    item.addEventListener('focusout', (event) => {
      if (!item.contains(event.relatedTarget)) reopen();
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !wide.matches) return;
    document.querySelectorAll('.has-sub').forEach((item) => {
      if (!item.matches(':hover, :focus-within')) return;
      item.setAttribute('data-closed', '');
      if (item.contains(document.activeElement)) item.querySelector(':scope > a').focus();
    });
  });

  // Passage en grand écran : la navigation est toujours visible, l'état replié n'a plus de sens.
  wide.addEventListener('change', () => set(false));
})();
