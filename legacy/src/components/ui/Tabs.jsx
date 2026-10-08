import { useRef } from 'react';
import { cx } from '../../lib/cx';
import { panelId, tabId } from '../../lib/tabs';

/**
 * Onglets accessibles (motif ARIA « tabs ») : flèches gauche/droite, Début/Fin, un seul onglet dans l'ordre de tabulation.
 * Les panneaux de la page utilisent tabId / panelId (src/lib/tabs.js) pour leurs attributs id et aria-labelledby.
 */
export default function Tabs({ prefix, label, tabs, value, onChange }) {
  const refs = useRef({});

  const onKeyDown = (e) => {
    const index = tabs.findIndex((t) => t.id === value);
    let next = null;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line pb-px">
      {tabs.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            ref={(node) => { refs.current[t.id] = node; }}
            type="button"
            role="tab"
            id={tabId(prefix, t.id)}
            aria-selected={selected}
            aria-controls={panelId(prefix, t.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={onKeyDown}
            className={cx('min-h-11 shrink-0 rounded-t-lg border-b-2 px-4 text-sm font-semibold transition-colors duration-200', selected ? 'border-brand bg-brand/10 text-ink' : 'border-transparent text-body hover:bg-raised hover:text-ink')}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
