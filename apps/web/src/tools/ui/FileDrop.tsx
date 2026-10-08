import { FileText, Upload } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { cx } from './cx';
import { formatBytes } from './download';

interface Props {
  id: string;
  label: string;
  hint?: string;
  drop: string;
  choose: string;
  change: string;
  accept: string;
  file: { name: string; size: number } | null;
  error?: string | undefined;
  onFile: (file: File) => void;
}

/**
 * Zone de dépôt de fichier. Le champ <input type="file"> natif reste le chemin accessible (clavier, lecteur d'écran, mobile) ;
 * le glisser-déposer n'est qu'un confort. Le fichier n'est jamais envoyé : `onFile` le lit dans le navigateur.
 */
export default function FileDrop({
  id,
  label,
  hint,
  drop,
  choose,
  change,
  accept,
  file,
  error,
  onFile,
}: Props) {
  const [over, setOver] = useState(false);
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

  const take = (list: FileList | null | undefined) => {
    const first = list?.[0];
    if (first) onFile(first);
  };

  return (
    <div class="filedrop-wrap">
      <p class="filedrop-label">{label}</p>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        class={cx('filedrop', over && 'is-over', error && 'has-error')}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          take(event.dataTransfer?.files);
        }}
      >
        {file ? (
          <p class="filedrop-file">
            <FileText size={20} aria-hidden="true" />
            <span class="filedrop-name">{file.name}</span>
            <span class="meta">{formatBytes(file.size)}</span>
          </p>
        ) : (
          <>
            <Upload size={24} aria-hidden="true" />
            <p>{drop}</p>
          </>
        )}
        <input
          id={id}
          type="file"
          accept={accept}
          aria-describedby={describedBy}
          class="visually-hidden file-input"
          onChange={(event) => {
            take(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
        <label for={id} class="btn">
          {file ? change : choose}
        </label>
      </div>
      {hint && (
        <p id={`${id}-hint`} class="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" class="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
