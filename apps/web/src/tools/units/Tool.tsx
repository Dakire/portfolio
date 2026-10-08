import {
  BASES,
  DATA_UNITS,
  RATE_UNITS,
  convertData,
  convertRate,
  describeInteger,
  durationParts,
  parseInteger,
  parseNumber,
  plain,
  toBitsPerSecond,
  toBytes,
  transferSeconds,
  type DataUnit,
  type RateUnit,
} from '@grichard/tools-core/units';
import { useMemo, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import CopyButton from '../ui/CopyButton';
import { panelId, tabId } from '../ui/cx';
import Field, { SelectField } from '../ui/Field';
import Tabs from '../ui/Tabs';
import { UNITS_TOOL } from './text';

type Ui = (typeof UNITS_TOOL)['fr']['ui'];

const PREFIX = 'units';
const TAB_IDS = ['data', 'transfer', 'base'] as const;
type TabId = (typeof TAB_IDS)[number];

const formatValue = (value: number, lang: Lang): string => {
  if (value === 0) return '0';
  if (Math.abs(value) < 1e-6) return value.toExponential(4);
  return new Intl.NumberFormat(lang, { maximumSignificantDigits: 10 }).format(value);
};

interface RowProps {
  label: string;
  sub?: string | undefined;
  value: string;
  copy?: string;
  ui: Ui;
}

function Row({ label, sub, value, copy, ui }: RowProps) {
  return (
    <div class="kv-row">
      <dt>
        {label}
        {sub && <span class="meta"> {sub}</span>}
      </dt>
      <dd class="mono">{value}</dd>
      <dd class="kv-copy">
        <CopyButton
          text={copy ?? value}
          label={`${ui.common.copy} : ${label}`}
          copiedLabel={ui.common.copied}
        />
      </dd>
    </div>
  );
}

interface UnitSelectProps<T extends { id: string }> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  units: T[];
  labels: Record<string, string>;
}

function UnitSelect<T extends { id: string }>({
  id,
  label,
  value,
  onChange,
  units,
  labels,
}: UnitSelectProps<T>) {
  return (
    <SelectField id={id} label={label} value={value} onChange={onChange}>
      {units.map((u) => (
        <option key={u.id} value={u.id}>
          {labels[u.id]}
        </option>
      ))}
    </SelectField>
  );
}

type Parsed = ReturnType<typeof parseNumber>;
const numberError = (ui: Ui, parsed: Parsed): string | undefined => {
  if (!('error' in parsed) || parsed.error === 'empty') return undefined;
  return ui.errors[parsed.error];
};

function DataTab({ lang, ui }: { lang: Lang; ui: Ui }) {
  const [value, setValue] = useState('500');
  const [unit, setUnit] = useState('GB');
  const parsed = useMemo(() => parseNumber(value), [value]);
  const rows = useMemo(
    () => ('error' in parsed ? null : convertData(parsed.value, unit)),
    [parsed, unit],
  );
  const d = ui.data;
  const labels: Record<string, string> = ui.labels;

  return (
    <div class="stack">
      <div class="form-row form-row-unit">
        <Field
          id="units-data-value"
          label={ui.common.value}
          value={value}
          onInput={(e) => setValue(e.currentTarget.value)}
          inputMode="decimal"
          autoComplete="off"
          spellcheck={false}
          hint={d.hint}
          error={numberError(ui, parsed)}
        />
        <UnitSelect<DataUnit>
          id="units-data-unit"
          label={ui.common.unit}
          value={unit}
          onChange={setUnit}
          units={DATA_UNITS}
          labels={labels}
        />
      </div>
      <p role="status" class="visually-hidden">
        {rows && !('error' in parsed)
          ? `${formatValue(parsed.value, lang)} ${labels[unit]} = ${formatValue(toBytes(parsed.value, unit), lang)} ${labels.B}`
          : ''}
      </p>
      <div>
        {rows ? (
          <dl class="kv">
            {rows.map((r) => (
              <Row
                key={r.id}
                ui={ui}
                label={labels[r.id] ?? r.id}
                sub={d.norms[r.family]}
                value={formatValue(r.value, lang)}
                copy={plain(r.value)}
              />
            ))}
          </dl>
        ) : !('error' in parsed) || parsed.error === 'empty' ? (
          <p class="note">{d.empty}</p>
        ) : null}
      </div>
      <p class="note">{d.note}</p>
    </div>
  );
}

