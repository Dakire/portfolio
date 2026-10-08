import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { SUBNET } from '../../data/tools/subnet';
import { contains, describeNetwork, overlaps, parseCidr, parseNeeds, splitNetwork, vlsm } from '../../lib/net/cidr';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CopyButton from '../ui/CopyButton';
import Field from '../ui/Field';
import ScrollRegion from '../ui/ScrollRegion';

const EXAMPLES = ['192.168.1.10/24', '10.0.0.0 255.255.0.0', '172.16.0.0/12', '2001:db8::/32'];
const fmt = (n) => (typeof n === 'bigint' ? n.toLocaleString('en-US').replace(/,/g, ' ') : String(n));

/** Binaire avec les bits de réseau mis en évidence (les points séparent les octets). */
function Binary({ value, prefix }) {
  let seen = 0;
  return (
    <span className="mono">
      {[...value].map((c, i) => {
        if (c === '.') return <span key={i}>.</span>;
        seen += 1;
        return <span key={i} className={seen <= prefix ? 'text-brand' : 'text-body'}>{c}</span>;
      })}
    </span>
  );
}

function Row({ label, value, copy, ui }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="grid gap-x-4 gap-y-0.5 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[14rem_1fr_auto] sm:items-center">
      <dt className="text-meta font-semibold text-muted sm:text-copy">{label}</dt>
      <dd className="mono min-w-0 text-ink">{value}</dd>
      <dd className="justify-self-start sm:justify-self-end">{copy ? <CopyButton text={copy} label={`${ui.result.copy} : ${label}`} copiedLabel={ui.result.copied} /> : null}</dd>
    </div>
  );
}

