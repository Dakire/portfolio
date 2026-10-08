import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { PASSWORD } from '../../data/tools/password';
import { crackSeconds, entropyBits, generatePassword, generatePin, generatePronounceable, poolSizeOf, pronounceableEntropy, strengthOf } from '../../lib/password';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CopyButton from '../ui/CopyButton';

const STRENGTH_COLOR = { veryWeak: 'bg-danger', weak: 'bg-danger', fair: 'bg-warn', good: 'bg-link', strong: 'bg-brand' };
const STRENGTH_WIDTH = { veryWeak: 'w-[12%]', weak: 'w-[30%]', fair: 'w-[55%]', good: 'w-[78%]', strong: 'w-full' };

function formatDuration(seconds, d) {
  if (seconds < 1) return d.instant;
  if (seconds < 60) return d.seconds;
  if (seconds < 3600) return d.minutes;
  if (seconds < 86_400) return d.hours;
  if (seconds < 31_536_000) return d.days;
  const years = seconds / 31_536_000;
  if (years < 1000) return d.years(Math.round(years).toLocaleString());
  return years < 1e6 ? d.centuries : d.millennia;
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg py-1 text-copy text-body">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--brand-strong)]" />
      <span>{children}</span>
    </label>
  );
}

/** Générateur de mots de passe : aléa cryptographique, entièrement dans le navigateur. */
export default function PasswordGenerator({ lang }) {
  const ui = PASSWORD[lang].ui;
  const f = ui.form;
  const r = ui.result;
  const [mode, setMode] = useState('random');
  const [options, setOptions] = useState({ length: 20, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false });
  const [pron, setPron] = useState({ syllables: 6, digits: 2, capitalize: true });
  const [pinLength, setPinLength] = useState(6);
  const [count, setCount] = useState(5);
  const [items, setItems] = useState([]);
  const [hidden, setHidden] = useState(false);
  const setOpt = (key) => (value) => setOptions((o) => ({ ...o, [key]: value }));

  const make = useCallback(() => {
    if (mode === 'random') return generatePassword(options);
    if (mode === 'pronounceable') return generatePronounceable({ ...pron, separator: '-' });
    return generatePin(pinLength);
  }, [mode, options, pron, pinLength]);

  const generate = useCallback(() => setItems(Array.from({ length: count }, make).filter(Boolean)), [count, make]);

  // Les mots de passe sont aléatoires : ils ne peuvent être produits qu'après l'hydratation, jamais dans le HTML pré-rendu
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    generate();
  }, [generate]);

  const bits = mode === 'random' ? entropyBits(poolSizeOf(options), options.length) : mode === 'pronounceable' ? pronounceableEntropy(pron) : entropyBits(10, pinLength);
  const strength = strengthOf(bits);
  const noSet = mode === 'random' && poolSizeOf(options) === 0;

  return (
    <div className="space-y-6">
      <Card solid className="space-y-6 p-5 shadow-float sm:p-6">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">{f.mode}</legend>
          <div className="flex flex-wrap gap-2">
            {['random', 'pronounceable', 'pin'].map((m) => (
              <label key={m} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2 has-[:checked]:border-brand has-[:checked]:bg-brand/10">
                <input type="radio" name="pw-mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="h-4 w-4 accent-[var(--brand-strong)]" />
                <span className="font-medium text-ink">{f.modes[m]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {mode === 'random' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="pw-length" className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink">
                <span>{f.length}</span>
                <output htmlFor="pw-length" className="font-mono text-base">{options.length}</output>
              </label>
              <input id="pw-length" type="range" min="8" max="128" value={options.length} onChange={(e) => setOpt('length')(Number(e.target.value))} className="h-11 w-full accent-[var(--brand-strong)]" />
            </div>
            <div className="grid gap-x-6 sm:grid-cols-2">
              <Check checked={options.lower} onChange={setOpt('lower')}>{f.lower}</Check>
              <Check checked={options.upper} onChange={setOpt('upper')}>{f.upper}</Check>
              <Check checked={options.digits} onChange={setOpt('digits')}>{f.digits}</Check>
              <Check checked={options.symbols} onChange={setOpt('symbols')}>{f.symbols}</Check>
              <Check checked={options.avoidAmbiguous} onChange={setOpt('avoidAmbiguous')}>{f.ambiguous}</Check>
            </div>
            {noSet && <p role="alert" className="text-copy font-medium text-danger">{f.none}</p>}
          </div>
        )}

        {mode === 'pronounceable' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pw-syllables" className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink"><span>{f.syllables}</span><output htmlFor="pw-syllables" className="font-mono text-base">{pron.syllables}</output></label>
              <input id="pw-syllables" type="range" min="3" max="16" value={pron.syllables} onChange={(e) => setPron((p) => ({ ...p, syllables: Number(e.target.value) }))} className="h-11 w-full accent-[var(--brand-strong)]" />
            </div>
            <div>
              <label htmlFor="pw-pdigits" className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink"><span>{f.digitsCount}</span><output htmlFor="pw-pdigits" className="font-mono text-base">{pron.digits}</output></label>
              <input id="pw-pdigits" type="range" min="0" max="6" value={pron.digits} onChange={(e) => setPron((p) => ({ ...p, digits: Number(e.target.value) }))} className="h-11 w-full accent-[var(--brand-strong)]" />
            </div>
            <Check checked={pron.capitalize} onChange={(value) => setPron((p) => ({ ...p, capitalize: value }))}>{f.capitalize}</Check>
          </div>
        )}

        {mode === 'pin' && (
          <div className="max-w-sm">
            <label htmlFor="pw-pin" className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink"><span>{f.pinLength}</span><output htmlFor="pw-pin" className="font-mono text-base">{pinLength}</output></label>
            <input id="pw-pin" type="range" min="4" max="12" value={pinLength} onChange={(e) => setPinLength(Number(e.target.value))} className="h-11 w-full accent-[var(--brand-strong)]" />
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="pw-count" className="mb-1.5 block text-sm font-medium text-ink">{f.count}</label>
            <select id="pw-count" value={count} onChange={(e) => setCount(Number(e.target.value))} className="field w-28">
              {[1, 3, 5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Button size="lg" onClick={generate} disabled={noSet}><RefreshCw className="h-5 w-5" aria-hidden="true" /> {f.generate}</Button>
        </div>
      </Card>

      <div role="status" aria-live="polite" className="sr-only">{items.length ? r.announce(items.length) : ''}</div>

      {items.length > 0 && !noSet && (
        <Card solid className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">{r.title}</h2>
            <Button variant="ghost" onClick={() => setHidden((h) => !h)} aria-pressed={hidden}>
              {hidden ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />} {hidden ? r.show : r.hide}
            </Button>
          </div>

          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={`${i}-${item}`} className="flex items-center gap-2 rounded-xl border border-line bg-canvas pl-4">
                <code className="mono min-w-0 flex-1 py-2.5 text-base text-ink" aria-label={hidden ? undefined : item}>{hidden ? '•'.repeat(Math.min(item.length, 32)) : item}</code>
                <CopyButton text={item} label={`${r.copy} ${i + 1}`} copiedLabel={r.copied} />
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-line pt-4">
            <p className="flex flex-wrap items-baseline justify-between gap-2 text-copy text-body">
              <span><strong className="text-ink">{r.strengthLabel} : {r.strengths[strength]}</strong> · {r.entropy} {Math.round(bits)} {r.bits}</span>
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-raised" aria-hidden="true">
              <div className={`h-full rounded-full transition-all duration-300 ${STRENGTH_COLOR[strength]} ${STRENGTH_WIDTH[strength]}`} />
            </div>
            <p className="text-meta text-muted">{r.crack(formatDuration(crackSeconds(bits), r.durations))}</p>
          </div>
          <p className="text-meta text-muted">{ui.privacy}</p>
        </Card>
      )}
    </div>
  );
}
