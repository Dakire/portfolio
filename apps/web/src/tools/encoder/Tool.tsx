import {
  ALGORITHMS,
  hashHex,
  sameHash,
  type HashAlgorithm,
} from '@grichard/tools-core/encode/hash';
import { decodeJwt } from '@grichard/tools-core/encode/jwt';
import {
  bytesToHex,
  bytesToText,
  decodeBase64,
  decodeUrl,
  encodeBase64,
  encodeUrlComponent,
  encodeUrlFull,
  escapeHtml,
  hexToBytes,
  parseUrl,
  textToHex,
  toBytes,
  unescapeHtml,
} from '@grichard/tools-core/encode/text';
import {
  describeInstant,
  inspectUuid,
  parseTimestamp,
  uuidV4,
  uuidV7,
} from '@grichard/tools-core/encode/time';
import { ArrowDownUp, Eraser } from 'lucide-preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import Button from '../ui/Button';
import { Check, Radio } from '../ui/Choice';
import CopyButton from '../ui/CopyButton';
import { panelId, tabId } from '../ui/cx';
import Field, { SelectField } from '../ui/Field';
import FileDrop from '../ui/FileDrop';
import Rows from '../ui/Rows';
import ScrollRegion from '../ui/ScrollRegion';
import Tabs from '../ui/Tabs';
import { ENCODER } from './text';

type Ui = (typeof ENCODER)['fr']['ui'];

const PREFIX = 'enc';
const TAB_IDS = ['base64', 'url', 'hex', 'html', 'jwt', 'hash', 'time', 'uuid'] as const;
type TabId = (typeof TAB_IDS)[number];
type TextKind = 'base64' | 'url' | 'hex' | 'html';

interface OutputProps {
  value: string;
  ui: Ui;
  id: string;
  onUse?: () => void;
  error?: string | undefined;
}

