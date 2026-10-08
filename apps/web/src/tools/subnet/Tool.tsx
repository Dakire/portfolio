import {
  contains,
  describeNetwork,
  overlaps,
  parseCidr,
  parseNeeds,
  splitNetwork,
  vlsm,
  type Cidr,
  type Network4,
} from '@grichard/tools-core/net/cidr';
import { Calculator } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import type { Lang } from '../../lib/i18n';
import Button from '../ui/Button';
import CopyButton from '../ui/CopyButton';
import Field from '../ui/Field';
import ScrollRegion from '../ui/ScrollRegion';
import { SUBNET } from './text';

type Ui = (typeof SUBNET)['fr']['ui'];

const EXAMPLES = ['192.168.1.10/24', '10.0.0.0 255.255.0.0', '172.16.0.0/12', '2001:db8::/32'];
const fmt = (n: bigint | number): string =>
  typeof n === 'bigint' ? n.toLocaleString('en-US').replace(/,/g, ' ') : String(n);

/** Binaire avec les bits de réseau mis en évidence (les points séparent les octets). */
function Binary({ value, prefix }: { value: string; prefix: number }) {
  let seen = 0;
  return (
    <span class="mono">
      {[...value].map((c, i) => {
        if (c === '.') return <span key={i}>.</span>;
        seen += 1;
        return (
          <span key={i} class={seen <= prefix ? 'bit-net' : undefined}>
            {c}
          </span>
        );
      })}
    </span>
  );
}

function Row({
  label,
  value,
  copy,
  ui,
}: {
  label: string;
  value: ComponentChildren;
  copy?: string | null | undefined;
  ui: Ui;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div class="kv-row kv-row-wide">
      <dt>{label}</dt>
      <dd class="mono">{value}</dd>
      <dd class="kv-copy">
        {copy ? (
          <CopyButton
            text={copy}
            label={`${ui.result.copy} : ${label}`}
            copiedLabel={ui.result.copied}
          />
        ) : null}
      </dd>
    </div>
  );
}

const defaultSplit = (p: Cidr): string => String(Math.min(p.prefix + 2, p.family === 4 ? 32 : 128));

