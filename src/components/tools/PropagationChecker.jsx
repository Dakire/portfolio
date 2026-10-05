import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleX, Copy, LoaderCircle, RefreshCw, Search, TriangleAlert } from 'lucide-react';
import { PROPAGATION } from '../../data/tools/propagation';
import { cx } from '../../lib/cx';
import { normalizeDomain } from '../../lib/dns/domain';
import { checkPropagation, PROPAGATION_RESOLVERS, PROPAGATION_TYPES, summarize } from '../../lib/dns/propagation';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Field from '../ui/Field';

const EXAMPLES = [
  ['example.com', 'A'],
  ['gmail.com', 'MX'],
  ['_dmarc.gmail.com', 'TXT'],
];
const REFRESH_MS = 30_000;

const EMPTY_FORM = { domain: '', type: 'A', expected: '' };

// Verdict -> icône et couleur (la couleur ne porte jamais seule l'information : la phrase du verdict est toujours affichée)
const VERDICT_STYLE = {
  pending: { icon: LoaderCircle, color: 'text-brand', spin: true },
  propagated: { icon: CircleCheck, color: 'text-link' },
  consistent: { icon: CircleCheck, color: 'text-link' },
  partial: { icon: TriangleAlert, color: 'text-warn' },
  diverging: { icon: TriangleAlert, color: 'text-warn' },
  none: { icon: CircleX, color: 'text-danger' },
  unreachable: { icon: CircleX, color: 'text-danger' },
};

function verdictText(ui, summary) {
  const v = ui.results.verdicts;
  const c = summary.counts;
  switch (summary.verdict) {
    case 'pending': return v.pending(c.total - c.pending, c.total);
    case 'propagated': return v.propagated(c.matches);
    case 'partial': return v.partial(c.matches, c.usable);
    case 'none': return v.none;
    case 'consistent': return v.consistent(c.usable);
    case 'diverging': return v.diverging(c.groups, c.usable);
    default: return v.unreachable;
  }
}

/** Pastille de la ligne d'un résolveur : icône, libellé (toujours écrit) et couleur. */
function badgeOf(row, summary, ui) {
  const b = ui.results.badges;
  if (row.state === 'pending') return { icon: LoaderCircle, label: b.pending, color: 'text-muted', spin: true };
  if (row.state === 'error' || row.state === 'servfail' || row.state === 'refused') return { icon: TriangleAlert, label: b.failed, color: 'text-warn' };
  if (summary.expected) return row.match ? { icon: CircleCheck, label: b.match, color: 'text-link' } : { icon: TriangleAlert, label: b.mismatch, color: 'text-warn' };
  if (summary.counts.groups === 1) return { icon: CircleCheck, label: b.same, color: 'text-link' };
  return row.inMajority ? { icon: CircleCheck, label: b.majority, color: 'text-link' } : { icon: TriangleAlert, label: b.different, color: 'text-warn' };
}

