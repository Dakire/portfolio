// Mentions légales : page statique pré-rendue (/mentions-legales/ et /en/legal-notice/), avec sa propre URL.
import Shell from './Shell';
import { PORTFOLIO_DATA } from '../data/content';

export default function LegalPage({ lang }) {
  const { legal } = PORTFOLIO_DATA[lang];

  return (
    <Shell lang={lang}>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-8">{legal.title}</h1>
      <div className="space-y-6 leading-relaxed text-slate-300">
        {legal.sections.map((s, i) => (
          <section key={s.h} id={`s${i + 1}`} className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-white mb-2">{s.h}</h2>
            <p>{s.p}</p>
          </section>
        ))}
      </div>
    </Shell>
  );
}
