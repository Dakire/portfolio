import type { Finding as FindingData, Severity } from '@grichard/tools-core/dns/findings';
import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-preact';

// Gravité -> icône et classe de couleur. Le texte « Erreur », « Avertissement »… est toujours présent à côté (la couleur ne porte jamais seule l'information).
export const SEVERITY = {
  ok: { icon: CircleCheck, tone: 'tone-ok' },
  info: { icon: Info, tone: 'tone-info' },
  warn: { icon: TriangleAlert, tone: 'tone-warn' },
  error: { icon: CircleX, tone: 'tone-danger' },
} as const satisfies Record<Severity, { icon: unknown; tone: string }>;

interface Props {
  finding: Pick<FindingData, 'severity' | 'code' | 'params'>;
  describe: (finding: Pick<FindingData, 'code' | 'params'>) => {
    title: string;
    detail: string;
    fix: string;
  };
  statusLabels: Record<Severity, string>;
  fixLabel: string;
  /** Lecture directe : le texte est proportionnel à la gravité (« conforme » : titre seul ; information : titre et détail ; erreur et avertissement : tout). */
  terse?: boolean;
}

/** Un constat d'analyse : icône de gravité, titre, explication et correction. */
export default function Finding({
  finding,
  describe,
  statusLabels,
  fixLabel,
  terse = false,
}: Props) {
  const d = describe(finding);
  const showDetail = !terse || finding.severity !== 'ok';
  const showFix = !terse || finding.severity === 'error' || finding.severity === 'warn';
  const { icon: Icon, tone } = SEVERITY[finding.severity];
  return (
    <li class="finding">
      <Icon size={20} class={`finding-icon ${tone}`} aria-hidden="true" />
      <div>
        <p class="finding-title">
          <span class="visually-hidden">{statusLabels[finding.severity]} : </span>
          {d.title}
        </p>
        {showDetail && d.detail && <p>{d.detail}</p>}
        {showFix && d.fix && (
          <p>
            <strong>{fixLabel} :</strong> {d.fix}
          </p>
        )}
      </div>
    </li>
  );
}
