import { analyzeDomain, STEPS, type DomainReport } from '@grichard/tools-core/dns/analyze';
import { normalizeDomain, parseSelectors } from '@grichard/tools-core/dns/domain';
import { createResolver, DnsUnavailableError } from '@grichard/tools-core/dns/resolver';
import { Check, LoaderCircle, Search } from 'lucide-preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import Button from '../ui/Button';
import Field from '../ui/Field';
import DnsReport from './DnsReport';
import { buildMarkdown } from './report';
import { DNS_TOOL } from './text';

const EXAMPLES = ['grichard.eu', 'gmail.com', 'microsoft.com'];

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

type Status = 'idle' | 'running' | 'done' | 'error';

/** L'outil complet : formulaire, progression, rapport. Les paramètres ?d= (domaine) et ?s= (sélecteurs) rendent une analyse partageable. */
export default function DnsChecker({ lang }: { lang: Lang }) {
  const ui = DNS_TOOL[lang].ui;
  const errors: Record<string, string> = ui.errors;
  const steps: Record<string, string> = ui.progress.steps;
  const [domain, setDomain] = useState('');
  const [selectors, setSelectors] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<Record<string, 'start' | 'done'>>({});
  const [report, setReport] = useState<DomainReport | null>(null);
  const [failure, setFailure] = useState<'unavailable' | 'generic' | null>(null);
  const [notice, setNotice] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const run = useCallback(
    async (rawDomain: string, rawSelectors: string) => {
      const parsed = normalizeDomain(rawDomain);
      if ('error' in parsed) {
        setFormError(parsed.error);
        return;
      }
      setFormError(null);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const list = parseSelectors(rawSelectors);
      setDomain(parsed.domain);
      setStatus('running');
      setProgress({});
      setReport(null);
      setFailure(null);
      setNotice('');

      // Adresse partageable : l'analyse se relance à l'ouverture du lien
      try {
        const url = new URL(window.location.href);
        url.search = '';
        url.searchParams.set('d', parsed.domain);
        if (list.length) url.searchParams.set('s', list.join(','));
        window.history.replaceState(null, '', url);
      } catch {
        // environnement sans History API : sans conséquence
      }

      try {
        const result = await analyzeDomain({
          domain: parsed.domain,
          selectors: list,
          resolver: createResolver({ signal: controller.signal }),
          onProgress: ({ id, state }) => setProgress((p) => ({ ...p, [id]: state })),
        });
        if (controller.signal.aborted) return;
        setReport(result);
        setStatus('done');
        setNotice(ui.results.announce(result.counts));
      } catch (error) {
        if (controller.signal.aborted) return;
        setFailure(error instanceof DnsUnavailableError ? 'unavailable' : 'generic');
        setStatus('error');
      }
    },
    [ui],
  );

  // Ouverture d'un lien partagé : champs préremplis et analyse lancée. L'URL est un système externe : la synchronisation
  // ne peut avoir lieu qu'après l'hydratation (le HTML pré-rendu est identique pour tous), donc dans un effet.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (d) {
      setSelectors(params.get('s') ?? '');
      void run(d, params.get('s') ?? '');
    }
    return () => abortRef.current?.abort();
  }, [run]);

  // Le focus passe au titre du rapport : le clavier et les lecteurs d'écran arrivent directement sur le résultat
  useEffect(() => {
    if (status === 'done') headingRef.current?.focus();
  }, [status]);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice((current) => (current === message ? '' : current)), 2500);
  };

  const running = status === 'running';
  return (
    <div class="stack">
      <div class="tool">
        <form
          class="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void run(domain, selectors);
          }}
        >
          <div class="form-row form-row-dns">
            <Field
              id="dns-domain"
              label={ui.form.domain}
              required
              value={domain}
              onInput={(e) => setDomain(e.currentTarget.value)}
              placeholder={ui.form.domainPlaceholder}
              autoComplete="off"
              autoCapitalize="none"
              spellcheck={false}
              inputMode="url"
              hint={ui.form.domainHint}
              error={formError ? errors[formError] : undefined}
            />
            <Field
              id="dns-selector"
              label={ui.form.selector}
              value={selectors}
              onInput={(e) => setSelectors(e.currentTarget.value)}
              placeholder={ui.form.selectorPlaceholder}
              autoComplete="off"
              autoCapitalize="none"
              spellcheck={false}
              hint={ui.form.selectorHint}
            />
          </div>
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
            <p class="row-actions note">
              {ui.form.example}
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  class="link-button mono"
                  onClick={() => {
                    setSelectors('');
                    void run(example, '');
                  }}
                >
                  {example}
                </button>
              ))}
            </p>
          </div>
        </form>
      </div>

      {/* Annonces pour les lecteurs d'écran : début, fin et copies */}
      <div role="status" aria-live="polite" class="visually-hidden">
        {running ? ui.progress.title : notice}
      </div>

      {running && (
        <div class="tool" aria-hidden="true">
          <p class="strong">{ui.progress.title}…</p>
          <ol class="progress-list">
            {STEPS.map((step) => (
              <li key={step}>
                {progress[step] === 'done' ? (
                  <Check size={16} class="tone-ok" />
                ) : progress[step] === 'start' ? (
                  <LoaderCircle size={16} class="spin" />
                ) : (
                  <span class="progress-dot" />
                )}
                <span class={progress[step] === 'done' ? 'note' : undefined}>
                  {steps[step] ?? step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {status === 'error' && failure && (
        <p role="alert" class="alert-box">
          {errors[failure]}
        </p>
      )}

      {report && (
        <DnsReport
          report={report}
          lang={lang}
          headingRef={headingRef}
          onCopyLink={async () =>
            flash((await copyText(window.location.href)) ? ui.results.copied : '')
          }
          onCopyReport={async () =>
            flash(
              (await copyText(buildMarkdown(report, lang, { url: window.location.href })))
                ? ui.results.copied
                : '',
            )
          }
        />
      )}
    </div>
  );
}
