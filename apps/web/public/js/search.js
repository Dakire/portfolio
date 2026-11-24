// Recherche globale (ADR 0016) : palette de commandes (<dialog> modal natif) et page /search/?q=, alimentées par Pagefind.
// Pagefind est un index statique produit au build (/pagefind/) ; le moteur (JS + WebAssembly) ne se charge qu'à la première
// ouverture. Aucun service externe. Casse, accents et début de mot sont gérés par Pagefind ; les résultats sont groupés par type
// (filtre « type »), l'extrait met les termes trouvés en évidence. Vide : suggestions tirées de /search-index.json.
// Raccourcis : Ctrl/Cmd+K et « / » (sauf dans un champ, et sur les cheatsheets qui ont leur propre recherche).
(() => {
  const dialog = document.getElementById('search');
  const page = document.querySelector('[data-search-page]');
  const openers = [...document.querySelectorAll('[data-search-open]')];
  if (!dialog) return;
  const canModal = typeof dialog.showModal === 'function';
  if (!canModal && !page) return;

  const input = page ? page.querySelector('input') : dialog.querySelector('#search-input');
  const results = page
    ? page.querySelector('[data-search-results]')
    : dialog.querySelector('#search-results');
  const status = dialog.querySelector('#search-status');
  const lang = dialog.dataset.lang;
  const kinds = JSON.parse(dialog.dataset.kinds || '{}');
  const ORDER = ['page', 'project', 'article', 'skill', 'experience', 'tool', 'category', 'tag'];
  const MAX = 24;
  let engine = null;
  let suggestions = null;

  const loadEngine = () =>
    (engine ??= import(dialog.dataset.pagefind)
      .then(async (pf) => {
        await pf.options({ baseUrl: dialog.dataset.pagefindBase });
        await pf.init();
        return pf;
      })
      .catch(() => {
        engine = null;
        return null;
      }));

  const loadSuggestions = () =>
    (suggestions ??= fetch(dialog.dataset.index)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => data[lang]?.items ?? [])
      .catch(() => []));

  const say = (text) => {
    if (status) status.textContent = text;
  };
  const message = (text) => {
    results.replaceChildren();
    const p = document.createElement('p');
    p.className = 'search-message';
    p.textContent = text;
    results.append(p);
    say(text);
  };

  // Extrait Pagefind -> nœuds texte et <mark> (pas d'innerHTML : le texte reste du texte).
  const excerptNodes = (html) => {
    const nodes = [];
    for (const part of html.split(/(<mark>.*?<\/mark>)/g)) {
      if (!part) continue;
      const m = part.match(/^<mark>(.*)<\/mark>$/);
      const text = new DOMParser().parseFromString(m ? m[1] : part, 'text/html').body.textContent;
      if (m) {
        const mark = document.createElement('mark');
        mark.textContent = text;
        nodes.push(mark);
      } else nodes.push(document.createTextNode(text));
    }
    return nodes;
  };

  const row = ({ url, title, kind, hint, excerpt }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.className = 'search-link';
    const name = document.createElement('span');
    name.className = 'search-title';
    if (title instanceof Node) name.append(title);
    else name.textContent = title;
    const badge = document.createElement('span');
    badge.className = 'search-badge';
    badge.textContent = kinds[kind] ?? kind;
    a.append(name, badge);
    if (excerpt) {
      const p = document.createElement('span');
      p.className = 'search-hint';
      p.append(...excerptNodes(excerpt));
      a.append(p);
    } else if (hint) {
      const p = document.createElement('span');
      p.className = 'search-hint';
      p.textContent = hint;
      a.append(p);
    }
    li.append(a);
    return li;
  };

  const group = (kind, rows) => {
    const section = document.createElement('section');
    section.className = 'search-group';
    const h = document.createElement('h3');
    h.className = 'search-group-title';
    h.textContent = kinds[kind] ?? kind;
    const ul = document.createElement('ul');
    ul.className = 'search-list';
    ul.setAttribute('role', 'list');
    ul.append(...rows);
    section.append(h, ul);
    return section;
  };

  const renderSuggestions = async () => {
    const items = await loadSuggestions();
    if (input.value.trim()) return;
    const pick = (g, n) => items.filter((i) => i.group === g).slice(0, n);
    const parts = [
      ['page', pick('pages', 5)],
      ['project', pick('projects', 3)],
      ['article', pick('articles', 3)],
    ].filter(([, list]) => list.length);
    if (!parts.length) return message(dialog.dataset.hint);
    results.replaceChildren(
      ...parts.map(([kind, list]) =>
        group(
          kind,
          list.map((i) => row({ url: i.url, title: i.title, kind, hint: i.hint })),
        ),
      ),
    );
    say(dialog.dataset.hint);
  };

  let seq = 0;
  const render = async () => {
    const q = input.value.trim();
    const mine = ++seq;
    if (page) {
      const url = new URL(location.href);
      if (q) url.searchParams.set('q', q);
      else url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
    if (!q) return renderSuggestions();
    const pf = await loadEngine();
    if (mine !== seq) return;
    if (!pf) return message(dialog.dataset.error);
    const search = await pf.debouncedSearch(q, {}, 120);
    if (!search || mine !== seq) return;
    const found = await Promise.all(search.results.slice(0, MAX).map((r) => r.data()));
    if (mine !== seq) return;
    if (!found.length) return message(dialog.dataset.none);
    const byKind = new Map();
    for (const d of found) {
      const kind = d.filters?.type?.[0] ?? 'page';
      if (!byKind.has(kind)) byKind.set(kind, []);
      byKind
        .get(kind)
        .push(row({ url: d.url, title: d.meta?.title ?? d.url, kind, excerpt: d.excerpt }));
    }
    const order = [...byKind.keys()].sort(
      (a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99),
    );
    results.replaceChildren(...order.map((kind) => group(kind, byKind.get(kind))));
    say(dialog.dataset.count.replace('{n}', String(found.length)));
  };

  const open = () => {
    if (page) {
      input.focus();
      return;
    }
    if (!dialog.open) dialog.showModal();
    input.focus();
    input.select();
    render();
    loadEngine();
  };

  input.addEventListener('input', render);
  const links = () => [...results.querySelectorAll('a')];
  const onKey = (e) => {
    // Échap dans un champ de recherche vide d'abord le texte ; ici il ferme toujours la palette.
    if (e.key === 'Escape' && !page && dialog.open) {
      e.preventDefault();
      dialog.close();
      return;
    }
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
  };

  if (page) {
    page.addEventListener('keydown', onKey);
    input.value = new URL(location.href).searchParams.get('q') ?? '';
    render();
    loadEngine();
  }
  if (canModal) {
    openers.forEach((button) => {
      button.hidden = false;
      button.addEventListener('click', open);
    });
    dialog.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    if (!page) dialog.addEventListener('keydown', onKey);
  }

  // Navigation sans rechargement (ClientRouter, voir Base.astro) : script relancé à chaque page, raccourci global coupé avant
  // l'échange pour ne pas s'empiler.
  const scope = new AbortController();
  const { signal } = scope;
  document.addEventListener('astro:before-swap', () => scope.abort(), { once: true, signal });
  document.addEventListener(
    'keydown',
    (e) => {
      if (document.querySelector('[data-reference]') || page) return;
      const t = e.target;
      const typing =
        t instanceof HTMLElement && (t.matches('input, textarea, select') || t.isContentEditable);
      const ctrlK = (e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey;
      const slash = e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (!ctrlK && !slash) return;
      // Dans le terminal (page /terminal), Ctrl+K est repris par le terminal lui-même.
      if (ctrlK && t instanceof HTMLElement && t.closest('[data-terminal]')) return;
      e.preventDefault();
      open();
    },
    { signal },
  );
})();
