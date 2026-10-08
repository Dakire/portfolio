import { useMemo, useState } from 'react';
import { UNITS_TOOL } from '../../data/tools/units';
import { BASES, DATA_UNITS, RATE_UNITS, convertData, convertRate, describeInteger, durationParts, parseInteger, parseNumber, plain, toBitsPerSecond, toBytes, transferSeconds } from '../../lib/units';
import { panelId, tabId } from '../../lib/tabs';
import Card from '../ui/Card';
import CopyButton from '../ui/CopyButton';
import Field from '../ui/Field';
import Tabs from '../ui/Tabs';

const PREFIX = 'units';
const TAB_IDS = ['data', 'transfer', 'base'];

const formatValue = (value, lang) => {
  if (value === 0) return '0';
  if (Math.abs(value) < 1e-6) return value.toExponential(4);
  return new Intl.NumberFormat(lang, { maximumSignificantDigits: 10 }).format(value);
};

function Row({ label, sub, value, copy, ui }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[11rem_1fr_auto] sm:items-center">
      <dt className="text-meta font-semibold text-muted sm:text-copy">{label}{sub && <span className="ml-2 font-normal">{sub}</span>}</dt>
      <dd className="mono min-w-0 text-ink">{value}</dd>
      <dd className="justify-self-start sm:justify-self-end">
        <CopyButton text={copy ?? value} label={`${ui.common.copy} : ${label}`} copiedLabel={ui.common.copied} />
      </dd>
    </div>
  );
}

function UnitSelect({ id, label, value, onChange, units, labels }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field">
        {units.map((u) => <option key={u.id} value={u.id}>{labels[u.id]}</option>)}
      </select>
    </div>
  );
}

const numberError = (ui, parsed) => (parsed.error && parsed.error !== 'empty' ? ui.errors[parsed.error] : undefined);

function DataTab({ lang, ui }) {
  const [value, setValue] = useState('500');
  const [unit, setUnit] = useState('GB');
  const parsed = useMemo(() => parseNumber(value), [value]);
  const rows = useMemo(() => (parsed.error ? null : convertData(parsed.value, unit)), [parsed, unit]);
  const d = ui.data;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field id="units-data-value" label={ui.common.value} value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" autoComplete="off" spellCheck={false} hint={d.hint} error={numberError(ui, parsed)} />
        <UnitSelect id="units-data-unit" label={ui.common.unit} value={unit} onChange={setUnit} units={DATA_UNITS} labels={ui.labels} />
      </div>
      <p role="status" className="sr-only">{rows ? `${formatValue(parsed.value, lang)} ${ui.labels[unit]} = ${formatValue(toBytes(parsed.value, unit), lang)} ${ui.labels.B}` : ''}</p>
      <div>
        {rows ? (
          <dl>
            {rows.map((r) => <Row key={r.id} ui={ui} label={ui.labels[r.id]} sub={d.norms[r.family]} value={formatValue(r.value, lang)} copy={plain(r.value)} />)}
          </dl>
        ) : (
          !parsed.error || parsed.error === 'empty' ? <p className="text-copy text-muted">{d.empty}</p> : null
        )}
      </div>
      <p className="text-meta text-muted">{d.note}</p>
    </div>
  );
}

function durationText(seconds, t, lang) {
  const p = durationParts(seconds);
  if (!p) return null;
  if (p.days > 36_500) return t.tooLong;
  if (seconds < 1) return `${p.milliseconds} ${t.units.ms}`;
  return [
    p.days && `${p.days.toLocaleString(lang)} ${t.units.d}`,
    p.hours && `${p.hours} ${t.units.h}`,
    p.minutes && `${p.minutes} ${t.units.min}`,
    p.seconds && `${p.seconds} ${t.units.s}`,
  ].filter(Boolean).join(' ');
}

