import { useState } from 'react';
import { ChevronRight, CircleAlert, CircleCheck, Copy } from 'lucide-react';
import { describeFinding, DNS_TOOL } from '../../data/dns-tool';
import { cx } from '../../lib/cx';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { SEVERITY } from './severity';

// Zone à défilement horizontal : focalisable au clavier pour pouvoir la faire défiler (exigence d'accessibilité)
function ScrollRegion({ label, children }) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-xl border border-line">
      {children}
    </div>
  );
}

function CopyButton({ text, label, copiedLabel, className }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // presse-papiers indisponible (page non sécurisée, autorisation refusée) : aucun retour, le texte reste sélectionnable
    }
  };
  return (
    <Button variant="ghost" icon onClick={copy} aria-label={copied ? copiedLabel : label} className={className}>
      {copied ? <CircleCheck className="h-4 w-4 text-link" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
    </Button>
  );
}

function Finding({ finding, lang, ui }) {
  const d = describeFinding(lang, finding);
  const { icon: Icon, color } = SEVERITY[finding.severity];
  return (
    <li className="flex gap-3">
      <Icon className={cx('mt-0.5 h-5 w-5 shrink-0', color)} aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold text-ink">
          <span className="sr-only">{ui.results.status[finding.severity]} : </span>
          {d.title}
        </p>
        {d.detail && <p className="text-copy text-body">{d.detail}</p>}
        {d.fix && (
          <p className="mt-1 text-copy text-body">
            <strong className="text-ink">{ui.results.fix} :</strong> {d.fix}
          </p>
        )}
      </div>
    </li>
  );
}

