import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, Search } from 'lucide-react';
import { DNS_TOOL } from '../../data/dns-tool';
import { analyzeDomain, STEPS } from '../../lib/dns/analyze';
import { normalizeDomain, parseSelectors } from '../../lib/dns/domain';
import { buildMarkdown } from '../../lib/dns/report';
import { createResolver, DnsUnavailableError } from '../../lib/dns/resolver';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Field from '../ui/Field';
import DnsReport from './DnsReport';

const EXAMPLES = ['grichard.eu', 'gmail.com', 'microsoft.com'];

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/** L'outil complet : formulaire, progression, rapport. Les paramètres ?d= (domaine) et ?s= (sélecteurs) rendent une analyse partageable. */
export default function DnsChecker({ lang }) {
  const ui = DNS_TOOL[lang].ui;
  const [domain, setDomain] = useState('');
  const [selectors, setSelectors] = useState('');
  const [formError, setFormError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [progress, setProgress] = useState({});
  const [report, setReport] = useState(null);
  const [failure, setFailure] = useState(null);
  const [notice, setNotice] = useState('');
  const abortRef = useRef(null);
  const headingRef = useRef(null);
  const lastQuery = useRef(null);

  const run = useCallback(
    async (rawDomain, rawSelectors) => {
      const parsed = normalizeDomain(rawDomain);
      if (parsed.error) {
        setFormError(parsed.error);
        return;
      }
      setFormError(null);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const list = parseSelectors(rawSelectors);
      lastQuery.current = { domain: parsed.domain, selectors: list };
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
      // oxlint-disable-next-line react/set-state-in-effect
      setSelectors(params.get('s') ?? '');
      run(d, params.get('s') ?? '');
    }
    return () => abortRef.current?.abort();
  }, [run]);

  // Le focus passe au titre du rapport : le clavier et les lecteurs d'écran arrivent directement sur le résultat
  useEffect(() => {
    if (status === 'done') headingRef.current?.focus();
  }, [status]);

  const onSubmit = (e) => {
    e.preventDefault();
    run(domain, selectors);
  };

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice((current) => (current === message ? '' : current)), 2500);
  };

  const running = status === 'running';
  return (
    <div className="space-y-6">
      <Card solid className="p-5 shadow-float sm:p-6">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div>
              <Field
                id="dns-domain"
                label={ui.form.domain}
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder={ui.form.domainPlaceholder}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="url"
                hint={ui.form.domainHint}
                error={formError ? ui.errors[formError] : undefined}
              />
            </div>
            <div>
              <Field
                id="dns-selector"
                label={ui.form.selector}
                value={selectors}
                onChange={(e) => setSelectors(e.target.value)}
                placeholder={ui.form.selectorPlaceholder}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                hint={ui.form.selectorHint}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" loading={running}>
              {running ? ui.form.running : (<><Search className="h-5 w-5" aria-hidden="true" /> {ui.form.submit}</>)}
            </Button>
            <p className="flex flex-wrap items-center gap-x-2 text-meta text-muted">
              {ui.form.example}
              {EXAMPLES.map((example) => (
                <button key={example} type="button" className="tap link font-mono" onClick={() => { setSelectors(''); run(example, ''); }}>
                  {example}
                </button>
              ))}
            </p>
          </div>
        </form>
      </Card>

      {/* Annonces pour les lecteurs d'écran : début, fin et copies */}
      <div role="status" aria-live="polite" className="sr-only">{running ? ui.progress.title : notice}</div>

      {running && (
        <Card solid className="p-5 sm:p-6" aria-hidden="true">
          <p className="mb-3 font-semibold text-ink">{ui.progress.title}…</p>
          <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {STEPS.map((step) => (
              <li key={step} className="flex items-center gap-2 text-copy text-body">
                {progress[step] === 'done' ? (
                  <Check className="h-4 w-4 text-link" />
                ) : progress[step] === 'start' ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-brand" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-line-strong" />
                )}
                <span className={progress[step] === 'done' ? 'text-muted' : undefined}>{ui.progress.steps[step]}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {status === 'error' && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-copy font-medium text-danger">{ui.errors[failure]}</p>
      )}

      {report && (
        <DnsReport
          report={report}
          lang={lang}
          headingRef={headingRef}
          onCopyLink={async () => flash((await copyText(window.location.href)) ? ui.results.copied : '')}
          onCopyReport={async () => flash((await copyText(buildMarkdown(report, lang, { url: window.location.href }))) ? ui.results.copied : '')}
        />
      )}
    </div>
  );
}
