import type { ComponentChildren } from 'preact';

interface RadioProps {
  name: string;
  value: string;
  current: string;
  onChange: (value: string) => void;
  children: ComponentChildren;
}

/** Choix exclusif présenté en pastille (groupe de boutons radio natifs). */
export function Radio({ name, value, current, onChange, children }: RadioProps) {
  return (
    <label class="pill-choice">
      <input
        type="radio"
        name={name}
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
      />
      <span>{children}</span>
    </label>
  );
}

/** Case à cocher étiquetée (cible de 44 px). */
export function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ComponentChildren;
}) {
  return (
    <label class="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span>{children}</span>
    </label>
  );
}
