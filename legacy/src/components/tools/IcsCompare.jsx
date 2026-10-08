import { useMemo, useState } from 'react';
import { ArrowLeftRight, ChevronRight, CircleAlert, Copy, Download, LoaderCircle } from 'lucide-react';
import { ICS_COMPARE } from '../../data/tools/ics-compare';
import { baseName, buildCalendar } from '../../lib/ics/build';
import { compareCalendars } from '../../lib/ics/compare';
import { formatEventDate } from '../../lib/ics/dates';
import { downloadBlob } from '../../lib/download';
import Button from '../ui/Button';
import Card from '../ui/Card';
import FileDrop from '../ui/FileDrop';
import ScrollRegion from '../ui/ScrollRegion';
import { useIcsFile } from './useIcsFile';

const ROWS_STEP = 100;

function Check({ checked, onChange, children }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg py-1.5 text-copy text-body">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--brand-strong)]" />
      <span>{children}</span>
    </label>
  );
}

/** Liste repliable d'événements : tableau limité à 100 lignes, « afficher la suite » par paquets. */
function EventList({ title, items, columns, ui, open = false }) {
  const [shown, setShown] = useState(ROWS_STEP);
  const r = ui.result;
  return (
    <Card as="section" solid className="overflow-hidden">
      <details className="check" open={open}>
        <summary className="flex min-h-14 items-center gap-3 px-4 py-3 sm:px-5">
          <ChevronRight className="chevron h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          <span className="flex-1 font-bold text-ink">{title}</span>
          <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-meta font-semibold text-ink">{items.length}</span>
        </summary>
        <div className="space-y-3 border-t border-line px-4 py-4 sm:px-5">
          {items.length === 0 ? (
            <p className="text-copy text-muted">{r.empty}</p>
          ) : (
            <ScrollRegion label={title}>
              <table className="record-table">
                <caption className="sr-only">{title}</caption>
                <thead>
                  <tr>{columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}</tr>
                </thead>
                <tbody>
                  {items.slice(0, shown).map((item, i) => (
                    <tr key={i}>{columns.map((c) => <td key={c.key} className={c.mono ? 'mono text-ink' : 'text-body'}>{c.render(item) || '—'}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          )}
          {items.length > shown && (
            <Button variant="secondary" onClick={() => setShown((n) => n + ROWS_STEP)}>{r.more(Math.min(ROWS_STEP, items.length - shown))}</Button>
          )}
        </div>
      </details>
    </Card>
  );
}

/** Comparateur de fichiers ICS : « source moins destination ». Tout se passe dans le navigateur. */
export default function IcsCompare({ lang }) {
  const ui = ICS_COMPARE[lang].ui;
  const f = ui.form;
  const r = ui.result;
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const source = useIcsFile();
  const destination = useIcsFile();
  const [options, setOptions] = useState({ match: 'both', ignoreCase: true, ignoreEnd: false, ignoreDescription: true, dedupe: true, includeModified: false });
  const [copied, setCopied] = useState(false);
  const set = (key) => (value) => setOptions((o) => ({ ...o, [key]: value }));

  const comparison = useMemo(() => (source.parsed && destination.parsed ? compareCalendars(source.parsed, destination.parsed, options) : null), [source.parsed, destination.parsed, options]);

  const title = (d) => d.summary || r.untitled;
  const when = (d) => formatEventDate(d.start, locale);
  const baseCols = [
    { key: 'title', label: r.cols.title, render: (d) => title(d) },
    { key: 'start', label: r.cols.start, render: (d) => when(d) },
  ];

  const swap = () => {
    const a = source.file;
    const b = destination.file;
    if (a && b) {
      source.load(b);
      destination.load(a);
    }
  };

  const downloadMissing = () => {
    const text = buildCalendar({ calendar: source.parsed.calendars[0] ?? null, events: comparison.toImport.map((d) => d.event), timezones: source.parsed.timezones });
    downloadBlob(`${baseName(source.file.name)}-moins-${baseName(destination.file.name)}.ics`, text, 'text/calendar;charset=utf-8');
  };
  const copyList = async () => {
    const text = comparison.toImport.map((d) => `${when(d)}\t${title(d)}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // presse-papiers indisponible
    }
  };

  const c = comparison?.counts;
  const stat = (value, label, help, accent) => (
    <li key={label} className={`rounded-xl border px-4 py-3 ${accent ? 'border-brand bg-brand/10' : 'border-line bg-surface'}`}>
      <p className="text-3xl font-extrabold tabular-nums text-ink">{value}</p>
      <p className="font-semibold text-ink">{label}</p>
      {help && <p className="text-meta text-muted">{help}</p>}
    </li>
  );

  return (
    <div className="space-y-6">
      <Card solid className="space-y-6 p-5 shadow-float sm:p-6">
        <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
          <FileDrop id="ics-source" label={f.source} hint={f.sourceHint} drop={f.drop} choose={f.choose} change={f.change} accept=".ics,.ical,text/calendar" file={source.file} error={source.error ? ui.errors[source.error] : undefined} onFile={source.load} />
          <Button variant="ghost" icon onClick={swap} aria-label={f.swap} title={f.swap} className="self-center max-md:justify-self-center md:mt-8" disabled={!source.file || !destination.file}>
            <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
          </Button>
          <FileDrop id="ics-destination" label={f.destination} hint={f.destinationHint} drop={f.drop} choose={f.choose} change={f.change} accept=".ics,.ical,text/calendar" file={destination.file} error={destination.error ? ui.errors[destination.error] : undefined} onFile={destination.load} />
        </div>
        {(source.loading || destination.loading) && (
          <p className="flex items-center gap-2 text-copy text-body" role="status"><LoaderCircle className="h-4 w-4 animate-spin text-brand" aria-hidden="true" /> …</p>
        )}

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium text-ink">{f.options}</legend>
          <div className="grid gap-2 lg:grid-cols-3">
            {['both', 'uid', 'content'].map((m) => (
              <label key={m} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line px-3 py-2.5 has-[:checked]:border-brand has-[:checked]:bg-brand/10">
                <input type="radio" name="match-mode" value={m} checked={options.match === m} onChange={() => set('match')(m)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-strong)]" />
                <span>
                  <span className="block font-medium text-ink">{f.match[m][0]}</span>
                  <span className="block text-meta text-muted">{f.match[m][1]}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="grid gap-x-6 sm:grid-cols-2">
            <Check checked={options.ignoreCase} onChange={set('ignoreCase')}>{f.ignoreCase}</Check>
            <Check checked={options.ignoreEnd} onChange={set('ignoreEnd')}>{f.ignoreEnd}</Check>
            <Check checked={options.ignoreDescription} onChange={set('ignoreDescription')}>{f.ignoreDescription}</Check>
            <Check checked={options.dedupe} onChange={set('dedupe')}>{f.dedupe}</Check>
            <Check checked={options.includeModified} onChange={set('includeModified')}>{f.includeModified}</Check>
          </div>
        </fieldset>
      </Card>

      <div role="status" aria-live="polite" className="sr-only">{comparison ? r.announce(c) : ''}</div>

      {comparison && (
        <>
          <Card solid className="space-y-5 p-5 shadow-float sm:p-6">
            <h2 className="text-xl font-bold text-ink">{r.title}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stat(c.toImport, r.toImport, r.toImportHelp, true)}
              {stat(c.matched, r.matched)}
              {stat(c.modified, r.modified)}
              {stat(c.onlyInDestination, r.onlyDestination)}
            </ul>
            <p className="text-meta text-muted">{f.source} : {c.source} {ui.loaded.events} · {f.destination} : {c.destination} {ui.loaded.events}</p>

            {c.toImport === 0 ? (
              <p className="text-copy font-medium text-link">{r.nothing}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button size="lg" onClick={downloadMissing}><Download className="h-5 w-5" aria-hidden="true" /> {r.download}</Button>
                <Button variant="secondary" size="lg" onClick={copyList}><Copy className="h-5 w-5" aria-hidden="true" /> {copied ? r.copied : r.copy}</Button>
              </div>
            )}
            {comparison.removedDuplicates > 0 && <p className="flex items-start gap-2 text-copy text-body"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden="true" /> {r.removedDuplicates(comparison.removedDuplicates)}</p>}
            {comparison.orphanExceptions.length > 0 && <p className="flex items-start gap-2 text-copy text-warn"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {r.orphans(comparison.orphanExceptions.length)}</p>}
            {(source.encoding || destination.encoding) && <p className="text-copy text-warn">{ICS_COMPARE[lang].ui.errors.read}</p>}
          </Card>

          <div className="space-y-3">
            <EventList title={r.lists.toImport} items={comparison.toImport} columns={baseCols} ui={ui} open />
            <EventList
              title={r.lists.modified}
              items={comparison.modified}
              columns={[
                { key: 'title', label: r.cols.title, render: (m) => title(m.source) },
                { key: 'start', label: r.cols.start, render: (m) => when(m.source) },
                { key: 'changes', label: r.cols.changes, render: (m) => m.changes.map((k) => r.fields[k]).join(', ') },
              ]}
              ui={ui}
              open={comparison.modified.length > 0}
            />
            <EventList title={r.lists.onlyDestination} items={comparison.onlyInDestination} columns={baseCols} ui={ui} />
            <EventList
              title={r.lists.matched}
              items={comparison.matched}
              columns={[
                { key: 'title', label: r.cols.title, render: (m) => title(m.source) },
                { key: 'start', label: r.cols.start, render: (m) => when(m.source) },
                { key: 'how', label: r.cols.how, render: (m) => r.by[m.by] },
              ]}
              ui={ui}
            />
            <EventList
              title={r.lists.duplicatesSource}
              items={comparison.duplicatesSource}
              columns={[
                { key: 'title', label: r.cols.title, render: (g) => title(g[0]) },
                { key: 'start', label: r.cols.start, render: (g) => when(g[0]) },
                { key: 'copies', label: r.cols.copies, render: (g) => g.length },
              ]}
              ui={ui}
              open={comparison.duplicatesSource.length > 0}
            />
            <EventList
              title={r.lists.duplicatesDestination}
              items={comparison.duplicatesDestination}
              columns={[
                { key: 'title', label: r.cols.title, render: (g) => title(g[0]) },
                { key: 'start', label: r.cols.start, render: (g) => when(g[0]) },
                { key: 'copies', label: r.cols.copies, render: (g) => g.length },
              ]}
              ui={ui}
            />
          </div>
          <p className="text-meta text-muted">{ui.privacy}</p>
        </>
      )}
    </div>
  );
}
