import { normalizeDomain } from '@grichard/tools-core/dns/domain';
import {
  checkPropagation,
  PROPAGATION_RESOLVERS,
  PROPAGATION_TYPES,
  summarize,
  type PropagationType,
  type ResolverResult,
  type Verdict,
} from '@grichard/tools-core/dns/propagation';
import {
  CircleCheck,
  CircleX,
  Copy,
  LoaderCircle,
  RefreshCw,
  Search,
  TriangleAlert,
} from 'lucide-preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import Button from '../ui/Button';
import { Check } from '../ui/Choice';
import { cx } from '../ui/cx';
import Field, { SelectField } from '../ui/Field';
import { PROPAGATION } from './text';

type Ui = (typeof PROPAGATION)['fr']['ui'];
type Summary = ReturnType<typeof summarize>;
type SummaryRow = Summary['rows'][number];

const EXAMPLES: [string, PropagationType][] = [
  ['example.com', 'A'],
  ['gmail.com', 'MX'],
  ['_dmarc.gmail.com', 'TXT'],
];
const REFRESH_MS = 30_000;

interface FormState {
  domain: string;
  type: PropagationType;
  expected: string;
}
const EMPTY_FORM: FormState = { domain: '', type: 'A', expected: '' };

// Verdict -> icône et teinte (la couleur ne porte jamais seule l'information : la phrase du verdict est toujours affichée)
const VERDICT_STYLE: Record<Verdict, { icon: typeof CircleCheck; tone: string; spin?: boolean }> = {
  pending: { icon: LoaderCircle, tone: 'tone-ok', spin: true },
  propagated: { icon: CircleCheck, tone: 'tone-ok' },
  consistent: { icon: CircleCheck, tone: 'tone-ok' },
  partial: { icon: TriangleAlert, tone: 'tone-warn' },
  diverging: { icon: TriangleAlert, tone: 'tone-warn' },
  none: { icon: CircleX, tone: 'tone-danger' },
  unreachable: { icon: CircleX, tone: 'tone-danger' },
};

function verdictText(ui: Ui, summary: Summary): string {
  const v = ui.results.verdicts;
  const c = summary.counts;
  switch (summary.verdict) {
    case 'pending':
      return v.pending(c.total - c.pending, c.total);
    case 'propagated':
      return v.propagated(c.matches);
    case 'partial':
      return v.partial(c.matches, c.usable);
    case 'none':
      return v.none;
    case 'consistent':
      return v.consistent(c.usable);
    case 'diverging':
      return v.diverging(c.groups, c.usable);
    default:
      return v.unreachable;
  }
}

/** Pastille de la ligne d'un résolveur : icône, libellé (toujours écrit) et teinte. */
function badgeOf(
  row: SummaryRow,
  summary: Summary,
  ui: Ui,
): { icon: typeof CircleCheck; label: string; tone: string; spin?: boolean } {
  const b = ui.results.badges;
  if (row.state === 'pending')
    return { icon: LoaderCircle, label: b.pending, tone: 'note', spin: true };
  if (row.state === 'error' || row.state === 'servfail' || row.state === 'refused')
    return { icon: TriangleAlert, label: b.failed, tone: 'tone-warn' };
  if (summary.expected)
    return row.match
      ? { icon: CircleCheck, label: b.match, tone: 'tone-ok' }
      : { icon: TriangleAlert, label: b.mismatch, tone: 'tone-warn' };
  if (summary.counts.groups === 1) return { icon: CircleCheck, label: b.same, tone: 'tone-ok' };
  return row.inMajority
    ? { icon: CircleCheck, label: b.majority, tone: 'tone-ok' }
    : { icon: TriangleAlert, label: b.different, tone: 'tone-warn' };
}

