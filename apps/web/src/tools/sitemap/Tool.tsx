import type { Lang } from '../../lib/i18n';
import ServerTool from '../server/ServerTool';
import ScrollRegion from '../ui/ScrollRegion';
import { describeCheck, type SitemapReport } from './checks';
import { SITEMAP_TOOL } from './text';

const kib = (bytes: number) =>
  bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} Mio`
    : `${Math.max(1, Math.round(bytes / 1024))} Kio`;

/** Tableaux propres au sitemap : fichiers lus et échantillon de pages testées. */
function Details({ report, lang }: { report: SitemapReport; lang: Lang }) {
  const ui = SITEMAP_TOOL[lang].ui.tables;
  const status = SITEMAP_TOOL[lang].ui.errors;
  return (
    <>
      <p>
        {ui.discoveryLabel} : <strong>{ui.discovery[report.discovery.method]}</strong>
      </p>
      {report.files.length > 0 && (
        <div class="stack">
          <h3 id="sitemap-files">{ui.files}</h3>
          <ScrollRegion label={ui.files}>
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">{ui.file}</th>
                  <th scope="col">{ui.httpStatus}</th>
                  <th scope="col">{ui.type}</th>
                  <th scope="col">{ui.urls}</th>
                  <th scope="col">{ui.size}</th>
                </tr>
              </thead>
              <tbody>
                {report.files.map((file) => (
                  <tr key={file.url}>
                    <th scope="row" class="mono seo-detail">
                      {file.depth > 0 && <span aria-hidden="true">{'↳ '.repeat(file.depth)}</span>}
                      {file.url}
                    </th>
                    <td>
                      {file.status ?? (file.error ? (status[file.error] ?? file.error) : '—')}
                    </td>
                    <td class="mono">
                      {file.type ?? '—'}
                      {file.gzip ? ' · gzip' : ''}
                    </td>
                    <td>{file.type === 'sitemapindex' ? '—' : file.count}</td>
                    <td>{file.uncompressedBytes ? kib(file.uncompressedBytes) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </div>
      )}
      {report.sample.length > 0 && (
        <div class="stack">
          <h3 id="sitemap-sample">{ui.sample}</h3>
          <ScrollRegion label={ui.sample}>
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">{ui.page}</th>
                  <th scope="col">{ui.result}</th>
                </tr>
              </thead>
              <tbody>
                {report.sample.map((row) => {
                  const problems = [
                    row.error
                      ? (status[row.error] ?? row.error)
                      : row.status && row.status >= 400
                        ? `HTTP ${row.status}`
                        : '',
                    row.redirects > 0 ? ui.redirect : '',
                    row.noindex ? ui.noindex : '',
                    row.canonicalMismatch ? ui.canonical : '',
                  ].filter(Boolean);
                  return (
                    <tr key={row.url}>
                      <th scope="row" class="mono seo-detail">
                        {row.url}
                      </th>
                      <td class={problems.length ? 'tone-danger' : 'tone-ok'}>
                        {problems.length ? problems.join(', ') : `${ui.ok} (${row.status})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollRegion>
        </div>
      )}
    </>
  );
}

/** Vérificateur de sitemap : découverte, fichiers, URL et échantillon, contrôlés par tools.php. */
export default function SitemapTool({ lang }: { lang: Lang }) {
  return (
    <ServerTool<SitemapReport>
      lang={lang}
      tool="sitemap"
      filePrefix="verification-sitemap"
      texts={SITEMAP_TOOL[lang].ui}
      describe={describeCheck}
      extra={(report) => <Details report={report} lang={lang} />}
    />
  );
}
