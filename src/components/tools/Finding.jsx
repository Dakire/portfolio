import { cx } from '../../lib/cx';
import { SEVERITY } from './severity';

/** Un constat d'analyse : icône de gravité, titre, explication et correction. `describe(finding)` fournit les textes traduits. */
export default function Finding({ finding, describe, statusLabels, fixLabel }) {
  const d = describe(finding);
  const { icon: Icon, color } = SEVERITY[finding.severity];
  return (
    <li className="flex gap-3">
      <Icon className={cx('mt-0.5 h-5 w-5 shrink-0', color)} aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold text-ink">
          <span className="sr-only">{statusLabels[finding.severity]} : </span>
          {d.title}
        </p>
        {d.detail && <p className="text-copy text-body">{d.detail}</p>}
        {d.fix && (
          <p className="mt-1 text-copy text-body">
            <strong className="text-ink">{fixLabel} :</strong> {d.fix}
          </p>
        )}
      </div>
    </li>
  );
}
