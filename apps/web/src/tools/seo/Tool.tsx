import {
  CircleCheck,
  CircleX,
  Download,
  Info,
  Printer,
  RefreshCw,
  Search,
  TriangleAlert,
} from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useTurnstile } from '../../contact/useTurnstile';
import { withBase } from '../../lib/base';
import type { Lang } from '../../lib/i18n';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { downloadBlob } from '../ui/download';
import { describeCheck, type CheckStatus, type SeoCheck, type SeoReport } from './checks';
import { SEO_TOOL } from './text';

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined;
const ENDPOINT = withBase('/tools.php');

const ICONS = {
  pass: { icon: CircleCheck, tone: 'tone-ok' },
  info: { icon: Info, tone: 'tone-info' },
  warn: { icon: TriangleAlert, tone: 'tone-warn' },
  fail: { icon: CircleX, tone: 'tone-danger' },
} as const satisfies Record<CheckStatus, { icon: unknown; tone: string }>;

const SEVERITY_ORDER = { critical: 0, important: 1, info: 2 } as const;
const STATUS_ORDER = { fail: 0, warn: 1, info: 2, pass: 3 } as const;

type Status = 'idle' | 'running' | 'done' | 'error';

/** Appel de tools.php : jeton CSRF (cookie + en-tête) demandé une fois par page, puis l'analyse. */
async function requestReport(
  url: string,
  turnstileToken: string,
  csrf: { current: string },
): Promise<{ report: SeoReport } | { code: string }> {
  if (!csrf.current) {
    const res = await fetch(`${ENDPOINT}?csrf`, { credentials: 'same-origin' });
    const body = (await res.json()) as { data?: { csrf?: string } };
    csrf.current = body.data?.csrf ?? '';
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf.current },
    body: JSON.stringify({ tool: 'seo', url, turnstileToken }),
  });
  const body = (await res.json().catch(() => ({}))) as { data?: SeoReport; code?: string };
  if (res.ok && body.data) return { report: body.data };
  if (body.code === 'csrf') csrf.current = '';
  return { code: body.code ?? (res.status === 429 ? 'rate_limited' : 'generic') };
}

function CheckItem({ check, lang, showFix }: { check: SeoCheck; lang: Lang; showFix: boolean }) {
  const ui = SEO_TOOL[lang].ui;
  const d = describeCheck(check, lang);
  const { icon: Icon, tone } = ICONS[check.status];
  return (
    <li class="finding">
      <Icon size={20} class={`finding-icon ${tone}`} aria-hidden="true" />
      <div>
        <p class="finding-title">
          <span class="visually-hidden">{ui.status[check.status]} : </span>
          {d.title}{' '}
          {check.status !== 'pass' && check.status !== 'info' && (
            <span class={`tag seo-severity seo-${check.severity}`}>
              {ui.severity[check.severity]}
            </span>
          )}
        </p>
        {d.detail && <p class="seo-detail">{d.detail}</p>}
        {showFix && d.fix && (
          <p>
            <strong>{ui.results.fix} :</strong> <span class="seo-fix">{d.fix}</span>
          </p>
        )}
      </div>
    </li>
  );
}

