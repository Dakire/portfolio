import { useState } from 'react';
import { Eraser, FileSearch } from 'lucide-react';
import { describeHeaderFinding, EMAIL_HEADERS } from '../../data/tools/email-headers';
import { SAMPLE_HEADERS } from '../../data/tools/email-headers-sample';
import { findTool, toolPath } from '../../data/tools/index';
import { analyzeHeaders } from '../../lib/mail/headers';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Field from '../ui/Field';
import ScrollRegion from '../ui/ScrollRegion';
import Finding from './Finding';
import { SEVERITY } from './severity';

const SEVERITIES = ['error', 'warn', 'info', 'ok'];

function Section({ title, children }) {
  return (
    <Card solid className="space-y-3 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {children}
    </Card>
  );
}

function Table({ caption, columns, children }) {
  return (
    <ScrollRegion label={caption}>
      <table className="record-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </ScrollRegion>
  );
}

/** Analyseur d'en-têtes d'e-mail : tout se fait dans le navigateur, rien n'est envoyé. */
export default function EmailHeaders({ lang }) {
  const ui = EMAIL_HEADERS[lang].ui;
  const f = ui.form;
  const r = ui.result;
  const [raw, setRaw] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const dnsPath = toolPath(findTool('dns'), lang);
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';

  const analyze = (text = raw) => {
    if (!text.trim()) {
      setError(f.empty);
      setReport(null);
      return;
    }
    const result = analyzeHeaders(text);
    if (!result.ok) {
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

  const time = (ms) => (ms == null ? '' : new Date(ms).toLocaleString(locale));
  const delay = (ms) => (ms == null ? '' : ms < 0 ? `−${r.path.seconds(Math.round(-ms / 1000))}` : r.path.seconds(Math.round(ms / 1000)));
  const identity = report ? r.identity : null;

  return (
    <div className="space-y-6">
      <Card solid className="space-y-4 p-5 shadow-float sm:p-6">
        <form onSubmit={(e) => { e.preventDefault(); analyze(); }} noValidate className="space-y-4">
          <Field as="textarea" id="mail-headers" label={f.label} hint={f.hint} rows={10} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={f.placeholder} spellCheck={false} autoComplete="off" autoCapitalize="none" error={error || undefined} className="mono" />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg"><FileSearch className="h-5 w-5" aria-hidden="true" /> {f.analyze}</Button>
            <Button variant="secondary" onClick={loadSample}>{f.example}</Button>
            {raw && <Button variant="ghost" onClick={clear}><Eraser className="h-4 w-4" aria-hidden="true" /> {f.clear}</Button>}
          </div>
        </form>
      </Card>

      <div role="status" aria-live="polite" className="sr-only">{report ? r.announce(report.counts) : ''}</div>

      {report && (
        <>
          <Section title={r.title}>
            <dl>
              {[
                [r.summary.from, report.summary.from],
                [r.summary.to, report.summary.to],
                [r.summary.subject, report.summary.subject],
                [r.summary.date, report.summary.date],
                [r.summary.messageId, report.summary.messageId],
                [r.summary.hops, report.hops.length ? String(report.hops.length) : ''],
                [r.summary.total, report.totalMs == null ? '' : r.path.seconds(Math.max(0, Math.round(report.totalMs / 1000)))],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="grid gap-x-4 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[12rem_1fr]">
                  <dt className="text-meta font-semibold text-muted sm:text-copy">{label}</dt>
                  <dd className="min-w-0 break-words text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <ul className="flex flex-wrap gap-2 pt-1">
              {SEVERITIES.map((s) => {
                const { icon: Icon, color } = SEVERITY[s];
                return (
                  <li key={s} className="tag flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
                    {r.counts[s]} : {report.counts[s] ?? 0}
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section title={r.sections.findings}>
            <ul className="space-y-4">
              {report.findings.map((finding, i) => (
                <Finding key={`${finding.code}-${i}`} finding={finding} describe={(x) => describeHeaderFinding(lang, x)} statusLabels={r.status} fixLabel={r.fix} />
              ))}
            </ul>
          </Section>

          <Section title={r.sections.path}>
            {report.hops.length ? (
              <>
                <p className="text-meta text-muted">{r.path.oldest}</p>
                <Table caption={r.sections.path} columns={['#', r.path.cols.from, r.path.cols.by, r.path.cols.protocol, r.path.cols.tls, r.path.cols.date, r.path.cols.delay]}>
                  {report.hops.map((hop) => (
                    <tr key={hop.index}>
                      <td className="text-body">{hop.index}</td>
                      <td className="mono text-body">{hop.from}</td>
                      <td className="mono text-ink">{hop.by}</td>
                      <td className="text-body">{hop.protocol}</td>
                      <td className="text-body">{hop.tls === null ? r.path.tls.unknown : hop.tls ? r.path.tls.yes : r.path.tls.no}</td>
                      <td className="text-body">{time(hop.date)}</td>
                      <td className="text-body">{delay(hop.delayMs)}</td>
                    </tr>
                  ))}
                </Table>
              </>
            ) : (
              <p className="text-copy text-body">{r.path.none}</p>
            )}
          </Section>

          <Section title={r.sections.auth}>
            {[report.authentication.spf && { ...report.authentication.spf }, ...report.authentication.dkim, report.authentication.dmarc && { ...report.authentication.dmarc }].filter(Boolean).length ? (
              <Table caption={r.sections.auth} columns={[r.auth.cols.method, r.auth.cols.result, r.auth.cols.domain, r.auth.cols.server]}>
                {[report.authentication.spf, ...report.authentication.dkim, report.authentication.dmarc].filter(Boolean).map((a, i) => (
                  <tr key={`${a.method}-${i}`}>
                    <td className="font-semibold uppercase text-ink">{a.method}</td>
                    <td className="text-body">{r.auth.results[a.result] ?? a.result}</td>
                    <td className="mono text-body">{a.props['header.d'] ?? a.props['smtp.mailfrom'] ?? a.props['header.from'] ?? ''}</td>
                    <td className="mono text-body">{a.host}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-copy text-body">{r.auth.none}</p>
            )}
          </Section>

          <Section title={r.sections.dkim}>
            {report.signatures.length ? (
              <Table caption={r.sections.dkim} columns={[r.dkim.cols.domain, r.dkim.cols.selector, r.dkim.cols.algorithm, r.dkim.cols.canon, r.dkim.cols.headers, r.dkim.cols.date, '']}>
                {report.signatures.map((s, i) => (
                  <tr key={`${s.domain}-${s.selector}-${i}`}>
                    <td className="mono text-ink">{s.domain}</td>
                    <td className="mono text-body">{s.selector}</td>
                    <td className="text-body">{s.algorithm}</td>
                    <td className="text-body">{s.canonicalization}</td>
                    <td className="mono text-body">{s.signedHeaders.join(', ')}</td>
                    <td className="text-body">{time(s.timestamp)}</td>
                    <td><a className="tap link" href={`${dnsPath}?d=${encodeURIComponent(s.domain)}&s=${encodeURIComponent(s.selector)}`}>{r.dkim.check}</a></td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-copy text-body">{r.dkim.none}</p>
            )}
          </Section>

          <Section title={r.sections.identity}>
            <p className="text-meta text-muted">{identity.help}</p>
            <dl>
              {[
                [identity.from, report.from.address && `${report.from.name ? `${report.from.name} ` : ''}<${report.from.address}>`],
                [identity.returnPath, report.returnPath.address],
                [identity.replyTo, report.replyTo.address],
                [`${identity.alignment} · ${identity.spf}`, report.alignment.spf.domain && `${report.alignment.spf.domain} : ${report.alignment.spf.aligned ? identity.aligned : report.alignment.spf.passed ? identity.notAligned : identity.failed}`],
                ...report.alignment.dkim.map((d) => [`${identity.alignment} · ${identity.dkim}`, `${d.domain} (${d.selector}) : ${d.passed && d.aligned ? identity.aligned : d.passed ? identity.notAligned : identity.failed}`]),
              ].filter(([, v]) => v).map(([label, value], i) => (
                <div key={`${label}-${i}`} className="grid gap-x-4 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[16rem_1fr]">
                  <dt className="text-meta font-semibold text-muted sm:text-copy">{label}</dt>
                  <dd className="mono min-w-0 break-words text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title={r.sections.spam}>
            {Object.keys(report.spam).length ? (
              <dl>
                {[
                  [r.spam.scl, report.spam.scl !== undefined ? String(report.spam.scl) : ''],
                  [r.spam.spamAssassin, report.spam.spamAssassin],
                  [r.spam.forefront, report.spam.forefront ? Object.entries(report.spam.forefront).map(([k, v]) => `${k}:${v}`).join(' ; ') : ''],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="grid gap-x-4 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[16rem_1fr]">
                    <dt className="text-meta font-semibold text-muted sm:text-copy">{label}</dt>
                    <dd className="mono min-w-0 break-words text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-copy text-body">{r.spam.none}</p>
            )}
          </Section>

          <Section title={`${r.sections.headers} (${r.headers.count(report.headers.length)})`}>
            <details>
              <summary className="tap cursor-pointer font-semibold text-ink">{r.sections.headers}</summary>
              <div className="mt-3">
                <Table caption={r.sections.headers} columns={[r.headers.name, r.headers.value]}>
                  {report.headers.map((h, i) => (
                    <tr key={`${h.name}-${i}`}>
                      <td className="mono whitespace-nowrap text-ink">{h.name}</td>
                      <td className="mono break-all text-body">{h.value}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            </details>
          </Section>
          <p className="text-meta text-muted">{ui.privacy}</p>
        </>
      )}
    </div>
  );
}
