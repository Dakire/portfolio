// Palette de commandes : Ctrl/Cmd + K (ou « / », ou le bouton de l'en-tête) ouvre une recherche de pages, d'articles et d'actions.
// <dialog> natif (focus piégé dans la fenêtre, Échap, retour du focus) + motif ARIA « combobox / listbox ».
// L'index (/search-index.json) n'est chargé qu'à la première ouverture. Sans JavaScript, le bouton reste masqué.
(() => {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';
  const MAX_RESULTS = 12;
  const GROUP_ORDER = ['actions', 'pages', 'tools', 'sections', 'articles'];

  let dialog;
  let input;
  let list;
  let status;
  let footer;
  let data = null;
  let loading = null;
  let results = [];
  let active = 0;

  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Pertinence d'un élément pour les mots saisis : tous les mots doivent correspondre (titre > mots-clés > description)
  function score(item, terms) {
    const title = norm(item.title);
    const words = title.split(/[^a-z0-9]+/);
    const keywords = norm(item.keywords ?? '');
    const hint = norm(item.hint ?? '');
    let total = 0;
    for (const term of terms) {
      let s = 0;
      if (title.startsWith(term)) s = 100;
      else if (words.some((w) => w.startsWith(term))) s = 80;
      else if (title.includes(term)) s = 60;
      else if (keywords.split(' ').some((w) => w.startsWith(term))) s = 45;
      else if (keywords.includes(term)) s = 35;
      else if (hint.includes(term)) s = 20;
      else if (subsequence(title, term)) s = 8;
      if (!s) return 0;
      total += s;
    }
    return total;
  }

  function subsequence(text, term) {
    let i = 0;
    for (const c of text) if (c === term[i]) i += 1;
    return term.length >= 3 && i === term.length;
  }

  function search(query) {
    const items = data?.items ?? [];
    const terms = norm(query).split(/\s+/).filter(Boolean);
    if (!terms.length) {
      // Sans saisie : actions et pages d'abord, puis les sections et quelques articles, dans l'ordre naturel
      const pick = (g, n) => items.filter((i) => i.group === g).slice(0, n);
      return [...pick('actions', 8), ...pick('pages', 4), ...pick('tools', 4), ...pick('sections', 6), ...pick('articles', 3)];
    }
    return items
      .map((item) => ({ item, s: score(item, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || GROUP_ORDER.indexOf(a.item.group) - GROUP_ORDER.indexOf(b.item.group))
      .slice(0, MAX_RESULTS)
      .map((r) => r.item);
  }

  const el = (tag, props = {}, children = []) => {
    const node = Object.assign(document.createElement(tag), props);
    for (const child of children) node.append(child);
    return node;
  };

  function build() {
    if (dialog) return;
    const ui = data?.ui ?? {};
    input = el('input', {
      type: 'text',
      className: 'palette-input',
      placeholder: ui.placeholder ?? '',
      autocomplete: 'off',
      spellcheck: false,
    });
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-controls', 'palette-list');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-label', ui.label ?? '');
    input.setAttribute('autocapitalize', 'none');
    input.setAttribute('enterkeyhint', 'go');

    const close = el('button', { type: 'button', className: 'palette-close btn btn-ghost btn-icon', textContent: '✕' });
    close.setAttribute('aria-label', ui.close ?? 'Close');
    close.addEventListener('click', () => dialog.close());

    list = el('ul', { id: 'palette-list', className: 'palette-list' });
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', ui.label ?? '');
    status = el('p', { className: 'sr-only' });
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    footer = el('p', { className: 'palette-footer' });

    dialog = el('dialog', { className: 'palette' }, [
      el('div', { className: 'palette-head' }, [el('span', { className: 'palette-icon', textContent: '⌕' }), input, close]),
      list,
      footer,
      status,
    ]);
    dialog.setAttribute('aria-label', ui.label ?? '');
    dialog.addEventListener('click', (e) => e.target === dialog && dialog.close()); // clic sur le fond
    dialog.addEventListener('close', () => document.querySelector('[data-palette-open]:not([hidden])')?.setAttribute('aria-expanded', 'false'));
    input.addEventListener('input', () => render(input.value));
    input.addEventListener('keydown', onKeydown);
    list.addEventListener('click', (e) => {
      const option = e.target.closest('[role="option"]');
      if (option) choose(Number(option.dataset.index));
    });
    list.addEventListener('pointermove', (e) => {
      const option = e.target.closest('[role="option"]');
      if (option && Number(option.dataset.index) !== active) setActive(Number(option.dataset.index));
    });
    document.body.append(dialog);
  }

  function render(query = '') {
    const ui = data?.ui ?? {};
    list.replaceChildren();
    if (!data) {
      list.append(el('li', { className: 'palette-note', textContent: loading ? (ui.loading ?? '…') : (ui.error ?? '') }));
      return;
    }
    results = search(query);
    active = 0;
    if (!results.length) {
      list.append(el('li', { className: 'palette-note', textContent: (ui.empty ?? '').replace('{q}', query.trim()) }));
      status.textContent = (ui.empty ?? '').replace('{q}', query.trim());
      input.removeAttribute('aria-activedescendant');
      return;
    }

    let group = null;
    results.forEach((item, i) => {
      if (!query.trim() && item.group !== group) {
        group = item.group;
        const heading = el('li', { className: 'palette-group', textContent: ui.groups?.[group] ?? group });
        heading.setAttribute('role', 'presentation');
        list.append(heading);
      }
      const option = el('li', { id: `palette-opt-${i}`, className: 'palette-option' }, [
        el('span', { className: 'palette-title', textContent: item.title }),
        el('span', { className: 'palette-hint', textContent: query.trim() ? (ui.groups?.[item.group] ?? '') : (item.hint ?? '') }),
      ]);
      option.setAttribute('role', 'option');
      option.dataset.index = String(i);
      list.append(option);
    });
    setActive(0);
    status.textContent = (ui.count ?? '').replace('{n}', String(results.length));
  }

  function setActive(index) {
    const options = list.querySelectorAll('[role="option"]');
    if (!options.length) return;
    active = (index + options.length) % options.length;
    options.forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', options[active].id);
    options[active].scrollIntoView({ block: 'nearest' });
  }

  function onKeydown(e) {
    const move = (to) => {
      e.preventDefault();
      setActive(to);
    };
    if (e.key === 'ArrowDown') move(active + 1);
    else if (e.key === 'ArrowUp') move(active - 1);
    else if (e.key === 'Home' && !input.value) move(0);
    else if (e.key === 'End' && !input.value) move(results.length - 1);
    else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active);
    }
  }

  function choose(index) {
    const item = results[index];
    if (!item) return;
    if (item.action === 'copy') {
      navigator.clipboard?.writeText(item.value).then(() => {
        status.textContent = data.ui.copied;
        footer.textContent = `✓ ${data.ui.copied}`;
      }, () => {});
      return;
    }
    dialog.close();
    if (item.action === 'theme') document.querySelector('[data-theme-toggle]')?.click();
    else if (item.action === 'lang') {
      const link = document.querySelector('a[data-lang-switch]');
      if (link) window.location.href = link.href;
    } else if (item.action === 'top') window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    else if (item.url && item.external) window.open(item.url, '_blank', 'noopener');
    else if (item.url) window.location.href = item.url;
  }

  async function load() {
    if (data || loading) return loading;
    loading = fetch('/search-index.json')
      .then((res) => res.json())
      .then((all) => {
        data = all[lang];
      })
      .catch(() => {
        data = null;
      })
      .finally(() => {
        loading = null;
      });
    return loading;
  }

  async function open() {
    if (dialog?.open) return;
    build();
    footer.textContent = '';
    input.value = '';
    dialog.showModal();
    document.querySelectorAll('[data-palette-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    render('');
    input.focus();
    await load();
    if (data) {
      input.placeholder = data.ui.placeholder;
      input.setAttribute('aria-label', data.ui.label);
      dialog.setAttribute('aria-label', data.ui.label);
      list.setAttribute('aria-label', data.ui.label);
      dialog.querySelector('.palette-close')?.setAttribute('aria-label', data.ui.close);
      const h = data.ui.hints;
      footer.textContent = `↑↓ ${h.navigate} · ↵ ${h.open} · Esc ${h.close}`;
    }
    render(input.value);
  }

  document.addEventListener('click', (e) => e.target.closest('[data-palette-open]') && open());
  document.addEventListener('keydown', (e) => {
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialog?.open) dialog.close();
      else open();
    } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !dialog?.open) {
      e.preventDefault();
      open();
    }
  });
})();
