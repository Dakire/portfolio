// Petits clins d'œil, sans effet sur l'usage du site (fichier externe : la CSP interdit tout script en ligne).
//  - code Konami (↑ ↑ ↓ ↓ ← → ← → B A) : affiche ou retire les lignes de construction de la page ;
//  - un mot dans la console du navigateur pour celles et ceux qui l'ouvrent.
// Ignoré dans les champs de saisie ; jamais de mouvement ; le message est annoncé aux lecteurs d'écran (role="status").
(() => {
  const root = document.documentElement;
  const en = root.lang === 'en';
  const KONAMI = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  let step = 0;
  let timer = 0;

  const say = (text) => {
    document.querySelector('.egg-toast')?.remove();
    const note = document.createElement('p');
    note.className = 'egg-toast';
    note.setAttribute('role', 'status');
    note.textContent = text;
    document.body.append(note);
    clearTimeout(timer);
    timer = setTimeout(() => note.remove(), 4000);
  };

  const guides = (on) => {
    root.classList.toggle('egg-guides', on);
    say(
      on
        ? en
          ? 'Construction lines on. Same code, or Esc, to remove them.'
          : 'Lignes de construction affichées. Même code, ou Échap, pour les retirer.'
        : en
          ? 'Construction lines off.'
          : 'Lignes de construction retirées.',
    );
  };

  addEventListener('keydown', (event) => {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable="true"]')
    ) {
      step = 0;
      return;
    }
    if (event.key === 'Escape' && root.classList.contains('egg-guides')) {
      guides(false);
      return;
    }
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === KONAMI[step]) {
      step += 1;
      if (step === KONAMI.length) {
        step = 0;
        guides(!root.classList.contains('egg-guides'));
      }
    } else {
      step = key === KONAMI[0] ? 1 : 0;
    }
  });

  try {
    console.log(
      en
        ? '%cgrichard.eu%c\nYou opened the console. So do I, when something does not work.\nThe code is public: https://github.com/Dakire/portfolio\nThere is also a code from 1986 that does something here.'
        : '%cgrichard.eu%c\nVous avez ouvert la console. Moi aussi, quand quelque chose ne marche pas.\nLe code est public : https://github.com/Dakire/portfolio\nIl y a aussi un code de 1986 qui fait quelque chose ici.',
      'font: 700 14px monospace; color: #f5a524',
      'font: 12px monospace',
    );
  } catch {
    // console indisponible : sans importance
  }
})();
