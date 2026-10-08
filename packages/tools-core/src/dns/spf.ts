// SPF (RFC 7208) : analyse de la syntaxe, puis résolution récursive des include / redirect pour compter les requêtes DNS
// (limite de 10), détecter les boucles, les doublons, les plages qui se recouvrent et les mécanismes dangereux.
import { finding, type Finding, type Severity } from './findings.js';
import { hasHostBits4, isIPv4, isIPv6, rangeOf4 } from './ip.js';
import { detectProviders } from './providers.js';
import { RCODE, stripDot, txtRecords, type DnsResult, type Resolver } from './resolver.js';

export const isSpfRecord = (text: unknown): boolean => /^v=spf1(\s|$)/i.test(String(text).trim());

const MACRO = /^(?:[^%]|%%|%_|%-|%\{[slodiphcrtv]\d*r?[.\-+,/_=]*\})*$/i;
const HOST =
  /^(?=.{1,253}\.?$)[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?(?:\.[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?)*\.?$/i;
const validDomainSpec = (spec: string): boolean =>
  spec.includes('%') ? MACRO.test(spec) : HOST.test(spec);
const DNS_MECHANISMS = new Set(['include', 'a', 'mx', 'ptr', 'exists']);

export interface SpfError {
  code: string;
  params: Finding['params'];
}
export interface SpfModifier {
  raw: string;
  kind: 'modifier';
  name: string;
  value: string;
  errors: SpfError[];
}
export interface SpfInvalid {
  raw: string;
  kind: 'invalid';
  errors: SpfError[];
}
export interface SpfDirective {
  raw: string;
  kind: 'directive';
  qualifier: string;
  mechanism: string;
  value: string | null;
  cidr4: number | null;
  cidr6: number | null;
  errors: SpfError[];
  unknown?: boolean;
}
export type SpfTerm = SpfModifier | SpfInvalid | SpfDirective;

/** Analyse d'un terme SPF isolé. `errors` liste ses défauts de syntaxe ({ code, params }). */
export function parseTerm(raw: string): SpfTerm {
  const modifier = /^([a-z][a-z0-9_.-]*)=(.*)$/i.exec(raw);
  if (modifier) {
    const name = (modifier[1] ?? '').toLowerCase();
    const value = modifier[2] ?? '';
    const errors: SpfError[] = [];
    if ((name === 'redirect' || name === 'exp') && !validDomainSpec(value))
      errors.push({ code: 'spf.badDomain', params: { term: raw } });
    return { raw, kind: 'modifier', name, value, errors };
  }

  const m = /^([+\-~?])?([a-z0-9]+)(.*)$/i.exec(raw);
  if (!m)
    return { raw, kind: 'invalid', errors: [{ code: 'spf.badSyntax', params: { term: raw } }] };
  const term: SpfDirective = {
    raw,
    kind: 'directive',
    qualifier: m[1] ?? '+',
    mechanism: (m[2] ?? '').toLowerCase(),
    value: null,
    cidr4: null,
    cidr6: null,
    errors: [],
  };
  const rest = m[3] ?? '';
  const bad = (code: string) => term.errors.push({ code, params: { term: raw } });

  switch (term.mechanism) {
    case 'all':
      if (rest !== '') bad('spf.badSyntax');
      break;
    case 'include':
    case 'exists':
      if (!rest.startsWith(':') || rest.length < 2) bad('spf.badSyntax');
      else if (!validDomainSpec(rest.slice(1))) bad('spf.badDomain');
      else term.value = rest.slice(1);
      break;
    case 'a':
    case 'mx': {
      const x = /^(?::([^/]+))?(?:\/(\d+))?(?:\/\/(\d+))?$/.exec(rest);
      if (!x) {
        bad('spf.badSyntax');
        break;
      }
      if (x[1] !== undefined) {
        if (validDomainSpec(x[1])) term.value = x[1];
        else bad('spf.badDomain');
      }
      if (x[2] !== undefined) {
        term.cidr4 = Number(x[2]);
        if (term.cidr4 > 32) bad('spf.badCidr');
      }
      if (x[3] !== undefined) {
        term.cidr6 = Number(x[3]);
        if (term.cidr6 > 128) bad('spf.badCidr');
      }
      break;
    }
    case 'ptr':
      if (rest !== '' && !(rest.startsWith(':') && validDomainSpec(rest.slice(1))))
        bad('spf.badSyntax');
      else if (rest) term.value = rest.slice(1);
      break;
    case 'ip4':
    case 'ip6': {
      const x = /^:([^/]+)(?:\/(\d+))?$/.exec(rest);
      const v4 = term.mechanism === 'ip4';
      if (!x) {
        bad('spf.badSyntax');
        break;
      }
      const address = x[1] ?? '';
      if (!(v4 ? isIPv4(address) : isIPv6(address))) bad('spf.badIp');
      else term.value = address;
      if (x[2] !== undefined) {
        term.cidr4 = v4 ? Number(x[2]) : null;
        term.cidr6 = v4 ? null : Number(x[2]);
        if (Number(x[2]) > (v4 ? 32 : 128)) bad('spf.badCidr');
      }
      break;
    }
    default:
      term.unknown = true;
      term.errors.push({ code: 'spf.unknownTerm', params: { term: raw } });
  }
  return term;
}

const ALL_CODES: Record<string, string> = {
  '+': 'spf.plusAll',
  '?': 'spf.neutralAll',
  '~': 'spf.softfailAll',
  '-': 'spf.hardfailAll',
};
const ALL_SEVERITY: Record<string, Severity> = {
  'spf.plusAll': 'error',
  'spf.neutralAll': 'warn',
  'spf.softfailAll': 'info',
  'spf.hardfailAll': 'ok',
};

/** Analyse syntaxique d'un enregistrement SPF : termes et constats (sans requête DNS). */
export function parseSpf(text: unknown) {
  const raw = String(text).trim();
  const findings: Finding[] = [];
  if (/[\t\r\n]/.test(raw)) findings.push(finding('spf.whitespace', 'warn'));

  const terms = raw.slice(6).split(' ').filter(Boolean).map(parseTerm);
  for (const t of terms)
    for (const e of t.errors) findings.push(finding(e.code, 'error', e.params));

  const directives = terms.filter((t): t is SpfDirective => t.kind === 'directive' && !t.unknown);
  const modifiers = terms.filter((t): t is SpfModifier => t.kind === 'modifier');
  const allIndex = directives.findIndex((t) => t.mechanism === 'all');
  const all = allIndex >= 0 ? (directives[allIndex] ?? null) : null;
  const redirect = modifiers.find((t) => t.name === 'redirect');

  for (const name of ['redirect', 'exp']) {
    if (modifiers.filter((t) => t.name === name).length > 1)
      findings.push(finding('spf.duplicateModifier', 'error', { name }));
  }
  if (all && allIndex < directives.length - 1)
    findings.push(finding('spf.afterAll', 'warn', { count: directives.length - 1 - allIndex }));
  if (all && redirect) findings.push(finding('spf.redirectIgnored', 'warn'));
  if (!all && !redirect) findings.push(finding('spf.noAll', 'warn'));

  if (all) {
    const key = ALL_CODES[all.qualifier] ?? 'spf.neutralAll';
    findings.push(finding(key, ALL_SEVERITY[key] ?? 'warn'));
  }

  const seen = new Set<string>();
  for (const t of directives) {
    const key = `${t.mechanism}:${(t.value ?? '').toLowerCase()}:${t.cidr4 ?? ''}:${t.cidr6 ?? ''}`;
    if (t.mechanism !== 'all' && seen.has(key))
      findings.push(finding('spf.duplicateTerm', 'warn', { term: t.raw }));
    seen.add(key);

    if (t.mechanism === 'ptr') findings.push(finding('spf.ptr', 'warn'));
    if (t.mechanism === 'ip4' && t.value && t.cidr4 !== null && t.cidr4 <= 32) {
      if (t.cidr4 === 0) findings.push(finding('spf.allIp', 'error', { term: t.raw }));
      else if (t.cidr4 < 16) findings.push(finding('spf.wideRange', 'warn', { term: t.raw }));
      else if (hasHostBits4(t.value, t.cidr4))
        findings.push(finding('spf.hostBits', 'info', { term: t.raw }));
    }
    if (t.mechanism === 'ip6' && t.value && t.cidr6 === 0)
      findings.push(finding('spf.allIp', 'error', { term: t.raw }));
  }

  if (raw.length > 450) findings.push(finding('spf.tooLong', 'warn', { length: raw.length }));
  return { terms, findings, all, redirect };
}

export interface SpfNode {
  domain: string;
  via: 'root' | 'include' | 'redirect';
  record: string | null;
  terms: SpfTerm[];
  findings: Finding[];
  children: SpfNode[];
}

export interface SpfAnalysis {
  tree: SpfNode;
  findings: Finding[];
  lookups: number;
  voids: number;
  partial: boolean;
  includes: string[];
  record: string | null;
  multiple: boolean;
}

/**
 * Analyse complète d'un SPF : syntaxe + résolution récursive.
 * `texts` : valeurs TXT du domaine (l'enregistrement SPF en fait partie, ou non) ;
 * `maxQueries` : garde-fou, au-delà l'analyse est marquée partielle.
 */
export async function analyzeSpf({
  domain,
  texts,
  resolver,
  maxQueries = 40,
}: {
  domain: string;
  texts: string[];
  resolver: Resolver;
  maxQueries?: number;
}): Promise<SpfAnalysis> {
  const ctx = {
    lookups: 0,
    voids: 0,
    queries: 0,
    partial: false,
    includeCounts: new Map<string, number>(),
    nets4: [] as { raw: string; range: [number, number] }[],
    includes: [] as string[],
  };

  async function q(name: string, type: 'TXT' | 'A' | 'AAAA' | 'MX'): Promise<DnsResult | null> {
    if (ctx.queries >= maxQueries) {
      ctx.partial = true;
      return null;
    }
    ctx.queries += 1;
    return resolver.query(name, type);
  }
  const isVoid = (res: DnsResult | null) =>
    !res || res.status === RCODE.NXDOMAIN || res.answers.filter((a) => a.type !== 5).length === 0;

  async function walk(
    { name, texts: records, via }: { name: string; texts: string[]; via: SpfNode['via'] },
    stack: string[],
    depth: number,
  ): Promise<SpfNode> {
    const spf = records.filter(isSpfRecord);
    const node: SpfNode = {
      domain: name,
      via,
      record: spf[0] ?? null,
      terms: [],
      findings: [],
      children: [],
    };
    const root = via === 'root';

    if (spf.length === 0) {
      node.findings.push(
        finding(root ? 'spf.missing' : 'spf.includeNoRecord', root ? 'warn' : 'error', {
          domain: name,
        }),
      );
      return node;
    }
    if (spf.length > 1)
      node.findings.push(
        finding(root ? 'spf.multiple' : 'spf.includeMultiple', 'error', {
          domain: name,
          count: spf.length,
        }),
      );

    const parsed = parseSpf(spf[0]);
    node.terms = parsed.terms;
    // Dans un include, la qualification du « all » final est sans effet (il ne correspond jamais) : seul +all, qui autoriserait tout le monde, compte
    const ignoredInInclude = new Set([
      'spf.softfailAll',
      'spf.hardfailAll',
      'spf.neutralAll',
      'spf.noAll',
    ]);
    // Défauts de style d'un include tiers (ptr, plage large…) : le propriétaire du domaine ne peut pas les corriger et ils n'invalident pas son SPF
    const softInInclude = new Set([
      'spf.ptr',
      'spf.wideRange',
      'spf.hostBits',
      'spf.duplicateTerm',
      'spf.afterAll',
      'spf.tooLong',
      'spf.redirectIgnored',
    ]);
    node.findings.push(
      ...parsed.findings
        .filter((f) => root || !ignoredInInclude.has(f.code))
        .map((f): Finding => ({
          ...f,
          severity:
            !root && f.severity === 'warn' && softInInclude.has(f.code) ? 'info' : f.severity,
          params: { ...f.params, domain: name },
        })),
    );

    const pending: Promise<SpfNode | null>[] = [];
    const follow = (target: string, kind: 'include' | 'redirect') => {
      ctx.includes.push(target);
      ctx.includeCounts.set(target, (ctx.includeCounts.get(target) ?? 0) + 1);
      if (stack.includes(target)) {
        node.findings.push(finding('spf.loop', 'error', { target, domain: name }));
        return;
      }
      if (depth >= 10) {
        ctx.partial = true;
        return;
      }
      pending.push(
        (async () => {
          const res = await q(target, 'TXT');
          if (!res) return null;
          if (res.status === RCODE.NXDOMAIN) {
            ctx.voids += 1;
            node.findings.push(finding('spf.includeNxdomain', 'error', { target, domain: name }));
            return null;
          }
          return walk(
            { name: target, texts: txtRecords(res).map((r) => r.text), via: kind },
            [...stack, target],
            depth + 1,
          );
        })(),
      );
    };

    for (const term of parsed.terms) {
      if (term.kind === 'directive' && !term.unknown) {
        if (DNS_MECHANISMS.has(term.mechanism)) ctx.lookups += 1;
        const target = term.value ? stripDot(term.value) : name;
        const macro = term.value?.includes('%');

        if (term.mechanism === 'include' && term.value && !macro) follow(target, 'include');
        if (['a', 'mx', 'exists'].includes(term.mechanism) && !macro) {
          pending.push(
            (async () => {
              const types =
                term.mechanism === 'mx'
                  ? (['MX'] as const)
                  : term.mechanism === 'a'
                    ? (['A', 'AAAA'] as const)
                    : (['A'] as const);
              const results = await Promise.all(types.map((t) => q(target, t)));
              if (results.every(isVoid) && results.some(Boolean)) {
                ctx.voids += 1;
                node.findings.push(
                  finding('spf.voidTerm', 'warn', { term: term.raw, target, domain: name }),
                );
              }
              return null;
            })(),
          );
        }
        if (term.mechanism === 'ip4' && term.value && term.cidr4 !== null && term.qualifier === '+')
          ctx.nets4.push({ raw: term.raw, range: rangeOf4(term.value, term.cidr4) });
        if (term.mechanism === 'ip4' && term.value && term.cidr4 === null && term.qualifier === '+')
          ctx.nets4.push({ raw: term.raw, range: rangeOf4(term.value, 32) });
      }
      if (
        term.kind === 'modifier' &&
        term.name === 'redirect' &&
        !parsed.all &&
        !term.value.includes('%') &&
        validDomainSpec(term.value)
      ) {
        ctx.lookups += 1;
        follow(stripDot(term.value), 'redirect');
      }
    }

    node.children = (await Promise.all(pending)).filter(
      (child): child is SpfNode => child !== null,
    );
    return node;
  }

  const tree = await walk({ name: domain, texts, via: 'root' }, [domain], 0);

  const findings: Finding[] = [];
  const collect = (node: SpfNode) => {
    findings.push(...node.findings);
    node.children.forEach(collect);
  };
  collect(tree);

  if (tree.record) {
    if (ctx.lookups > 10)
      findings.push(finding('spf.tooManyLookups', 'error', { count: ctx.lookups }));
    else if (ctx.lookups >= 8)
      findings.push(finding('spf.nearLimit', 'warn', { count: ctx.lookups }));
    if (ctx.voids > 2) findings.push(finding('spf.tooManyVoids', 'warn', { count: ctx.voids }));
    if (ctx.partial) findings.push(finding('spf.partial', 'info'));

    for (const [target, count] of ctx.includeCounts)
      if (count > 1) findings.push(finding('spf.duplicateInclude', 'warn', { target, count }));

    const overlaps: [string, string][] = [];
    for (const a of ctx.nets4) {
      for (const b of ctx.nets4) {
        if (a !== b && a.raw !== b.raw && a.range[0] >= b.range[0] && a.range[1] <= b.range[1])
          overlaps.push([a.raw, b.raw]);
      }
    }
    for (const [a, b] of overlaps.slice(0, 5))
      findings.push(finding('spf.overlap', 'info', { a, b }));

    const providers = detectProviders({ spfIncludes: ctx.includes });
    if (providers.length)
      findings.push(
        finding('spf.provider', 'info', { names: providers.map((p) => p.name).join(', ') }),
      );
    if (!findings.some((f) => f.severity === 'error' || f.severity === 'warn'))
      findings.push(finding('spf.ok', 'ok', { count: ctx.lookups }));
  }

  return {
    tree,
    findings,
    lookups: ctx.lookups,
    voids: ctx.voids,
    partial: ctx.partial,
    includes: [...new Set(ctx.includes)],
    record: tree.record,
    multiple: texts.filter(isSpfRecord).length > 1,
  };
}
