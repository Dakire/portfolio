import type { Lang } from '../../lib/i18n';
import ServerTool from '../server/ServerTool';
import { describeCheck, type SeoReport } from './checks';
import { SEO_TOOL } from './text';

/** Rapport SEO : une page analysée par tools.php, contrôles classés par priorité. */
export default function SeoTool({ lang }: { lang: Lang }) {
  return (
    <ServerTool<SeoReport>
      lang={lang}
      tool="seo"
      filePrefix="rapport-seo"
      texts={SEO_TOOL[lang].ui}
      describe={describeCheck}
    />
  );
}
