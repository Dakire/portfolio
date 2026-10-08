import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Download, Eraser, FileJson } from 'lucide-react';
import { JSON_TOOL } from '../../data/tools/json';
import { downloadBlob } from '../../lib/download';
import { byteLength, parseJson, serialize } from '../../lib/json';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CopyButton from '../ui/CopyButton';
import Field from '../ui/Field';

const INDENTS = { 2: 2, 4: 4, tab: '\t', min: 0 };

function Radio({ name, value, current, onChange, children }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2 has-[:checked]:border-brand has-[:checked]:bg-brand/10">
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} className="h-4 w-4 accent-[var(--brand-strong)]" />
      <span className="font-medium text-ink">{children}</span>
    </label>
  );
}

/** Validation et mise en forme de JSON dans le navigateur : rien n'est envoyé. */
export default function JsonFormatter({ lang }) {
  const ui = JSON_TOOL[lang].ui;
  const f = ui.form;
  const [text, setText] = useState('');
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const areaRef = useRef(null);

  // Un document de plusieurs mégaoctets ne doit pas ralentir la frappe : l'analyse suit avec un léger retard
  const source = useDeferredValue(text);
  const parsed = useMemo(() => (source.trim() ? parseJson(source) : null), [source]);
  const output = useMemo(() => (parsed?.ok ? serialize(parsed.node, { indent: INDENTS[indent], sortKeys }) : ''), [parsed, indent, sortKeys]);

  const error = parsed && !parsed.ok ? parsed : null;
  const message = error ? [ui.errors[error.code] instanceof Function ? ui.errors[error.code](error.extra) : ui.errors[error.code], error.hint && ui.hints[error.hint]].filter(Boolean).join(' ') : undefined;

  const goToError = () => {
    const el = areaRef.current;
    if (!el || !error) return;
    const bom = source.charCodeAt(0) === 0xfeff ? 1 : 0; // la position est calculée sans le BOM
    const at = Math.min(error.position + bom, source.length);
    el.focus();
    el.setSelectionRange(at, Math.min(at + 1, source.length));
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.scrollTop = Math.max(0, (error.line - 1) * lineHeight - el.clientHeight / 2);
  };

  const stats = parsed?.ok ? parsed.stats : null;
  const duplicates = stats?.duplicates.length ? ui.stats.duplicates(stats.duplicates.slice(0, 5).join(', ') + (stats.duplicates.length > 5 ? '…' : '')) : null;

  return (
    <div className="space-y-6">
      <Card solid className="space-y-4 p-5 shadow-float sm:p-6">
        <Field
          as="textarea"
          ref={areaRef}
          id="json-input"
          label={f.input}
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={f.placeholder}
          className="mono resize-y"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          error={message}
        />

        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className="flex min-h-11 items-center gap-2 text-copy font-semibold">
            {!parsed && <span className="font-normal text-muted">{ui.status.empty}</span>}
            {stats && <><CircleCheck className="h-5 w-5 text-link" aria-hidden="true" /><span className="text-ink">{ui.status.valid}</span></>}
            {error && <><CircleAlert className="h-5 w-5 text-danger" aria-hidden="true" /><span className="text-danger">{ui.status.invalid} · {ui.status.position(error.line, error.column)}</span></>}
          </p>
          {error && error.code !== 'tooLarge' && <Button variant="secondary" onClick={goToError}>{f.goto}</Button>}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setText(f.sampleText)}><FileJson className="h-4 w-4" aria-hidden="true" /> {f.sample}</Button>
            {text && <Button variant="ghost" onClick={() => { setText(''); areaRef.current?.focus(); }}><Eraser className="h-4 w-4" aria-hidden="true" /> {f.clear}</Button>}
          </div>
        </div>
      </Card>

      <Card solid className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">{f.indent}</legend>
            {Object.keys(INDENTS).map((k) => <Radio key={k} name="json-indent" value={k} current={indent} onChange={setIndent}>{f.indents[k]}</Radio>)}
          </fieldset>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-copy text-body">
            <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} className="h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--brand-strong)]" />
            <span>{f.sortKeys}</span>
          </label>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="json-output" className="text-sm font-medium text-ink">{f.output}</label>
            <div className="flex items-center gap-1">
              {output && (
                <>
                  <Button variant="ghost" onClick={() => downloadBlob('document.json', output, 'application/json')}><Download className="h-4 w-4" aria-hidden="true" /> {f.download}</Button>
                  <CopyButton text={output} label={ui.common.copy} copiedLabel={ui.common.copied} />
                </>
              )}
            </div>
          </div>
          <textarea id="json-output" readOnly rows={12} value={output} className="field mono resize-y" />
        </div>

        {stats && (
          <>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-copy text-body">
              <li>{ui.stats.size} : <strong className="text-ink">{ui.stats.saved(byteLength(source).toLocaleString(lang), byteLength(output).toLocaleString(lang))}</strong></li>
              <li><strong className="text-ink">{stats.keys.toLocaleString(lang)}</strong> {ui.stats.keys}</li>
              <li><strong className="text-ink">{stats.items.toLocaleString(lang)}</strong> {ui.stats.items}</li>
              <li>{ui.stats.depth} : <strong className="text-ink">{stats.depth}</strong></li>
            </ul>
            {duplicates && <p className="text-copy font-medium text-warn">{duplicates}</p>}
          </>
        )}
        <p className="text-meta text-muted">{ui.privacy}</p>
      </Card>
    </div>
  );
}