function ResolverRow({ row, summary, ui, countryName }) {
  const { resolver } = row;
  const badge = badgeOf(row, summary, ui);
  const Icon = badge.icon;
  const r = ui.results;
  const answered = row.state === 'answer';
  return (
    <li className="grid gap-x-4 gap-y-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[12rem_1fr_9rem] sm:items-start">
      <div>
        <p className="font-semibold text-ink">{resolver.name}</p>
        <p className="text-meta text-muted">{[countryName, resolver.ip].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="min-w-0">
        {answered ? (
          <ul>
            {row.values.map((value) => (
              <li key={value} className="mono text-ink">{value}</li>
            ))}
          </ul>
        ) : (
          <p className="text-copy text-muted">{r.states[row.state]}</p>
        )}
        {row.ms !== null && (
          <p className="mt-0.5 text-meta text-muted">{[answered && r.ttl(row.ttl), r.ms(row.ms)].filter(Boolean).join(' · ')}</p>
        )}
      </div>
      <p className={cx('flex items-center gap-1.5 text-copy font-medium sm:justify-end', badge.color)}>
        <Icon className={cx('h-4 w-4 shrink-0', badge.spin && 'animate-spin')} aria-hidden="true" />
        <span className="text-ink">{badge.label}</span>
      </p>
    </li>
  );
}

/** Propagation DNS : la même question posée à plusieurs résolveurs publics, réponses comparées. Les paramètres ?d= (nom), ?t= (type) et ?e= (valeur attendue) rendent une vérification partageable. */
export default function PropagationChecker({ lang }) {
  const ui = PROPAGATION[lang].ui;
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [query, setQuery] = useState(null); // { domain, type, expected } de la vérification affichée
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [auto, setAuto] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);
  const headingRef = useRef(null);
  const focusOnDone = useRef(false);

  const countryNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang], { type: 'region' });
    } catch {
      return null;
    }
  }, [lang]);

  const run = useCallback(async (rawDomain, type, rawExpected, { refresh = false } = {}) => {
    const parsed = normalizeDomain(rawDomain);
    if (parsed.error) {
      setFormError(parsed.error);
      return;
    }
    setFormError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const next = { domain: parsed.domain, type, expected: String(rawExpected ?? '').trim() };
    setForm((f) => ({ ...f, domain: next.domain }));
    setQuery(next);
    setRunning(true);
    if (!refresh) setResults([]); // une relance garde les lignes affichées jusqu'à l'arrivée de chaque nouvelle réponse

    // Adresse partageable : la vérification se relance à l'ouverture du lien
    try {
      const url = new URL(window.location.href);
      url.search = '';
      url.searchParams.set('d', next.domain);
      url.searchParams.set('t', type);
      if (next.expected) url.searchParams.set('e', next.expected);
      window.history.replaceState(null, '', url);
    } catch {
      // environnement sans History API : sans conséquence
    }

    try {
      await checkPropagation({
        domain: next.domain,
        type,
        signal: controller.signal,
        onResult: (result) => {
          if (!controller.signal.aborted) setResults((previous) => [...previous.filter((r) => r.id !== result.id), result]);
        },
      });
    } catch {
      return; // annulée par une nouvelle vérification ou par la fermeture de la page
    }
    if (!controller.signal.aborted) setRunning(false);
  }, []);

  // Ouverture d'un lien partagé : champs préremplis et vérification lancée. L'URL est un système externe : la synchronisation
  // ne peut avoir lieu qu'après l'hydratation (le HTML pré-rendu est identique pour tous), donc dans un effet.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (d) {
      const t = PROPAGATION_TYPES.includes(params.get('t')) ? params.get('t') : 'A';
      const e = params.get('e') ?? '';
      // oxlint-disable-next-line react/set-state-in-effect
      setForm({ domain: d, type: t, expected: e });
      focusOnDone.current = true;
      run(d, t, e);
    }
    return () => abortRef.current?.abort();
  }, [run]);

  const summary = useMemo(() => (query ? summarize(PROPAGATION_RESOLVERS, results, query.type, query.expected) : null), [query, results]);

  // Le focus passe au titre quand une vérification demandée par l'utilisateur se termine (pas à chaque relance automatique)
  useEffect(() => {
    if (!running && focusOnDone.current) {
      focusOnDone.current = false;
      headingRef.current?.focus();
    }
  }, [running]);

  // Relance automatique : toutes les 30 s, jusqu'à ce que la valeur attendue soit partout
  const verdict = summary?.verdict;
  useEffect(() => {
    if (!auto || running || !query || verdict === 'propagated') return undefined;
    const timer = setTimeout(() => run(query.domain, query.type, query.expected, { refresh: true }), REFRESH_MS);
    return () => clearTimeout(timer);
  }, [auto, running, query, verdict, run]);

  const submit = (e) => {
    e.preventDefault();
    focusOnDone.current = true;
    run(form.domain, form.type, form.expected);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // presse-papiers indisponible : sans conséquence
    }
  };

  const style = summary ? VERDICT_STYLE[summary.verdict] : null;
  const VerdictIcon = style?.icon;
  const text = summary ? verdictText(ui, summary) : '';
  const hints = [];
  if (summary && summary.verdict !== 'pending') {
    if (summary.verdict === 'partial') hints.push(ui.results.hints.partial);
    if (summary.verdict === 'diverging' && (query.type === 'A' || query.type === 'AAAA')) hints.push(ui.results.hints.loadBalanced);
    if (summary.counts.failed > 0) hints.push(ui.results.hints.failed(summary.counts.failed));
  }

  return (
    <div className="space-y-6">
      <Card solid className="p-5 shadow-float sm:p-6">
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr_1.4fr]">
            <Field
              id="prop-domain"
              label={ui.form.domain}
              required
              value={form.domain}
              onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
              placeholder={ui.form.domainPlaceholder}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="url"
              hint={ui.form.domainHint}
              error={formError ? ui.errors[formError] : undefined}
            />
            <div>
              <label htmlFor="prop-type" className="mb-1.5 block text-sm font-medium text-ink">{ui.form.type}</label>
              <select id="prop-type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="field">
                {PROPAGATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field
              id="prop-expected"
              label={ui.form.expected}
              value={form.expected}
              onChange={(e) => setForm((f) => ({ ...f, expected: e.target.value }))}
              placeholder={ui.form.placeholders[form.type]}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              hint={ui.form.expectedHint}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" loading={running && results.length === 0}>
              <Search className="h-5 w-5" aria-hidden="true" /> {ui.form.submit}
            </Button>
            <p className="flex flex-wrap items-center gap-x-2 text-meta text-muted">
              {ui.form.example}
              {EXAMPLES.map(([domain, type]) => (
                <button
                  key={`${domain}-${type}`}
                  type="button"
                  className="tap link font-mono"
                  onClick={() => {
                    setForm({ domain, type, expected: '' });
                    focusOnDone.current = true;
                    run(domain, type, '');
                  }}
                >
                  {domain} ({type})
                </button>
              ))}
            </p>
          </div>
        </form>
      </Card>

      {/* Annonces pour les lecteurs d'écran : début, fin et copie du lien */}
      <div role="status" aria-live="polite" className="sr-only">{copied ? ui.results.copied : running ? ui.form.running : text}</div>

      {summary && (
        <Card solid className="space-y-4 p-5 shadow-float sm:p-6">
          <div>
            <h2 ref={headingRef} tabIndex={-1} className="mono text-xl font-bold text-ink outline-none sm:text-2xl">
              {ui.results.title} {query.domain} <span className="font-sans text-muted">({query.type})</span>
            </h2>
            <p className="mt-3 flex items-start gap-2 text-lg font-semibold text-ink">
              <VerdictIcon className={cx('mt-1 h-5 w-5 shrink-0', style.color, style.spin && 'animate-spin')} aria-hidden="true" />
              <span>{text}</span>
            </p>
            {hints.map((hint) => <p key={hint} className="mt-1 text-meta text-muted">{hint}</p>)}
          </div>

          <ul>
            {summary.rows.map((row) => (
              <ResolverRow key={row.resolver.id} row={row} summary={summary} ui={ui} countryName={countryNames?.of(row.resolver.country) ?? row.resolver.country} />
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={() => { focusOnDone.current = true; run(query.domain, query.type, query.expected, { refresh: true }); }} loading={running}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> {ui.results.recheck}
            </Button>
            <Button variant="secondary" onClick={copyLink}><Copy className="h-4 w-4" aria-hidden="true" /> {ui.results.copyLink}</Button>
            <Button variant="ghost" href={`${ui.results.lookupPath}?d=${encodeURIComponent(query.domain)}`}>{ui.results.lookup}</Button>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg py-1 text-copy text-body">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--brand-strong)]" />
              <span>{ui.results.auto}</span>
            </label>
          </div>
          <p className="text-meta text-muted">{ui.results.note}</p>
        </Card>
      )}
      <p className="text-meta text-muted">{ui.privacy}</p>
    </div>
  );
}
