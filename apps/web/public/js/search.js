// Recherche globale du site : boîte de dialogue modale native alimentée par /search-index.json (pages, articles, outils, cheatsheets, réalisations).
// Index chargé à la première ouverture ; recherche locale sans accent ni casse, chaque mot saisi doit être présent. Les résultats sont des
// liens ordinaires (flèches haut/bas pour passer de l'un à l'autre, Entrée ouvre le premier). Raccourcis : Ctrl/Cmd+K et « / », sauf sur les
// pages de cheatsheets, où ils appartiennent déjà à la recherche de la page. Sans <dialog> ou sans JavaScript, le bouton reste masqué.
(() => {
  const dialog = document.getElementById('search');
  const openers = [...document.querySelectorAll('[data-search-open]')];
  if (!dialog || openers.length === 0 || typeof dialog.showModal !== 'function') return;

  const input = dialog.querySelector('#search-input');
  const results = dialog.querySelector('#search-results');
  const status = dialog.querySelector('#search-status');
  const lang = dialog.dataset.lang;
  const MAX = 12;
  let items = null;
  let groups = {};
  let loading = null;

  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const load = () => {
    loading ??= fetch(dialog.dataset.index)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        const entry = data[lang] ?? { items: [], groups: {} };
        groups = entry.groups ?? {};
        items = entry.items.map((it) => ({
          ...it,
          t: fold(it.title),
          h: fold(it.hint ?? ''),
        }));
      })
      .catch(() => {
        loading = null;
        items = null;
      });
    return loading;
  };

  const message = (text) => {
    results.replaceChildren();
    const p = document.createElement('p');
    p.className = 'search-message';
    p.textContent = text;
    results.append(p);
    status.textContent = text;
  };

  const score = (it, words) => {
    let total = 0;
    for (const w of words) {
      if (it.t.includes(w)) total += it.t.startsWith(w) || it.t.includes(` ${w}`) ? 5 : 3;
      else if (it.h.includes(w)) total += 1;
      else return 0;
    }
    return total;
  };

  const render = () => {
    const q = fold(input.value).trim();
    if (!q) return message(dialog.dataset.hint);
    if (!items) return message(dialog.dataset.error);
    const words = q.split(/\s+/);
    const found = items
      .map((it) => ({ it, s: score(it, words) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX);
    if (found.length === 0) return message(dialog.dataset.none);
    const list = document.createElement('ul');
    list.className = 'search-list';
    list.setAttribute('role', 'list');
    for (const { it } of found) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = it.url;
      a.className = 'search-link';
      const kind = document.createElement('span');
      kind.className = 'label';
      kind.textContent = groups[it.group] ?? it.group;
      const title = document.createElement('span');
      title.className = 'search-title';
      title.textContent = it.title;
      a.append(kind, title);
      if (it.hint) {
        const hint = document.createElement('span');
        hint.className = 'search-hint';
        hint.textContent = it.hint;
        a.append(hint);
      }
      li.append(a);
      list.append(li);
    }
    results.replaceChildren(list);
    status.textContent = dialog.dataset.count.replace('{n}', String(found.length));
  };

  const open = async () => {
    if (!dialog.open) dialog.showModal();
    input.focus();
    input.select();
    render();
    if (!items) {
      await load();
      render();
    }
  };

  openers.forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', open);
  });
  dialog.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
  // Clic sur le fond (hors du panneau) : ferme.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  input.addEventListener('input', render);

  const links = () => [...results.querySelectorAll('a')];
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target === input) {
      const first = links()[0];
      if (first) location.assign(first.href);
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const all = links();
    if (all.length === 0) return;
    e.preventDefault();
    const at = all.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') (all[at + 1] ?? all[0]).focus();
    else if (at <= 0) input.focus();
    else all[at - 1].focus();
  });

  document.addEventListener('keydown', (e) => {
    if (document.querySelector('[data-reference]')) return;
    const t = e.target;
    const typing =
      t instanceof HTMLElement && (t.matches('input, textarea, select') || t.isContentEditable);
    const ctrlK = (e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey;
    const slash = e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (!ctrlK && !slash) return;
    e.preventDefault();
    open();
  });

  // Après navigation par lien, le dialogue disparaît avec la page : rien d'autre à nettoyer.
})();
