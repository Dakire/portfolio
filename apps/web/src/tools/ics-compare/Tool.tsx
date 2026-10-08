import { baseName, buildCalendar } from '@grichard/tools-core/ics/build';
import {
  compareCalendars,
  MATCH_MODES,
  type CompareOptions,
  type EventInfo,
  type Match,
} from '@grichard/tools-core/ics/compare';
import { formatEventDate } from '@grichard/tools-core/ics/dates';
import {
  ArrowLeftRight,
  ChevronRight,
  CircleAlert,
  Copy,
  Download,
  LoaderCircle,
} from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import { useIcsFile } from '../ics-shared/useIcsFile';
import Button from '../ui/Button';
import { Check } from '../ui/Choice';
import FileDrop from '../ui/FileDrop';
import ScrollRegion from '../ui/ScrollRegion';
import { downloadBlob } from '../ui/download';
import { ICS_COMPARE } from './text';

type Ui = (typeof ICS_COMPARE)['fr']['ui'];

const ROWS_STEP = 100;

interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => ComponentChildren;
}

/** Liste repliable d'événements : tableau limité à 100 lignes, « afficher la suite » par paquets. */
function EventList<T>({
  title,
  items,
  columns,
  ui,
  open = false,
}: {
  title: string;
  items: T[];
  columns: Column<T>[];
  ui: Ui;
  open?: boolean;
}) {
  const [shown, setShown] = useState(ROWS_STEP);
  const r = ui.result;
  return (
    <section class="disclosure">
      <details open={open}>
        <summary>
          <ChevronRight size={20} class="chevron" aria-hidden="true" />
          <span class="disclosure-title">{title}</span>
          <span class="tag">{items.length}</span>
        </summary>
        <div class="disclosure-body stack">
          {items.length === 0 ? (
            <p class="note">{r.empty}</p>
          ) : (
            <ScrollRegion label={title}>
              <table class="data-table">
                <caption class="visually-hidden">{title}</caption>
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} scope="col">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, shown).map((item, i) => (
                    <tr key={i}>
                      {columns.map((c) => (
                        <td key={c.key}>{c.render(item) || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          )}
          {items.length > shown && (
            <Button onClick={() => setShown((n) => n + ROWS_STEP)}>
              {r.more(Math.min(ROWS_STEP, items.length - shown))}
            </Button>
          )}
        </div>
      </details>
    </section>
  );
}

/** Comparateur de fichiers ICS : « source moins destination ». Tout se passe dans le navigateur. */
export default function IcsCompare({ lang }: { lang: Lang }) {
  const ui = ICS_COMPARE[lang].ui;
  const f = ui.form;
  const r = ui.result;
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const errors: Record<string, string> = ui.errors;
  const fields: Record<string, string> = r.fields;
  const source = useIcsFile();
  const destination = useIcsFile();
  const [options, setOptions] = useState<CompareOptions>({
    match: 'both',
    ignoreCase: true,
    ignoreEnd: false,
    ignoreDescription: true,
    dedupe: true,
    includeModified: false,
  });
  const [copied, setCopied] = useState(false);
  const set =
    <K extends keyof CompareOptions>(key: K) =>
    (value: CompareOptions[K]) =>
      setOptions((o) => ({ ...o, [key]: value }));

  const comparison = useMemo(
    () =>
      source.parsed && destination.parsed
        ? compareCalendars(source.parsed, destination.parsed, options)
        : null,
    [source.parsed, destination.parsed, options],
  );

  const title = (d: EventInfo) => d.summary || r.untitled;
  const when = (d: EventInfo) => formatEventDate(d.start, locale);
  const baseCols: Column<EventInfo>[] = [
    { key: 'title', label: r.cols.title, render: (d) => title(d) },
    { key: 'start', label: r.cols.start, render: (d) => when(d) },
  ];
  const matchCols = (last: Column<Match>): Column<Match>[] => [
    { key: 'title', label: r.cols.title, render: (m) => title(m.source) },
    { key: 'start', label: r.cols.start, render: (m) => when(m.source) },
    last,
  ];
  const groupCols: Column<EventInfo[]>[] = [
    { key: 'title', label: r.cols.title, render: (g) => (g[0] ? title(g[0]) : '') },
    { key: 'start', label: r.cols.start, render: (g) => (g[0] ? when(g[0]) : '') },
    { key: 'copies', label: r.cols.copies, render: (g) => String(g.length) },
  ];

  const swap = () => {
    const a = source.file;
    const b = destination.file;
    if (a && b) {
      void source.load(b);
      void destination.load(a);
    }
  };

  const downloadMissing = () => {
    if (!comparison || !source.parsed || !source.file || !destination.file) return;
    const text = buildCalendar({
      calendar: source.parsed.calendars[0] ?? null,
      events: comparison.toImport.map((d) => d.event),
      timezones: source.parsed.timezones,
    });
    downloadBlob(
      `${baseName(source.file.name)}-moins-${baseName(destination.file.name)}.ics`,
      text,
      'text/calendar;charset=utf-8',
    );
  };
  const copyList = async () => {
    if (!comparison) return;
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
  const stat = (value: number, label: string, help?: string, accent?: boolean) => (
    <li key={label} class={accent ? 'stat-card is-accent' : 'stat-card'}>
      <p class="stat-number">{value}</p>
      <p class="stat-label">{label}</p>
      {help && <p class="note">{help}</p>}
    </li>
  );

  return (
    <div class="stack">
      <div class="tool">
        <div class="compare-files">
          <FileDrop
            id="ics-source"
            label={f.source}
            hint={f.sourceHint}
            drop={f.drop}
            choose={f.choose}
            change={f.change}
            accept=".ics,.ical,text/calendar"
            file={source.file}
            error={source.error ? errors[source.error] : undefined}
            onFile={source.load}
          />
          <Button
            variant="ghost"
            icon
            onClick={swap}
            aria-label={f.swap}
            title={f.swap}
            class="compare-swap"
            disabled={!source.file || !destination.file}
          >
            <ArrowLeftRight size={20} aria-hidden="true" />
          </Button>
          <FileDrop
            id="ics-destination"
            label={f.destination}
            hint={f.destinationHint}
            drop={f.drop}
            choose={f.choose}
            change={f.change}
            accept=".ics,.ical,text/calendar"
            file={destination.file}
            error={destination.error ? errors[destination.error] : undefined}
            onFile={destination.load}
          />
        </div>
        {(source.loading || destination.loading) && (
          <p class="status-line" role="status">
            <LoaderCircle size={18} class="spin" aria-hidden="true" /> …
          </p>
        )}

        <fieldset class="stack">
          <legend>{f.options}</legend>
          <div class="form-row form-row-3">
            {MATCH_MODES.map((m) => (
              <label key={m} class="pill-choice pill-choice-block">
                <input
                  type="radio"
                  name="match-mode"
                  value={m}
                  checked={options.match === m}
                  onChange={() => set('match')(m)}
                />
                <span>
                  <span class="choice-title">{f.match[m][0]}</span>
                  <span class="note">{f.match[m][1]}</span>
                </span>
              </label>
            ))}
          </div>
          <div class="form-row form-row-2">
            <Check checked={options.ignoreCase} onChange={set('ignoreCase')}>
              {f.ignoreCase}
            </Check>
            <Check checked={options.ignoreEnd} onChange={set('ignoreEnd')}>
              {f.ignoreEnd}
            </Check>
            <Check checked={options.ignoreDescription} onChange={set('ignoreDescription')}>
              {f.ignoreDescription}
            </Check>
            <Check checked={options.dedupe} onChange={set('dedupe')}>
              {f.dedupe}
            </Check>
            <Check checked={options.includeModified} onChange={set('includeModified')}>
              {f.includeModified}
            </Check>
          </div>
        </fieldset>
      </div>

      <div role="status" aria-live="polite" class="visually-hidden">
        {comparison && c ? r.announce(c) : ''}
      </div>

      {comparison && c && (
        <>
          <div class="tool">
            <h2>{r.title}</h2>
            <ul class="stat-grid" role="list">
              {stat(c.toImport, r.toImport, r.toImportHelp, true)}
              {stat(c.matched, r.matched)}
              {stat(c.modified, r.modified)}
              {stat(c.onlyInDestination, r.onlyDestination)}
            </ul>
            <p class="note">
              {f.source} : {c.source} {ui.loaded.events} · {f.destination} : {c.destination}{' '}
              {ui.loaded.events}
            </p>

            {c.toImport === 0 ? (
              <p class="tone-ok">{r.nothing}</p>
            ) : (
              <div class="row-actions">
                <Button variant="primary" class="btn-lg" onClick={downloadMissing}>
                  <Download size={20} aria-hidden="true" /> {r.download}
                </Button>
                <Button class="btn-lg" onClick={copyList}>
                  <Copy size={20} aria-hidden="true" /> {copied ? r.copied : r.copy}
                </Button>
              </div>
            )}
            {comparison.removedDuplicates > 0 && (
              <p class="icon-line">
                <CircleAlert size={18} class="tone-info" aria-hidden="true" />{' '}
                {r.removedDuplicates(comparison.removedDuplicates)}
              </p>
            )}
            {comparison.orphanExceptions.length > 0 && (
              <p class="icon-line tone-warn">
                <CircleAlert size={18} aria-hidden="true" />{' '}
                {r.orphans(comparison.orphanExceptions.length)}
              </p>
            )}
            {(source.encoding || destination.encoding) && <p class="tone-warn">{ui.errors.read}</p>}
          </div>

          <div class="stack">
            <EventList
              title={r.lists.toImport}
              items={comparison.toImport}
              columns={baseCols}
              ui={ui}
              open
            />
            <EventList
              title={r.lists.modified}
              items={comparison.modified}
              columns={matchCols({
                key: 'changes',
                label: r.cols.changes,
                render: (m) => m.changes.map((k) => fields[k] ?? k).join(', '),
              })}
              ui={ui}
              open={comparison.modified.length > 0}
            />
            <EventList
              title={r.lists.onlyDestination}
              items={comparison.onlyInDestination}
              columns={baseCols}
              ui={ui}
            />
            <EventList
              title={r.lists.matched}
              items={comparison.matched}
              columns={matchCols({ key: 'how', label: r.cols.how, render: (m) => r.by[m.by] })}
              ui={ui}
            />
            <EventList
              title={r.lists.duplicatesSource}
              items={comparison.duplicatesSource}
              columns={groupCols}
              ui={ui}
              open={comparison.duplicatesSource.length > 0}
            />
            <EventList
              title={r.lists.duplicatesDestination}
              items={comparison.duplicatesDestination}
              columns={groupCols}
              ui={ui}
            />
          </div>
          <p class="note">{ui.privacy}</p>
        </>
      )}
    </div>
  );
}
