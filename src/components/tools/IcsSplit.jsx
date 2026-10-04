import { useMemo, useState } from 'react';
import { Download, FileArchive, LoaderCircle } from 'lucide-react';
import { ICS_SPLIT } from '../../data/tools/ics-split';
import { formatEventDate } from '../../lib/ics/dates';
import { splitCalendar, summarize } from '../../lib/ics/split';
import { baseName } from '../../lib/ics/build';
import { downloadBlob, formatBytes } from '../../lib/download';
import { zipStore } from '../../lib/zip';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Field from '../ui/Field';
import FileDrop from '../ui/FileDrop';
import ScrollRegion from '../ui/ScrollRegion';
import { useIcsFile } from './useIcsFile';

const MODES = ['count', 'size', 'year', 'month', 'single', 'calendar'];
const MAX_ROWS = 100;

/** Découpeur de fichier ICS : tout se passe dans le navigateur ; aucun octet n'est envoyé. */
export default function IcsSplit({ lang }) {
  const ui = ICS_SPLIT[lang].ui;
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const ics = useIcsFile();
  const [mode, setMode] = useState('count');
  const [count, setCount] = useState('100');
  const [sizeKb, setSizeKb] = useState('1000');

  const summary = useMemo(() => (ics.parsed ? summarize(ics.parsed) : null), [ics.parsed]);
  const result = useMemo(
    () => (ics.parsed ? splitCalendar(ics.parsed, { mode, count: Number(count) || 1, maxBytes: Math.max(10, Number(sizeKb) || 1000) * 1024, filename: ics.file.name }) : null),
    [ics.parsed, ics.file, mode, count, sizeKb],
  );
  const total = result?.files.reduce((n, f) => n + f.events, 0) ?? 0;
  const base = ics.file ? baseName(ics.file.name) : 'calendrier';

  const downloadOne = (f) => downloadBlob(f.name, f.text, 'text/calendar;charset=utf-8');
  const downloadAll = () => downloadBlob(`${base}-decoupe.zip`, zipStore(result.files.map((f) => ({ name: f.name, data: f.text }))), 'application/zip');

  return (
    <div className="space-y-6">
      <Card solid className="space-y-6 p-5 shadow-float sm:p-6">
        <FileDrop id="ics-file" label={ui.h1} hint={ui.form.hint} drop={ui.form.drop} choose={ui.form.choose} change={ui.form.change} accept=".ics,.ical,.ifb,text/calendar" file={ics.file} error={ics.error ? ui.errors[ics.error] : undefined} onFile={ics.load} />

        {ics.loading && (
          <p className="flex items-center gap-2 text-copy text-body" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin text-brand" aria-hidden="true" /> …
          </p>
        )}

        {summary && (
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-copy text-body">
            <li><strong className="text-ink">{summary.events}</strong> {ui.loaded.events}</li>
            <li><strong className="text-ink">{summary.series}</strong> {ui.loaded.series}</li>
            <li><strong className="text-ink">{summary.timezones}</strong> {ui.loaded.timezones}</li>
            <li><strong className="text-ink">{summary.calendars}</strong> {ui.loaded.calendars}</li>
            {summary.first != null && (
              <li>{ui.loaded.period} : <strong className="text-ink">{formatEventDate({ kind: 'date', ms: summary.first }, locale)} → {formatEventDate({ kind: 'date', ms: summary.last }, locale)}</strong></li>
            )}
          </ul>
        )}

        {ics.parsed && (
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium text-ink">{ui.form.mode}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODES.map((m) => (
                <label key={m} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line px-3 py-2.5 has-[:checked]:border-brand has-[:checked]:bg-brand/10">
                  <input type="radio" name="split-mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-strong)]" />
                  <span>
                    <span className="block font-medium text-ink">{ui.form.modes[m][0]}</span>
                    <span className="block text-meta text-muted">{ui.form.modes[m][1]}</span>
                  </span>
                </label>
              ))}
            </div>
            {mode === 'count' && <div className="max-w-xs"><Field id="split-count" label={ui.form.count} type="number" min="1" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} /></div>}
            {mode === 'size' && <div className="max-w-xs"><Field id="split-size" label={ui.form.size} type="number" min="10" inputMode="numeric" value={sizeKb} onChange={(e) => setSizeKb(e.target.value)} /></div>}
          </fieldset>
        )}
      </Card>

      <div role="status" aria-live="polite" className="sr-only">{result ? ui.result.announce(result.files.length) : ''}</div>

      {result && (
        <Card solid className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-ink">{ui.result.title}</h2>
              <p className="text-copy text-body">{ui.result.total(total, result.files.length)}</p>
              {total === (summary?.events ?? -1) && <p className="text-meta text-link">{ui.result.check}</p>}
            </div>
            {result.files.length > 1 && (
              <Button onClick={downloadAll}><FileArchive className="h-4 w-4" aria-hidden="true" /> {ui.result.downloadAll}</Button>
            )}
          </div>

          {ics.encoding && <p className="text-copy text-warn">{ui.warnings.encoding}</p>}
          {summary?.issues.length > 0 && <p className="text-copy text-body">{ui.warnings.issues(summary.issues.length)}</p>}
          {result.warnings.map((w) => (
            <p key={w.code + w.value} className="text-copy text-warn">{ui.warnings[w.code](w.value)}</p>
          ))}

          {result.files.length > 0 && (
            <ScrollRegion label={ui.result.title}>
              <table className="record-table">
                <caption className="sr-only">{ui.result.title}</caption>
                <thead>
                  <tr>
                    <th scope="col">{ui.result.file}</th>
                    <th scope="col">{ui.result.eventsCol}</th>
                    <th scope="col">{ui.result.size}</th>
                    <th scope="col"><span className="sr-only">{ui.result.download}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {result.files.slice(0, MAX_ROWS).map((f) => (
                    <tr key={f.name}>
                      <td className="mono text-ink">{f.name}</td>
                      <td className="text-body">{f.events}</td>
                      <td className="whitespace-nowrap text-body">{formatBytes(f.bytes, ui.result.kb)}</td>
                      <td className="w-px">
                        <Button variant="ghost" icon onClick={() => downloadOne(f)} aria-label={`${ui.result.download} : ${f.name}`}>
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          )}
          {result.files.length > MAX_ROWS && <p className="text-meta text-muted">… {result.files.length - MAX_ROWS} / {result.files.length}</p>}
          <p className="text-meta text-muted">{ui.privacy}</p>
        </Card>
      )}
    </div>
  );
}