function ResolverRow({
  row,
  summary,
  ui,
  countryName,
}: {
  row: SummaryRow;
  summary: Summary;
  ui: Ui;
  countryName: string;
}) {
  const { resolver } = row;
  const badge = badgeOf(row, summary, ui);
  const Icon = badge.icon;
  const r = ui.results;
  const states: Record<string, string> = r.states;
  const answered = row.state === 'answer';
  return (
    <li class="resolver-row">
      <div>
        <p class="resolver-name">{resolver.name}</p>
        <p class="note">{[countryName, resolver.ip].filter(Boolean).join(' · ')}</p>
      </div>
      <div class="resolver-values">
        {answered ? (
          <ul role="list">
            {row.values.map((value) => (
              <li key={value} class="mono">
                {value}
              </li>
            ))}
          </ul>
        ) : (
          <p class="note">{states[row.state] ?? row.state}</p>
        )}
        {row.ms !== null && (
          <p class="note">
            {[answered && row.ttl !== null && r.ttl(row.ttl), r.ms(row.ms)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
      <p class={cx('status-line resolver-badge', badge.tone)}>
        <Icon size={16} class={badge.spin ? 'spin' : undefined} aria-hidden="true" />
        <span class="resolver-badge-label">{badge.label}</span>
      </p>
    </li>
  );
}

/** Propagation DNS : la même question posée à plusieurs résolveurs publics, réponses comparées. Les paramètres ?d= (nom), ?t= (type) et ?e= (valeur attendue) rendent une vérification partageable. */
export default function PropagationChecker({ lang }: { lang: Lang }) {
  const ui = PROPAGATION[lang].ui;
  const errors: Record<string, string> = ui.errors;
  const placeholders: Record<string, string> = ui.form.placeholders;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState<FormState | null>(null); // vérification affichée
  const [results, setResults] = useState<ResolverResult[]>([]);
  const [running, setRunning] = useState(false);
  const [auto, setAuto] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusOnDone = useRef(false);

  const countryNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang], { type: 'region' });
    } catch {
      return null;
    }
  }, [lang]);

  const run = useCallback(
    async (
      rawDomain: string,
      type: PropagationType,
      rawExpected: string,
      { refresh = false } = {},
    ) => {
      const parsed = normalizeDomain(rawDomain);
      if ('error' in parsed) {
        setFormError(parsed.error);
        return;
      }
      setFormError(null);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const next: FormState = {
        domain: parsed.domain,
        type,
        expected: String(rawExpected ?? '').trim(),
      };
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
            if (!controller.signal.aborted)
              setResults((previous) => [...previous.filter((r) => r.id !== result.id), result]);
          },
        });
      } catch {
        return; // annulée par une nouvelle vérification ou par la fermeture de la page
      }
      if (!controller.signal.aborted) setRunning(false);
    },
    [],
  );

  // Ouverture d'un lien partagé : champs préremplis et vérification lancée. L'URL est un système externe : la synchronisation
  // ne peut avoir lieu qu'après l'hydratation (le HTML pré-rendu est identique pour tous), donc dans un effet.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (d) {
      const requested = params.get('t');
      const t = (PROPAGATION_TYPES as readonly string[]).includes(requested ?? '')
        ? (requested as PropagationType)
        : 'A';
      const e = params.get('e') ?? '';
      setForm({ domain: d, type: t, expected: e });
      focusOnDone.current = true;
      void run(d, t, e);
    }
    return () => abortRef.current?.abort();
  }, [run]);

  const summary = useMemo(
    () => (query ? summarize(PROPAGATION_RESOLVERS, results, query.type, query.expected) : null),
    [query, results],
  );

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
    const timer = setTimeout(
      () => void run(query.domain, query.type, query.expected, { refresh: true }),
      REFRESH_MS,
    );
    return () => clearTimeout(timer);
  }, [auto, running, query, verdict, run]);

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
  const hints: string[] = [];
  if (summary && query && summary.verdict !== 'pending') {
    if (summary.verdict === 'partial') hints.push(ui.results.hints.partial);
    if (summary.verdict === 'diverging' && (query.type === 'A' || query.type === 'AAAA'))
      hints.push(ui.results.hints.loadBalanced);
    if (summary.counts.failed > 0) hints.push(ui.results.hints.failed(summary.counts.failed));
  }

  return (
    <div class="stack">
      <div class="tool">
        <form
          class="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            focusOnDone.current = true;
            void run(form.domain, form.type, form.expected);
          }}
        >
          <div class="form-row form-row-prop">
            <Field
              id="prop-domain"
              label={ui.form.domain}
              required
              value={form.domain}
              onInput={(e) => setForm((f) => ({ ...f, domain: e.currentTarget.value }))}
              placeholder={ui.form.domainPlaceholder}
              autoComplete="off"
              autoCapitalize="none"
              spellcheck={false}
              inputMode="url"
              hint={ui.form.domainHint}
              error={formError ? errors[formError] : undefined}
            />
            <SelectField
              id="prop-type"
              label={ui.form.type}
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v as PropagationType }))}
            >
              {PROPAGATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectField>
            <Field
              id="prop-expected"
              label={ui.form.expected}
              value={form.expected}
              onInput={(e) => setForm((f) => ({ ...f, expected: e.currentTarget.value }))}
              placeholder={placeholders[form.type]}
              autoComplete="off"
              autoCapitalize="none"
              spellcheck={false}
              hint={ui.form.expectedHint}
            />
          </div>
          <div class="row-actions">
            <Button
              type="submit"
              variant="primary"
              class="btn-lg"
              loading={running && results.length === 0}
            >
              <Search size={20} aria-hidden="true" /> {ui.form.submit}
            </Button>
            <p class="row-actions note">
              {ui.form.example}
              {EXAMPLES.map(([domain, type]) => (
                <button
                  key={`${domain}-${type}`}
                  type="button"
                  class="link-button mono"
                  onClick={() => {
                    setForm({ domain, type, expected: '' });
                    focusOnDone.current = true;
                    void run(domain, type, '');
                  }}
                >
                  {domain} ({type})
                </button>
              ))}
            </p>
          </div>
        </form>
      </div>

      {/* Annonces pour les lecteurs d'écran : début, fin et copie du lien */}
      <div role="status" aria-live="polite" class="visually-hidden">
        {copied ? ui.results.copied : running ? ui.form.running : text}
      </div>

      {summary && query && style && VerdictIcon && (
        <div class="tool">
          <div class="stack">
            {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
            <h2 ref={headingRef} tabIndex={-1} class="result-heading mono">
              {ui.results.title} {query.domain} <span class="note">({query.type})</span>
            </h2>
            <p class="verdict">
              <VerdictIcon
                size={22}
                class={cx(style.tone, style.spin && 'spin')}
                aria-hidden="true"
              />
              <span>{text}</span>
            </p>
            {hints.map((hint) => (
              <p key={hint} class="note">
                {hint}
              </p>
            ))}
          </div>

          <ul class="resolver-list" role="list">
            {summary.rows.map((row) => (
              <ResolverRow
                key={row.resolver.id}
                row={row}
                summary={summary}
                ui={ui}
                countryName={countryNames?.of(row.resolver.country) ?? row.resolver.country}
              />
            ))}
          </ul>

          <div class="row-actions">
            <Button
              onClick={() => {
                focusOnDone.current = true;
                void run(query.domain, query.type, query.expected, { refresh: true });
              }}
              loading={running}
            >
              <RefreshCw size={18} aria-hidden="true" /> {ui.results.recheck}
            </Button>
            <Button onClick={copyLink}>
              <Copy size={18} aria-hidden="true" /> {ui.results.copyLink}
            </Button>
            <a
              class="btn btn-ghost"
              href={`${ui.results.lookupPath}?d=${encodeURIComponent(query.domain)}`}
            >
              {ui.results.lookup}
            </a>
            <Check checked={auto} onChange={setAuto}>
              {ui.results.auto}
            </Check>
          </div>
          <p class="note">{ui.results.note}</p>
        </div>
      )}
      <p class="note">{ui.privacy}</p>
    </div>
  );
}
