// Rapport en Markdown (à coller dans un ticket ou un e-mail), dans la langue de l'interface.
import type { DomainReport } from '@grichard/tools-core/dns/analyze';
import type { Severity } from '@grichard/tools-core/dns/findings';
import type { Lang } from '../../lib/i18n';
import { describeFinding, DNS_TOOL } from './text';

const MARK: Record<Severity, string> = { ok: '✅', info: 'ℹ️', warn: '⚠️', error: '❌' };
const cell = (s: unknown): string => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function buildMarkdown(
  report: DomainReport,
  lang: Lang,
  { url }: { url?: string } = {},
): string {
  const ui = DNS_TOOL[lang].ui;
  const r = ui.results;
  const checks: Record<string, { title: string }> = ui.checks;
  const lines = [`# ${r.title} ${report.domain}`, ''];
  if (url) lines.push(`${url}`, '');
  lines.push(
    `${report.counts.error} ${r.countsPlural.error.toLowerCase()} · ${report.counts.warn} ${r.countsPlural.warn.toLowerCase()} · ${report.counts.info} ${r.countsPlural.info.toLowerCase()} · ${report.counts.ok} ${r.countsPlural.ok.toLowerCase()}`,
    '',
  );
  if (report.providers.length) lines.push(`${r.providers} : ${report.providers.join(', ')}`, '');

  if (report.duplicates.length) {
    lines.push(`## ${r.duplicatesFound}`, '');
    for (const f of report.duplicates)
      lines.push(
        `- ${MARK[f.severity]} ${describeFinding(lang, f).title} — ${describeFinding(lang, f).detail}`,
      );
    lines.push('');
  }

  for (const check of report.checks) {
    lines.push(`## ${MARK[check.status]} ${checks[check.id]?.title ?? check.id}`, '');
    for (const f of check.findings) {
      const d = describeFinding(lang, f);
      lines.push(
        `- ${MARK[f.severity]} **${d.title}**${d.detail ? ` — ${d.detail}` : ''}${d.fix ? ` *${r.fix} : ${d.fix}*` : ''}`,
      );
    }
    if (check.records.length) {
      lines.push(
        '',
        `| ${r.recordCols.name} | ${r.recordCols.type} | ${r.recordCols.ttl} | ${r.recordCols.value} |`,
        '|---|---|---|---|',
      );
      for (const rec of check.records)
        lines.push(
          `| ${cell(rec.name)} | ${rec.type} | ${rec.ttl ?? ''} | \`${cell(rec.value)}\` |`,
        );
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}
