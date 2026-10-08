import { byteLength, parseJson, serialize, type JsonParseResult } from '@grichard/tools-core/json';
import { CircleAlert, CircleCheck, Download, Eraser, FileJson } from 'lucide-preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import Button from '../ui/Button';
import { Radio } from '../ui/Choice';
import CopyButton from '../ui/CopyButton';
import Field from '../ui/Field';
import { downloadBlob } from '../ui/download';
import { useDebounced } from '../ui/hooks';
import { JSON_TOOL } from './text';

const INDENTS = { '2': 2, '4': 4, tab: '\t', min: 0 } as const;
type IndentKey = keyof typeof INDENTS;

type Failure = Extract<JsonParseResult, { ok: false }>;

/** Validation et mise en forme de JSON dans le navigateur : rien n'est envoyé. */
export default function JsonFormatter({ lang }: { lang: Lang }) {
  const ui = JSON_TOOL[lang].ui;
  const f = ui.form;
  const [text, setText] = useState('');
  const [indent, setIndent] = useState<IndentKey>('2');
  const [sortKeys, setSortKeys] = useState(false);
  const areaRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Un document de plusieurs mégaoctets ne doit pas ralentir la frappe : l'analyse suit avec un léger retard
  const source = useDebounced(text);
  const parsed = useMemo(() => (source.trim() ? parseJson(source) : null), [source]);
  const output = useMemo(
    () => (parsed?.ok ? serialize(parsed.node, { indent: INDENTS[indent], sortKeys }) : ''),
    [parsed, indent, sortKeys],
  );

  const error: Failure | null = parsed && !parsed.ok ? parsed : null;
  const errors: Record<string, string | ((value: string) => string)> = ui.errors;
  const hints: Record<string, string> = ui.hints;
  const entry = error ? errors[error.code] : undefined;
  const message = error
    ? [
        typeof entry === 'function' ? entry(error.extra ?? '') : entry,
        error.hint && hints[error.hint],
      ]
        .filter(Boolean)
        .join(' ')
    : undefined;

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
  const duplicates = stats?.duplicates.length
    ? ui.stats.duplicates(
        stats.duplicates.slice(0, 5).join(', ') + (stats.duplicates.length > 5 ? '…' : ''),
      )
    : null;

  return (
    <div class="stack">
      <div class="tool">
        <Field
          as="textarea"
          fieldRef={areaRef}
          id="json-input"
          label={f.input}
          rows={12}
          value={text}
          onInput={(e) => setText(e.currentTarget.value)}
          placeholder={f.placeholder}
          class="mono"
          autoComplete="off"
          autoCapitalize="none"
          spellcheck={false}
          error={message}
        />

        <div class="row-actions">
          <p role="status" class="status-line">
            {!parsed && <span class="note">{ui.status.empty}</span>}
            {stats && (
              <>
                <CircleCheck size={20} class="tone-ok" aria-hidden="true" />
                <span>{ui.status.valid}</span>
              </>
            )}
            {error && (
              <>
                <CircleAlert size={20} class="tone-danger" aria-hidden="true" />
                <span class="tone-danger">
                  {ui.status.invalid} · {ui.status.position(error.line, error.column)}
                </span>
              </>
            )}
          </p>
          {error && error.code !== 'tooLarge' && <Button onClick={goToError}>{f.goto}</Button>}
          <div class="row-actions row-end">
            <Button variant="ghost" onClick={() => setText(f.sampleText)}>
              <FileJson size={18} aria-hidden="true" /> {f.sample}
            </Button>
            {text && (
              <Button
                variant="ghost"
                onClick={() => {
                  setText('');
                  areaRef.current?.focus();
                }}
              >
                <Eraser size={18} aria-hidden="true" /> {f.clear}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div class="tool">
        <div class="row-actions">
          <fieldset class="choice-group">
            <legend class="visually-hidden">{f.indent}</legend>
            {(Object.keys(INDENTS) as IndentKey[]).map((k) => (
              <Radio
                key={k}
                name="json-indent"
                value={k}
                current={indent}
                onChange={(v) => setIndent(v as IndentKey)}
              >
                {f.indents[k]}
              </Radio>
            ))}
          </fieldset>
          <label class="check">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.currentTarget.checked)}
            />
            <span>{f.sortKeys}</span>
          </label>
        </div>

        <div class="field">
          <div class="field-head">
            <label for="json-output">{f.output}</label>
            <div class="row-actions">
              {output && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => downloadBlob('document.json', output, 'application/json')}
                  >
                    <Download size={18} aria-hidden="true" /> {f.download}
                  </Button>
                  <CopyButton text={output} label={ui.common.copy} copiedLabel={ui.common.copied} />
                </>
              )}
            </div>
          </div>
          <textarea id="json-output" readOnly rows={12} value={output} class="mono" />
        </div>

        {stats && (
          <>
            <ul class="stat-list" role="list">
              <li>
                {ui.stats.size} :{' '}
                <strong>
                  {ui.stats.saved(
                    byteLength(source).toLocaleString(lang),
                    byteLength(output).toLocaleString(lang),
                  )}
                </strong>
              </li>
              <li>
                <strong>{stats.keys.toLocaleString(lang)}</strong> {ui.stats.keys}
              </li>
              <li>
                <strong>{stats.items.toLocaleString(lang)}</strong> {ui.stats.items}
              </li>
              <li>
                {ui.stats.depth} : <strong>{stats.depth}</strong>
              </li>
            </ul>
            {duplicates && <p class="tone-warn">{duplicates}</p>}
          </>
        )}
        <p class="note">{ui.privacy}</p>
      </div>
    </div>
  );
}