function Report({
  report,
  lang,
  headingRef,
  onAgain,
}: {
  report: SeoReport;
  lang: Lang;
  headingRef: { current: HTMLHeadingElement | null };
  onAgain: () => void;
}) {
  const ui = SEO_TOOL[lang].ui;
  const [showPassed, setShowPassed] = useState(false);
  const sorted = [...report.checks].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
  const toFix = sorted.filter((c) => c.status === 'fail' || c.status === 'warn');
  const passed = sorted.filter((c) => c.status === 'pass' || c.status === 'info');
  const tone = report.score >= 80 ? 'tone-ok' : report.score >= 50 ? 'tone-warn' : 'tone-danger';

  const print = () => {
    setShowPassed(true);
    setTimeout(() => window.print(), 50); // laisse le temps d'afficher les contrôles conformes
  };
  const exportJson = () => {
    const host = (() => {
      try {
        return new URL(report.finalUrl).hostname;
      } catch {
        return 'page';
      }
    })();
    downloadBlob(
      `rapport-seo-${host}-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          tool: 'https://grichard.eu/outils/seo/',
          ...report,
        },
        null,
        2,
      ),
      'application/json',
    );
  };

  return (
    <section class="tool seo-report stack" aria-labelledby="seo-report-title">
      <div class="seo-head">
        <div class="stack">
          <h2 id="seo-report-title" tabIndex={-1} ref={headingRef}>
            {ui.results.title}
          </h2>
          <dl class="seo-urls">
            <dt>{ui.results.analysed}</dt>
            <dd class="mono">{report.url}</dd>
            {report.finalUrl !== report.url && (
              <>
                <dt>{ui.results.finalUrl}</dt>
                <dd class="mono">{report.finalUrl}</dd>
              </>
            )}
          </dl>
          <p class="note">
            {ui.results.summary(
              report.summary.critical,
              report.summary.important,
              report.summary.info,
            )}
          </p>
        </div>
        <div class={`seo-score ${tone}`}>
          <p>
            <span class="seo-score-value">{report.score}</span>
            <span class="seo-score-of"> / 100</span>
          </p>
          <meter
            min={0}
            max={100}
            low={50}
            high={80}
            optimum={100}
            value={report.score}
            aria-label={`${ui.results.score} ${report.score} ${ui.results.scoreOf}`}
          />
        </div>
      </div>

      <div class="row no-print">
        <Button onClick={exportJson}>
          <Download size={18} aria-hidden="true" /> {ui.results.exportJson}
        </Button>
        <Button onClick={print}>
          <Printer size={18} aria-hidden="true" /> {ui.results.print}
        </Button>
        <Button variant="ghost" onClick={onAgain}>
          <RefreshCw size={18} aria-hidden="true" /> {ui.results.again}
        </Button>
      </div>

      <h3>
        {ui.results.toFix} ({toFix.length})
      </h3>
      {toFix.length ? (
        <ul class="findings" role="list">
          {toFix.map((check) => (
            <CheckItem key={check.id} check={check} lang={lang} showFix />
          ))}
        </ul>
      ) : (
        <p>{ui.results.none}</p>
      )}

      <details
        class="seo-passed"
        open={showPassed}
        onToggle={(e) => setShowPassed(e.currentTarget.open)}
      >
        <summary>
          {ui.results.passed} ({passed.length})
        </summary>
        <ul class="findings" role="list">
          {passed.map((check) => (
            <CheckItem key={check.id} check={check} lang={lang} showFix={false} />
          ))}
        </ul>
      </details>
    </section>
  );
}

/** Rapport SEO : formulaire (adresse + Turnstile), appel de tools.php, rapport classé par priorité. */
export default function SeoTool({ lang }: { lang: Lang }) {
  const ui = SEO_TOOL[lang].ui;
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [report, setReport] = useState<SeoReport | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const csrf = useRef('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const { widgetRef, token, ready, loadFailed, retry, reset } = useTurnstile({
    siteKey: TURNSTILE_SITE_KEY,
    lang,
  });

  useEffect(() => {
    if (status === 'done') headingRef.current?.focus();
  }, [status]);

  const submit = async () => {
    const value = url.trim();
    if (!value) {
      setFormError('empty');
      inputRef.current?.focus();
      return;
    }
    if (TURNSTILE_SITE_KEY && !token) {
      setFormError(loadFailed ? 'captchaUnavailable' : 'captchaMissing');
      return;
    }
    setFormError(null);
    setErrorCode(null);
    setReport(null);
    setStatus('running');
    setNotice(ui.form.running);
    try {
      const result = await requestReport(value, token, csrf);
      if ('report' in result) {
        setReport(result.report);
        setStatus('done');
        const toFix = result.report.checks.filter(
          (c) => c.status === 'fail' || c.status === 'warn',
        ).length;
        setNotice(ui.results.announce(result.report.score, toFix));
      } else {
        setErrorCode(result.code);
        setStatus('error');
        setNotice(ui.errors[result.code] ?? ui.errors.generic ?? '');
      }
    } catch {
      setErrorCode('generic');
      setStatus('error');
      setNotice(ui.errors.generic ?? '');
    } finally {
      reset(); // un jeton Turnstile ne sert qu'une fois
    }
  };

  const running = status === 'running';
  return (
    <div class="stack">
      <div class="tool no-print">
        <form
          class="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field
            id="seo-url"
            label={ui.form.url}
            required
            value={url}
            fieldRef={inputRef}
            onInput={(e) => setUrl(e.currentTarget.value)}
            placeholder={ui.form.urlPlaceholder}
            type="url"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellcheck={false}
            hint={ui.form.urlHint}
            error={formError === 'empty' ? ui.errors.empty : undefined}
          />
          {TURNSTILE_SITE_KEY && (
            <div class="captcha">
              <div
                ref={widgetRef}
                role="group"
                aria-label={ui.form.captchaLabel}
                class="captcha-widget"
              />
              {!ready && !loadFailed && (
                <p class="captcha-loading note" role="status">
                  {ui.form.captchaLoading}
                </p>
              )}
              {loadFailed && (
                <Button onClick={retry}>
                  <RefreshCw size={18} aria-hidden="true" /> {ui.form.retryCaptcha}
                </Button>
              )}
            </div>
          )}
          {formError && formError !== 'empty' && (
            <p class="field-error" role="alert">
              {ui.errors[formError]}
            </p>
          )}
          <div class="row-actions">
            <Button type="submit" variant="primary" class="btn-lg" loading={running}>
              {running ? (
                ui.form.running
              ) : (
                <>
                  <Search size={20} aria-hidden="true" /> {ui.form.submit}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Région live stable : annonce le début, la fin ou l'erreur */}
      <div role="status" aria-live="polite" class="visually-hidden">
        {notice}
      </div>

      {status === 'error' && errorCode && (
        <p role="alert" class="alert-box">
          {ui.errors[errorCode] ?? ui.errors.generic}
        </p>
      )}

      {report && (
        <Report
          report={report}
          lang={lang}
          headingRef={headingRef}
          onAgain={() => {
            setReport(null);
            setStatus('idle');
            inputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