function Output({ value, ui, id, onUse, error }: OutputProps) {
  const c = ui.common;
  return (
    <div class="field">
      <div class="field-head">
        <label for={id}>{c.output}</label>
        <div class="row-actions">
          {onUse && value && (
            <Button variant="ghost" onClick={onUse}>
              <ArrowDownUp size={18} aria-hidden="true" /> {c.swap}
            </Button>
          )}
          <CopyButton text={value} label={c.copy} copiedLabel={c.copied} />
        </div>
      </div>
      <textarea
        id={id}
        readOnly
        rows={5}
        value={value}
        aria-invalid={error ? 'true' : undefined}
        class="mono"
      />
      {error && (
        <p role="alert" class="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function Mode({
  name,
  value,
  onChange,
  legend,
  labels,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  legend: string;
  labels: [string, string][];
}) {
  return (
    <fieldset class="choice-group">
      <legend class="visually-hidden">{legend}</legend>
      {labels.map(([v, label]) => (
        <Radio key={v} name={name} value={v} current={value} onChange={onChange}>
          {label}
        </Radio>
      ))}
    </fieldset>
  );
}

// --- Onglets texte : Base64, URL, hexadécimal, HTML ---

interface TextResult {
  value: string;
  error?: string;
  note?: string;
}

function TextTool({ kind, ui }: { kind: TextKind; ui: Ui }) {
  const c = ui.common;
  const [text, setText] = useState('');
  const [direction, setDirection] = useState('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [padding, setPadding] = useState(true);
  const [urlMode, setUrlMode] = useState('component');
  const [plus, setPlus] = useState(false);
  const [separator, setSeparator] = useState(' ');

  const result = useMemo((): TextResult => {
    if (!text) return { value: '' };
    const enc = direction === 'encode';
    if (kind === 'base64') {
      if (enc) return { value: encodeBase64(text, { urlSafe, padding }) };
      const d = decodeBase64(text);
      if (!d.ok) return { value: '', error: c.invalid };
      return d.text === null
        ? { value: bytesToHex(d.bytes, ' '), note: ui.base64.binary }
        : { value: d.text, note: d.urlSafe ? ui.base64.detected : '' };
    }
    if (kind === 'url') {
      if (enc)
        return { value: urlMode === 'component' ? encodeUrlComponent(text) : encodeUrlFull(text) };
      const d = decodeUrl(text, { plusAsSpace: plus });
      return d.ok ? { value: d.text } : { value: '', error: c.invalid };
    }
    if (kind === 'hex') {
      if (enc) return { value: textToHex(text, separator) };
      const bytes = hexToBytes(text);
      const decoded = bytes ? bytesToText(bytes) : null;
      return decoded === null ? { value: '', error: c.invalid } : { value: decoded };
    }
    return { value: enc ? escapeHtml(text) : unescapeHtml(text) };
  }, [kind, text, direction, urlSafe, padding, urlMode, plus, separator, c.invalid, ui.base64]);

  const url = useMemo(
    () => (kind === 'url' && direction === 'decode' && text ? parseUrl(text) : null),
    [kind, direction, text],
  );
  const labels: [string, string][] =
    kind === 'html'
      ? [
          ['encode', ui.html.escape],
          ['decode', ui.html.unescape],
        ]
      : [
          ['encode', c.encode],
          ['decode', c.decode],
        ];
  const id = `${PREFIX}-${kind}`;

  return (
    <div class="stack">
      <Mode
        name={`${id}-dir`}
        value={direction}
        onChange={setDirection}
        legend={c.output}
        labels={labels}
      />
      <Field
        as="textarea"
        id={`${id}-in`}
        label={c.input}
        rows={5}
        value={text}
        onInput={(e) => setText(e.currentTarget.value)}
        spellcheck={false}
        autoComplete="off"
        hint={kind === 'hex' && direction === 'decode' ? ui.hex.hint : undefined}
      />

      <div class="row-actions">
        {kind === 'base64' && direction === 'encode' && (
          <>
            <Check checked={urlSafe} onChange={setUrlSafe}>
              {ui.base64.urlSafe}
            </Check>
            <Check checked={padding} onChange={setPadding}>
              {ui.base64.padding}
            </Check>
          </>
        )}
        {kind === 'url' && direction === 'encode' && (
          <>
            <Radio name={`${id}-mode`} value="component" current={urlMode} onChange={setUrlMode}>
              {ui.url.component}
            </Radio>
            <Radio name={`${id}-mode`} value="full" current={urlMode} onChange={setUrlMode}>
              {ui.url.full}
            </Radio>
          </>
        )}
        {kind === 'url' && direction === 'decode' && (
          <Check checked={plus} onChange={setPlus}>
            {ui.url.plus}
          </Check>
        )}
        {kind === 'hex' && direction === 'encode' && (
          <fieldset class="choice-group">
            <legend class="visually-hidden">{ui.hex.separator}</legend>
            <span class="note">{ui.hex.separator}</span>
            {(
              [
                ['', ui.hex.none],
                [' ', ui.hex.space],
                [':', ui.hex.colon],
              ] as [string, string][]
            ).map(([v, label]) => (
              <Radio
                key={label}
                name={`${id}-sep`}
                value={v}
                current={separator}
                onChange={setSeparator}
              >
                {label}
              </Radio>
            ))}
          </fieldset>
        )}
        {text && (
          <Button variant="ghost" onClick={() => setText('')}>
            <Eraser size={18} aria-hidden="true" /> {c.clear}
          </Button>
        )}
      </div>

      <Output
        id={`${id}-out`}
        value={result.value}
        ui={ui}
        error={result.error}
        onUse={() => {
          setText(result.value);
          setDirection(direction === 'encode' ? 'decode' : 'encode');
        }}
      />
      {result.note && <p class="note">{result.note}</p>}

      {url?.ok && (
        <div class="stack">
          <h3>{ui.url.parts}</h3>
          <Rows
            rows={[
              [ui.url.fields.protocol, url.protocol],
              [ui.url.fields.username, url.username],
              [ui.url.fields.password, url.password],
              [ui.url.fields.host, url.host],
              [ui.url.fields.port, url.port],
              [ui.url.fields.path, url.path],
              [ui.url.fields.hash, url.hash],
              ...url.params.map(([k, v]): [string, string] => [
                `${ui.url.fields.params} · ${k}`,
                v,
              ]),
            ]}
          />
        </div>
      )}
    </div>
  );
}

// --- JWT ---

function JwtTool({ ui, lang }: { ui: Ui; lang: Lang }) {
  const j = ui.jwt;
  const [token, setToken] = useState('');
  const result = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const statusTone = {
    expired: 'tone-danger',
    notYetValid: 'tone-warn',
    valid: 'tone-ok',
    noExpiry: 'note',
  } as const;
  const errors: Record<string, string> = j.errors;
  const labels: Record<string, string> = j.labels;

  return (
    <div class="stack">
      <Field
        as="textarea"
        id={`${PREFIX}-jwt-in`}
        label={j.input}
        rows={5}
        value={token}
        onInput={(e) => setToken(e.currentTarget.value)}
        placeholder={j.placeholder}
        spellcheck={false}
        autoComplete="off"
        autoCapitalize="none"
        error={result && !result.ok ? errors[result.error] : undefined}
      />
      <p class="note">{j.notice}</p>
      {result?.ok && (
        <div class="stack">
          <p role="status" class={`status-line ${statusTone[result.status]}`}>
            {j.statuses[result.status]}
          </p>
          {result.unsigned && (
            <p role="alert" class="tone-warn">
              {j.unsigned}
            </p>
          )}
          <div class="split-2">
            <div>
              <h3>{j.header}</h3>
              <ScrollRegion label={j.header}>
                <pre class="code-block">{JSON.stringify(result.header, null, 2)}</pre>
              </ScrollRegion>
            </div>
            <div>
              <h3>{j.payload}</h3>
              <ScrollRegion label={j.payload}>
                <pre class="code-block">{JSON.stringify(result.payload, null, 2)}</pre>
              </ScrollRegion>
            </div>
          </div>
          <div>
            <h3>{j.claims}</h3>
            <Rows
              rows={result.claims.map((cl): [string, string] => [
                cl.label ? (labels[cl.label] ?? cl.label) : cl.name,
                cl.time
                  ? `${cl.time.toISOString()} · ${cl.time.toLocaleString(locale)}`
                  : typeof cl.value === 'object'
                    ? JSON.stringify(cl.value)
                    : String(cl.value),
              ])}
            />
          </div>
          {result.signature && (
            <div>
              <h3>{j.signature}</h3>
              <p class="mono">{result.signature}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Empreintes ---

function HashTool({ ui }: { ui: Ui }) {
  const h = ui.hash;
  const [source, setSource] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [expected, setExpected] = useState('');
  const [hashes, setHashes] = useState<Partial<Record<HashAlgorithm, string>>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      let bytes: Uint8Array<ArrayBuffer>;
      if (source === 'text') bytes = toBytes(text);
      else if (file) bytes = new Uint8Array(await file.arrayBuffer());
      else {
        setHashes({});
        return;
      }
      setBusy(true);
      const entries = await Promise.all(
        ALGORITHMS.map(async (a) => [a, await hashHex(a, bytes)] as const),
      );
      if (!cancelled) {
        setHashes(Object.fromEntries(entries));
        setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [source, text, file]);

  const empty = source === 'file' && !file;
  const matched = expected.trim()
    ? ALGORITHMS.find((a) => hashes[a] && sameHash(hashes[a], expected))
    : null;

  return (
    <div class="stack">
      <fieldset class="choice-group">
        <legend class="visually-hidden">{h.algorithm}</legend>
        <Radio name={`${PREFIX}-hash-src`} value="text" current={source} onChange={setSource}>
          {h.text}
        </Radio>
        <Radio name={`${PREFIX}-hash-src`} value="file" current={source} onChange={setSource}>
          {h.file}
        </Radio>
      </fieldset>
      {source === 'text' ? (
        <Field
          as="textarea"
          id={`${PREFIX}-hash-in`}
          label={ui.common.input}
          rows={4}
          value={text}
          onInput={(e) => setText(e.currentTarget.value)}
          spellcheck={false}
        />
      ) : (
        <FileDrop
          id={`${PREFIX}-hash-file`}
          label={h.file}
          drop={h.fileLabel}
          choose={h.fileLabel}
          change={h.fileLabel}
          accept="*/*"
          file={file}
          onFile={setFile}
        />
      )}
      <div role="status" aria-live="polite" class="note">
        {busy ? h.working : ''}
      </div>
      {!empty && (
        <ul class="secret-list hash-list" role="list">
          {ALGORITHMS.map((a) => (
            <li key={a}>
              <span class="hash-name">{a}</span>
              <code class="mono hash-value">{hashes[a] ?? ''}</code>
              <CopyButton
                text={hashes[a] ?? ''}
                label={`${ui.common.copy} ${a}`}
                copiedLabel={ui.common.copied}
              />
            </li>
          ))}
        </ul>
      )}
      <Field
        id={`${PREFIX}-hash-expected`}
        label={h.compare}
        value={expected}
        onInput={(e) => setExpected(e.currentTarget.value)}
        spellcheck={false}
        autoComplete="off"
      />
      {expected.trim() && !empty && (
        <p role="status" class={matched ? 'status-line tone-ok' : 'status-line tone-danger'}>
          {matched ? `${h.match} (${matched})` : h.noMatch}
        </p>
      )}
      <p class="note">{h.md5Warning}</p>
    </div>
  );
}

// --- Horodatage ---

function TimeTool({ ui, lang }: { ui: Ui; lang: Lang }) {
  const t = ui.time;
  const [input, setInput] = useState('');
  const [now, setNow] = useState(0);
  // Le « maintenant » n'existe qu'après l'hydratation (le HTML pré-rendu ne doit pas dépendre de l'heure du build)
  useEffect(() => {
    setNow(Date.now());
  }, []);
  const parsed = useMemo(() => (input.trim() ? parseTimestamp(input) : null), [input]);
  const d = useMemo(
    () =>
      parsed?.ok
        ? describeInstant(parsed.ms, {
            locale: lang === 'fr' ? 'fr-FR' : 'en-GB',
            now: now || Date.now(),
          })
        : null,
    [parsed, now, lang],
  );
  const units: Record<string, string> = t.units;

  return (
    <div class="stack">
      <div class="row-actions row-bottom">
        <div class="grow">
          <Field
            id={`${PREFIX}-time-in`}
            label={t.input}
            value={input}
            onInput={(e) => setInput(e.currentTarget.value)}
            placeholder={t.placeholder}
            spellcheck={false}
            autoComplete="off"
            error={parsed && !parsed.ok ? t.invalid : undefined}
          />
        </div>
        <Button onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>{t.now}</Button>
      </div>
      {d && parsed?.ok && (
        <>
          <p role="status" class="note">
            {t.detected(units[parsed.unit] ?? parsed.unit)}
          </p>
          <Rows
            rows={[
              [t.rows.seconds, String(d.seconds)],
              [t.rows.milliseconds, String(d.milliseconds)],
              [t.rows.iso, d.iso],
              [t.rows.utc, d.utc],
              [t.rows.local, d.local],
              [t.rows.timeZone, d.timeZone],
              [t.rows.relative, d.relative],
            ]}
          />
        </>
      )}
    </div>
  );
}

// --- UUID ---

function UuidTool({ ui, lang }: { ui: Ui; lang: Lang }) {
  const u = ui.uuid;
  const [version, setVersion] = useState('v4');
  const [count, setCount] = useState(5);
  const [items, setItems] = useState<string[]>([]);
  const [probe, setProbe] = useState('');

  const make = () => Array.from({ length: count }, () => (version === 'v7' ? uuidV7() : uuidV4()));
  // Aléatoires : générés après l'hydratation seulement
  useEffect(() => {
    setItems(Array.from({ length: count }, () => (version === 'v7' ? uuidV7() : uuidV4())));
  }, [version, count]);

  const info = useMemo(() => (probe.trim() ? inspectUuid(probe) : null), [probe]);

  return (
    <div class="stack">
      <div class="row-actions row-bottom">
        <fieldset class="choice-group">
          <legend class="visually-hidden">{u.version}</legend>
          <Radio name={`${PREFIX}-uuid-v`} value="v4" current={version} onChange={setVersion}>
            {u.v4}
          </Radio>
          <Radio name={`${PREFIX}-uuid-v`} value="v7" current={version} onChange={setVersion}>
            {u.v7}
          </Radio>
        </fieldset>
        <SelectField
          id={`${PREFIX}-uuid-count`}
          label={u.count}
          value={String(count)}
          onChange={(v) => setCount(Number(v))}
          class="field-narrow"
        >
          {[1, 5, 10, 25].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </SelectField>
        <Button onClick={() => setItems(make())}>{u.generate}</Button>
      </div>
      <ul class="secret-list" role="list">
        {items.map((item, i) => (
          <li key={`${i}-${item}`}>
            <code class="mono">{item}</code>
            <CopyButton
              text={item}
              label={`${ui.common.copy} ${i + 1}`}
              copiedLabel={ui.common.copied}
            />
          </li>
        ))}
      </ul>
      <div class="stack">
        <Field
          id={`${PREFIX}-uuid-probe`}
          label={u.inspect}
          value={probe}
          onInput={(e) => setProbe(e.currentTarget.value)}
          placeholder={u.inspectPlaceholder}
          spellcheck={false}
          autoComplete="off"
          error={info && !info.ok ? u.invalid : undefined}
        />
        {info?.ok && (
          <Rows
            rows={[
              [u.rows.version, String(info.version)],
              [u.rows.variant, info.variant],
              [u.rows.canonical, info.canonical],
              [
                u.rows.date,
                info.ms === null
                  ? ''
                  : new Date(info.ms).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB'),
              ],
            ]}
          />
        )}
      </div>
    </div>
  );
}

/** Boîte à outils d'encodage : huit onglets (Base64, URL, hex, HTML, JWT, empreintes, timestamp, UUID), tout dans le navigateur. */
export default function EncoderDecoder({ lang }: { lang: Lang }) {
  const ui = ENCODER[lang].ui;
  const [tab, setTab] = useState<TabId>('base64');
  const tabs = TAB_IDS.map((id) => ({ id, label: ui.tabs[id] }));

  return (
    <div class="stack">
      <div class="tool">
        <Tabs
          prefix={PREFIX}
          label={ui.tabsLabel}
          tabs={tabs}
          value={tab}
          onChange={(id) => setTab(id as TabId)}
        />
        {TAB_IDS.map((id) => (
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          <div
            key={id}
            role="tabpanel"
            id={panelId(PREFIX, id)}
            aria-labelledby={tabId(PREFIX, id)}
            hidden={tab !== id}
            tabIndex={0}
            class="tabpanel"
          >
            {tab === id &&
              (id === 'base64' || id === 'url' || id === 'hex' || id === 'html' ? (
                <TextTool kind={id} ui={ui} />
              ) : id === 'jwt' ? (
                <JwtTool ui={ui} lang={lang} />
              ) : id === 'hash' ? (
                <HashTool ui={ui} />
              ) : id === 'time' ? (
                <TimeTool ui={ui} lang={lang} />
              ) : (
                <UuidTool ui={ui} lang={lang} />
              ))}
          </div>
        ))}
      </div>
      <p class="note">{ui.privacy}</p>
    </div>
  );
}
