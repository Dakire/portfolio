import { useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { cx } from '../../lib/cx';
import { formatBytes } from '../../lib/download';

/**
 * Zone de dépôt de fichier. Le champ <input type="file"> natif reste le chemin accessible (clavier, lecteur d'écran, mobile) ;
 * le glisser-déposer n'est qu'un confort. Le fichier n'est jamais envoyé : `onFile` le lit dans le navigateur.
 */
export default function FileDrop({ id, label, hint, drop, choose, change, accept, file, error, onFile }) {
  const [over, setOver] = useState(false);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

  const take = (list) => {
    const first = list?.[0];
    if (first) onFile(first);
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={cx('flex flex-col items-center gap-3 rounded-card border-2 border-dashed px-5 py-7 text-center transition-colors duration-200', over ? 'border-brand bg-brand/10' : error ? 'border-danger bg-surface' : 'border-line-strong bg-surface')}
      >
        {file ? (
          <p className="flex min-w-0 max-w-full items-center gap-2 text-ink">
            <FileText className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <span className="truncate font-semibold">{file.name}</span>
            <span className="shrink-0 text-meta text-muted">{formatBytes(file.size)}</span>
          </p>
        ) : (
          <>
            <Upload className="h-6 w-6 text-brand" aria-hidden="true" />
            <p className="text-copy text-body">{drop}</p>
          </>
        )}
        <input id={id} type="file" accept={accept} aria-describedby={describedBy} className="peer sr-only" onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
        <label htmlFor={id} className="btn btn-secondary cursor-pointer peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-brand peer-focus-visible:outline-solid">
          {file ? change : choose}
        </label>
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-meta text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-meta font-medium text-danger">{error}</p>}
    </div>
  );
}
