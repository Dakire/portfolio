import type { DomainReport, Check, ReportRecord } from '@grichard/tools-core/dns/analyze';
import type { DkimEntry, analyzeDkim } from '@grichard/tools-core/dns/dkim';
import type { DmarcAnalysis } from '@grichard/tools-core/dns/dmarc';
import type { Finding as FindingData, Severity } from '@grichard/tools-core/dns/findings';
import type { analyzeMx } from '@grichard/tools-core/dns/mx';
import type { SpfAnalysis, SpfNode } from '@grichard/tools-core/dns/spf';
import { ChevronRight, CircleAlert, CircleCheck, Copy } from 'lucide-preact';
import type { Ref } from 'preact';
import { useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import Button from '../ui/Button';
import CopyButton from '../ui/CopyButton';
import { cx } from '../ui/cx';
import Finding, { SEVERITY } from '../ui/Finding';
import ScrollRegion from '../ui/ScrollRegion';
import { describeFinding, DNS_TOOL } from './text';

type Ui = (typeof DNS_TOOL)['fr']['ui'];
type CheckFinding = FindingData & { check?: string };
type DkimAnalysis = Awaited<ReturnType<typeof analyzeDkim>>;
type MxAnalysis = Awaited<ReturnType<typeof analyzeMx>>;

const ORDER: Severity[] = ['error', 'warn', 'info', 'ok'];
const bySeverity = (a: { severity: Severity }, b: { severity: Severity }): number =>
  ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity); // tri stable : l'ordre d'origine est gardé à gravité égale

