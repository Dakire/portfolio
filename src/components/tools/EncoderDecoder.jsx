import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Eraser } from 'lucide-react';
import { ENCODER } from '../../data/tools/encoder';
import { bytesToHex, bytesToText, decodeBase64, decodeUrl, encodeBase64, encodeUrlComponent, encodeUrlFull, escapeHtml, hexToBytes, parseUrl, textToHex, toBytes, unescapeHtml } from '../../lib/encode/text';
import { decodeJwt } from '../../lib/encode/jwt';
import { ALGORITHMS, hashHex, sameHash } from '../../lib/encode/hash';
import { describeInstant, inspectUuid, parseTimestamp, uuidV4, uuidV7 } from '../../lib/encode/time';
import { panelId, tabId } from '../../lib/tabs';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CopyButton from '../ui/CopyButton';
import Field from '../ui/Field';
import FileDrop from '../ui/FileDrop';
import ScrollRegion from '../ui/ScrollRegion';
import Tabs from '../ui/Tabs';

const PREFIX = 'enc';
const TAB_IDS = ['base64', 'url', 'hex', 'html', 'jwt', 'hash', 'time', 'uuid'];

function Radio({ name, value, current, onChange, children }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2 has-[:checked]:border-brand has-[:checked]:bg-brand/10">
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} className="h-4 w-4 accent-[var(--brand-strong)]" />
      <span className="font-medium text-ink">{children}</span>
    </label>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1 text-copy text-body">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--brand-strong)]" />
      <span>{children}</span>
    </label>
  );
}

function Output({ value, ui, id, onUse, error }) {
  const c = ui.common;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">{c.output}</label>
        <div className="flex items-center gap-1">
          {onUse && value && <Button variant="ghost" onClick={onUse}><ArrowDownUp className="h-4 w-4" aria-hidden="true" /> {c.swap}</Button>}
          <CopyButton text={value} label={c.copy} copiedLabel={c.copied} />
        </div>
      </div>
      <textarea id={id} readOnly rows={5} value={value} aria-invalid={error ? 'true' : undefined} className="field mono" />
      {error && <p role="alert" className="mt-1.5 text-copy font-medium text-danger">{error}</p>}
    </div>
  );
}

function Mode({ name, value, onChange, ui, labels }) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{ui.common.output}</legend>
      {labels.map(([v, label]) => <Radio key={v} name={name} value={v} current={value} onChange={onChange}>{label}</Radio>)}
    </fieldset>
  );
}

