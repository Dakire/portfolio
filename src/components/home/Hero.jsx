import { Download } from 'lucide-react';
import Terminal from '../Terminal';

export default function Hero({ t }) {
  return (
    <section id="home" aria-labelledby="hero-title" className="scroll-mt-32 grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] min-h-[50vh] md:min-h-[60vh]">
      <div className="flex flex-col items-start">
        <p className="text-emerald-400 font-mono mb-4 text-lg">{t.hero.greeting}</p>
        <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4">
          Guillaume <span className="gradient-shift bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-cyan-400">Richard.</span>
        </h1>
        <p className="caret-after text-xl sm:text-2xl md:text-4xl font-bold text-slate-300 mb-8 max-w-3xl leading-tight">{t.hero.role}</p>

        <div className="flex flex-wrap gap-4 mt-4">
          <a href="#contact" className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/30">
            {t.hero.contactBtn}
          </a>
          <a href={t.hero.cvLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-6 py-3 rounded-lg font-medium transition-colors">
            <Download className="w-5 h-5" aria-hidden="true" />
            {t.hero.cvBtn}
            <span className="sr-only"> ({t.ui.cvOpen})</span>
          </a>
        </div>
      </div>
      <Terminal lines={t.hero.terminal} />
    </section>
  );
}