function RecordTable({
  records,
  ui,
  caption,
}: {
  records: ReportRecord[];
  ui: Ui;
  caption: string;
}) {
  const c = ui.results.recordCols;
  if (!records.length) return <p class="note">{ui.results.noRecords}</p>;
  return (
    <ScrollRegion label={caption}>
      <table class="data-table">
        <caption class="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{c.name}</th>
            <th scope="col">{c.type}</th>
            <th scope="col">{c.ttl}</th>
            <th scope="col">{c.value}</th>
            <th scope="col">
              <span class="visually-hidden">{ui.results.copy}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={`${r.name}-${r.type}-${i}`}>
              <td class="mono">{r.name}</td>
              <td class="mono">{r.type}</td>
              <td>{r.ttl ?? ''}</td>
              <td class="mono">{r.value}</td>
              <td class="shrink">
                <CopyButton
                  text={r.value}
                  label={`${ui.results.copy} : ${r.name} ${r.type}`}
                  copiedLabel={ui.results.copied}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

function SpfTree({ node }: { node: SpfNode }) {
  const via = node.via === 'root' ? null : node.via;
  return (
    <li>
      <p class="mono">
        {node.domain}
        {via && <span class="tag spf-via">{via}</span>}
      </p>
      {node.record && <p class="mono code-line">{node.record}</p>}
      {node.children.length > 0 && (
        <ul class="spf-children" role="list">
          {node.children.map((child) => (
            <SpfTree key={child.domain} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Extra({ check, ui }: { check: Check; ui: Ui }) {
  const r = ui.results;
  const checks: Record<string, { title: string }> = ui.checks;
  if (check.id === 'spf') {
    const data = check.data as SpfAnalysis;
    if (!data.tree.record) return null;
    return (
      <div>
        <p class="strong">
          {r.spfTree}{' '}
          <span class="note">
            — {data.lookups} {r.spfLookups}
          </span>
        </p>
        <ul role="list" class="plain-list">
          <SpfTree node={data.tree} />
        </ul>
      </div>
    );
  }
  if (check.id === 'dkim') {
    const data = check.data as DkimAnalysis;
    return (
      <div class="stack">
        <p>
          {data.tested} {r.dkimTested} · {data.found.length} {r.dkimFound}
        </p>
        {data.found.length > 0 && (
          <ul class="plain-list" role="list">
            {data.found.map((s: DkimEntry) => (
              <li key={s.selector}>
                <span class="mono strong">{s.selector}</span>
                {s.provider ? ` — ${r.dkimProvider} : ${s.provider}` : ''}
                {s.key?.bits
                  ? ` · ${s.key.type === 'ed25519' ? 'Ed25519' : 'RSA'} ${s.key.bits} bits`
                  : ''}
              </li>
            ))}
          </ul>
        )}
        <details>
          <summary class="summary-link">
            {data.results.length} {r.dkimTested}
          </summary>
          <ul class="mono chip-list" role="list">
            {data.results.map((s) => (
              <li key={s.selector}>
                {s.selector}
                {s.found ? ' ✓' : ''}
                {s.provider ? ` (${s.provider})` : ''}
              </li>
            ))}
          </ul>
        </details>
        {!data.explicit && <p class="note">{r.dkimHint}</p>}
      </div>
    );
  }
  if (check.id === 'mx') {
    const data = check.data as MxAnalysis;
    if (!data.hosts.length) return null;
    return (
      <ScrollRegion label={checks.mx?.title ?? 'MX'}>
        <table class="data-table">
          <caption class="visually-hidden">{checks.mx?.title}</caption>
          <thead>
            <tr>
              <th scope="col">MX</th>
              <th scope="col">IPv4</th>
              <th scope="col">IPv6</th>
            </tr>
          </thead>
          <tbody>
            {data.hosts.map((h) => (
              <tr key={h.host}>
                <td class="mono">{h.host}</td>
                <td class="mono">{h.a.join(', ') || '—'}</td>
                <td class="mono">{h.aaaa.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    );
  }
  if (check.id === 'dmarc') {
    const data = check.data as DmarcAnalysis;
    if (!data.parsed) return null;
    return (
      <ScrollRegion label={checks.dmarc?.title ?? 'DMARC'}>
        <table class="data-table">
          <caption class="visually-hidden">{checks.dmarc?.title}</caption>
          <tbody>
            {Object.entries(data.parsed.tags).map(([tag, value]) => (
              <tr key={tag}>
                <th scope="row" class="mono">
                  {tag}
                </th>
                <td class="mono">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    );
  }
  return null;
}

/** Une vérification : en-tête cliquable (gravité, titre, première conclusion), puis constats, détails et enregistrements. */
function CheckSection({
  check,
  lang,
  ui,
  open,
  onToggle,
}: {
  check: Check;
  lang: Lang;
  ui: Ui;
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const describe = (f: Pick<FindingData, 'code' | 'params'>) => describeFinding(lang, f);
  const checks: Record<string, { title: string }> = ui.checks;
  const title = checks[check.id]?.title ?? check.id;
  const { icon: Icon, tone } = SEVERITY[check.status];
  const findings = [...check.findings].sort(bySeverity); // les erreurs d'abord, les « conforme » à la fin
  const headline = findings[0];

  return (
    <section class="disclosure" aria-labelledby={`check-${check.id}`}>
      <details open={open} onToggle={(e) => onToggle((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>
          <ChevronRight size={20} class="chevron" aria-hidden="true" />
          <Icon size={20} class={cx('finding-icon', tone)} aria-hidden="true" />
          <span class="check-head">
            <span id={`check-${check.id}`} class="disclosure-title">
              {title}
              <span class="visually-hidden"> — {ui.results.status[check.status]}</span>
            </span>
            {headline && <span class="note truncate">{describeFinding(lang, headline).title}</span>}
          </span>
        </summary>
        <div class="disclosure-body stack">
          <ul class="findings" role="list">
            {findings.map((f, i) => (
              <Finding
                key={`${f.code}-${i}`}
                finding={f}
                describe={describe}
                statusLabels={ui.results.status}
                fixLabel={ui.results.fix}
                terse
              />
            ))}
          </ul>
          <Extra check={check} ui={ui} />
          {check.id !== 'dkim' || check.records.length > 0 ? (
            <div>
              <p class="strong">{ui.results.records}</p>
              <RecordTable
                records={check.records}
                ui={ui}
                caption={`${title} — ${ui.results.records}`}
              />
            </div>
          ) : null}
        </div>
      </details>
    </section>
  );
}

interface Props {
  report: DomainReport;
  lang: Lang;
  onCopyReport: () => void;
  onCopyLink: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}

export default function DnsReport({ report, lang, onCopyReport, onCopyLink, headingRef }: Props) {
  const ui = DNS_TOOL[lang].ui;
  const describe = (f: Pick<FindingData, 'code' | 'params'>) => describeFinding(lang, f);
  const r = ui.results;
  const checks: Record<string, { title: string }> = ui.checks;
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      report.checks.map((c) => [c.id, c.status === 'error' || c.status === 'warn']),
    ),
  );
  const setAll = (value: boolean) =>
    setOpenMap(Object.fromEntries(report.checks.map((c) => [c.id, value])));
  const toFix = report.findings
    .filter((f) => f.severity === 'error' || f.severity === 'warn')
    .sort(bySeverity);

  // Déplie la vérification, y fait défiler la page et y place le focus (le résumé est toujours visible, même replié)
  const goTo = (id: string) => {
    setOpenMap((m) => ({ ...m, [id]: true }));
    const title = document.getElementById(`check-${id}`);
    title?.scrollIntoView({ block: 'start' });
    title?.closest('summary')?.focus({ preventScroll: true });
  };

  if (!report.exists) {
    return (
      <div class="tool">
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <h2 ref={headingRef} tabIndex={-1} class="result-heading">
          {r.title} {report.domain}
        </h2>
        <ul class="findings" role="list">
          {report.findings.map((f, i) => (
            <Finding
              key={i}
              finding={f}
              describe={describe}
              statusLabels={r.status}
              fixLabel={r.fix}
              terse
            />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div class="stack">
      <div class="tool">
        <div>
          {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <h2 ref={headingRef} tabIndex={-1} class="result-heading mono">
            {r.title} {report.domain}
          </h2>
          <p class="note">
            {report.queries} {r.queries} {r.took} {(report.tookMs / 1000).toFixed(1)} s
          </p>
        </div>

        <ul class="chip-list" role="list">
          {ORDER.map((severity) => {
            const { icon: Icon, tone } = SEVERITY[severity];
            const n = report.counts[severity];
            return (
              <li key={severity} class={cx('tag', n === 0 && 'is-dim')}>
                <Icon size={16} class={tone} aria-hidden="true" />
                {n} {n === 1 ? r.counts[severity] : r.countsPlural[severity]}
              </li>
            );
          })}
        </ul>

        <div>
          <h3>{r.fixFirst}</h3>
          {toFix.length === 0 ? (
            <p class="icon-line">
              <CircleCheck size={20} class="tone-ok" aria-hidden="true" /> {r.fixFirstNone}
            </p>
          ) : (
            <ul class="plain-list" role="list">
              {toFix.map((f: CheckFinding, i) => {
                const { icon: Icon, tone } = SEVERITY[f.severity];
                return (
                  <li key={`${f.code}-${i}`} class="fix-item">
                    <span class="icon-line">
                      <Icon size={20} class={tone} aria-hidden="true" />
                      <span>
                        <span class="visually-hidden">{r.status[f.severity]} : </span>
                        {describe(f).title}
                      </span>
                    </span>
                    <button type="button" class="link-button" onClick={() => goTo(f.check ?? '')}>
                      {checks[f.check ?? '']?.title ?? f.check}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <nav aria-label={r.overview}>
          <h3>{r.overview}</h3>
          <ul class="chip-list" role="list">
            {report.checks.map((check) => {
              const { icon: Icon, tone } = SEVERITY[check.status];
              return (
                <li key={check.id}>
                  <button type="button" onClick={() => goTo(check.id)} class="pill-button">
                    <Icon size={16} class={tone} aria-hidden="true" />
                    <span class="visually-hidden">{r.status[check.status]} : </span>
                    {checks[check.id]?.title ?? check.id}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <p>
          <strong>{r.providers} :</strong>{' '}
          {report.providers.length ? report.providers.join(', ') : r.noProvider}
        </p>

        {report.duplicates.length > 0 && (
          <div>
            <p class="icon-line strong">
              <CircleAlert size={20} class="tone-warn" aria-hidden="true" /> {r.duplicates}
            </p>
            <ul class="findings" role="list">
              {report.duplicates.map((f, i) => (
                <Finding
                  key={`${f.code}-${i}`}
                  finding={f}
                  describe={describe}
                  statusLabels={r.status}
                  fixLabel={r.fix}
                  terse
                />
              ))}
            </ul>
          </div>
        )}

        <div class="row-actions">
          <Button onClick={onCopyReport}>
            <Copy size={18} aria-hidden="true" /> {r.copyReport}
          </Button>
          <Button onClick={onCopyLink}>
            <Copy size={18} aria-hidden="true" /> {r.copyLink}
          </Button>
          <Button variant="ghost" onClick={() => setAll(true)}>
            {r.expandAll}
          </Button>
          <Button variant="ghost" onClick={() => setAll(false)}>
            {r.collapseAll}
          </Button>
        </div>
      </div>

      <div class="stack">
        {report.checks.map((check) => (
          <CheckSection
            key={check.id}
            check={check}
            lang={lang}
            ui={ui}
            open={Boolean(openMap[check.id])}
            onToggle={(open) => setOpenMap((m) => ({ ...m, [check.id]: open }))}
          />
        ))}
      </div>
      <p class="note">{r.privacy}</p>
    </div>
  );
}
