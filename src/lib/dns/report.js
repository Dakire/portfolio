// Rapport en Markdown (à coller dans un ticket ou un e-mail), dans la langue de l'interface.
import { describeFinding, DNS_TOOL } from '../../data/dns-tool.js';

const MARK = { ok: '✅', info: 'ℹ️', warn: '⚠️', error: '❌' };
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function buildMarkdown(report, lang, { url } = {}) {
  const ui = DNS_TOOL[lang].ui;
  const r = ui.results;
  const lines = [`# ${r.title} ${report.domain}`, ''];
  if (url) lines.push(`${url}`, '');
  lines.push(`${report.counts.error} ${r.countsPlural.error.toLowerCase()} · ${report.counts.warn} ${r.countsPlural.warn.toLowerCase()} · ${report.counts.info} ${r.countsPlural.info.toLowerCase()} · ${report.counts.ok} ${r.countsPlural.ok.toLowerCase()}`, '');
  if (report.providers?.length) lines.push(`${r.providers} : ${report.providers.join(', ')}`, '');

  if (report.duplicates?.length) {
    lines.push(`## ${r.duplicatesFound}`, '');
    for (const f of report.duplicates) lines.push(`- ${MARK[f.severity]} ${describeFinding(lang, f).title} — ${describeFinding(lang, f).detail}`);
    lines.push('');
  }

  for (const check of report.checks) {
    lines.push(`## ${MARK[check.status]} ${ui.checks[check.id].title}`, '');
    for (const f of check.findings) {
      const d = describeFinding(lang, f);
      lines.push(`- ${MARK[f.severity]} **${d.title}**${d.detail ? ` — ${d.detail}` : ''}${d.fix ? ` *${r.fix} : ${d.fix}*` : ''}`);
    }
    if (check.records?.length) {
      lines.push('', `| ${r.recordCols.name} | ${r.recordCols.type} | ${r.recordCols.ttl} | ${r.recordCols.value} |`, '|---|---|---|---|');
      for (const rec of check.records) lines.push(`| ${cell(rec.name)} | ${rec.type} | ${rec.ttl ?? ''} | \`${cell(rec.value)}\` |`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}
