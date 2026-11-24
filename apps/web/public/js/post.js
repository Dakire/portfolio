// Confort de lecture d'un article (ADR 0016) : barre de progression, boutons « Copier » sur les blocs de code, copie du lien et
// partage natif (Web Share API, seulement s'il existe). Aucun service tiers. Fichier externe (CSP).
(() => {
  const body = document.querySelector('.post-body');
  if (!body) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const labels = body.closest('article')?.dataset ?? {};
  const copiedLabel = labels.copiedLabel ?? 'Copié';
  const failLabel = labels.copyFail ?? 'Échec';

  // Barre de progression : se remplit avec le défilement dans l'article.
  const bar = document.querySelector('[data-read-progress]');
  // Navigation sans rechargement (ClientRouter, voir Base.astro) : le suivi du défilement est coupé avant l'échange de page,
  // sinon il continuerait de mesurer l'article quitté.
  const scope = new AbortController();
  const { signal } = scope;
  document.addEventListener('astro:before-swap', () => scope.abort(), { once: true, signal });
  if (bar) {
    const fill = bar.firstElementChild;
    bar.hidden = false;
    const update = () => {
      const box = body.getBoundingClientRect();
      const total = box.height - innerHeight * 0.5;
      const done = Math.min(1, Math.max(0, (innerHeight * 0.3 - box.top) / Math.max(1, total)));
      fill.style.transform = `scaleX(${done.toFixed(3)})`;
      bar.setAttribute('aria-valuenow', String(Math.round(done * 100)));
    };
    addEventListener('scroll', update, { passive: true, signal });
    addEventListener('resize', update, { signal });
    update();
  }

  const timers = new WeakMap();
  const flash = (button, text, original) => {
    button.textContent = text;
    clearTimeout(timers.get(button));
    timers.set(
      button,
      setTimeout(() => (button.textContent = original), reduced ? 1500 : 1800),
    );
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  // Blocs de code : un bouton « Copier » par bloc.
  for (const pre of body.querySelectorAll('pre')) {
    const code = pre.textContent ?? '';
    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.replaceWith(wrap);
    wrap.append(pre);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    const idle = labels.copyLabel ?? 'Copier';
    button.textContent = idle;
    button.setAttribute('aria-label', labels.copyAria ?? 'Copier le code');
    button.addEventListener('click', async () => {
      flash(button, (await copy(code)) ? copiedLabel : failLabel, idle);
    });
    wrap.append(button);
  }

  // Partage : copie du lien, et partage natif si le navigateur le propose.
  const link = document.querySelector('[data-copy-link]');
  if (link) {
    link.hidden = false;
    const idle = link.textContent;
    link.addEventListener('click', async () => {
      flash(link, (await copy(location.href)) ? copiedLabel : failLabel, idle);
    });
  }
  const share = document.querySelector('[data-share]');
  if (share && navigator.share) {
    share.hidden = false;
    share.addEventListener('click', () =>
      navigator.share({ title: document.title, url: location.href }).catch(() => {}),
    );
  }
})();
