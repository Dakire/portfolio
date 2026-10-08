// Filtre en direct du tableau qui suit un champ <input data-filter-table> (sans accent ni casse, tous les mots doivent correspondre).
(() => {
  const en = document.documentElement.lang === 'en';
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  document.querySelectorAll('input[data-filter-table]').forEach((input) => {
    // Le tableau peut être enveloppé dans un conteneur défilant (.table-scroll).
    let holder = input.nextElementSibling;
    while (holder && holder.tagName !== 'TABLE' && !holder.querySelector('table')) holder = holder.nextElementSibling;
    const table = holder && (holder.tagName === 'TABLE' ? holder : holder.querySelector('table'));
    if (!table) return;

    const rows = [...table.querySelectorAll('tbody tr')].map((tr) => ({ tr, text: norm(tr.textContent) }));
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.hidden = true;
    holder.after(status);
    input.hidden = false;

    input.addEventListener('input', () => {
      const terms = norm(input.value).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const { tr, text } of rows) {
        const match = terms.every((t) => text.includes(t));
        tr.hidden = !match;
        if (match) shown += 1;
      }
      status.hidden = terms.length === 0;
      status.textContent = shown === 0
        ? (en ? 'No results: try the brand alone (e.g. "dell") or the series.' : 'Aucun résultat : essayez la marque seule (ex. « dell ») ou la série.')
        : (en ? `${shown} result(s)` : `${shown} résultat(s)`);
    });
  });
})();
