import { analyzeHeaders, type HeadersAnalysis } from '@grichard/tools-core/mail/headers';
import type { Severity } from '@grichard/tools-core/dns/findings';
import { Eraser, FileSearch } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import { findTool, toolPath } from '../registry';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Finding, { SEVERITY } from '../ui/Finding';
import ScrollRegion from '../ui/ScrollRegion';
import { SAMPLE_HEADERS } from './sample';
import { describeHeaderFinding, EMAIL_HEADERS } from './text';

const SEVERITIES: Severity[] = ['error', 'warn', 'info', 'ok'];

function Section({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <div class="tool">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function Table({
  caption,
  columns,
  children,
}: {
  caption: string;
  columns: string[];
  children: ComponentChildren;
}) {
  return (
    <ScrollRegion label={caption}>
      <table class="data-table">
        <caption class="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={`${c}-${i}`} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </ScrollRegion>
  );
}

/** Liste « libellé : valeur » : les lignes sans valeur sont ignorées. */
function Facts({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl class="kv kv-plain">
      {rows
        .filter(([, v]) => v)
        .map(([label, value], i) => (
          <div key={`${label}-${i}`} class="kv-row">
            <dt>{label}</dt>
            <dd class="mono">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

type OkReport = HeadersAnalysis & { ok: true };
const isOk = (report: HeadersAnalysis): report is OkReport => report.ok;

/** Analyseur d'en-têtes d'e-mail : tout se fait dans le navigateur, rien n'est envoyé. */
export default function EmailHeaders({ lang }: { lang: Lang }) {
  const ui = EMAIL_HEADERS[lang].ui;
  const f = ui.form;
  const r = ui.result;
  const [raw, setRaw] = useState('');
  const [report, setReport] = useState<OkReport | null>(null);
  const [error, setError] = useState('');
  const dnsTool = findTool('dns');
  const dnsPath = dnsTool ? toolPath(dnsTool, lang) : '';
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const results: Record<string, string> = r.auth.results;

  const analyze = (text = raw) => {
    if (!text.trim()) {
      setError(f.empty);
      setReport(null);
      return;
    }
    const result = analyzeHeaders(text);
    if (!isOk(result)) {
      setError(f.notHeaders);
      setReport(null);
      return;
    }
    setError('');
    setReport(result);
  };

  const loadSample = () => {
    setRaw(SAMPLE_HEADERS);
    analyze(SAMPLE_HEADERS);
  };
  const clear = () => {
    setRaw('');
    setReport(null);
    setError('');
  };

  const time = (ms: number | null | undefined): string =>
    ms == null ? '' : new Date(ms).toLocaleString(locale);
  const delay = (ms: number | null): string =>
    ms == null
      ? ''
      : ms < 0
        ? `−${r.path.seconds(Math.round(-ms / 1000))}`
        : r.path.seconds(Math.round(ms / 1000));
  const identity = r.identity;

  const auth = report
    ? [
        report.authentication?.spf,
        ...(report.authentication?.dkim ?? []),
        report.authentication?.dmarc,
      ].flatMap((a) => (a ? [a] : []))
    : [];

  return (
    <div class="stack">
      <div class="tool">
        <form
          class="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            analyze();
          }}
        >
          <Field
            as="textarea"
            id="mail-headers"
            label={f.label}
            hint={f.hint}
            rows={10}
            value={raw}
            onInput={(e) => setRaw(e.currentTarget.value)}
            placeholder={f.placeholder}
            spellcheck={false}
            autoComplete="off"
            autoCapitalize="none"
            error={error || undefined}
            class="mono"
          />
          <div class="row-actions">
            <Button type="submit" variant="primary" class="btn-lg">
              <FileSearch size={20} aria-hidden="true" /> {f.analyze}
            </Button>
            <Button onClick={loadSample}>{f.example}</Button>
            {raw && (
              <Button variant="ghost" onClick={clear}>
                <Eraser size={18} aria-hidden="true" /> {f.clear}
              </Button>
            )}
          </div>
        </form>
      </div>

      <div role="status" aria-live="polite" class="visually-hidden">
        {report ? r.announce(report.counts) : ''}
      </div>

      {report &&
        report.summary &&
        report.hops &&
        report.from &&
        report.returnPath &&
        report.replyTo &&
        report.signatures &&
        report.alignment &&
        report.spam && (
          <>
            <Section title={r.title}>
              <Facts
                rows={[
                  [r.summary.from, report.summary.from],
                  [r.summary.to, report.summary.to],
                  [r.summary.subject, report.summary.subject],
                  [r.summary.date, report.summary.date],
                  [r.summary.messageId, report.summary.messageId],
                  [r.summary.hops, report.hops.length ? String(report.hops.length) : ''],
                  [
                    r.summary.total,
                    report.totalMs == null
                      ? ''
                      : r.path.seconds(Math.max(0, Math.round(report.totalMs / 1000))),
                  ],
                ]}
              />
              <ul class="chip-list" role="list">
                {SEVERITIES.map((s) => {
                  const { icon: Icon, tone } = SEVERITY[s];
                  return (
                    <li key={s} class="tag">
                      <Icon size={16} class={tone} aria-hidden="true" />
                      {r.counts[s]} : {report.counts[s] ?? 0}
                    </li>
                  );
                })}
              </ul>
            </Section>

            <Section title={r.sections.findings}>
              <ul class="findings" role="list">
                {report.findings.map((finding, i) => (
                  <Finding
                    key={`${finding.code}-${i}`}
                    finding={finding}
                    describe={(x) => describeHeaderFinding(lang, x)}
                    statusLabels={r.status}
                    fixLabel={r.fix}
                  />
                ))}
              </ul>
            </Section>

            <Section title={r.sections.path}>
              {report.hops.length ? (
                <>
                  <p class="note">{r.path.oldest}</p>
                  <Table
                    caption={r.sections.path}
                    columns={[
                      '#',
                      r.path.cols.from,
                      r.path.cols.by,
                      r.path.cols.protocol,
                      r.path.cols.tls,
                      r.path.cols.date,
                      r.path.cols.delay,
                    ]}
                  >
                    {report.hops.map((hop) => (
                      <tr key={hop.index}>
                        <td>{hop.index}</td>
                        <td class="mono">{hop.from}</td>
                        <td class="mono">{hop.by}</td>
                        <td>{hop.protocol}</td>
                        <td>
                          {hop.tls === null
                            ? r.path.tls.unknown
                            : hop.tls
                              ? r.path.tls.yes
                              : r.path.tls.no}
                        </td>
                        <td>{time(hop.date)}</td>
                        <td>{delay(hop.delayMs)}</td>
                      </tr>
                    ))}
                  </Table>
                </>
              ) : (
                <p>{r.path.none}</p>
              )}
            </Section>

            <Section title={r.sections.auth}>
              {auth.length ? (
                <Table
                  caption={r.sections.auth}
                  columns={[
                    r.auth.cols.method,
                    r.auth.cols.result,
                    r.auth.cols.domain,
                    r.auth.cols.server,
                  ]}
                >
                  {auth.map((a, i) => (
                    <tr key={`${a.method}-${i}`}>
                      <td class="upper">{a.method}</td>
                      <td>{results[a.result] ?? a.result}</td>
                      <td class="mono">
                        {a.props['header.d'] ??
                          a.props['smtp.mailfrom'] ??
                          a.props['header.from'] ??
                          ''}
                      </td>
                      <td class="mono">{a.host}</td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <p>{r.auth.none}</p>
              )}
            </Section>

            <Section title={r.sections.dkim}>
              {report.signatures.length ? (
                <Table
                  caption={r.sections.dkim}
                  columns={[
                    r.dkim.cols.domain,
                    r.dkim.cols.selector,
                    r.dkim.cols.algorithm,
                    r.dkim.cols.canon,
                    r.dkim.cols.headers,
                    r.dkim.cols.date,
                    '',
                  ]}
                >
                  {report.signatures.map((s, i) => (
                    <tr key={`${s.domain}-${s.selector}-${i}`}>
                      <td class="mono">{s.domain}</td>
                      <td class="mono">{s.selector}</td>
                      <td>{s.algorithm}</td>
                      <td>{s.canonicalization}</td>
                      <td class="mono">{s.signedHeaders.join(', ')}</td>
                      <td>{time(s.timestamp)}</td>
                      <td>
                        <a
                          href={`${dnsPath}?d=${encodeURIComponent(s.domain)}&s=${encodeURIComponent(s.selector)}`}
                        >
                          {r.dkim.check}
                        </a>
                      </td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <p>{r.dkim.none}</p>
              )}
            </Section>

            <Section title={r.sections.identity}>
              <p class="note">{identity.help}</p>
              <Facts
                rows={[
                  [
                    identity.from,
                    report.from.address
                      ? `${report.from.name ? `${report.from.name} ` : ''}<${report.from.address}>`
                      : '',
                  ],
                  [identity.returnPath, report.returnPath.address],
                  [identity.replyTo, report.replyTo.address],
                  [
                    `${identity.alignment} · ${identity.spf}`,
                    report.alignment.spf.domain
                      ? `${report.alignment.spf.domain} : ${report.alignment.spf.aligned ? identity.aligned : report.alignment.spf.passed ? identity.notAligned : identity.failed}`
                      : '',
                  ],
                  ...report.alignment.dkim.map((d): [string, string] => [
                    `${identity.alignment} · ${identity.dkim}`,
                    `${d.domain} (${d.selector}) : ${d.passed && d.aligned ? identity.aligned : d.passed ? identity.notAligned : identity.failed}`,
                  ]),
                ]}
              />
            </Section>

            <Section title={r.sections.spam}>
              {Object.keys(report.spam).length ? (
                <Facts
                  rows={[
                    [r.spam.scl, report.spam.scl !== undefined ? String(report.spam.scl) : ''],
                    [r.spam.spamAssassin, report.spam.spamAssassin],
                    [
                      r.spam.forefront,
                      report.spam.forefront
                        ? Object.entries(report.spam.forefront)
                            .map(([k, v]) => `${k}:${v}`)
                            .join(' ; ')
                        : '',
                    ],
                  ]}
                />
              ) : (
                <p>{r.spam.none}</p>
              )}
            </Section>

            <Section title={`${r.sections.headers} (${r.headers.count(report.headers.length)})`}>
              <details>
                <summary class="summary-link">{r.sections.headers}</summary>
                <div class="disclosure-body">
                  <Table caption={r.sections.headers} columns={[r.headers.name, r.headers.value]}>
                    {report.headers.map((h, i) => (
                      <tr key={`${h.name}-${i}`}>
                        <td class="mono nowrap">{h.name}</td>
                        <td class="mono breakall">{h.value}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              </details>
            </Section>
            <p class="note">{ui.privacy}</p>
          </>
        )}
    </div>
  );
}
