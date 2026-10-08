import type { ButtonHTMLAttributes, ComponentChildren } from 'preact';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'icon' | 'loading' | 'disabled' | 'type'
> {
  variant?: Variant;
  /** Bouton carré réservé à une icône (donner un aria-label). */
  icon?: boolean;
  /** Affiche un indicateur et bloque les clics (aria-busy). */
  loading?: boolean;
  /** Bloque les clics en gardant le focus clavier (aria-disabled plutôt que l'attribut disabled). */
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children?: ComponentChildren;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: '',
  ghost: 'btn-ghost',
};

export default function Button({
  variant = 'secondary',
  icon = false,
  loading = false,
  disabled = false,
  class: className,
  children,
  onClick,
  type = 'button',
  ...rest
}: Props) {
  const blocked = loading || disabled;
  return (
    <button
      {...rest}
      type={type}
      class={cx('btn', VARIANTS[variant], icon && 'btn-icon', className as string | undefined)}
      aria-disabled={blocked || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (blocked) event.preventDefault();
        else onClick?.(event);
      }}
    >
      {loading && <span class="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