/** Calculatrice réseau IPv4 / IPv6 : description, découpage, VLSM, appartenance. Tout se passe dans le navigateur. */
export default function SubnetCalculator({ lang }: { lang: Lang }) {
  const ui = SUBNET[lang].ui;
  const f = ui.form;
  const r = ui.result;
  const errors: Record<string, string> = ui.errors;
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [splitPrefix, setSplitPrefix] = useState('');
  const [needsText, setNeedsText] = useState('');
  const [check, setCheck] = useState('');

  const parsed = useMemo(() => (submitted ? parseCidr(submitted) : null), [submitted]);
  const net: Cidr | null = parsed && !('error' in parsed) ? parsed : null;
  const d = useMemo(() => (net ? describeNetwork(net) : null), [net]);
  const max = net ? (net.family === 4 ? 32 : 128) : 32;

  const run = (text: string) => {
    setSubmitted(text);
    const p = parseCidr(text);
    if (!('error' in p)) setSplitPrefix(defaultSplit(p));
  };

  const split = useMemo(
    () => (net && splitPrefix !== '' ? splitNetwork(net, Number(splitPrefix), 256) : null),
    [net, splitPrefix],
  );
  const needs = useMemo(() => parseNeeds(needsText), [needsText]);
  const validNeeds = useMemo(() => needs.flatMap((n) => ('error' in n ? [] : [n])), [needs]);
  const plan = useMemo(
    () => (net && needsText.trim() ? vlsm(net, validNeeds) : null),
    [net, validNeeds, needsText],
  );

  const checkResult = useMemo(() => {
    if (!net || !check.trim()) return null;
    const other = parseCidr(check);
    if ('error' in other) return { kind: 'invalid' } as const;
    if (other.family !== net.family) return { kind: 'family' } as const;
    return /[/\s]/.test(check.trim())
      ? ({ kind: 'overlap', value: overlaps(net, other) } as const)
      : ({ kind: 'inside', value: contains(net, other.ip) } as const);
  }, [net, check]);

  const v4: Network4 | null = d && d.family === 4 ? d : null;
  const typeName = d ? ((ui.types as Record<string, string>)[d.type] ?? d.type) : '';
  const planErrors: Record<string, string | ((name: string) => string)> = ui.vlsm.errors;

  return (
    <div class="stack">
      <div class="tool">
        <form
          class="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
          }}
        >
          <Field
            id="cidr-input"
            label={f.input}
            value={input}
            onInput={(e) => setInput(e.currentTarget.value)}
            placeholder={f.placeholder}
            hint={f.hint}
            autoComplete="off"
            autoCapitalize="none"
            spellcheck={false}
            inputMode="text"
            error={parsed && 'error' in parsed ? errors[parsed.error] : undefined}
          />
          <div class="row-actions">
            <Button type="submit" variant="primary" class="btn-lg">
              <Calculator size={20} aria-hidden="true" /> {f.calculate}
            </Button>
            <p class="row-actions note">
              {f.examples}
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  type="button"
                  class="link-button mono"
                  onClick={() => {
                    setInput(e);
                    run(e);
                  }}
                >
                  {e}
                </button>
              ))}
            </p>
          </div>
        </form>
      </div>

      <div role="status" aria-live="polite" class="visually-hidden">
        {d ? r.announce(`${d.network}/${d.prefix}`) : ''}
      </div>

      {d && (
        <>
          <div class="tool">
            <h2>{r.title}</h2>
            <dl class="kv">
              <Row ui={ui} label={r.rows.address} value={d.address} copy={d.address} />
              <Row
                ui={ui}
                label={r.rows.cidr}
                value={`${d.network}/${d.prefix}`}
                copy={`${d.network}/${d.prefix}`}
              />
              <Row ui={ui} label={r.rows.network} value={d.network} copy={d.network} />
              {v4 && (
                <Row
                  ui={ui}
                  label={r.rows.broadcast}
                  value={v4.broadcast ?? r.none}
                  copy={v4.broadcast}
                />
              )}
              {v4 && <Row ui={ui} label={r.rows.mask} value={v4.mask} copy={v4.mask} />}
              {v4 && <Row ui={ui} label={r.rows.wildcard} value={v4.wildcard} copy={v4.wildcard} />}
              <Row
                ui={ui}
                label={v4 ? r.rows.first : r.rows.firstAddress}
                value={d.first}
                copy={d.first}
              />
              <Row
                ui={ui}
                label={v4 ? r.rows.last : r.rows.lastAddress}
                value={v4 ? v4.lastHost : d.last}
                copy={v4 ? v4.lastHost : d.last}
              />
              {v4 && (
                <Row ui={ui} label={r.rows.hosts} value={fmt(d.hosts)} copy={d.hosts.toString()} />
              )}
              <Row ui={ui} label={r.rows.total} value={fmt(d.total)} copy={d.total.toString()} />
              {v4 && <Row ui={ui} label={r.rows.class} value={v4.class} />}
              <Row ui={ui} label={r.rows.type} value={typeName} />
              {v4 && (
                <Row
                  ui={ui}
                  label={r.rows.binaryAddress}
                  value={<Binary value={v4.binaryAddress} prefix={d.prefix} />}
                  copy={v4.binaryAddress}
                />
              )}
              {v4 && (
                <Row
                  ui={ui}
                  label={r.rows.binaryMask}
                  value={<Binary value={v4.binaryMask} prefix={d.prefix} />}
                  copy={v4.binaryMask}
                />
              )}
              {v4 && <Row ui={ui} label={r.rows.hex} value={v4.hex} copy={v4.hex} />}
              {v4 && (
                <Row
                  ui={ui}
                  label={r.rows.integer}
                  value={fmt(v4.integer)}
                  copy={v4.integer.toString()}
                />
              )}
              {d.family === 6 && (
                <Row ui={ui} label={r.rows.expanded} value={d.expanded} copy={d.expanded} />
              )}
              {d.family === 6 && d.subnets64 !== null && (
                <Row
                  ui={ui}
                  label={r.rows.subnets64}
                  value={fmt(d.subnets64)}
                  copy={d.subnets64.toString()}
                />
              )}
              <Row ui={ui} label={r.rows.reverse} value={d.reverse} copy={d.reverse} />
            </dl>
            {v4?.pointToPoint && <p>{r.pointToPoint}</p>}
            {v4?.singleHost && <p>{r.singleHost}</p>}
          </div>

          <div class="tool">
            <h2>{ui.split.title}</h2>
            <div class="row-actions row-bottom">
              <div class="field-narrow">
                <Field
                  id="split-prefix"
                  label={ui.split.prefix}
                  type="number"
                  min={d.prefix}
                  max={max}
                  inputMode="numeric"
                  value={splitPrefix}
                  onInput={(e) => setSplitPrefix(e.currentTarget.value)}
                />
              </div>
              {split && !('error' in split) && <p>{ui.split.help(fmt(split.count))}</p>}
            </div>
            {split && 'error' in split && (
              <p role="alert" class="field-error">
                {ui.split.invalid}
              </p>
            )}
            {split && !('error' in split) && (
              <>
                <ScrollRegion label={ui.split.title}>
                  <table class="data-table">
                    <caption class="visually-hidden">{ui.split.title}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{ui.split.columns.network}</th>
                        <th scope="col">{ui.split.columns.first}</th>
                        <th scope="col">{ui.split.columns.last}</th>
                        {v4 && <th scope="col">{ui.split.columns.broadcast}</th>}
                        <th scope="col">{ui.split.columns.hosts}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {split.items.map((s) => (
                        <tr key={`${s.network}/${s.prefix}`}>
                          <td class="mono">
                            {s.network}/{s.prefix}
                          </td>
                          <td class="mono">{s.first}</td>
                          <td class="mono">{s.family === 4 ? s.lastHost : s.last}</td>
                          {v4 && (
                            <td class="mono">{s.family === 4 ? (s.broadcast ?? r.none) : ''}</td>
                          )}
                          <td>{fmt(s.hosts)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollRegion>
                {split.truncated && (
                  <p class="note">{ui.split.truncated(split.items.length, fmt(split.count))}</p>
                )}
              </>
            )}
          </div>

          {v4 && (
            <div class="tool">
              <h2>{ui.vlsm.title}</h2>
              <p class="note">{ui.vlsm.help}</p>
              <Field
                as="textarea"
                id="vlsm-needs"
                label={ui.vlsm.label}
                rows={5}
                value={needsText}
                onInput={(e) => setNeedsText(e.currentTarget.value)}
                placeholder={ui.vlsm.placeholder}
                spellcheck={false}
              />
              {needs.flatMap((n) =>
                'error' in n
                  ? [
                      <p key={n.error} role="alert" class="field-error">
                        {ui.vlsm.errors.invalid(n.error)}
                      </p>,
                    ]
                  : [],
              )}
              {plan && 'error' in plan && (
                <p role="alert" class="field-error">
                  {plan.error === 'ipv4only'
                    ? ui.vlsm.errors.ipv4only
                    : (() => {
                        const entry = planErrors[plan.error];
                        return typeof entry === 'function' && 'need' in plan
                          ? entry(plan.need.name)
                          : entry;
                      })()}
                </p>
              )}
              {plan && 'allocations' in plan && plan.allocations.length > 0 && (
                <>
                  <ScrollRegion label={ui.vlsm.title}>
                    <table class="data-table">
                      <caption class="visually-hidden">{ui.vlsm.title}</caption>
                      <thead>
                        <tr>
                          {(['name', 'needed', 'subnet', 'range', 'hosts', 'wasted'] as const).map(
                            (c) => (
                              <th key={c} scope="col">
                                {ui.vlsm.columns[c]}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {plan.allocations.map((a) => (
                          <tr key={`${a.network}/${a.prefix}`}>
                            <td>{a.name}</td>
                            <td>{a.needed}</td>
                            <td class="mono">
                              {a.network}/{a.prefix}
                            </td>
                            <td class="mono">
                              {a.first} – {a.lastHost}
                            </td>
                            <td>{fmt(a.hosts)}</td>
                            <td>{a.wasted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollRegion>
                  {'free' in plan && <p class="note">{ui.vlsm.free(fmt(plan.free))}</p>}
                </>
              )}
            </div>
          )}

          <div class="tool">
            <h2>{ui.check.title}</h2>
            <Field
              id="check-input"
              label={ui.check.label}
              value={check}
              onInput={(e) => setCheck(e.currentTarget.value)}
              placeholder={v4 ? '192.168.1.200' : '2001:db8::1'}
              autoComplete="off"
              spellcheck={false}
            />
            {checkResult && (
              <p role="status" class="status-line">
                {checkResult.kind === 'invalid'
                  ? ui.check.invalid
                  : checkResult.kind === 'family'
                    ? ui.check.family
                    : checkResult.kind === 'inside'
                      ? checkResult.value
                        ? ui.check.inside
                        : ui.check.outside
                      : checkResult.value
                        ? ui.check.overlap
                        : ui.check.noOverlap}
              </p>
            )}
          </div>
          <p class="note">{ui.privacy}</p>
        </>
      )}
    </div>
  );
}
