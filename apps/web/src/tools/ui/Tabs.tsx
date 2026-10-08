import { useRef } from 'preact/hooks';
import { panelId, tabId } from './cx';

interface Tab {
  id: string;
  label: string;
}

interface Props {
  prefix: string;
  label: string;
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
}

/**
 * Onglets accessibles (motif ARIA « tabs ») : flèches gauche/droite, Début/Fin, un seul onglet dans l'ordre de tabulation.
 * Les panneaux de la page utilisent tabId / panelId (cx.ts) pour leurs attributs id et aria-labelledby.
 */
export default function Tabs({ prefix, label, tabs, value, onChange }: Props) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (event: KeyboardEvent) => {
    const index = tabs.findIndex((t) => t.id === value);
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    const target = next === null ? undefined : tabs[next];
    if (!target) return;
    event.preventDefault();
    onChange(target.id);
    refs.current[target.id]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} class="tabs">
      {tabs.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            ref={(node) => {
              refs.current[t.id] = node;
            }}
            type="button"
            role="tab"
            id={tabId(prefix, t.id)}
            aria-selected={selected}
            aria-controls={panelId(prefix, t.id)}
            tabIndex={selected ? 0 : -1}
            class="tab"
            onClick={() => onChange(t.id)}
            onKeyDown={onKeyDown}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
