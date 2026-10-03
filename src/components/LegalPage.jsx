import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function LegalPage({ t, onBack }) {
  const headingRef = useRef(null);

  // Annonce le changement de "page" aux lecteurs d'écran et remonte en haut.
  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, []);

  return (
    <main id="main" className="min-h-screen bg-slate-950 text-slate-300 p-4 sm:p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8 transition-colors font-medium rounded-lg px-2 py-1 -ml-2">
          <ArrowLeft className="w-5 h-5" aria-hidden="true" /> {t.ui.back}
        </button>
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-white mb-6 outline-none">{t.legal.title}</h1>
        <div className="space-y-6 leading-relaxed text-slate-300">
          {t.legal.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold text-white mb-2">{s.h}</h2>
              <p>{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