function durationText(seconds: number, t: Ui['transfer'], lang: Lang): string | null {
  const p = durationParts(seconds);
  if (!p) return null;
  if (p.days > 36_500) return t.tooLong;
  if (seconds < 1) return `${p.milliseconds} ${t.units.ms}`;
  return [
    p.days && `${p.days.toLocaleString(lang)} ${t.units.d}`,
    p.hours && `${p.hours} ${t.units.h}`,
    p.minutes && `${p.minutes} ${t.units.min}`,
    p.seconds && `${p.seconds} ${t.units.s}`,
  ]
    .filter(Boolean)
    .join(' ');
}

function TransferTab({ lang, ui }: { lang: Lang; ui: Ui }) {
  const t = ui.transfer;
  const labels: Record<string, string> = ui.labels;
  const [size, setSize] = useState('50');
  const [sizeUnit, setSizeUnit] = useState('GB');
  const [rate, setRate] = useState('1');
  const [rateUnit, setRateUnit] = useState('Gbit/s');
  const [efficiency, setEfficiency] = useState('100');

  const sizeP = useMemo(() => parseNumber(size), [size]);
  const rateP = useMemo(() => parseNumber(rate), [rate]);
  const effP = useMemo(() => parseNumber(efficiency), [efficiency]);

  const rateError =
    'error' in rateP ? numberError(ui, rateP) : rateP.value === 0 ? ui.errors.zeroRate : undefined;
  const effError =
    'error' in effP
      ? numberError(ui, effP)
      : effP.value < 1 || effP.value > 100
        ? ui.errors.efficiency
        : undefined;

  const result = useMemo(() => {
    if ('error' in sizeP || 'error' in rateP || 'error' in effP) return null;
    if (rateP.value <= 0 || effP.value < 1 || effP.value > 100) return null;
    const bps = toBitsPerSecond(rateP.value, rateUnit);
    const seconds = transferSeconds(toBytes(sizeP.value, sizeUnit), bps, effP.value);
    return { seconds, bps, efficiency: effP.value, rows: convertRate(rateP.value, rateUnit) };
  }, [sizeP, rateP, effP, sizeUnit, rateUnit]);

  return (
    <div class="stack">
      <div class="form-row form-row-unit">
        <Field
          id="units-size"
          label={t.size}
          value={size}
          onInput={(e) => setSize(e.currentTarget.value)}
          inputMode="decimal"
          autoComplete="off"
          spellcheck={false}
          error={numberError(ui, sizeP)}
        />
        <UnitSelect<DataUnit>
          id="units-size-unit"
          label={ui.common.unit}
          value={sizeUnit}
          onChange={setSizeUnit}
          units={DATA_UNITS.filter((u) => u.id !== 'bit')}
          labels={labels}
        />
        <Field
          id="units-rate"
          label={t.rate}
          value={rate}
          onInput={(e) => setRate(e.currentTarget.value)}
          inputMode="decimal"
          autoComplete="off"
          spellcheck={false}
          error={rateError}
        />
        <UnitSelect<RateUnit>
          id="units-rate-unit"
          label={ui.common.unit}
          value={rateUnit}
          onChange={setRateUnit}
          units={RATE_UNITS}
          labels={labels}
        />
        <Field
          id="units-eff"
          label={t.efficiency}
          value={efficiency}
          onInput={(e) => setEfficiency(e.currentTarget.value)}
          inputMode="decimal"
          autoComplete="off"
          spellcheck={false}
          hint={t.efficiencyHint}
          error={effError}
        />
      </div>

      <p role="status" class="visually-hidden">
        {result ? `${t.result} : ${durationText(result.seconds, t, lang)}` : ''}
      </p>
      <div>
        {result && (
          <div class="stack">
            <div class="result-box">
              <p class="note">{t.result}</p>
              <p class="result-value mono">{durationText(result.seconds, t, lang)}</p>
              <p>
                {t.theoretical(formatValue(result.seconds, lang))} ·{' '}
                {t.effective(
                  `${formatValue((result.bps * result.efficiency) / 100 / 8e6, lang)} ${labels['MB/s']} (${formatValue((result.bps * result.efficiency) / 100 / 1e6, lang)} ${labels['Mbit/s']})`,
                )}
              </p>
            </div>
            <div>
              <h3>{t.converted}</h3>
              <dl class="kv">
                {result.rows.map((r) => (
                  <Row
                    key={r.id}
                    ui={ui}
                    label={labels[r.id] ?? r.id}
                    value={formatValue(r.value, lang)}
                    copy={plain(r.value)}
                  />
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BaseTab({ ui }: { ui: Ui }) {
  const b = ui.base;
  const [value, setValue] = useState('255');
  const [base, setBase] = useState<keyof typeof BASES>('dec');
  const parsed = useMemo(() => parseInteger(value, BASES[base]), [value, base]);
  const info = useMemo(() => ('error' in parsed ? null : describeInteger(parsed.value)), [parsed]);
  const error =
    'error' in parsed && parsed.error !== 'empty'
      ? parsed.error === 'invalid'
        ? b.errors.invalid(BASES[base])
        : b.errors.tooLong
      : undefined;

  return (
    <div class="stack">
      <div class="form-row form-row-unit">
        <Field
          id="units-base-value"
          label={b.input}
          value={value}
          onInput={(e) => setValue(e.currentTarget.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellcheck={false}
          class="mono"
          hint={b.hint}
          error={error}
        />
        <SelectField
          id="units-base-from"
          label={b.from}
          value={base}
          onChange={(v) => setBase(v as keyof typeof BASES)}
        >
          {(Object.keys(BASES) as (keyof typeof BASES)[]).map((k) => (
            <option key={k} value={k}>
              {b.bases[k]}
            </option>
          ))}
        </SelectField>
      </div>
      <p role="status" class="visually-hidden">
        {info
          ? `${b.rows.dec} ${info.dec} = ${b.rows.hex} ${info.hex} = ${b.rows.bin} ${info.bin}`
          : ''}
      </p>
      <div>
        {info ? (
          <dl class="kv">
            <Row ui={ui} label={b.rows.dec} value={info.dec} />
            <Row ui={ui} label={b.rows.hex} value={info.hex} />
            <Row ui={ui} label={b.rows.bin} value={info.bin} />
            <Row ui={ui} label={b.rows.binGrouped} value={info.binGrouped} />
            <Row ui={ui} label={b.rows.oct} value={info.oct} />
            <Row ui={ui} label={b.rows.bits} value={b.bits(info.bits)} copy={String(info.bits)} />
          </dl>
        ) : (
          !error && <p class="note">{b.empty}</p>
        )}
      </div>
      <p class="note">{b.note}</p>
    </div>
  );
}

/** Conversions d'unités informatiques : tailles, débits et durée de transfert, bases numériques. Calcul local. */
export default function UnitConverter({ lang }: { lang: Lang }) {
  const ui = UNITS_TOOL[lang].ui;
  const [tab, setTab] = useState<TabId>('data');
  const tabs = TAB_IDS.map((id) => ({ id, label: ui.tabs[id] }));

  return (
    <div class="tool">
      <Tabs
        prefix={PREFIX}
        label={ui.tabs.label}
        tabs={tabs}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
      />
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div
        role="tabpanel"
        id={panelId(PREFIX, tab)}
        aria-labelledby={tabId(PREFIX, tab)}
        tabIndex={0}
        class="tabpanel"
      >
        {tab === 'data' && <DataTab lang={lang} ui={ui} />}
        {tab === 'transfer' && <TransferTab lang={lang} ui={ui} />}
        {tab === 'base' && <BaseTab ui={ui} />}
      </div>
      <p class="note">{ui.privacy}</p>
    </div>
  );
}
