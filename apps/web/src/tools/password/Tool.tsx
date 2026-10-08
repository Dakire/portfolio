import {
  crackSeconds,
  entropyBits,
  generatePassword,
  generatePin,
  generatePronounceable,
  poolSizeOf,
  pronounceableEntropy,
  strengthOf,
  type PasswordOptions,
} from '@grichard/tools-core/password';
import { Eye, EyeOff, RefreshCw } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import Button from '../ui/Button';
import CopyButton from '../ui/CopyButton';
import { SelectField } from '../ui/Field';
import { PASSWORD } from './text';

type Mode = 'random' | 'pronounceable' | 'pin';
type Durations = (typeof PASSWORD)['fr']['ui']['result']['durations'];

function formatDuration(seconds: number, d: Durations): string {
  if (seconds < 1) return d.instant;
  if (seconds < 60) return d.seconds;
  if (seconds < 3600) return d.minutes;
  if (seconds < 86_400) return d.hours;
  if (seconds < 31_536_000) return d.days;
  const years = seconds / 31_536_000;
  if (years < 1000) return d.years(Math.round(years).toLocaleString());
  return years < 1e6 ? d.centuries : d.millennia;
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ComponentChildren;
}) {
  return (
    <label class="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

interface RangeProps {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

function Range({ id, label, min, max, value, onChange }: RangeProps) {
  return (
    <div class="range">
      <label for={id}>
        <span>{label}</span>
        <output for={id} class="mono">
          {value}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onInput={(e) => onChange(Number(e.currentTarget.value))}
      />
    </div>
  );
}

/** Générateur de mots de passe : aléa cryptographique, entièrement dans le navigateur. */
export default function PasswordGenerator({ lang }: { lang: Lang }) {
  const ui = PASSWORD[lang].ui;
  const f = ui.form;
  const r = ui.result;
  const [mode, setMode] = useState<Mode>('random');
  const [options, setOptions] = useState<Required<PasswordOptions>>({
    length: 20,
    lower: true,
    upper: true,
    digits: true,
    symbols: true,
    avoidAmbiguous: false,
  });
  const [pron, setPron] = useState({ syllables: 6, digits: 2, capitalize: true });
  const [pinLength, setPinLength] = useState(6);
  const [count, setCount] = useState(5);
  const [items, setItems] = useState<string[]>([]);
  const [hidden, setHidden] = useState(false);
  const setOpt =
    <K extends keyof PasswordOptions>(key: K) =>
    (value: Required<PasswordOptions>[K]) =>
      setOptions((o) => ({ ...o, [key]: value }));

  const make = useCallback(() => {
    if (mode === 'random') return generatePassword(options);
    if (mode === 'pronounceable') return generatePronounceable({ ...pron, separator: '-' });
    return generatePin(pinLength);
  }, [mode, options, pron, pinLength]);

  const generate = useCallback(
    () => setItems(Array.from({ length: count }, make).filter(Boolean)),
    [count, make],
  );

  // Les mots de passe sont aléatoires : ils ne peuvent être produits qu'après l'hydratation, jamais dans le HTML pré-rendu
  useEffect(() => {
    generate();
  }, [generate]);

  const bits =
    mode === 'random'
      ? entropyBits(poolSizeOf(options), options.length)
      : mode === 'pronounceable'
        ? pronounceableEntropy(pron)
        : entropyBits(10, pinLength);
  const strength = strengthOf(bits);
  const noSet = mode === 'random' && poolSizeOf(options) === 0;
  const modes: Mode[] = ['random', 'pronounceable', 'pin'];

  return (
    <div class="stack">
      <div class="tool">
        <fieldset>
          <legend>{f.mode}</legend>
          <div class="choice-group">
            {modes.map((m) => (
              <label key={m} class="pill-choice">
                <input
                  type="radio"
                  name="pw-mode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                />
                <span>{f.modes[m]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {mode === 'random' && (
          <div class="stack">
            <Range
              id="pw-length"
              label={f.length}
              min={8}
              max={128}
              value={options.length}
              onChange={setOpt('length')}
            />
            <div class="form-row form-row-2">
              <Check checked={options.lower} onChange={setOpt('lower')}>
                {f.lower}
              </Check>
              <Check checked={options.upper} onChange={setOpt('upper')}>
                {f.upper}
              </Check>
              <Check checked={options.digits} onChange={setOpt('digits')}>
                {f.digits}
              </Check>
              <Check checked={options.symbols} onChange={setOpt('symbols')}>
                {f.symbols}
              </Check>
              <Check checked={options.avoidAmbiguous} onChange={setOpt('avoidAmbiguous')}>
                {f.ambiguous}
              </Check>
            </div>
            {noSet && (
              <p role="alert" class="field-error">
                {f.none}
              </p>
            )}
          </div>
        )}

        {mode === 'pronounceable' && (
          <div class="form-row form-row-2">
            <Range
              id="pw-syllables"
              label={f.syllables}
              min={3}
              max={16}
              value={pron.syllables}
              onChange={(v) => setPron((p) => ({ ...p, syllables: v }))}
            />
            <Range
              id="pw-pdigits"
              label={f.digitsCount}
              min={0}
              max={6}
              value={pron.digits}
              onChange={(v) => setPron((p) => ({ ...p, digits: v }))}
            />
            <Check
              checked={pron.capitalize}
              onChange={(value) => setPron((p) => ({ ...p, capitalize: value }))}
            >
              {f.capitalize}
            </Check>
          </div>
        )}

        {mode === 'pin' && (
          <Range
            id="pw-pin"
            label={f.pinLength}
            min={4}
            max={12}
            value={pinLength}
            onChange={setPinLength}
          />
        )}

        <div class="row-actions row-bottom">
          <SelectField
            id="pw-count"
            label={f.count}
            value={String(count)}
            onChange={(v) => setCount(Number(v))}
            class="field-narrow"
          >
            {[1, 3, 5, 10, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectField>
          <Button variant="primary" class="btn-lg" onClick={generate} disabled={noSet}>
            <RefreshCw size={20} aria-hidden="true" /> {f.generate}
          </Button>
        </div>
      </div>

      <div role="status" aria-live="polite" class="visually-hidden">
        {items.length ? r.announce(items.length) : ''}
      </div>

      {items.length > 0 && !noSet && (
        <div class="tool">
          <div class="row-actions row-between">
            <h2>{r.title}</h2>
            <Button variant="ghost" onClick={() => setHidden((h) => !h)} aria-pressed={hidden}>
              {hidden ? (
                <Eye size={18} aria-hidden="true" />
              ) : (
                <EyeOff size={18} aria-hidden="true" />
              )}{' '}
              {hidden ? r.show : r.hide}
            </Button>
          </div>

          <ul class="secret-list" role="list">
            {items.map((item, i) => (
              <li key={`${i}-${item}`}>
                <code class="mono" aria-label={hidden ? undefined : item}>
                  {hidden ? '•'.repeat(Math.min(item.length, 32)) : item}
                </code>
                <CopyButton text={item} label={`${r.copy} ${i + 1}`} copiedLabel={r.copied} />
              </li>
            ))}
          </ul>

          <div class="stack strength">
            <p>
              <strong>
                {r.strengthLabel} : {r.strengths[strength]}
              </strong>{' '}
              · {r.entropy} {Math.round(bits)} {r.bits}
            </p>
            <div class="meter" aria-hidden="true">
              <div class={`meter-bar meter-${strength}`} />
            </div>
            <p class="note">{r.crack(formatDuration(crackSeconds(bits), r.durations))}</p>
          </div>
          <p class="note">{ui.privacy}</p>
        </div>
      )}
    </div>
  );
}
