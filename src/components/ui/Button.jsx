import { cx } from '../../lib/cx';

const VARIANTS = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost' };

/**
 * Bouton ou lien d'action (un lien si `href` est fourni). Les styles, tailles et états vivent dans index.css (.btn).
 * - loading : affiche un spinner et bloque les clics (aria-busy) ;
 * - disabled : bloque les clics tout en gardant le focus clavier (aria-disabled plutôt que l'attribut disabled).
 */
export default function Button({ variant = 'primary', size, icon = false, loading = false, disabled = false, className, children, onClick, ...props }) {
  const Tag = props.href ? 'a' : 'button';
  const blocked = loading || disabled;
  if (Tag === 'button') props.type ??= 'button';

  return (
    <Tag
      {...props}
      className={cx('btn', VARIANTS[variant], size === 'lg' && 'btn-lg', icon && 'btn-icon', className)}
      aria-disabled={blocked || undefined}
      aria-busy={loading || undefined}
      onClick={(e) => (blocked ? e.preventDefault() : onClick?.(e))}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </Tag>
  );
}