function Rows({ rows }) {
  return (
    <dl>
      {rows.filter(([, v]) => v !== '' && v !== null && v !== undefined).map(([label, value]) => (
        <div key={label} className="grid gap-x-4 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[14rem_1fr]">
          <dt className="text-meta font-semibold text-muted sm:text-copy">{label}</dt>
          <dd className="mono min-w-0 break-words text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// --- Onglets texte : Base64, URL, hexadécimal, HTML ---

function TextTool({ kind, ui }) {
  const c = ui.common;
  const [text, setText] = useState('');
  const [direction, setDirection] = useState('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [padding, setPadding] = useState(true);
  const [urlMode, setUrlMode] = useState('component');
  const [plus, setPlus] = useState(false);
  const [separator, setSeparator] = useState(' ');

  const result = useMemo(() => {
    if (!text) return { value: '' };
    const enc = direction === 'encode';
    if (kind === 'base64') {
      if (enc) return { value: encodeBase64(text, { urlSafe, padding }) };
      const d = decodeBase64(text);
      if (!d.ok) return { value: '', error: c.invalid };
      return d.text === null ? { value: bytesToHex(d.bytes, ' '), note: ui.base64.binary } : { value: d.text, note: d.urlSafe ? ui.base64.detected : '' };
    }
    if (kind === 'url') {
      if (enc) return { value: urlMode === 'component' ? encodeUrlComponent(text) : encodeUrlFull(text) };
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

  const url = useMemo(() => (kind === 'url' && direction === 'decode' && text ? parseUrl(text) : null), [kind, direction, text]);
  const labels = kind === 'html' ? [['encode', ui.html.escape], ['decode', ui.html.unescape]] : [['encode', c.encode], ['decode', c.decode]];
  const id = `${PREFIX}-${kind}`;

  return (
    <div className="space-y-4">
      <Mode name={`${id}-dir`} value={direction} onChange={setDirection} ui={ui} labels={labels} />
      <Field as="textarea" id={`${id}-in`} label={c.input} rows={5} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} autoComplete="off" hint={kind === 'hex' && direction === 'decode' ? ui.hex.hint : undefined} />

      <div className="flex flex-wrap items-center gap-x-6">
        {kind === 'base64' && direction === 'encode' && (
          <>
            <Check checked={urlSafe} onChange={setUrlSafe}>{ui.base64.urlSafe}</Check>
            <Check checked={padding} onChange={setPadding}>{ui.base64.padding}</Check>
          </>
        )}
        {kind === 'url' && direction === 'encode' && (
          <>
            <Radio name={`${id}-mode`} value="component" current={urlMode} onChange={setUrlMode}>{ui.url.component}</Radio>
            <Radio name={`${id}-mode`} value="full" current={urlMode} onChange={setUrlMode}>{ui.url.full}</Radio>
          </>
        )}
        {kind === 'url' && direction === 'decode' && <Check checked={plus} onChange={setPlus}>{ui.url.plus}</Check>}
        {kind === 'hex' && direction === 'encode' && (
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="sr-only">{ui.hex.separator}</legend>
            <span className="text-sm font-medium text-ink">{ui.hex.separator}</span>
            {[['', ui.hex.none], [' ', ui.hex.space], [':', ui.hex.colon]].map(([v, label]) => (
              <Radio key={label} name={`${id}-sep`} value={v} current={separator} onChange={setSeparator}>{label}</Radio>
            ))}
          </fieldset>
        )}
        {text && <Button variant="ghost" onClick={() => setText('')}><Eraser className="h-4 w-4" aria-hidden="true" /> {c.clear}</Button>}
      </div>

      <Output id={`${id}-out`} value={result.value} ui={ui} error={result.error} onUse={() => { setText(result.value); setDirection(direction === 'encode' ? 'decode' : 'encode'); }} />
      {result.note && <p className="text-copy text-muted">{result.note}</p>}

      {url?.ok && (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-ink">{ui.url.parts}</h3>
          <Rows rows={[
            [ui.url.fields.protocol, url.protocol],
            [ui.url.fields.username, url.username],
            [ui.url.fields.password, url.password],
            [ui.url.fields.host, url.host],
            [ui.url.fields.port, url.port],
            [ui.url.fields.path, url.path],
            [ui.url.fields.hash, url.hash],
            ...url.params.map(([k, v]) => [`${ui.url.fields.params} · ${k}`, v]),
          ]} />
        </div>
      )}
    </div>
  );
}

// --- JWT ---

function JwtTool({ ui, lang }) {
  const j = ui.jwt;
  const [token, setToken] = useState('');
  const result = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const statusColor = { expired: 'text-danger', notYetValid: 'text-warn', valid: 'text-brand', noExpiry: 'text-muted' };

  return (
    <div className="space-y-4">
      <Field as="textarea" id={`${PREFIX}-jwt-in`} label={j.input} rows={5} value={token} onChange={(e) => setToken(e.target.value)} placeholder={j.placeholder} spellCheck={false} autoComplete="off" autoCapitalize="none" error={result && !result.ok ? j.errors[result.error] : undefined} />
      <p className="text-meta text-muted">{j.notice}</p>
      {result?.ok && (
        <div className="space-y-4">
          <p role="status" className={`font-semibold ${statusColor[result.status]}`}>{j.statuses[result.status]}</p>
          {result.unsigned && <p role="alert" className="text-copy font-medium text-warn">{j.unsigned}</p>}
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-1.5 text-sm font-medium text-ink">{j.header}</h3>
              <ScrollRegion label={j.header}><pre className="mono rounded-xl border border-line bg-canvas p-3 text-ink">{JSON.stringify(result.header, null, 2)}</pre></ScrollRegion>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-medium text-ink">{j.payload}</h3>
              <ScrollRegion label={j.payload}><pre className="mono rounded-xl border border-line bg-canvas p-3 text-ink">{JSON.stringify(result.payload, null, 2)}</pre></ScrollRegion>
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-lg font-bold text-ink">{j.claims}</h3>
            <Rows rows={result.claims.map((cl) => [
              cl.label ? j.labels[cl.label] : cl.name,
              cl.time ? `${cl.time.toISOString()} · ${cl.time.toLocaleString(locale)}` : typeof cl.value === 'object' ? JSON.stringify(cl.value) : String(cl.value),
            ])} />
          </div>
          {result.signature && (
            <div>
              <h3 className="mb-1.5 text-sm font-medium text-ink">{j.signature}</h3>
              <p className="mono break-all text-copy text-body">{result.signature}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Empreintes ---

function HashTool({ ui }) {
  const h = ui.hash;
  const [source, setSource] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [expected, setExpected] = useState('');
  const [hashes, setHashes] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      let bytes;
      if (source === 'text') bytes = toBytes(text);
      else if (file) bytes = new Uint8Array(await file.arrayBuffer());
      else {
        setHashes({});
        return;
      }
      setBusy(true);
      const entries = await Promise.all(ALGORITHMS.map(async (a) => [a, await hashHex(a, bytes)]));
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

  const empty = source === 'text' ? false : !file;
  const matched = expected.trim() ? ALGORITHMS.find((a) => hashes[a] && sameHash(hashes[a], expected)) : null;

  return (
    <div className="space-y-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{h.algorithm}</legend>
        <Radio name={`${PREFIX}-hash-src`} value="text" current={source} onChange={setSource}>{h.text}</Radio>
        <Radio name={`${PREFIX}-hash-src`} value="file" current={source} onChange={setSource}>{h.file}</Radio>
      </fieldset>
      {source === 'text' ? (
        <Field as="textarea" id={`${PREFIX}-hash-in`} label={ui.common.input} rows={4} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      ) : (
        <FileDrop id={`${PREFIX}-hash-file`} label={h.file} drop={h.fileLabel} choose={h.fileLabel} change={h.fileLabel} file={file} onFile={setFile} />
      )}
      <div role="status" aria-live="polite" className="text-meta text-muted">{busy ? h.working : ''}</div>
      {!empty && (
        <ul className="space-y-2">
          {ALGORITHMS.map((a) => (
            <li key={a} className="flex items-center gap-2 rounded-xl border border-line bg-canvas pl-4">
              <span className="w-20 shrink-0 text-sm font-semibold text-ink">{a}</span>
              <code className="mono min-w-0 flex-1 break-all py-2 text-ink">{hashes[a] ?? ''}</code>
              <CopyButton text={hashes[a] ?? ''} label={`${ui.common.copy} ${a}`} copiedLabel={ui.common.copied} />
            </li>
          ))}
        </ul>
      )}
      <Field id={`${PREFIX}-hash-expected`} label={h.compare} value={expected} onChange={(e) => setExpected(e.target.value)} spellCheck={false} autoComplete="off" />
      {expected.trim() && !empty && (
        <p role="status" className={`font-semibold ${matched ? 'text-brand' : 'text-danger'}`}>{matched ? `${h.match} (${matched})` : h.noMatch}</p>
      )}
      <p className="text-meta text-muted">{h.md5Warning}</p>
    </div>
  );
}

// --- Horodatage ---

function TimeTool({ ui, lang }) {
  const t = ui.time;
  const [input, setInput] = useState('');
  const [now, setNow] = useState(0);
  // Le « maintenant » n'existe qu'après l'hydratation (le HTML pré-rendu ne doit pas dépendre de l'heure du build)
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setNow(Date.now());
  }, []);
  const parsed = useMemo(() => (input.trim() ? parseTimestamp(input) : null), [input]);
  const d = useMemo(() => (parsed?.ok ? describeInstant(parsed.ms, { locale: lang === 'fr' ? 'fr-FR' : 'en-GB', now: now || undefined }) : null), [parsed, now, lang]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-72">
          <Field id={`${PREFIX}-time-in`} label={t.input} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.placeholder} spellCheck={false} autoComplete="off" error={parsed && !parsed.ok ? t.invalid : undefined} />
        </div>
        <Button variant="secondary" onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>{t.now}</Button>
      </div>
      {d && (
        <>
          <p role="status" className="text-copy text-muted">{t.detected(t.units[parsed.unit])}</p>
          <Rows rows={[
            [t.rows.seconds, String(d.seconds)],
            [t.rows.milliseconds, String(d.milliseconds)],
            [t.rows.iso, d.iso],
            [t.rows.utc, d.utc],
            [t.rows.local, d.local],
            [t.rows.timeZone, d.timeZone],
            [t.rows.relative, d.relative],
          ]} />
        </>
      )}
    </div>
  );
}

// --- UUID ---

function UuidTool({ ui, lang }) {
  const u = ui.uuid;
  const [version, setVersion] = useState('v4');
  const [count, setCount] = useState(5);
  const [items, setItems] = useState([]);
  const [probe, setProbe] = useState('');

  const generate = () => setItems(Array.from({ length: count }, () => (version === 'v7' ? uuidV7() : uuidV4())));
  // Aléatoires : générés après l'hydratation seulement
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setItems(Array.from({ length: count }, () => (version === 'v7' ? uuidV7() : uuidV4())));
  }, [version, count]);

  const info = useMemo(() => (probe.trim() ? inspectUuid(probe) : null), [probe]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">{u.version}</legend>
          <Radio name={`${PREFIX}-uuid-v`} value="v4" current={version} onChange={setVersion}>{u.v4}</Radio>
          <Radio name={`${PREFIX}-uuid-v`} value="v7" current={version} onChange={setVersion}>{u.v7}</Radio>
        </fieldset>
        <div>
          <label htmlFor={`${PREFIX}-uuid-count`} className="mb-1.5 block text-sm font-medium text-ink">{u.count}</label>
          <select id={`${PREFIX}-uuid-count`} value={count} onChange={(e) => setCount(Number(e.target.value))} className="field w-28">
            {[1, 5, 10, 25].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <Button onClick={generate}>{u.generate}</Button>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={`${i}-${item}`} className="flex items-center gap-2 rounded-xl border border-line bg-canvas pl-4">
            <code className="mono min-w-0 flex-1 py-2 text-ink">{item}</code>
            <CopyButton text={item} label={`${ui.common.copy} ${i + 1}`} copiedLabel={ui.common.copied} />
          </li>
        ))}
      </ul>
      <div className="space-y-3 border-t border-line pt-4">
        <Field id={`${PREFIX}-uuid-probe`} label={u.inspect} value={probe} onChange={(e) => setProbe(e.target.value)} placeholder={u.inspectPlaceholder} spellCheck={false} autoComplete="off" error={info && !info.ok ? u.invalid : undefined} />
        {info?.ok && (
          <Rows rows={[
            [u.rows.version, String(info.version)],
            [u.rows.variant, info.variant],
            [u.rows.canonical, info.canonical],
            [u.rows.date, info.ms === null ? '' : new Date(info.ms).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB')],
          ]} />
        )}
      </div>
    </div>
  );
}

/** Boîte à outils d'encodage : huit onglets (Base64, URL, hex, HTML, JWT, empreintes, timestamp, UUID), tout dans le navigateur. */
export default function EncoderDecoder({ lang }) {
  const ui = ENCODER[lang].ui;
  const [tab, setTab] = useState('base64');
  const tabs = TAB_IDS.map((id) => ({ id, label: ui.tabs[id] }));

  return (
    <div className="space-y-4">
      <Card solid className="space-y-5 p-5 shadow-float sm:p-6">
        <Tabs prefix={PREFIX} label={ui.tabsLabel} tabs={tabs} value={tab} onChange={setTab} />
        {TAB_IDS.map((id) => (
          <div key={id} role="tabpanel" id={panelId(PREFIX, id)} aria-labelledby={tabId(PREFIX, id)} hidden={tab !== id} tabIndex={0}>
            {tab === id && (['base64', 'url', 'hex', 'html'].includes(id) ? <TextTool kind={id} ui={ui} /> : id === 'jwt' ? <JwtTool ui={ui} lang={lang} /> : id === 'hash' ? <HashTool ui={ui} /> : id === 'time' ? <TimeTool ui={ui} lang={lang} /> : <UuidTool ui={ui} lang={lang} />)}
          </div>
        ))}
      </Card>
      <p className="text-meta text-muted">{ui.privacy}</p>
    </div>
  );
}
