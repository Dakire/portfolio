import { baseName } from '@grichard/tools-core/ics/build';
import { formatEventDate, type IcsDate } from '@grichard/tools-core/ics/dates';
import {
  SPLIT_MODES,
  splitCalendar,
  summarize,
  type SplitFile,
  type SplitMode,
} from '@grichard/tools-core/ics/split';
import { zipStore } from '@grichard/tools-core/zip';
import { Download, FileArchive, LoaderCircle } from 'lucide-preact';
import { useMemo, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import { useIcsFile } from '../ics-shared/useIcsFile';
import Button from '../ui/Button';
import Field from '../ui/Field';
import FileDrop from '../ui/FileDrop';
import ScrollRegion from '../ui/ScrollRegion';
import { downloadBlob, formatBytes } from '../ui/download';
import { ICS_SPLIT } from './text';

const MAX_ROWS = 100;

/** Jour entier à afficher : seule `ms` compte pour le format « date ». */
const dayOf = (ms: number): IcsDate => ({
  kind: 'date',
  y: 0,
  mo: 0,
  d: 0,
  h: 0,
  mi: 0,
  s: 0,
  tzid: null,
  ms,
});

/** Découpeur de fichier ICS : tout se passe dans le navigateur ; aucun octet n'est envoyé. */
export default function IcsSplit({ lang }: { lang: Lang }) {
  const ui = ICS_SPLIT[lang].ui;
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const errors: Record<string, string> = ui.errors;
  const ics = useIcsFile();
  const [mode, setMode] = useState<SplitMode>('count');
  const [count, setCount] = useState('100');
  const [sizeKb, setSizeKb] = useState('1000');

  const summary = useMemo(() => (ics.parsed ? summarize(ics.parsed) : null), [ics.parsed]);
  const result = useMemo(
    () =>
      ics.parsed && ics.file
        ? splitCalendar(ics.parsed, {
            mode,
            count: Number(count) || 1,
            maxBytes: Math.max(10, Number(sizeKb) || 1000) * 1024,
            filename: ics.file.name,
          })
        : null,
    [ics.parsed, ics.file, mode, count, sizeKb],
  );
  const total = result?.files.reduce((n, f) => n + f.events, 0) ?? 0;
  const base = ics.file ? baseName(ics.file.name) : 'calendrier';
  const warnings = ui.warnings as Record<
    string,
    string | ((value: string | number | undefined) => string)
  >;

  const downloadOne = (f: SplitFile) => downloadBlob(f.name, f.text, 'text/calendar;charset=utf-8');
  const downloadAll = () => {
    if (result)
      downloadBlob(
        `${base}-decoupe.zip`,
        zipStore(result.files.map((f) => ({ name: f.name, data: f.text }))),
        'application/zip',
      );
  };

  return (
    <div class="stack">
      <div class="tool">
        <FileDrop
          id="ics-file"
          label={ui.h1}
          hint={ui.form.hint}
          drop={ui.form.drop}
          choose={ui.form.choose}
          change={ui.form.change}
          accept=".ics,.ical,.ifb,text/calendar"
          file={ics.file}
          error={ics.error ? errors[ics.error] : undefined}
          onFile={ics.load}
        />

        {ics.loading && (
          <p class="status-line" role="status">
            <LoaderCircle size={18} class="spin" aria-hidden="true" /> …
          </p>
        )}

        {summary && (
          <ul class="stat-list" role="list">
            <li>
              <strong>{summary.events}</strong> {ui.loaded.events}
            </li>
            <li>
              <strong>{summary.series}</strong> {ui.loaded.series}
            </li>
            <li>
              <strong>{summary.timezones}</strong> {ui.loaded.timezones}
            </li>
            <li>
              <strong>{summary.calendars}</strong> {ui.loaded.calendars}
            </li>
            {summary.first != null && summary.last != null && (
              <li>
                {ui.loaded.period} :{' '}
                <strong>
                  {formatEventDate(dayOf(summary.first), locale)} →{' '}
                  {formatEventDate(dayOf(summary.last), locale)}
                </strong>
              </li>
            )}
          </ul>
        )}

        {ics.parsed && (
          <fieldset class="stack">
            <legend>{ui.form.mode}</legend>
            <div class="form-row form-row-2">
              {SPLIT_MODES.map((m) => (
                <label key={m} class="pill-choice pill-choice-block">
                  <input
                    type="radio"
                    name="split-mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                  />
                  <span>
                    <span class="choice-title">{ui.form.modes[m][0]}</span>
                    <span class="note">{ui.form.modes[m][1]}</span>
                  </span>
                </label>
              ))}
            </div>
            {mode === 'count' && (
              <div class="field-medium">
                <Field
                  id="split-count"
                  label={ui.form.count}
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={count}
                  onInput={(e) => setCount(e.currentTarget.value)}
                />
              </div>
            )}
            {mode === 'size' && (
              <div class="field-medium">
                <Field
                  id="split-size"
                  label={ui.form.size}
                  type="number"
                  min="10"
                  inputMode="numeric"
                  value={sizeKb}
                  onInput={(e) => setSizeKb(e.currentTarget.value)}
                />
              </div>
            )}
          </fieldset>
        )}
      </div>

      <div role="status" aria-live="polite" class="visually-hidden">
        {result ? ui.result.announce(result.files.length) : ''}
      </div>

      {result && (
        <div class="tool">
          <div class="row-actions row-between">
            <div>
              <h2>{ui.result.title}</h2>
              <p>{ui.result.total(total, result.files.length)}</p>
              {total === (summary?.events ?? -1) && <p class="note tone-ok">{ui.result.check}</p>}
            </div>
            {result.files.length > 1 && (
              <Button onClick={downloadAll}>
                <FileArchive size={18} aria-hidden="true" /> {ui.result.downloadAll}
              </Button>
            )}
          </div>

          {ics.encoding && <p class="tone-warn">{ui.warnings.encoding}</p>}
          {summary && summary.issues.length > 0 && (
            <p>{ui.warnings.issues(summary.issues.length)}</p>
          )}
          {result.warnings.map((w) => {
            const entry = warnings[w.code];
            return (
              <p key={`${w.code}${w.value}`} class="tone-warn">
                {typeof entry === 'function' ? entry(w.value) : entry}
              </p>
            );
          })}

          {result.files.length > 0 && (
            <ScrollRegion label={ui.result.title}>
              <table class="data-table">
                <caption class="visually-hidden">{ui.result.title}</caption>
                <thead>
                  <tr>
                    <th scope="col">{ui.result.file}</th>
                    <th scope="col">{ui.result.eventsCol}</th>
                    <th scope="col">{ui.result.size}</th>
                    <th scope="col">
                      <span class="visually-hidden">{ui.result.download}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.files.slice(0, MAX_ROWS).map((f) => (
                    <tr key={f.name}>
                      <td class="mono">{f.name}</td>
                      <td>{f.events}</td>
                      <td class="nowrap">{formatBytes(f.bytes, ui.result.kb)}</td>
                      <td class="shrink">
                        <Button
                          variant="ghost"
                          icon
                          onClick={() => downloadOne(f)}
                          aria-label={`${ui.result.download} : ${f.name}`}
                        >
                          <Download size={18} aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          )}
          {result.files.length > MAX_ROWS && (
            <p class="note">
              … {result.files.length - MAX_ROWS} / {result.files.length}
            </p>
          )}
          <p class="note">{ui.privacy}</p>
        </div>
      )}
    </div>
  );
}
