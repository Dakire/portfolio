/** Liste « libellé : valeur » (les lignes sans valeur sont ignorées). */
export default function Rows({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl class="kv kv-plain">
      {rows
        .filter(([, v]) => v !== '' && v !== null && v !== undefined)
        .map(([label, value]) => (
          <div key={label} class="kv-row">
            <dt>{label}</dt>
            <dd class="mono">{value}</dd>
          </div>
        ))}
    </dl>
  );
}
