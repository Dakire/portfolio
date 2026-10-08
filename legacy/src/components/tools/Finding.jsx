import { cx } from '../../lib/cx';
import { SEVERITY } from './severity';

/**
 * Un constat d'analyse : icône de gravité, titre, explication et correction. `describe(finding)` fournit les textes traduits.
 * `terse` : lecture directe, le texte est proportionnel à la gravité (« conforme » : titre seul ; information : titre et détail ; erreur et avertissement : tout).
 */
export default function Finding({ finding, describe, statusLabels, fixLabel, terse = false }) {
  const d = describe(finding);
  const showDetail = !terse || finding.severity !== 'ok';
  const showFix = !terse || finding.severity === 'error' || finding.severity === 'warn';
  const { icon: Icon, color } = SEVERITY[finding.severity];
  return (
    <li className="flex gap-3">
      <Icon className={cx('mt-0.5 h-5 w-5 shrink-0', color)} aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold text-ink">
          <span className="sr-only">{statusLabels[finding.severity]} : </span>
          {d.title}
        </p>
        {showDetail && d.detail && <p className="text-copy text-body">{d.detail}</p>}
        {showFix && d.fix && (
          <p className="mt-1 text-copy text-body">
            <strong className="text-ink">{fixLabel} :</strong> {d.fix}
          </p>
        )}
      </div>
    </li>
  );
}