function RecordTable({ records, ui, caption }) {
  const c = ui.results.recordCols;
  if (!records.length) return <p className="text-copy text-muted">{ui.results.noRecords}</p>;
  return (
    <ScrollRegion label={caption}>
      <table className="record-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{c.name}</th>
            <th scope="col">{c.type}</th>
            <th scope="col">{c.ttl}</th>
            <th scope="col">{c.value}</th>
            <th scope="col"><span className="sr-only">{ui.results.copy}</span></th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={`${r.name}-${r.type}-${i}`}>
              <td className="mono text-body">{r.name}</td>
              <td className="font-mono text-body">{r.type}</td>
              <td className="text-body">{r.ttl ?? ''}</td>
              <td className="mono text-ink">{r.value}</td>
              <td className="w-px">
                <CopyButton text={r.value} label={`${ui.results.copy} : ${r.name} ${r.type}`} copiedLabel={ui.results.copied} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

function SpfTree({ node }) {
  const via = node.via === 'root' ? null : node.via;
  return (
    <li>
      <p className="mono text-copy text-ink">
        {node.domain}
        {via && <span className="ml-2 rounded-md border border-line-strong px-1.5 py-0.5 font-sans text-meta text-muted">{via}</span>}
      </p>
      {node.record && <p className="mono mt-1 rounded-lg bg-canvas px-3 py-2 text-meta text-body">{node.record}</p>}
      {node.children.length > 0 && (
        <ul className="mt-2 space-y-3 border-l border-line-strong pl-4">
          {node.children.map((child) => (
            <SpfTree key={child.domain} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Extra({ check, ui }) {
  const r = ui.results;
  const { data } = check;
  if (check.id === 'spf' && data.tree?.record) {
    return (
      <div>
        <p className="mb-2 font-semibold text-ink">
          {r.spfTree} <span className="font-normal text-muted">— {data.lookups} {r.spfLookups}</span>
        </p>
        <ul><SpfTree node={data.tree} /></ul>
      </div>
    );
  }
  if (check.id === 'dkim') {
    return (
      <div>
        <p className="mb-2 text-copy text-body">
          {data.tested} {r.dkimTested} · {data.found.length} {r.dkimFound}
        </p>
        {data.found.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {data.found.map((s) => (
              <li key={s.selector} className="text-copy text-body">
                <span className="mono font-semibold text-ink">{s.selector}</span>
                {s.provider ? ` — ${r.dkimProvider} : ${s.provider}` : ''}
                {s.key?.bits ? ` · ${s.key.type === 'ed25519' ? 'Ed25519' : 'RSA'} ${s.key.bits} bits` : ''}
              </li>
            ))}
          </ul>
        )}
        <details className="text-copy text-body">
          <summary className="tap cursor-pointer text-link">{data.results.length} {r.dkimTested}</summary>
          <ul className="mono mt-1 flex flex-wrap gap-x-4 gap-y-1 text-meta">
            {data.results.map((s) => (
              <li key={s.selector}>{s.selector}{s.found ? ' ✓' : ''}{s.provider ? ` (${s.provider})` : ''}</li>
            ))}
          </ul>
        </details>
        {!data.explicit && <p className="mt-3 text-meta text-muted">{r.dkimHint}</p>}
      </div>
    );
  }
  if (check.id === 'mx' && data.hosts?.length) {
    return (
      <ScrollRegion label={ui.checks.mx.title}>
        <table className="record-table">
          <caption className="sr-only">{ui.checks.mx.title}</caption>
          <thead>
            <tr><th scope="col">MX</th><th scope="col">IPv4</th><th scope="col">IPv6</th></tr>
          </thead>
          <tbody>
            {data.hosts.map((h) => (
              <tr key={h.host}>
                <td className="mono text-ink">{h.host}</td>
                <td className="mono text-body">{h.a.join(', ') || '—'}</td>
                <td className="mono text-body">{h.aaaa.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    );
  }
  if (check.id === 'dmarc' && data.parsed) {
    const rows = Object.entries(data.parsed.tags);
    return (
      <ScrollRegion label={ui.checks.dmarc.title}>
        <table className="record-table compact">
          <caption className="sr-only">{ui.checks.dmarc.title}</caption>
          <tbody>
            {rows.map(([tag, value]) => (
              <tr key={tag}><th scope="row" className="mono">{tag}</th><td className="mono text-ink">{value}</td></tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    );
  }
  return null;
}

/** Une vérification : en-tête cliquable (gravité, titre, première conclusion), puis constats, détails et enregistrements. */
function CheckSection({ check, lang, ui, open, onToggle }) {
  const { icon: Icon, color } = SEVERITY[check.status];
  const headline = [...check.findings].sort((a, b) => ['error', 'warn', 'info', 'ok'].indexOf(a.severity) - ['error', 'warn', 'info', 'ok'].indexOf(b.severity))[0];
  const records = check.records ?? [];

  return (
    <Card as="section" aria-labelledby={`check-${check.id}`} solid className="overflow-hidden">
      <details className="check" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
        <summary className="flex min-h-14 items-center gap-3 px-4 py-3 sm:px-5">
          <ChevronRight className="chevron h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          <Icon className={cx('h-5 w-5 shrink-0', color)} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span id={`check-${check.id}`} className="block font-bold text-ink">
              {ui.checks[check.id].title}
              <span className="sr-only"> — {ui.results.status[check.status]}</span>
            </span>
            {headline && <span className="block truncate text-meta text-muted">{describeFinding(lang, headline).title}</span>}
          </span>
        </summary>
        <div className="space-y-5 border-t border-line px-4 py-4 sm:px-5">
          {ui.checks[check.id].intro && <p className="text-copy text-muted">{ui.checks[check.id].intro}</p>}
          <ul className="space-y-3">
            {check.findings.map((f, i) => (
              <Finding key={`${f.code}-${i}`} finding={f} lang={lang} ui={ui} />
            ))}
          </ul>
          <Extra check={check} ui={ui} />
          {check.id !== 'dkim' || records.length > 0 ? (
            <div>
              <p className="mb-2 font-semibold text-ink">{ui.results.records}</p>
              <RecordTable records={records} ui={ui} caption={`${ui.checks[check.id].title} — ${ui.results.records}`} />
            </div>
          ) : null}
        </div>
      </details>
    </Card>
  );
}

export default function DnsReport({ report, lang, onCopyReport, onCopyLink, headingRef }) {
  const ui = DNS_TOOL[lang].ui;
  const r = ui.results;
  const [openMap, setOpenMap] = useState(() => Object.fromEntries(report.checks.map((c) => [c.id, c.status === 'error' || c.status === 'warn'])));
  const setAll = (value) => setOpenMap(Object.fromEntries(report.checks.map((c) => [c.id, value])));

  if (!report.exists) {
    return (
      <Card solid className="space-y-3 p-5 sm:p-6">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-ink outline-none">{r.title} {report.domain}</h2>
        <ul>{report.findings.map((f, i) => <Finding key={i} finding={f} lang={lang} ui={ui} />)}</ul>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card solid className="space-y-5 p-5 shadow-float sm:p-6">
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="mono text-xl font-bold text-ink outline-none sm:text-2xl">
            {r.title} {report.domain}
          </h2>
          <p className="mt-1 text-meta text-muted">
            {report.queries} {r.queries} {r.took} {(report.tookMs / 1000).toFixed(1)} s
          </p>
        </div>

        <ul className="flex flex-wrap gap-2">
          {['error', 'warn', 'info', 'ok'].map((severity) => {
            const { icon: Icon, color } = SEVERITY[severity];
            const n = report.counts[severity];
            return (
              <li key={severity} className={cx('sev-badge', n === 0 && 'opacity-60', color)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="text-ink">{n} {n === 1 ? r.counts[severity] : r.countsPlural[severity]}</span>
              </li>
            );
          })}
        </ul>

        <p className="text-copy text-body">
          <strong className="text-ink">{r.providers} :</strong> {report.providers.length ? report.providers.join(', ') : r.noProvider}
        </p>

        <div>
          <p className="mb-2 flex items-center gap-2 font-semibold text-ink">
            <CircleAlert className="h-5 w-5 text-warn" aria-hidden="true" /> {r.duplicates}
          </p>
          {report.duplicates.length === 0 ? (
            <p className="text-copy text-body">{r.duplicatesNone}</p>
          ) : (
            <ul className="space-y-3">
              {report.duplicates.map((f, i) => (
                <Finding key={`${f.code}-${i}`} finding={f} lang={lang} ui={ui} />
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="secondary" onClick={onCopyReport}><Copy className="h-4 w-4" aria-hidden="true" /> {r.copyReport}</Button>
          <Button variant="secondary" onClick={onCopyLink}><Copy className="h-4 w-4" aria-hidden="true" /> {r.copyLink}</Button>
          <Button variant="ghost" onClick={() => setAll(true)}>{r.expandAll}</Button>
          <Button variant="ghost" onClick={() => setAll(false)}>{r.collapseAll}</Button>
        </div>
      </Card>

      <div className="space-y-3">
        {report.checks.map((check) => (
          <CheckSection key={check.id} check={check} lang={lang} ui={ui} open={Boolean(openMap[check.id])} onToggle={(open) => setOpenMap((m) => ({ ...m, [check.id]: open }))} />
        ))}
      </div>
      <p className="text-meta text-muted">{r.privacy}</p>
    </div>
  );
}
