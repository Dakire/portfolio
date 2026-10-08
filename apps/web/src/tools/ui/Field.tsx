import type {
  AccessibleInputHTMLAttributes,
  ComponentChildren,
  TextareaHTMLAttributes,
} from 'preact';
import { cx } from './cx';

interface BaseProps {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  /** Compteur affiché à droite de l'erreur (ex. « 12 / 5000 »). */
  counter?: string | undefined;
  required?: boolean;
  class?: string;
}

type InputProps = BaseProps &
  Omit<AccessibleInputHTMLAttributes<HTMLInputElement>, 'id' | 'class' | 'size' | 'required'> & {
    as?: 'input';
  };
type TextareaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'class' | 'required'> & {
    as: 'textarea';
    rows?: number;
  };

/** Champ de formulaire : libellé, aide, erreur et compteur correctement reliés (aria-invalid, aria-describedby). */
export default function Field(props: InputProps | TextareaProps) {
  const {
    id,
    label,
    error,
    hint,
    counter,
    required = false,
    class: className,
    as: Control = 'input',
    ...rest
  } = props;
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`, counter && `${id}-counter`]
      .filter(Boolean)
      .join(' ') || undefined;
  const common = {
    id,
    name: id,
    required,
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': describedBy,
    class: className,
  };
  return (
    <div class="field">
      <label for={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {Control === 'textarea' ? (
        <textarea {...common} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input {...common} {...(rest as AccessibleInputHTMLAttributes<HTMLInputElement>)} />
      )}
      {hint && (
        <p id={`${id}-hint`} class="field-hint">
          {hint}
        </p>
      )}
      {(error || counter) && (
        <div class="field-foot">
          <p id={`${id}-error`} class="field-error">
            {error}
          </p>
          {counter && (
            <p id={`${id}-counter`} class="field-hint" aria-live="off">
              {counter}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ComponentChildren;
  class?: string;
}

/** Liste déroulante native, étiquetée. */
export function SelectField({
  id,
  label,
  value,
  onChange,
  children,
  class: className,
}: SelectProps) {
  return (
    <div class={cx('field', className)}>
      <label for={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {children}
      </select>
    </div>
  );
}