function TransferTab({ lang, ui }) {
  const t = ui.transfer;
  const [size, setSize] = useState('50');
  const [sizeUnit, setSizeUnit] = useState('GB');
  const [rate, setRate] = useState('1');
  const [rateUnit, setRateUnit] = useState('Gbit/s');
  const [efficiency, setEfficiency] = useState('100');

  const sizeP = useMemo(() => parseNumber(size), [size]);
  const rateP = useMemo(() => parseNumber(rate), [rate]);
  const effP = useMemo(() => parseNumber(efficiency), [efficiency]);

  const rateError = rateP.error ? numberError(ui, rateP) : rateP.value === 0 ? ui.errors.zeroRate : undefined;
  const effError = effP.error ? numberError(ui, effP) : effP.value < 1 || effP.value > 100 ? ui.errors.efficiency : undefined;
  const ready = !sizeP.error && !rateP.error && rateP.value > 0 && !effP.error && effP.value >= 1 && effP.value <= 100;

  const result = useMemo(() => {
    if (!ready) return null;
    const bps = toBitsPerSecond(rateP.value, rateUnit);
    const seconds = transferSeconds(toBytes(sizeP.value, sizeUnit), bps, effP.value);
    return { seconds, bps, rows: convertRate(rateP.value, rateUnit) };
  }, [ready, sizeP, rateP, effP, sizeUnit, rateUnit]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field id="units-size" label={t.size} value={size} onChange={(e) => setSize(e.target.value)} inputMode="decimal" autoComplete="off" spellCheck={false} error={numberError(ui, sizeP)} />
        <UnitSelect id="units-size-unit" label={ui.common.unit} value={sizeUnit} onChange={setSizeUnit} units={DATA_UNITS.filter((u) => u.id !== 'bit')} labels={ui.labels} />
        <Field id="units-rate" label={t.rate} value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" autoComplete="off" spellCheck={false} error={rateError} />
        <UnitSelect id="units-rate-unit" label={ui.common.unit} value={rateUnit} onChange={setRateUnit} units={RATE_UNITS} labels={ui.labels} />
        <Field id="units-eff" label={t.efficiency} value={efficiency} onChange={(e) => setEfficiency(e.target.value)} inputMode="decimal" autoComplete="off" spellCheck={false} hint={t.efficiencyHint} error={effError} />
      </div>

      <p role="status" className="sr-only">{result ? `${t.result} : ${durationText(result.seconds, t, lang)}` : ''}</p>
      <div>
        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-sm font-medium text-muted">{t.result}</p>
              <p className="mono mt-1 text-2xl font-bold text-ink">{durationText(result.seconds, t, lang)}</p>
              <p className="mt-1 text-copy text-body">
                {t.theoretical(formatValue(result.seconds, lang))} · {t.effective(`${formatValue((result.bps * effP.value) / 100 / 8e6, lang)} ${ui.labels['MB/s']} (${formatValue((result.bps * effP.value) / 100 / 1e6, lang)} ${ui.labels['Mbit/s']})`)}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold text-ink">{t.converted}</h3>
              <dl>
                {result.rows.map((r) => <Row key={r.id} ui={ui} label={ui.labels[r.id]} value={formatValue(r.value, lang)} copy={plain(r.value)} />)}
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BaseTab({ ui }) {
  const b = ui.base;
  const [value, setValue] = useState('255');
  const [base, setBase] = useState('dec');
  const parsed = useMemo(() => parseInteger(value, BASES[base]), [value, base]);
  const info = useMemo(() => (parsed.error ? null : describeInteger(parsed.value)), [parsed]);
  const error = parsed.error && parsed.error !== 'empty' ? (parsed.error === 'invalid' ? b.errors.invalid(BASES[base]) : b.errors[parsed.error]) : undefined;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <Field id="units-base-value" label={b.input} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} className="mono" hint={b.hint} error={error} />
        <div>
          <label htmlFor="units-base-from" className="mb-1.5 block text-sm font-medium text-ink">{b.from}</label>
          <select id="units-base-from" value={base} onChange={(e) => setBase(e.target.value)} className="field">
            {Object.keys(BASES).map((k) => <option key={k} value={k}>{b.bases[k]}</option>)}
          </select>
        </div>
      </div>
      <p role="status" className="sr-only">{info ? `${b.rows.dec} ${info.dec} = ${b.rows.hex} ${info.hex} = ${b.rows.bin} ${info.bin}` : ''}</p>
      <div>
        {info ? (
          <dl>
            <Row ui={ui} label={b.rows.dec} value={info.dec} />
            <Row ui={ui} label={b.rows.hex} value={info.hex} />
            <Row ui={ui} label={b.rows.bin} value={info.bin} />
            <Row ui={ui} label={b.rows.binGrouped} value={info.binGrouped} />
            <Row ui={ui} label={b.rows.oct} value={info.oct} />
            <Row ui={ui} label={b.rows.bits} value={b.bits(info.bits)} copy={String(info.bits)} />
          </dl>
        ) : (
          !error && <p className="text-copy text-muted">{b.empty}</p>
        )}
      </div>
      <p className="text-meta text-muted">{b.note}</p>
    </div>
  );
}

/** Conversions d'unités informatiques : tailles, débits et durée de transfert, bases numériques. Calcul local. */
export default function UnitConverter({ lang }) {
  const ui = UNITS_TOOL[lang].ui;
  const [tab, setTab] = useState('data');
  const tabs = TAB_IDS.map((id) => ({ id, label: ui.tabs[id] }));

  return (
    <div className="space-y-6">
      <Card solid className="space-y-5 p-5 shadow-float sm:p-6">
        <Tabs prefix={PREFIX} label={ui.tabs.label} tabs={tabs} value={tab} onChange={setTab} />
        <div role="tabpanel" id={panelId(PREFIX, tab)} aria-labelledby={tabId(PREFIX, tab)} tabIndex={0} className="pt-1">
          {tab === 'data' && <DataTab lang={lang} ui={ui} />}
          {tab === 'transfer' && <TransferTab lang={lang} ui={ui} />}
          {tab === 'base' && <BaseTab ui={ui} />}
        </div>
        <p className="text-meta text-muted">{ui.privacy}</p>
      </Card>
    </div>
  );
}
