import { cx } from '../../lib/cx';

/**
 * Champ de formulaire : libellé, indication d'obligation, message d'erreur et compteur, correctement reliés
 * (aria-invalid, aria-describedby). `as` vaut 'input' ou 'textarea'.
 */
export default function Field({ as: Control = 'input', id, label, required = false, error, counter, className, ...props }) {
  const errorId = `${id}-error`;
  const counterId = `${id}-counter`;
  const describedBy = [error && errorId, counter && counterId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-link"> *</span>}
      </label>
      <Control
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cx('field', className)}
        {...props}
      />
      {(error || counter) && (
        <div className="mt-1.5 flex items-start justify-between gap-3 text-meta">
          <p id={errorId} className="font-medium text-danger">{error}</p>
          {counter && <p id={counterId} className="ml-auto shrink-0 text-muted" aria-live="off">{counter}</p>}
        </div>
      )}
    </div>
  );
}
