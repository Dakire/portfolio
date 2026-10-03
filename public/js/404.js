// Page 404 : le bouton « Retourner à l'accueil » esquive la souris.
// Garde-fous : le clavier et les lecteurs d'écran ne sont jamais esquivés, et le bouton abandonne tout seul
// après MAX_DODGES esquives. Avec « réduire les animations », le bouton se déplace instantanément (sans transition).
// Sans JavaScript, c'est un simple lien.
(() => {
  const MAX_DODGES = 8;
  const FLEE_DISTANCE = 110; // le bouton fuit quand le curseur s'approche à moins de ce nombre de pixels
  const SAFE_DISTANCE = 160; // et se pose au moins aussi loin du curseur

  const zone = document.getElementById('dodge-zone');
  const btn = document.getElementById('dodge-btn');
  const taunt = document.getElementById('taunt');
  const score = document.getElementById('score');
  const scoreN = document.getElementById('score-n');
  if (!zone || !btn || !taunt || !score || !scoreN) return;

  const taunts = [
    'Raté !',
    'Trop lent.',
    'Presque…',
    'Il faut viser, vous savez.',
    'Je suis timide.',
    'Astuce : le clavier (Tab puis Entrée) fonctionne aussi.',
    'Allez, encore un.',
  ];
  let dodges = 0;
  let lastMove = 0;

  const move = (cursorX, cursorY) => {
    const z = zone.getBoundingClientRect();
    const w = btn.offsetWidth;
    const h = btn.offsetHeight;
    let best = { x: 16, y: 16 };
    let bestDist = -1;
    // On tire plusieurs positions au hasard et on garde la plus éloignée du curseur.
    for (let i = 0; i < 12; i += 1) {
      const x = 8 + Math.random() * Math.max(0, z.width - w - 16);
      const y = 8 + Math.random() * Math.max(0, z.height - h - 16);
      const d = Math.hypot(z.left + x + w / 2 - cursorX, z.top + y + h / 2 - cursorY);
      if (d > bestDist) {
        best = { x, y };
        bestDist = d;
      }
      if (d >= SAFE_DISTANCE && i > 3) break;
    }
    btn.style.left = `${best.x}px`;
    btn.style.top = `${best.y}px`;
  };

  const giveUp = () => {
    taunt.textContent = 'Bon, j’abandonne. Vous avez gagné : cliquez.';
    btn.textContent = 'OK, retourner à l’accueil';
  };

  const dodge = (x, y) => {
    if (dodges >= MAX_DODGES) return;
    const now = Date.now();
    if (now - lastMove < 180) return;
    lastMove = now;
    dodges += 1;
    score.hidden = false;
    scoreN.textContent = String(dodges);
    if (dodges >= MAX_DODGES) {
      giveUp();
      return;
    }
    taunt.textContent = taunts[Math.min(dodges - 1, taunts.length - 1)];
    move(x, y);
  };

  // Souris : le bouton fuit quand le curseur s'approche.
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || dodges >= MAX_DODGES) return;
    const r = btn.getBoundingClientRect();
    const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    if (d < FLEE_DISTANCE + Math.max(r.width, r.height) / 2) dodge(e.clientX, e.clientY);
  });

  // Clic à la souris ou toucher : esquivé tant que le bouton n'a pas abandonné.
  // Un clic issu du clavier ou d'un lecteur d'écran a detail === 0 : il passe toujours.
  btn.addEventListener('click', (e) => {
    if (e.detail === 0 || dodges >= MAX_DODGES) return;
    e.preventDefault();
    dodge(e.clientX, e.clientY);
  });
})();
