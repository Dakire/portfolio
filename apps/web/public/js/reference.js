// Recherche des pages « Référence » : 100 % navigateur (MiniSearch + index JSON statique chargé à la demande).
// Un seul composant pour toutes les pages : <section data-reference data-index="/data/reference/xxx.json"> (ou "all").
(() => {
  const root = document.querySelector('[data-reference]');
  if (!root || typeof MiniSearch === 'undefined') return;

  const en = document.documentElement.lang === 'en';
  const T = en
    ? {
        idle: 'Type to search, or pick a category.',
        loading: 'Loading the index…',
        error: 'The index could not be loaded. Reload the page or use the official documentation.',
        results: (n, q) => `${n} result${n > 1 ? 's' : ''}${q ? ` for “${q}”` : ''}`,
        none: (q) => `No results for “${q}”`,
        noneHelp: 'Try fewer words, check the spelling, or pick another category.',
        didYouMean: 'Did you mean:',
        official: 'Official documentation',
        allRefs: 'Search all references',
        copy: 'Copy',
        copied: 'Copied',
        copyOf: (n) => `Copy the example: ${n}`,
        more: 'Show more',
        moreEx: (n) => `${n} more example${n > 1 ? 's' : ''}`,
        newWin: '(opens in a new window)',
        example: 'Example',
        all: 'All',
        copyFail: 'Copy failed: select the text manually.',
        risk: { read: 'Read-only', modify: 'Changes the system', admin: 'Requires admin' },
      }
    : {
        idle: 'Tapez pour chercher, ou choisissez une catégorie.',
        loading: "Chargement de l'index…",
        error:
          "L'index n'a pas pu être chargé. Rechargez la page ou utilisez la documentation officielle.",
        results: (n, q) => `${n} résultat${n > 1 ? 's' : ''}${q ? ` pour « ${q} »` : ''}`,
        none: (q) => `Aucun résultat pour « ${q} »`,
        noneHelp: "Essayez moins de mots, vérifiez l'orthographe ou changez de catégorie.",
        didYouMean: 'Vouliez-vous dire :',
        official: 'Documentation officielle',
        allRefs: 'Chercher dans toutes les références',
        copy: 'Copier',
        copied: 'Copié',
        copyOf: (n) => `Copier l'exemple : ${n}`,
        more: 'Afficher plus',
        moreEx: (n) => `${n} autre${n > 1 ? 's' : ''} exemple${n > 1 ? 's' : ''}`,
        newWin: '(nouvelle fenêtre)',
        example: 'Exemple',
        all: 'Toutes',
        copyFail: 'Copie impossible : sélectionnez le texte à la main.',
        risk: { read: 'Lecture seule', modify: 'Modifie le système', admin: 'Nécessite admin' },
      };

  const PAGE = 30;
  const input = root.querySelector('[data-ref-input]');
  const status = root.querySelector('[data-ref-status]');
  const list = root.querySelector('[data-ref-results]');
  const toast = root.querySelector('[data-ref-toast]');
  const catBox = root.querySelector('[data-ref-cats]');
  const hubUrl = root.dataset.hub || '';
  const multi = root.dataset.index === 'all';

  const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const words = (s) =>
    fold(s)
      .split(/[\s\p{P}]+/u)
      .filter(Boolean);

  // ---- État -----------------------------------------------------------------------------------
  let docs = []; // entrées enrichies : { ...entrée, _ref: meta, _i }
  let engine = null;
  let loading = null;
  let cat = '';
  let shown = 0;
  let current = []; // résultats courants : [{ doc, terms }]
  let query = '';
  let timer = 0;

  // ---- Chargement paresseux de l'index --------------------------------------------------------
  const fetchJson = (url) =>
    fetch(url).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });

  function ensureIndex() {
    if (loading) return loading;
    status.textContent = T.loading;
    const files = multi
      ? fetchJson(root.dataset.catalog).then((c) => c.refs.map((r) => r.file))
      : Promise.resolve([root.dataset.index]);
    loading = files
      .then((urls) => Promise.all(urls.map(fetchJson)))
      .then((datas) => {
        for (const data of datas)
          for (const e of data.entries) docs.push({ ...e, _ref: data.meta, _i: docs.length });
        engine = new MiniSearch({
          fields: ['name', 'alias', 'syn', 'desc', 'ex', 'tags', 'extra'],
          idField: '_i',
          processTerm: (t) => fold(t),
          searchOptions: {
            boost: { name: 10, alias: 6, syn: 4, desc: 3, ex: 2, tags: 1, extra: 1 },
            prefix: true,
            fuzzy: (t) => (t.length < 4 ? false : 0.2),
            combineWith: 'AND',
          },
        });
        engine.addAll(
          docs.map((d) => ({
            _i: d._i,
            name: d.name,
            alias: (d.alias ?? []).join(' '),
            syn: d.syn ?? '',
            desc: d.desc ?? '',
            ex: (d.ex ?? []).join('\n'),
            tags: (d.tags ?? []).join(' '),
            extra: [d.module, d.perms, d.pitfall, d.equiv, d.cat, d._ref.title]
              .filter(Boolean)
              .join(' '),
          })),
        );
      })
      .catch(() => {
        loading = null;
        status.textContent = T.error;
        throw new Error('index');
      });
    return loading;
  }

  // ---- Recherche ------------------------------------------------------------------------------
  function run(q) {
    const terms = words(q);
    const fq = fold(q.trim());
    let found;
    if (!terms.length) found = docs.map((doc) => ({ doc, terms: [] }));
    else {
      found = engine.search(q).map((r) => {
        const doc = docs[r.id];
        const name = fold(doc.name);
        let score = r.score;
        if (name === fq) score += 1000;
        else if (name.startsWith(fq)) score += 200;
        else if (name.includes(fq)) score += 100;
        score -= name.length * 0.01;
        return { doc, terms: Object.keys(r.match), score };
      });
      found.sort((a, b) => b.score - a.score);
    }
    const key = multi ? (d) => d._ref.id : (d) => d.cat;
    return found.filter(({ doc }) => !cat || key(doc) === cat);
  }

  function suggestions(q) {
    try {
      const hits = engine.search(q, { combineWith: 'OR', fuzzy: 0.4, prefix: true });
      return [...new Set(hits.slice(0, 40).map((h) => docs[h.id].name))].slice(0, 3);
    } catch {
      return [];
    }
  }

  // ---- Rendu ----------------------------------------------------------------------------------
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /** Écrit `text` dans `node` en entourant de <mark> les mots qui correspondent (sans accent ni casse). */
  function highlight(node, text, terms) {
    const f = fold(text);
    if (!terms.length || f.length !== text.length) {
      node.textContent = text;
      return node;
    }
    const ranges = [];
    for (const t of terms) {
      let from = 0;
      for (let at = f.indexOf(t, from); at !== -1; at = f.indexOf(t, from)) {
        from = at + t.length;
        if (at > 0 && /[\p{L}\p{N}]/u.test(f[at - 1])) continue; // début de mot seulement
        ranges.push([at, from]);
      }
    }
    if (!ranges.length) {
      node.textContent = text;
      return node;
    }
    ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    const merged = [];
    for (const r of ranges) {
      const last = merged.at(-1);
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([...r]);
    }
    let pos = 0;
    for (const [a, b] of merged) {
      if (a > pos) node.append(text.slice(pos, a));
      node.append(el('mark', '', text.slice(a, b)));
      pos = b;
    }
    if (pos < text.length) node.append(text.slice(pos));
    return node;
  }

  function link(url, label) {
    const a = el('a', 'ref-doc-link');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.append(label, el('span', 'visually-hidden', ` ${T.newWin}`), el('span', '', ' ↗'));
    a.lastChild.setAttribute('aria-hidden', 'true');
    return a;
  }

  function example(doc, code, label) {
    const box = el('div', 'ref-example');
    const pre = el('pre');
    pre.append(el('code', '', code));
    const btn = el('button', 'btn ref-copy', T.copy);
    btn.type = 'button';
    btn.dataset.copy = '';
    btn.setAttribute('aria-label', T.copyOf(label ?? doc.name));
    box.append(pre, btn);
    return box;
  }

  function item(doc, terms, n) {
    const li = el('li', 'ref-item');
    const art = el('article');
    art.tabIndex = -1;
    art.dataset.url = doc.url;
    const hid = `ref-r-${n}`;
    art.setAttribute('aria-labelledby', hid);

    const head = el('header', 'ref-item-head');
    const h = el('h3');
    h.id = hid;
    h.append(highlight(el('code', 'ref-name'), doc.name, terms));
    head.append(h);
    const catLabel = doc._ref.cats.find((c) => c.id === doc.cat)?.label;
    if (multi) head.append(el('span', 'ref-badge ref-badge-ref', doc._ref.h1));
    if (catLabel) head.append(el('span', 'ref-badge', catLabel));
    if (doc.risk) head.append(el('span', `ref-badge ref-risk-${doc.risk}`, T.risk[doc.risk]));
    art.append(head);

    if (doc.syn && doc.syn !== doc.name) art.append(highlight(el('p', 'ref-syn'), doc.syn, terms));
    if (doc.desc) art.append(highlight(el('p', 'ref-desc'), doc.desc, terms));

    const exs = doc.ex ?? [];
    if (exs.length) {
      art.append(example(doc, exs[0]));
      if (exs.length > 1) {
        const d = el('details', 'ref-more');
        d.append(el('summary', '', T.moreEx(exs.length - 1)));
        for (const x of exs.slice(1)) d.append(example(doc, x));
        art.append(d);
      }
    }

    const dl = el('dl', 'ref-meta');
    for (const f of doc._ref.fields) {
      if (!doc[f.key] || f.key === 'risk') continue;
      const row = el('div');
      row.append(el('dt', '', f.label), highlight(el('dd'), doc[f.key], terms));
      dl.append(row);
    }
    if (dl.children.length) art.append(dl);
    if (doc.tags?.length) art.append(el('p', 'ref-tags', doc.tags.map((t) => `#${t}`).join(' ')));

    const foot = el('p', 'ref-links');
    foot.append(link(doc.url, T.official));
    art.append(foot);
    li.append(art);
    return li;
  }

  function renderMore(focusFirst) {
    const from = shown;
    const slice = current.slice(from, from + PAGE);
    list.querySelector('[data-ref-more]')?.remove();
    const nodes = slice.map((r, i) =>
      item(r.doc, [...new Set([...words(query), ...r.terms])], from + i),
    );
    list.append(...nodes);
    shown += slice.length;
    if (shown < current.length) {
      const li = el('li', 'ref-more-row');
      li.dataset.refMore = '';
      const b = el('button', 'btn', `${T.more} (${current.length - shown})`);
      b.type = 'button';
      b.addEventListener('click', () => renderMore(true));
      li.append(b);
      list.append(li);
    }
    if (focusFirst && nodes[0]) nodes[0].querySelector('article').focus();
  }

  function render() {
    list.replaceChildren();
    shown = 0;
    current = run(query);
    const q = query.trim();
    if (!current.length) {
      status.textContent = T.none(q);
      const box = el('li', 'ref-empty');
      box.append(el('p', 'ref-empty-title', T.none(q)), el('p', '', T.noneHelp));
      const sugg = q ? suggestions(q) : [];
      if (sugg.length) {
        const p = el('p', '', `${T.didYouMean} `);
        sugg.forEach((s, i) => {
          if (i) p.append(' · ');
          const b = el('button', 'ref-suggest', s);
          b.type = 'button';
          b.addEventListener('click', () => {
            input.value = s;
            update(true);
            input.focus();
          });
          p.append(b);
        });
        box.append(p);
      }
      const p2 = el('p', 'ref-empty-links');
      if (!multi && root.dataset.docsUrl)
        p2.append(link(root.dataset.docsUrl, root.dataset.docsLabel || T.official));
      if (!multi && hubUrl && q) {
        const a = el('a', '', T.allRefs);
        a.href = `${hubUrl}?q=${encodeURIComponent(q)}`;
        p2.append(p2.childNodes.length ? ' · ' : '', a);
      }
      box.append(p2);
      list.append(box);
      return;
    }
    status.textContent = q || cat ? T.results(current.length, q) : T.results(current.length, '');
    renderMore(false);
  }

  // ---- Interactions ---------------------------------------------------------------------------
  function syncUrl() {
    const p = new URLSearchParams(location.search);
    query.trim() ? p.set('q', query.trim()) : p.delete('q');
    cat ? p.set('cat', cat) : p.delete('cat');
    const s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? `?${s}` : '') + location.hash);
  }

  function update(now) {
    query = input.value;
    clearTimeout(timer);
    const go = () => {
      ensureIndex()
        .then(() => {
          render();
          syncUrl();
        })
        .catch(() => {});
    };
    now ? go() : (timer = setTimeout(go, 100));
  }

  function setCat(id) {
    cat = id;
    for (const b of catBox?.querySelectorAll('button') ?? [])
      b.setAttribute('aria-pressed', String(b.dataset.cat === id));
  }

  input.addEventListener('focus', () => ensureIndex().catch(() => {}), { once: true });
  input.addEventListener('input', () => update(false));
  catBox?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cat]');
    if (!b) return;
    setCat(b.dataset.cat);
    update(true);
  });
  root.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    list.querySelector('article')?.focus();
  });

  const articles = () => [...list.querySelectorAll('article')];
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const typing =
      t instanceof HTMLElement && (t.matches('input, textarea, select') || t.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey) {
      e.preventDefault();
      input.focus();
      input.select();
      return;
    }
    if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      input.focus();
      input.select();
      return;
    }
    if (t === input) {
      if (e.key === 'Escape' && input.value) {
        e.preventDefault();
        input.value = '';
        update(true);
      } else if (e.key === 'ArrowDown') {
        const first = articles()[0];
        if (first) {
          e.preventDefault();
          first.focus();
        }
      }
      return;
    }
    if (t instanceof HTMLElement && t.matches('article') && list.contains(t)) {
      const all = articles();
      const i = all.indexOf(t);
      if (e.key === 'ArrowDown' && all[i + 1]) {
        e.preventDefault();
        all[i + 1].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        (all[i - 1] ?? input).focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        window.open(t.dataset.url, '_blank', 'noopener,noreferrer');
      } else if (e.key === 'Escape') {
        input.focus();
      }
    }
  });

  // Boutons « Copier » (résultats et blocs statiques de la page).
  let toastTimer = 0;
  document.addEventListener('click', async (e) => {
    const btn = e.target instanceof Element && e.target.closest('button[data-copy]');
    if (!btn) return;
    const code = btn.closest('.ref-example')?.querySelector('code')?.textContent ?? '';
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.setAttribute('readonly', '');
      ta.className = 'visually-hidden';
      document.body.append(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
      btn.focus();
    }
    if (toast) toast.textContent = ok ? T.copied : T.copyFail;
    if (ok) {
      const old = btn.textContent;
      btn.textContent = T.copied;
      setTimeout(() => (btn.textContent = old), 1800);
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast && (toast.textContent = ''), 2500);
  });

  // ---- Démarrage : état de l'URL ---------------------------------------------------------------
  const params = new URLSearchParams(location.search);
  const q0 = params.get('q') ?? '';
  const c0 = params.get('cat') ?? '';
  if (c0 && catBox?.querySelector(`button[data-cat="${CSS.escape(c0)}"]`)) setCat(c0);
  if (q0) input.value = q0;
  if (q0 || cat) update(true);
  else status.textContent = T.idle;
})();
