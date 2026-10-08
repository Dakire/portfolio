// Mentions légales : page statique pré-rendue (/mentions-legales/ et /en/legal-notice/), avec sa propre URL.
import Shell from './Shell';
import Card from './ui/Card';
import { LANGS, PORTFOLIO_DATA } from '../data/content';

export default function LegalPage({ lang }) {
  const { legal } = PORTFOLIO_DATA[lang];

  return (
    <Shell lang={lang} switchHref={LANGS[LANGS[lang].other].legal}>
      <h1 className="mb-8 text-title font-extrabold tracking-tight text-ink">{legal.title}</h1>
      <div className="space-y-5">
        {legal.sections.map((s, i) => (
          <section key={s.h} id={`s${i + 1}`}>
            <Card className="p-6">
              <h2 className="mb-2 text-xl font-semibold text-ink">{s.h}</h2>
              <p className="leading-relaxed text-body">{s.p}</p>
            </Card>
          </section>
        ))}
      </div>
    </Shell>
  );
}