/** Calculatrice réseau IPv4 / IPv6 : description, découpage, VLSM, appartenance. Tout se passe dans le navigateur. */
export default function SubnetCalculator({ lang }) {
  const ui = SUBNET[lang].ui;
  const f = ui.form;
  const r = ui.result;
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [splitPrefix, setSplitPrefix] = useState('');
  const [needsText, setNeedsText] = useState('');
  const [check, setCheck] = useState('');

  const parsed = useMemo(() => (submitted ? parseCidr(submitted) : null), [submitted]);
  const net = parsed && !parsed.error ? parsed : null;
  const d = useMemo(() => (net ? describeNetwork(net) : null), [net]);
  const max = net ? (net.family === 4 ? 32 : 128) : 32;

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(input);
    const p = parseCidr(input);
    if (!p.error) setSplitPrefix(String(Math.min(p.prefix + 2, p.family === 4 ? 32 : 128)));
  };
  const example = (text) => {
    setInput(text);
    setSubmitted(text);
    const p = parseCidr(text);
    if (!p.error) setSplitPrefix(String(Math.min(p.prefix + 2, p.family === 4 ? 32 : 128)));
  };

  const split = useMemo(() => (net && splitPrefix !== '' ? splitNetwork(net, Number(splitPrefix), 256) : null), [net, splitPrefix]);
  const needs = useMemo(() => parseNeeds(needsText), [needsText]);
  const plan = useMemo(() => (net && needsText.trim() ? vlsm(net, needs.filter((n) => !n.error)) : null), [net, needs, needsText]);

  const checkResult = useMemo(() => {
    if (!net || !check.trim()) return null;
    const other = parseCidr(check);
    if (other.error) return { invalid: true };
    if (other.family !== net.family) return { family: true };
    return /[/\s]/.test(check.trim()) ? { overlap: overlaps(net, other) } : { inside: contains(net, other.ip) };
  }, [net, check]);

  const v4 = d?.family === 4;
  const typeName = d ? ui.types[d.type] ?? d.type : '';

  return (
    <div className="space-y-6">
      <Card solid className="space-y-4 p-5 shadow-float sm:p-6">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field id="cidr-input" label={f.input} value={input} onChange={(e) => setInput(e.target.value)} placeholder={f.placeholder} hint={f.hint} autoComplete="off" autoCapitalize="none" spellCheck={false} inputMode="text" error={parsed?.error ? ui.errors[parsed.error] : undefined} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg"><Calculator className="h-5 w-5" aria-hidden="true" /> {f.calculate}</Button>
            <p className="flex flex-wrap items-center gap-x-2 text-meta text-muted">
              {f.examples}
              {EXAMPLES.map((e) => (
                <button key={e} type="button" className="tap link font-mono" onClick={() => example(e)}>{e}</button>
              ))}
            </p>
          </div>
        </form>
      </Card>

      <div role="status" aria-live="polite" className="sr-only">{d ? r.announce(`${d.network}/${d.prefix}`) : ''}</div>

      {d && (
        <>
          <Card solid className="space-y-3 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">{r.title}</h2>
            <dl>
              <Row ui={ui} label={r.rows.address} value={d.address} copy={d.address} />
              <Row ui={ui} label={r.rows.cidr} value={`${d.network}/${d.prefix}`} copy={`${d.network}/${d.prefix}`} />
              <Row ui={ui} label={r.rows.network} value={d.network} copy={d.network} />
              {v4 && <Row ui={ui} label={r.rows.broadcast} value={d.broadcast ?? r.none} copy={d.broadcast} />}
              {v4 && <Row ui={ui} label={r.rows.mask} value={d.mask} copy={d.mask} />}
              {v4 && <Row ui={ui} label={r.rows.wildcard} value={d.wildcard} copy={d.wildcard} />}
              <Row ui={ui} label={v4 ? r.rows.first : r.rows.firstAddress} value={d.first} copy={d.first} />
              <Row ui={ui} label={v4 ? r.rows.last : r.rows.lastAddress} value={v4 ? d.lastHost : d.last} copy={v4 ? d.lastHost : d.last} />
              {v4 && <Row ui={ui} label={r.rows.hosts} value={fmt(d.hosts)} copy={d.hosts.toString()} />}
              <Row ui={ui} label={r.rows.total} value={fmt(d.total)} copy={d.total.toString()} />
              {v4 && <Row ui={ui} label={r.rows.class} value={d.class} />}
              <Row ui={ui} label={r.rows.type} value={typeName} />
              {v4 && <Row ui={ui} label={r.rows.binaryAddress} value={<Binary value={d.binaryAddress} prefix={d.prefix} />} copy={d.binaryAddress} />}
              {v4 && <Row ui={ui} label={r.rows.binaryMask} value={<Binary value={d.binaryMask} prefix={d.prefix} />} copy={d.binaryMask} />}
              {v4 && <Row ui={ui} label={r.rows.hex} value={d.hex} copy={d.hex} />}
              {v4 && <Row ui={ui} label={r.rows.integer} value={fmt(d.integer)} copy={d.integer.toString()} />}
              {!v4 && <Row ui={ui} label={r.rows.expanded} value={d.expanded} copy={d.expanded} />}
              {!v4 && d.subnets64 !== null && <Row ui={ui} label={r.rows.subnets64} value={fmt(d.subnets64)} copy={d.subnets64.toString()} />}
              <Row ui={ui} label={r.rows.reverse} value={d.reverse} copy={d.reverse} />
            </dl>
            {d.pointToPoint && <p className="text-copy text-body">{r.pointToPoint}</p>}
            {d.singleHost && <p className="text-copy text-body">{r.singleHost}</p>}
          </Card>

          <Card solid className="space-y-4 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">{ui.split.title}</h2>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-40">
                <Field id="split-prefix" label={ui.split.prefix} type="number" min={d.prefix} max={max} inputMode="numeric" value={splitPrefix} onChange={(e) => setSplitPrefix(e.target.value)} />
              </div>
              {split && !split.error && <p className="pb-2 text-copy text-body">{ui.split.help(fmt(split.count))}</p>}
            </div>
            {split?.error && <p role="alert" className="text-copy font-medium text-danger">{ui.split.invalid}</p>}
            {split && !split.error && (
              <>
                <ScrollRegion label={ui.split.title}>
                  <table className="record-table">
                    <caption className="sr-only">{ui.split.title}</caption>
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
                        <tr key={s.network}>
                          <td className="mono text-ink">{s.network}/{s.prefix}</td>
                          <td className="mono text-body">{s.first}</td>
                          <td className="mono text-body">{v4 ? s.lastHost : s.last}</td>
                          {v4 && <td className="mono text-body">{s.broadcast ?? r.none}</td>}
                          <td className="text-body">{fmt(s.hosts)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollRegion>
                {split.truncated && <p className="text-meta text-muted">{ui.split.truncated(split.items.length, fmt(split.count))}</p>}
              </>
            )}
          </Card>

          {v4 && (
            <Card solid className="space-y-4 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-ink">{ui.vlsm.title}</h2>
              <p className="text-copy text-muted">{ui.vlsm.help}</p>
              <Field as="textarea" id="vlsm-needs" label={ui.vlsm.label} rows={5} value={needsText} onChange={(e) => setNeedsText(e.target.value)} placeholder={ui.vlsm.placeholder} spellCheck={false} />
              {needs.filter((n) => n.error).map((n) => <p key={n.error} role="alert" className="text-copy font-medium text-danger">{ui.vlsm.errors.invalid(n.error)}</p>)}
              {plan?.error && <p role="alert" className="text-copy font-medium text-danger">{plan.error === 'ipv4only' ? ui.vlsm.errors.ipv4only : ui.vlsm.errors[plan.error](plan.need.name)}</p>}
              {plan?.allocations?.length > 0 && (
                <>
                  <ScrollRegion label={ui.vlsm.title}>
                    <table className="record-table">
                      <caption className="sr-only">{ui.vlsm.title}</caption>
                      <thead>
                        <tr>{['name', 'needed', 'subnet', 'range', 'hosts', 'wasted'].map((c) => <th key={c} scope="col">{ui.vlsm.columns[c]}</th>)}</tr>
                      </thead>
                      <tbody>
                        {plan.allocations.map((a) => (
                          <tr key={a.network}>
                            <td className="text-ink">{a.name}</td>
                            <td className="text-body">{a.needed}</td>
                            <td className="mono text-ink">{a.network}/{a.prefix}</td>
                            <td className="mono text-body">{a.first} – {a.lastHost}</td>
                            <td className="text-body">{fmt(a.hosts)}</td>
                            <td className="text-body">{a.wasted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollRegion>
                  {!plan.error && <p className="text-meta text-muted">{ui.vlsm.free(fmt(plan.free))}</p>}
                </>
              )}
            </Card>
          )}

          <Card solid className="space-y-3 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-ink">{ui.check.title}</h2>
            <Field id="check-input" label={ui.check.label} value={check} onChange={(e) => setCheck(e.target.value)} placeholder={v4 ? '192.168.1.200' : '2001:db8::1'} autoComplete="off" spellCheck={false} />
            {checkResult && (
              <p role="status" className="text-copy font-medium text-ink">
                {checkResult.invalid ? ui.check.invalid : checkResult.family ? ui.check.family : 'inside' in checkResult ? (checkResult.inside ? ui.check.inside : ui.check.outside) : checkResult.overlap ? ui.check.overlap : ui.check.noOverlap}
              </p>
            )}
          </Card>
          <p className="text-meta text-muted">{ui.privacy}</p>
        </>
      )}
    </div>
  );
}
